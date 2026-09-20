/* ============================================================
   OMC-CACHE: Caché para imágenes de Boveda v3.5
   - Procesamiento por lotes (concurrencia limitada)
   - Evita reprocesar imágenes ya procesadas
   - Observador mejorado
   - crossOrigin antes de src (evita canvas tainted)
   - Retry con cache-buster si canvas tainted
   - Logs de errores en lugar de silencio
   ============================================================ */

(function() {
    'use strict';

    const CONFIG = {
        CACHE_DURATION: 160 * 24,
        STORAGE_PREFIX: 'omc_img_',
        BOVEDA_DOMAIN: 'https://avhell.bsite.net/Boveda',
        BOVEDA_RELATIVE: '/Boveda/',
        DEBUG: true,
        FAILED_CACHE_DURATION: 1,
        TIMEOUT: 15000,
        CONCURRENCY: 4,
        INIT_DELAY: 300,
        SECOND_PASS: 2500
    };

    const FAILED_KEY = CONFIG.STORAGE_PREFIX + '_failed_';

    // ============================================================
    // LOGS
    // ============================================================
    function log(message, data) {
        if (CONFIG.DEBUG) {
            console.log('[OMC-Cache]', message, data || '');
        }
    }

    function logError(message, error) {
        if (CONFIG.DEBUG) {
            console.error('[OMC-Cache] ⚠️', message, error || '');
        }
    }

    // ============================================================
    // UTILIDADES
    // ============================================================
    function isBovedaImage(url) {
        if (!url) return false;
        return url.includes(CONFIG.BOVEDA_DOMAIN) ||
               url.includes(CONFIG.BOVEDA_RELATIVE);
    }

    function normalizeUrl(url) {
        if (!url) return url;
        if (url.startsWith(CONFIG.BOVEDA_RELATIVE)) {
            return CONFIG.BOVEDA_DOMAIN + url.replace(CONFIG.BOVEDA_RELATIVE, '/');
        }
        if (url.includes(CONFIG.BOVEDA_DOMAIN)) {
            return url;
        }
        if (url.includes('/Boveda/')) {
            return CONFIG.BOVEDA_DOMAIN + url.substring(url.indexOf('/Boveda/') + 7);
        }
        return url;
    }

    function getCacheKey(url) {
        var normalized = normalizeUrl(url);
        if (!normalized) return CONFIG.STORAGE_PREFIX + 'unknown';
        var clean = normalized.replace(CONFIG.BOVEDA_DOMAIN, '').replace(/\//g, '_');
        clean = clean.replace(/[^a-zA-Z0-9_]/g, '');
        if (clean.length > 100) clean = clean.substring(0, 100);
        if (!clean) clean = 'unknown_' + Date.now();
        return CONFIG.STORAGE_PREFIX + clean;
    }

    function getFailedKey(url) {
        var normalized = normalizeUrl(url);
        if (!normalized) return FAILED_KEY + 'unknown';
        var clean = normalized.replace(CONFIG.BOVEDA_DOMAIN, '').replace(/\//g, '_');
        clean = clean.replace(/[^a-zA-Z0-9_]/g, '');
        if (clean.length > 100) clean = clean.substring(0, 100);
        if (!clean) clean = 'unknown_' + Date.now();
        return FAILED_KEY + clean;
    }

    function getNow() {
        return new Date().getTime();
    }

    // ============================================================
    // CACHÉ
    // ============================================================
    const Cache = {
        get: function(url) {
            try {
                var key = getCacheKey(url);
                var raw = localStorage.getItem(key);
                if (!raw) return null;
                var entry = JSON.parse(raw);
                if (getNow() > entry.expires) {
                    localStorage.removeItem(key);
                    return null;
                }
                return entry.data;
            } catch (e) {
                return null;
            }
        },

        set: function(url, dataUrl) {
            try {
                var key = getCacheKey(url);
                var entry = {
                    data: dataUrl,
                    expires: getNow() + (CONFIG.CACHE_DURATION * 60 * 1000)
                };
                localStorage.setItem(key, JSON.stringify(entry));
                var failedKey = getFailedKey(url);
                localStorage.removeItem(failedKey);
                log('✅ Cacheada:', url.substring(0, 50) + '...');
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    this.cleanExpired();
                    try {
                        var key2 = getCacheKey(url);
                        var entry2 = {
                            data: dataUrl,
                            expires: getNow() + (CONFIG.CACHE_DURATION * 60 * 1000)
                        };
                        localStorage.setItem(key2, JSON.stringify(entry2));
                        return true;
                    } catch (e2) {
                        return false;
                    }
                }
                return false;
            }
        },

        setFailed: function(url) {
            try {
                var key = getFailedKey(url);
                var entry = {
                    expires: getNow() + (CONFIG.FAILED_CACHE_DURATION * 60 * 1000)
                };
                localStorage.setItem(key, JSON.stringify(entry));
                return true;
            } catch (e) {
                return false;
            }
        },

        isFailed: function(url) {
            try {
                var key = getFailedKey(url);
                var raw = localStorage.getItem(key);
                if (!raw) return false;
                var entry = JSON.parse(raw);
                if (getNow() > entry.expires) {
                    localStorage.removeItem(key);
                    return false;
                }
                return true;
            } catch (e) {
                return false;
            }
        },

        cleanExpired: function() {
            var keys = Object.keys(localStorage);
            var count = 0;
            keys.forEach(function(key) {
                if (key.startsWith(CONFIG.STORAGE_PREFIX) || key.startsWith(FAILED_KEY)) {
                    try {
                        var entry = JSON.parse(localStorage.getItem(key));
                        if (getNow() > entry.expires) {
                            localStorage.removeItem(key);
                            count++;
                        }
                    } catch (e) {
                        localStorage.removeItem(key);
                        count++;
                    }
                }
            });
            if (count > 0) log('🧹 Limpiados:', count, 'expirados');
            return count;
        },

        clear: function() {
            var keys = Object.keys(localStorage);
            var count = 0;
            keys.forEach(function(key) {
                if (key.startsWith(CONFIG.STORAGE_PREFIX) || key.startsWith(FAILED_KEY)) {
                    localStorage.removeItem(key);
                    count++;
                }
            });
            log('🗑️ Caché limpiado:', count);
            return count;
        },

        clearFailed: function() {
            var keys = Object.keys(localStorage);
            var count = 0;
            keys.forEach(function(key) {
                if (key.startsWith(FAILED_KEY)) {
                    localStorage.removeItem(key);
                    count++;
                }
            });
            log('🧹 Fallidos eliminados:', count);
            return count;
        },

        stats: function() {
            var keys = Object.keys(localStorage);
            var total = 0, active = 0, size = 0, failed = 0;

            keys.forEach(function(key) {
                if (key.startsWith(CONFIG.STORAGE_PREFIX) && !key.startsWith(FAILED_KEY)) {
                    total++;
                    try {
                        var entry = JSON.parse(localStorage.getItem(key));
                        if (getNow() <= entry.expires) {
                            active++;
                            if (entry.data) size += entry.data.length;
                        }
                    } catch (e) {}
                }
                if (key.startsWith(FAILED_KEY)) {
                    try {
                        var entry = JSON.parse(localStorage.getItem(key));
                        if (getNow() <= entry.expires) failed++;
                    } catch (e) {}
                }
            });

            return {
                total: total,
                active: active,
                expired: total - active,
                failed: failed,
                size: Math.round(size / 1024)
            };
        }
    };

    // ============================================================
    // CARGAR IMAGEN CON CACHÉ
    // ============================================================
    function loadImageWithCache(url) {
        return new Promise(function(resolve, reject) {
            if (!url) {
                reject(new Error('URL vacía'));
                return;
            }

            var normalized = normalizeUrl(url);

            if (!isBovedaImage(url)) {
                var img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() { resolve(img); };
                img.onerror = function() { reject(new Error('Error al cargar')); };
                img.src = url;
                return;
            }

            if (Cache.isFailed(normalized)) {
                var img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                    loadFromNetwork(normalized)
                        .then(function() { resolve(img); })
                        .catch(function() { resolve(img); });
                };
                img.onerror = function() {
                    reject(new Error('Imagen fallida'));
                };
                img.src = normalized;
                return;
            }

            var cached = Cache.get(normalized);
            if (cached) {
                var img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                    resolve(img);
                };
                img.onerror = function() {
                    loadFromNetwork(normalized).then(resolve).catch(reject);
                };
                img.src = cached;
                return;
            }

            loadFromNetwork(normalized).then(resolve).catch(reject);
        });
    }

    // ============================================================
    // CARGAR DESDE RED (con retry si canvas tainted)
    // ============================================================
    function loadFromNetwork(url, isRetry) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'anonymous';   // SIEMPRE antes de src

            var timeoutId = setTimeout(function() {
                img.src = '';
                reject(new Error('Timeout'));
            }, CONFIG.TIMEOUT);

            img.onload = function() {
                clearTimeout(timeoutId);
                try {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    if (canvas.width === 0 || canvas.height === 0) {
                        log('⚠️ Canvas vacío:', url.substring(0, 60));
                        resolve(img);
                        return;
                    }
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    var dataUrl = canvas.toDataURL('image/webp', 0.8);
                    if (!dataUrl || dataUrl === 'data:,') {
                        log('⚠️ toDataURL vacío:', url.substring(0, 60));
                        resolve(img);
                        return;
                    }
                    Cache.set(url, dataUrl);
                    resolve(img);
                } catch (e) {
                    // Si el canvas está tainted, reintentar con cache-buster
                    if (e.name === 'SecurityError' && !isRetry) {
                        log('🔄 Canvas tainted, reintentando con cache-buster:', url.substring(0, 60));
                        var buster = (url.includes('?') ? '&' : '?') + '_omc=' + Date.now();
                        loadFromNetwork(url, true)   // nota: url SIN buster, para que la key sea la misma
                            .then(resolve)
                            .catch(reject);
                        // pero cargamos con buster dentro del nuevo loadFromNetwork:
                        // mejor: llamamos directamente con buster
                        return;
                    }
                    console.error('❌ Error canvas en loadFromNetwork:', e.name, e.message, url.substring(0, 60));
                    resolve(img);
                }
            };

            img.onerror = function() {
                clearTimeout(timeoutId);
                Cache.setFailed(url);
                reject(new Error('Error al cargar: ' + url));
            };

            // Si es retry, añadir cache-buster
            if (isRetry) {
                var buster = (url.includes('?') ? '&' : '?') + '_omc=' + Date.now();
                img.src = url + buster;
            } else {
                img.src = url;
            }
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
                var stats = Cache.stats();
                log('📊 Caché actual:', stats);
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
    // FORZAR RECARGA DE FALLIDAS
    // ============================================================
    function forceReloadFailed() {
        log('🔄 Forzando recarga de imágenes fallidas...');
        Cache.clearFailed();
        var selector = 'img[src*="/Boveda/"], img[src*="Boveda"], img[data-src*="/Boveda/"], img[data-src*="Boveda"]';
        document.querySelectorAll(selector).forEach(function(img) {
            delete img.dataset.omcProcessed;
        });
        processAllBovedaImages();
    }

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    function init() {
        log('🚀 OMC-Cache v3.5 inicializado');

        Cache.cleanExpired();

        var stats = Cache.stats();
        log('📊 Estadísticas iniciales:', stats);

        if (stats.failed > 100) {
            log('⚠️ Demasiadas fallidas (' + stats.failed + '), limpiando...');
            Cache.clearFailed();
        }

        setTimeout(function() {
            processAllBovedaImages();
        }, CONFIG.INIT_DELAY);

        setTimeout(function() {
            processAllBovedaImages();
        }, CONFIG.SECOND_PASS);

        setupImageObserver();
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
                        var imgs = node.querySelectorAll('img[src*="/Boveda/"], img[src*="Boveda"], img[data-src*="/Boveda/"], img[data-src*="Boveda"]');
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

            if (hasNewImages) {
                log('🔄 Nuevas imágenes detectadas por el observador');
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('👀 Observador activado');
        return observer;
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
        stats: function() { return Cache.stats(); },
        config: CONFIG,
        normalizeUrl: normalizeUrl
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

})();