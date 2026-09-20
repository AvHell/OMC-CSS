/* ============================================================
   OMC-CACHE v4.0 - IndexedDB
   - Guarda Blobs binarios (no base64)
   - Sin canvas, sin CORS tainted
   - Límite: ~50% del disco libre
   - Procesamiento por lotes
   - Compatible con API anterior (OMC.Cache.load, .stats, .clear)
   ============================================================ */

(function() {
    'use strict';

    const CONFIG = {
        DB_NAME: 'omc_cache_db',
        DB_VERSION: 1,
        STORE_NAME: 'images',
        CACHE_DURATION: 160 * 24 * 60 * 60 * 1000, // 160 días en ms
        FAILED_DURATION: 60 * 1000,                // 1 minuto
        BOVEDA_DOMAIN: 'https://avhell.bsite.net/Boveda',
        BOVEDA_RELATIVE: '/Boveda/',
        DEBUG: true,
        TIMEOUT: 15000,
        CONCURRENCY: 4,
        INIT_DELAY: 300,
        SECOND_PASS: 2500
    };

    // ============================================================
    // LOGS
    // ============================================================
    function log(msg, data) {
        if (CONFIG.DEBUG) console.log('[OMC-Cache]', msg, data || '');
    }

    function logError(msg, err) {
        if (CONFIG.DEBUG) console.error('[OMC-Cache] ⚠️', msg, err || '');
    }

    // ============================================================
    // UTILIDADES
    // ============================================================
    function isBovedaImage(url) {
        if (!url) return false;
        return url.includes(CONFIG.BOVEDA_DOMAIN) || url.includes(CONFIG.BOVEDA_RELATIVE);
    }

    function normalizeUrl(url) {
        if (!url) return url;
        if (url.startsWith(CONFIG.BOVEDA_RELATIVE)) {
            return CONFIG.BOVEDA_DOMAIN + url.replace(CONFIG.BOVEDA_RELATIVE, '/');
        }
        if (url.includes(CONFIG.BOVEDA_DOMAIN)) return url;
        if (url.includes('/Boveda/')) {
            return CONFIG.BOVEDA_DOMAIN + url.substring(url.indexOf('/Boveda/') + 7);
        }
        return url;
    }

    // ============================================================
    // INDEXEDDB - INICIALIZACIÓN
    // ============================================================
    var dbPromise = null;

    function openDB() {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise(function(resolve, reject) {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB no soportado'));
                return;
            }

            var request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains(CONFIG.STORE_NAME)) {
                    var store = db.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'url' });
                    store.createIndex('expires', 'expires', { unique: false });
                    log('📦 ObjectStore creado');
                }
            };

            request.onsuccess = function(event) {
                log('✅ IndexedDB abierta');
                resolve(event.target.result);
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        });

        return dbPromise;
    }

    // ============================================================
    // INDEXEDDB - OPERACIONES
    // ============================================================
    function dbGet(url) {
        return openDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(CONFIG.STORE_NAME, 'readonly');
                var store = tx.objectStore(CONFIG.STORE_NAME);
                var req = store.get(url);
                req.onsuccess = function() {
                    var entry = req.result;
                    if (!entry) { resolve(null); return; }
                    if (Date.now() > entry.expires) {
                        // Expirado
                        dbDelete(url).then(function() { resolve(null); });
                        return;
                    }
                    resolve(entry.blob);
                };
                req.onerror = function() { reject(req.error); };
            });
        });
    }

    function dbSet(url, blob, durationMs) {
        return openDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
                var store = tx.objectStore(CONFIG.STORE_NAME);
                var entry = {
                    url: url,
                    blob: blob,
                    expires: Date.now() + durationMs,
                    created: Date.now()
                };
                var req = store.put(entry);
                req.onsuccess = function() { resolve(true); };
                req.onerror = function() { reject(req.error); };
            });
        });
    }

    function dbDelete(url) {
        return openDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
                var store = tx.objectStore(CONFIG.STORE_NAME);
                var req = store.delete(url);
                req.onsuccess = function() { resolve(true); };
                req.onerror = function() { reject(req.error); };
            });
        });
    }

    function dbGetAll() {
        return openDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(CONFIG.STORE_NAME, 'readonly');
                var store = tx.objectStore(CONFIG.STORE_NAME);
                var req = store.getAll();
                req.onsuccess = function() { resolve(req.result || []); };
                req.onerror = function() { reject(req.error); };
            });
        });
    }

    function dbClear() {
        return openDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(CONFIG.STORE_NAME, 'readwrite');
                var store = tx.objectStore(CONFIG.STORE_NAME);
                var req = store.clear();
                req.onsuccess = function() { resolve(true); };
                req.onerror = function() { reject(req.error); };
            });
        });
    }

    // ============================================================
    // CACHÉ - API PÚBLICA (compatible con la versión anterior)
    // ============================================================
    var Cache = {
        get: function(url) {
            var normalized = normalizeUrl(url);
            return dbGet(normalized);
        },

        set: function(url, blob) {
            var normalized = normalizeUrl(url);
            return dbSet(normalized, blob, CONFIG.CACHE_DURATION)
                .then(function() {
                    log('✅ Cacheada:', normalized.substring(0, 50) + '...');
                    return true;
                })
                .catch(function(e) {
                    logError('❌ Error al guardar:', e);
                    return false;
                });
        },

        setFailed: function(url) {
            var normalized = normalizeUrl(url);
            // Guardamos un Blob vacío con duración corta
            return dbSet(normalized, new Blob([], { type: 'image/webp' }), CONFIG.FAILED_DURATION)
                .catch(function() { return false; });
        },

        isFailed: function(url) {
            var normalized = normalizeUrl(url);
            return dbGet(normalized).then(function(blob) {
                return blob && blob.size === 0;
            });
        },

        clear: function() {
            return dbClear().then(function() {
                log('🗑️ Caché limpiado');
                return true;
            });
        },

        clearFailed: function() {
            return dbGetAll().then(function(entries) {
                var failed = entries.filter(function(e) {
                    return e.blob && e.blob.size === 0;
                });
                return Promise.all(failed.map(function(e) {
                    return dbDelete(e.url);
                })).then(function() {
                    log('🧹 Fallidos eliminados:', failed.length);
                    return failed.length;
                });
            });
        },

        cleanExpired: function() {
            return dbGetAll().then(function(entries) {
                var now = Date.now();
                var expired = entries.filter(function(e) {
                    return e.expires < now;
                });
                return Promise.all(expired.map(function(e) {
                    return dbDelete(e.url);
                })).then(function() {
                    if (expired.length > 0) log('🧹 Expirados limpiados:', expired.length);
                    return expired.length;
                });
            });
        },

        stats: function() {
            return dbGetAll().then(function(entries) {
                var now = Date.now();
                var total = 0, active = 0, expired = 0, failed = 0, size = 0;
                entries.forEach(function(e) {
                    if (!e.blob) return;
                    if (e.blob.size === 0) { failed++; return; }
                    total++;
                    if (e.expires < now) { expired++; return; }
                    active++;
                    size += e.blob.size;
                });
                return {
                    total: total,
                    active: active,
                    expired: expired,
                    failed: failed,
                    size: Math.round(size / 1024)
                };
            });
        }
    };

    // ============================================================
    // CARGAR IMAGEN CON CACHÉ
    // ============================================================
    var objectUrls = {};

    function loadImageWithCache(url) {
        return new Promise(function(resolve, reject) {
            if (!url) { reject(new Error('URL vacía')); return; }

            var normalized = normalizeUrl(url);

            if (!isBovedaImage(url)) {
                var img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() { resolve(img); };
                img.onerror = function() { reject(new Error('Error al cargar')); };
                img.src = url;
                return;
            }

            // 1. Intentar caché
            Cache.get(normalized).then(function(blob) {
                if (blob && blob.size > 0) {
                    // Tenemos caché
                    var objectUrl = URL.createObjectURL(blob);
                    var img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = function() {
                        resolve(img);
                    };
                    img.onerror = function() {
                        URL.revokeObjectURL(objectUrl);
                        loadFromNetwork(normalized).then(resolve).catch(reject);
                    };
                    img.src = objectUrl;
                    objectUrls[normalized] = objectUrl;
                    return;
                }
                // No hay caché → red
                loadFromNetwork(normalized).then(resolve).catch(reject);
            }).catch(function() {
                loadFromNetwork(normalized).then(resolve).catch(reject);
            });
        });
    }

    // ============================================================
    // CARGAR DESDE RED Y GUARDAR EN CACHÉ (sin canvas)
    // ============================================================
    function loadFromNetwork(url) {
        return new Promise(function(resolve, reject) {
            var timeoutId = setTimeout(function() {
                reject(new Error('Timeout'));
            }, CONFIG.TIMEOUT);

            // Descargar como Blob con fetch (respeta CORS)
            fetch(url, { mode: 'cors', credentials: 'omit' })
                .then(function(response) {
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.blob();
                })
                .then(function(blob) {
                    clearTimeout(timeoutId);

                    // Guardar en IndexedDB
                    Cache.set(url, blob).then(function() {
                        // Crear ObjectURL para mostrar
                        var objectUrl = URL.createObjectURL(blob);
                        var img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = function() {
                            resolve(img);
                        };
                        img.onerror = function() {
                            URL.revokeObjectURL(objectUrl);
                            reject(new Error('Error al mostrar imagen'));
                        };
                        img.src = objectUrl;
                        objectUrls[url] = objectUrl;
                    }).catch(function(e) {
                        logError('Error al guardar en IndexedDB:', e);
                        // Si falla el guardado, mostrar directamente
                        var objectUrl = URL.createObjectURL(blob);
                        var img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = function() { resolve(img); };
                        img.onerror = function() { reject(new Error('Error al mostrar')); };
                        img.src = objectUrl;
                    });
                })
                .catch(function(error) {
                    clearTimeout(timeoutId);
                    Cache.setFailed(url);
                    reject(error);
                });
        });
    }

    // ============================================================
    // PROCESAR IMÁGENES POR LOTES
    // ============================================================
    var isProcessing = false;

    function processAllBovedaImages() {
        if (isProcessing) {
            log('⏳ Ya hay un procesamiento en curso, se omite');
            return;
        }

        var selector = 'img[src*="/Boveda/"], img[src*="Boveda"], img[data-src*="/Boveda/"], img[data-src*="Boveda"]';
        var allImages = Array.prototype.slice.call(document.querySelectorAll(selector));

        var pending = allImages.filter(function(img) {
            return !img.dataset.omcProcessed;
        });

        if (pending.length === 0) {
            log('⚠️ No hay imágenes nuevas de Bóveda (' + allImages.length + ' ya procesadas)');
            return;
        }

        isProcessing = true;
        log('🔄 Procesando ' + pending.length + ' de ' + allImages.length + ' imágenes (lotes de ' + CONFIG.CONCURRENCY + ')...');

        var index = 0;
        var processed = 0;
        var errors = 0;

        function processBatch() {
            if (index >= pending.length) {
                isProcessing = false;
                log('✅ Procesadas: ' + processed + ', errores: ' + errors);
                Cache.stats().then(function(stats) {
                    log('📊 Caché actual:', stats);
                });
                return;
            }

            var batch = pending.slice(index, index + CONFIG.CONCURRENCY);
            index += CONFIG.CONCURRENCY;

            Promise.all(batch.map(function(img) {
                var url = img.src || img.getAttribute('data-src');
                img.dataset.omcProcessed = 'true';

                if (!url || !isBovedaImage(url)) return Promise.resolve();

                return loadImageWithCache(url).then(function(cachedImg) {
                    if (img.src && img.src !== cachedImg.src) {
                        img.src = cachedImg.src;
                    }
                    processed++;
                }).catch(function() {
                    errors++;
                });
            })).then(processBatch);
        }

        processBatch();
    }

    // ============================================================
    // FORZAR RECARGA
    // ============================================================
    function forceReloadFailed() {
        log('🔄 Forzando recarga de imágenes fallidas...');
        Cache.clearFailed().then(function() {
            var selector = 'img[src*="/Boveda/"], img[src*="Boveda"]';
            document.querySelectorAll(selector).forEach(function(img) {
                delete img.dataset.omcProcessed;
            });
            processAllBovedaImages();
        });
    }

    // ============================================================
    // OBSERVADOR
    // ============================================================
    function setupImageObserver() {
        if (!window.MutationObserver) return;

        var observer = new MutationObserver(function(mutations) {
            var hasNewImages = false;

            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType !== 1) return;

                    if (node.tagName === 'IMG') {
                        var url = node.src || node.getAttribute('data-src');
                        if (url && isBovedaImage(url) && !node.dataset.omcProcessed) {
                            hasNewImages = true;
                            node.dataset.omcProcessed = 'true';
                            loadImageWithCache(url).then(function(cachedImg) {
                                if (node.src && node.src !== cachedImg.src) {
                                    node.src = cachedImg.src;
                                }
                            }).catch(function() {});
                        }
                    }

                    if (node.querySelectorAll) {
                        var imgs = node.querySelectorAll('img[src*="/Boveda/"], img[src*="Boveda"]');
                        imgs.forEach(function(img) {
                            if (!img.dataset.omcProcessed) {
                                var url = img.src || img.getAttribute('data-src');
                                if (url && isBovedaImage(url)) {
                                    img.dataset.omcProcessed = 'true';
                                    hasNewImages = true;
                                    loadImageWithCache(url).then(function(cachedImg) {
                                        if (img.src && img.src !== cachedImg.src) {
                                            img.src = cachedImg.src;
                                        }
                                    }).catch(function() {});
                                }
                            }
                        });
                    }
                });
            });

            if (hasNewImages) log('🔄 Nuevas imágenes detectadas');
        });

        observer.observe(document.body, { childList: true, subtree: true });
        log('👀 Observador activado');
        return observer;
    }

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    function init() {
        log('🚀 OMC-Cache v4.0 (IndexedDB) inicializado');

        openDB().then(function() {
            return Cache.cleanExpired();
        }).then(function() {
            return Cache.stats();
        }).then(function(stats) {
            log('📊 Estadísticas iniciales:', stats);

            setTimeout(function() { processAllBovedaImages(); }, CONFIG.INIT_DELAY);
            setTimeout(function() { processAllBovedaImages(); }, CONFIG.SECOND_PASS);
        }).catch(function(e) {
            logError('Error al inicializar IndexedDB:', e);
        });

        setupImageObserver();
    }

    // ============================================================
    // API PÚBLICA
    // ============================================================
    window.OMC = window.OMC || {};
    window.OMC.Cache = {
        load: loadImageWithCache,
        process: processAllBovedaImages,
        forceReload: forceReloadFailed,
        clear: function() { return Cache.clear(); },
        clearFailed: function() { return Cache.clearFailed(); },
        cleanExpired: function() { return Cache.cleanExpired(); },
        stats: function() { return Cache.stats(); },
        config: CONFIG,
        normalizeUrl: normalizeUrl,
        // Extra: info del DB
        dbInfo: function() {
            return openDB().then(function(db) {
                return {
                    name: db.name,
                    version: db.version,
                    stores: Array.from(db.objectStoreNames)
                };
            });
        }
    };

    // ============================================================
    // INICIO
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('💡 Comandos útiles:');
    console.log('  OMC.Cache.stats() - Ver estadísticas');
    console.log('  OMC.Cache.process() - Procesar imágenes');
    console.log('  OMC.Cache.forceReload() - Reintentar fallidas');
    console.log('  OMC.Cache.clearFailed() - Limpiar fallidas');
    console.log('  OMC.Cache.clear() - Limpiar todo');
    console.log('  OMC.Cache.dbInfo() - Info de la DB');

})();