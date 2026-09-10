(function() {
    'use strict';

    function log(msg, type = 'info') {
        const prefix = '[OMC-WPF]';
        if (type === 'error') console.error(prefix, msg);
        else if (type === 'warn') console.warn(prefix, msg);
        else console.log(prefix, msg);
    }

    log('Script iniciado');

    // =========== INYECCIÓN DE ESTILOS EN LÍNEA (SIEMPRE) ===========
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* RESET Y BASE */
            * { box-sizing: border-box; margin: 0; padding: 0; }
            :root {
                --color-bg: #030709;
                --color-surface: #0A3035;
                --color-text: #e0e0e0;
                --color-accent: #00FF7B;
                --color-border: rgba(255,255,255,0.08);
                --font-family: 'Poppins', sans-serif;
                --radius: 12px;
                --shadow: 0 8px 32px rgba(0,0,0,0.6);
                --transition: 0.25s ease-in-out;
            }
            body { font-family: var(--font-family); background: var(--color-bg); color: var(--color-text); line-height: 1.6; }
            #omc-modal-overlay {
                position: fixed; top:0; left:0; width:100%; height:100%;
                background: rgba(3,7,9,0.95); backdrop-filter: blur(6px);
                z-index:10000; display:none; align-items:center; justify-content:center;
                padding:20px; font-family:var(--font-family);
            }
            #omc-modal {
                background: var(--color-surface); border:1px solid var(--color-border);
                border-radius: var(--radius); box-shadow: var(--shadow);
                max-width:1100px; width:100%; max-height:95vh; overflow-y:auto;
                padding:20px 24px 24px; position:relative; color:var(--color-text);
                animation: modalFadeIn 0.3s ease;
            }
            @keyframes modalFadeIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
            #omc-modal::-webkit-scrollbar { width:6px; }
            #omc-modal::-webkit-scrollbar-track { background:rgba(255,255,255,0.05); border-radius:10px; }
            #omc-modal::-webkit-scrollbar-thumb { background:var(--color-accent); border-radius:10px; }

            .omc-close-icon {
                position:absolute; top:14px; right:16px; background:none; border:none;
                cursor:pointer; width:30px; height:30px; display:flex; align-items:center; justify-content:center;
                border-radius:50%; transition:var(--transition); color:rgba(255,255,255,0.5);
            }
            .omc-close-icon:hover { background:rgba(255,255,255,0.08); color:#fff; }
            .omc-close-icon svg { width:18px; height:18px; fill:currentColor; }

            .omc-topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
            .status-pill { font-size:12px; font-weight:500; padding:3px 14px; border-radius:50px; background:rgba(255,255,255,0.06); border:1px solid var(--color-border); color:rgba(255,255,255,0.7); display:inline-flex; align-items:center; gap:4px; }
            .pill-exists { background:rgba(0,255,123,0.15); color:#00FF7B; border-color:#00FF7B; }
            .pill-new { background:rgba(255,183,77,0.15); color:#FFB74D; border-color:rgba(255,183,77,0.3); }

            #omc-modal h2 { font-size:20px; font-weight:600; margin-bottom:14px; display:flex; align-items:center; gap:8px; color:#fff; }
            #omc-modal h2 svg { width:24px; height:24px; fill:#00FF7B; }
            #omc-modal h2 span { color:#00FF7B; font-weight:300; font-size:16px; }

            .omc-form-group { margin-bottom:10px; }
            .omc-form-group label { display:block; font-size:12px; font-weight:500; color:rgba(255,255,255,0.7); margin-bottom:2px; letter-spacing:0.2px; }
            .omc-form-group input, .omc-form-group select, .omc-form-group textarea {
                width:100%; padding:4px 10px; /* REDUCIDO */
                background:rgba(255,255,255,0.06); border:1px solid var(--color-border);
                border-radius:6px; color:var(--color-text); font-family:var(--font-family);
                font-size:13px; outline:none; transition:var(--transition);
            }
            .omc-form-group textarea { min-height:70px; resize:vertical; padding:6px 10px; }
            .omc-form-group input:focus, .omc-form-group textarea:focus, .omc-form-group select:focus {
                border-color:#00FF7B; box-shadow:0 0 0 3px rgba(0,255,123,0.15);
            }
            .omc-form-group input[readonly] { opacity:0.6; cursor:not-allowed; }

            .band-details-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
            .band-search-group { display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap; }
            .band-search-group .omc-form-group { flex:1; }
            .search-band-btn {
                background:rgba(33,150,243,0.1); color:#42a5f5; border:1px solid rgba(33,150,243,0.2);
                border-radius:50px; padding:4px 14px; font-family:var(--font-family);
                font-weight:500; font-size:12px; cursor:pointer; transition:var(--transition);
                white-space:nowrap; display:inline-flex; align-items:center; gap:4px; height:30px; /* ALINEADO */
            }
            .search-band-btn:hover { background:rgba(33,150,243,0.2); }
            .search-band-btn svg { width:14px; height:14px; fill:currentColor; }

            .support-group { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
            .support-group select { flex:1; min-width:100px; }
            .support-group input { flex:2; min-width:120px; }
            .support-group label { width:100%; }

            .band-actions, .match-bar { display:flex; flex-wrap:wrap; gap:10px; margin-top:14px; justify-content:center; }
            .omc-btn, .omc-secondary-btn {
                padding:6px 18px; border:none; border-radius:50px;
                font-family:var(--font-family); font-weight:600; font-size:13px;
                cursor:pointer; transition:var(--transition);
                display:inline-flex; align-items:center; gap:6px;
            }
            .omc-btn { background:#00FF7B; color:#030709; }
            .omc-btn:hover { background:#66ffa3; box-shadow:0 0 20px rgba(0,255,123,0.3); transform:translateY(-2px); }
            .omc-btn-update { background:#2979ff; color:#fff; }
            .omc-btn-update:hover { background:#448aff; }
            .omc-btn-save { background:#ff9100; color:#fff; }
            .omc-btn-save:hover { background:#ffab00; }
            .omc-secondary-btn { background:rgba(255,255,255,0.08); color:var(--color-text); border:1px solid var(--color-border); }
            .omc-secondary-btn:hover { background:rgba(255,255,255,0.15); border-color:#00FF7B; }
            .omc-btn svg, .omc-secondary-btn svg { width:16px; height:16px; fill:currentColor; }

            .omc-two-columns { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:14px; }
            .omc-column { background:rgba(0,0,0,0.25); border-radius:var(--radius); border:1px solid var(--color-border); display:flex; flex-direction:column; min-height:240px; }
            .omc-column-header { padding:8px 12px; font-weight:600; font-size:14px; color:rgba(255,255,255,0.9); background:rgba(0,0,0,0.3); border-bottom:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; }
            .omc-column-header svg { width:18px; height:18px; fill:#00FF7B; margin-right:4px; }
            .select-all-link { background:none; border:none; color:#00FF7B; font-size:11px; cursor:pointer; font-weight:500; transition:var(--transition); font-family:var(--font-family); display:inline-flex; align-items:center; gap:3px; }
            .select-all-link:hover { color:#66ffa3; text-decoration:underline; }
            .select-all-link svg { width:12px; height:12px; fill:currentColor; }

            .omc-filter-input {
                margin:6px 12px; padding:4px 10px 4px 28px;
                background:rgba(255,255,255,0.06); border:1px solid var(--color-border);
                border-radius:50px; color:var(--color-text); font-family:var(--font-family);
                font-size:12px; outline:none; transition:var(--transition);
                background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='rgba(255,255,255,0.3)'%3E%3Cpath d='M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'/%3E%3C/svg%3E");
                background-size:12px; background-position:8px center; background-repeat:no-repeat;
            }
            .omc-filter-input:focus { border-color:#00FF7B; box-shadow:0 0 0 3px rgba(0,255,123,0.15); }

            .album-container { flex:1; overflow-y:auto; padding:2px 0; max-height:320px; }
            .album-container::-webkit-scrollbar { width:4px; }
            .album-container::-webkit-scrollbar-track { background:rgba(255,255,255,0.03); }
            .album-container::-webkit-scrollbar-thumb { background:var(--color-accent); border-radius:10px; }

            .loading-spinner { padding:20px; text-align:center; color:rgba(255,255,255,0.4); font-size:13px; display:flex; flex-direction:column; align-items:center; gap:8px; }
            .loading-spinner::after { content:''; width:24px; height:24px; border:3px solid rgba(255,255,255,0.1); border-top-color:#00FF7B; border-radius:50%; animation:spin 0.8s linear infinite; }
            @keyframes spin { to { transform:rotate(360deg); } }

            .album-item { display:flex; align-items:center; gap:8px; padding:4px 10px; border-bottom:1px solid rgba(255,255,255,0.03); transition:var(--transition); border-left:3px solid transparent; }
            .album-item:hover { background:rgba(255,255,255,0.04); }
            .album-item .album-check, .album-item .album-radio { flex-shrink:0; accent-color:#00FF7B; width:14px; height:14px; cursor:pointer; }
            .album-item .album-info { flex:1; min-width:0; }
            .album-item .album-title-display { font-weight:500; font-size:13px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .album-item .album-meta-static { font-size:11px; color:rgba(255,255,255,0.4); display:flex; gap:4px; flex-wrap:wrap; align-items:center; }
            .badge-tipo { display:inline-block; padding:1px 8px; border-radius:50px; font-size:11px; font-weight:600; border:1px solid transparent; white-space:nowrap; color:#fff; }
            .badge-tipo.full-length { background:#00c853; }
            .badge-tipo.split { background:#2979ff; }
            .badge-tipo.demo { background:#ff9100; }
            .badge-tipo.ep { background:#d50000; }
            .badge-tipo.single { background:#8e44ad; }
            .badge-tipo.live-album { background:#e67e22; }
            .badge-tipo.compilation { background:#2ecc71; }
            .badge-tipo.boxed-set { background:#f39c12; }
            .badge-tipo:not(.full-length):not(.split):not(.demo):not(.ep):not(.single):not(.live-album):not(.compilation):not(.boxed-set) { background:#666; }
            .badge-anio { display:inline-block; padding:1px 8px; border-radius:50px; font-size:11px; font-weight:600; background:#FF8C00; color:#1a1a1a; border:1px solid rgba(255,140,0,0.3); }
            .badge-mid { display:inline-block; padding:1px 8px; border-radius:50px; font-size:11px; font-weight:500; background:rgba(79,195,247,0.2); color:#4FC3F7; border:1px solid rgba(79,195,247,0.2); }

            .album-item .album-actions { display:flex; gap:3px; flex-shrink:0; }
            .album-item .album-actions button { background:none; border:none; cursor:pointer; padding:2px 4px; border-radius:4px; transition:var(--transition); color:rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; }
            .album-item .album-actions button svg { width:14px; height:14px; fill:currentColor; }
            .album-item .album-actions button:hover { background:rgba(255,255,255,0.08); color:#fff; }
            .album-item .album-actions .save-edit { color:#00FF7B; }
            .album-item .album-editable { display:none; flex-wrap:wrap; gap:4px; margin-top:2px; }
            .album-item .album-editable input { flex:1; min-width:50px; padding:2px 6px; background:rgba(255,255,255,0.08); border:1px solid var(--color-border); border-radius:4px; color:#fff; font-size:12px; font-family:var(--font-family); }

            .omc-floating-btn {
                position:fixed; bottom:30px; right:30px; z-index:9999;
                background:#00FF7B; color:#030709; border:none; border-radius:50px;
                padding:10px 20px; font-family:var(--font-family); font-weight:600;
                font-size:14px; cursor:pointer; box-shadow:0 4px 20px rgba(0,255,123,0.4);
                transition:var(--transition); display:flex; align-items:center; gap:8px;
            }
            .omc-floating-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(0,255,123,0.6); }

            .spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.2); border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; }
            #omc-toast-container { position:fixed; bottom:70px; right:20px; z-index:10001; display:flex; flex-direction:column; gap:8px; max-width:380px; }
            .omc-toast { background:#0A3035; backdrop-filter:blur(8px); border-left:4px solid #00FF7B; border-radius:var(--radius); padding:10px 16px; box-shadow:var(--shadow); color:var(--color-text); font-size:13px; display:flex; align-items:center; gap:10px; border:1px solid var(--color-border); animation:slideInToast 0.3s ease; }
            .omc-toast svg { width:18px; height:18px; fill:currentColor; flex-shrink:0; }
            .omc-toast.error { border-left-color:#ff5252; }
            .omc-toast.warning { border-left-color:#FFB74D; }
            .omc-toast.info { border-left-color:#4FC3F7; }
            @keyframes slideInToast { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
            @keyframes fadeOutToast { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(40px); } }

            @media (max-width:768px) {
                .omc-two-columns { grid-template-columns:1fr; }
                .band-details-grid { grid-template-columns:1fr; }
                .support-group { flex-direction:column; align-items:stretch; }
                .band-search-group { flex-direction:column; align-items:stretch; }
                .omc-floating-btn { bottom:16px; right:16px; padding:8px 16px; font-size:13px; }
                .match-bar { flex-direction:column; }
                .match-bar .omc-btn { width:100%; justify-content:center; }
            }
        `;
        document.head.appendChild(style);
        log('Estilos en línea inyectados');
    }

    // =========== INICIALIZACIÓN ===========
    function iniciar() {
        log('Iniciando infiltrador...');
        if (!window.chrome?.webview) {
            log('No se detectó WebView2', 'error');
            return;
        }
        log('WebView2 detectado');

        // Verificar si estamos en página de banda
        const currentUrl = window.location.href;
        const bandaMatch = currentUrl.match(/\/(\d+)(?:[/?#]|$)/);
        if (!bandaMatch) {
            log('No es una página de banda. El infiltrador no se activará.');
            return;
        }
        const bandaId = bandaMatch[1];
        log(`Página de banda detectada (ID: ${bandaId})`);

        // Inyectar estilos siempre
        injectStyles();

        // =========== PUENTE DE COMUNICACIÓN ===========
        const activePromises = {};
        let callCounter = 0;
        const CALL_TIMEOUT = 20000;

        window.callHost = function(action, data) {
            const callId = ++callCounter;
            log(`Nueva llamada: ${action} (ID: ${callId})`);
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    if (activePromises[callId]) {
                        delete activePromises[callId];
                        reject(new Error(`Timeout en ${action} (ID: ${callId})`));
                        log(`Timeout ${action}`, 'error');
                    }
                }, CALL_TIMEOUT);

                activePromises[callId] = { resolve, reject, timeoutId };
                try {
                    window.chrome.webview.postMessage(JSON.stringify({ id: callId, accion: action, datos: data }));
                } catch (err) {
                    clearTimeout(timeoutId);
                    delete activePromises[callId];
                    reject(err);
                    log(`Error postMessage: ${err.message}`, 'error');
                }
            });
        };

        window.chrome.webview.addEventListener('message', event => {
            const response = event.data;
            if (response && response.id) {
                log(`Respuesta para ID: ${response.id} | Success: ${response.success}`);
                const p = activePromises[response.id];
                if (p) {
                    clearTimeout(p.timeoutId);
                    delete activePromises[response.id];
                    response.success ? p.resolve(response.datos) : p.reject(new Error(response.error || 'Error en host'));
                } else {
                    log(`Promesa no encontrada para ID ${response.id}`, 'warn');
                }
            }
        });

        // =========== FUNCIONES DE COMUNICACIÓN CON LA BD ===========
        async function cargarAlbumesBD(metallumId) {
            const container = document.getElementById("omc-albums-bd");
            if (!container) return;
            container.innerHTML = `<div class="loading-spinner">Cargando álbumes desde BD...</div>`;
            try {
                const result = await callHost("OBTENER_ALBUMES", { metallumId });
                let albumsData = result?.albums || [];
                bdAlbums = albumsData.map(alb => ({
                    IdAlbum: alb.IdAlbum,
                    Titulo: alb.Titulo,
                    Anio: alb.Anio,
                    MetallumId: alb.MetallumId || "",
                    originalTitulo: alb.Titulo,
                    originalAnio: alb.Anio,
                    originalMetallumId: alb.MetallumId || ""
                }));
                renderBDAlbums();
                log(`${bdAlbums.length} álbumes BD cargados`);
                applyFilterToColumn('bd');
            } catch (error) {
                log(`Error cargarAlbumesBD: ${error.message}`, 'error');
                container.innerHTML = `<div style="padding:20px; color:#ff6b6b;">Error: ${error.message}</div>`;
                bdAlbums = [];
            }
        }

        async function obtenerBandaLocal(metallumId) {
            try {
                const result = await callHost("OBTENER_BANDA_LOCAL", { metallumId });
                return result || { Existe: false };
            } catch (error) {
                log(`Error obtenerBandaLocal: ${error.message}`, 'error');
                return { Existe: false };
            }
        }

        async function guardarBanda(payload) {
            return await callHost("GUARDAR_BANDA", payload);
        }

        async function actualizarAlbumes(albumesModificados) {
            return await callHost("ACTUALIZAR_ALBUMES", { albums: albumesModificados });
        }

        async function sincronizarNuevosAlbumes(payload) {
            return await callHost("SINCRONIZAR_NUEVOS_ALBUMES", payload);
        }

        function notificarBoveda() { log("notificarBoveda ignorado (escritorio)"); }

        // =========== FUNCIONES DE UI ===========
        function showToast(message, type = 'success') {
            let container = document.getElementById('omc-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'omc-toast-container';
                document.body.appendChild(container);
            }
            const toast = document.createElement('div');
            toast.className = `omc-toast ${type}`;
            let iconSvg = '';
            if (type === 'success') {
                iconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
            } else if (type === 'error') {
                iconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
            } else {
                iconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
            }
            toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'fadeOutToast 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        function escapeHtml(str, forAttribute = false) {
            if (!str) return "";
            if (forAttribute) {
                return str.replace(/[&<>"]/g, function(m) {
                    if (m === '&') return '&amp;';
                    if (m === '<') return '&lt;';
                    if (m === '>') return '&gt;';
                    if (m === '"') return '&quot;';
                    return m;
                });
            } else {
                return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
            }
        }

        function getSafeString(id) {
            const val = document.getElementById(id)?.value ?? '';
            return val.trim() === '' ? '' : val.trim();
        }

        function extractSuffix(title) {
            const match = title.match(/\s(CD\d+|DVD\d+|Disc\s?\d+)$/i);
            return match ? match[1] : "";
        }

        let metallumAlbums = [];
        let bdAlbums = [];
        let currentLogo = "";
        let currentBandaId = null;

        function renderBDAlbums() {
            const container = document.getElementById("omc-albums-bd");
            if (!container) return;
            if (!bdAlbums.length) {
                container.innerHTML = `<div style="padding:20px; text-align:center; color:#8fa0aa;">📭 No hay álbumes en BD.</div>`;
                return;
            }
            let html = "";
            bdAlbums.forEach((alb, idx) => {
                const midDisplay = alb.MetallumId || "(ninguno)";
                html += `
                    <div class="album-item" data-idx="${idx}">
                        <input type="checkbox" class="album-check" data-i="${idx}">
                        <div class="album-info">
                            <div class="album-title-display">${escapeHtml(alb.Titulo)}</div>
                            <div class="album-meta-static">
                                <span class="badge-anio">${escapeHtml(alb.Anio)}</span>
                                <span class="badge-mid">${escapeHtml(midDisplay)}</span>
                            </div>
                            <div class="album-editable" style="display:none;">
                                <input type="text" class="edit-title" value="${escapeHtml(alb.Titulo, true)}" placeholder="Título">
                                <input type="text" class="edit-year" value="${escapeHtml(alb.Anio, true)}" placeholder="Año">
                                <input type="text" class="edit-mid" value="${escapeHtml(alb.MetallumId || "", true)}" placeholder="Metallum ID">
                            </div>
                        </div>
                        <div class="album-actions">
                            <button class="btn-edit-album" title="Editar">
                                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41z"/></svg>
                            </button>
                            <button class="btn-reset-album" title="Restaurar">
                                <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                            </button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;

            document.querySelectorAll("#omc-albums-bd .album-item").forEach(item => {
                const idx = parseInt(item.dataset.idx);
                const editBtn = item.querySelector(".btn-edit-album");
                const resetBtn = item.querySelector(".btn-reset-album");
                const displayDiv = item.querySelector(".album-title-display");
                const metaStatic = item.querySelector(".album-meta-static");
                const yearSpan = metaStatic.querySelector(".badge-anio");
                const midSpan = metaStatic.querySelector(".badge-mid");
                const editableDiv = item.querySelector(".album-editable");
                const editTitle = editableDiv.querySelector(".edit-title");
                const editYear = editableDiv.querySelector(".edit-year");
                const editMid = editableDiv.querySelector(".edit-mid");

                editBtn.addEventListener("click", () => {
                    displayDiv.style.display = "none";
                    metaStatic.style.display = "none";
                    editableDiv.style.display = "flex";
                    editBtn.style.display = "none";
                    resetBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
                    resetBtn.classList.add("save-edit");
                });

                const saveEdit = () => {
                    const newTitle = editTitle.value.trim();
                    const newYear = editYear.value.trim();
                    const newMid = editMid.value.trim();
                    if (newTitle === "") return;
                    bdAlbums[idx].Titulo = newTitle;
                    bdAlbums[idx].Anio = newYear;
                    bdAlbums[idx].MetallumId = newMid;
                    displayDiv.innerText = escapeHtml(newTitle);
                    yearSpan.innerText = escapeHtml(newYear);
                    midSpan.innerText = escapeHtml(newMid || "(ninguno)");
                    displayDiv.style.display = "block";
                    metaStatic.style.display = "block";
                    editableDiv.style.display = "none";
                    editBtn.style.display = "inline-flex";
                    resetBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
                    resetBtn.classList.remove("save-edit");
                    applyFilterToColumn('bd');
                };

                resetBtn.addEventListener("click", (e) => {
                    if (resetBtn.classList.contains("save-edit")) {
                        saveEdit();
                    } else {
                        const orig = bdAlbums[idx];
                        if (orig) {
                            bdAlbums[idx].Titulo = orig.originalTitulo;
                            bdAlbums[idx].Anio = orig.originalAnio;
                            bdAlbums[idx].MetallumId = orig.originalMetallumId;
                            displayDiv.innerText = escapeHtml(orig.originalTitulo);
                            yearSpan.innerText = escapeHtml(orig.originalAnio);
                            midSpan.innerText = escapeHtml(orig.originalMetallumId || "(ninguno)");
                            editTitle.value = orig.originalTitulo;
                            editYear.value = orig.originalAnio;
                            editMid.value = orig.originalMetallumId || "";
                            if (editableDiv.style.display === "flex") {
                                displayDiv.style.display = "block";
                                metaStatic.style.display = "block";
                                editableDiv.style.display = "none";
                                editBtn.style.display = "inline-flex";
                                resetBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
                                resetBtn.classList.remove("save-edit");
                            }
                            applyFilterToColumn('bd');
                        }
                    }
                });
            });
        }

        async function cargarAlbumesMetallum(id) {
            const container = document.getElementById("omc-albums-metallum");
            if (!container) return;
            container.innerHTML = `<div class="loading-spinner">🔍 Cargando discografía Metallum...</div>`;
            try {
                const htmlD = await fetch(`https://www.metal-archives.com/band/discography/id/${id}/tab/all`).then(r => r.text());
                const parser = new DOMParser();
                const docD = parser.parseFromString(htmlD, "text/html");
                const rows = docD.querySelectorAll("tbody tr");
                metallumAlbums = [];
                let albumsHtml = "";
                rows.forEach((row, idx) => {
                    const anchor = row.querySelector("a[href*='/albums/']");
                    if (anchor) {
                        const albId = anchor.href.split('/').pop();
                        const celdas = row.querySelectorAll("td");
                        let tipo = "Álbum";
                        if (celdas.length >= 2) {
                            tipo = celdas[1].innerText.trim() || "Álbum";
                        }
                        const anio = celdas.length >= 3 ? celdas[2].innerText.trim() : "????";
                        const titulo = anchor.innerText.trim();
                        metallumAlbums.push({ AlbumId: albId, Titulo: titulo, Anio: anio, Tipo: tipo });
                        const tipoClass = tipo.toLowerCase().replace(/\s/g, '-');
                        albumsHtml += `
                            <div class="album-item" data-idx="${idx}">
                                <input type="radio" name="selectedMetallumAlbum" class="album-radio" data-i="${idx}">
                                <input type="checkbox" class="album-check" data-i="${idx}">
                                <div class="album-info">
                                    <div class="album-title-display">${escapeHtml(titulo)}</div>
                                    <div class="album-meta-static">
                                        <span class="badge-tipo ${tipoClass}">${escapeHtml(tipo)}</span>
                                        <span class="badge-anio">${escapeHtml(anio)}</span>
                                    </div>
                                    <div class="album-editable" style="display:none;">
                                        <input type="text" class="edit-title" value="${escapeHtml(titulo, true)}" placeholder="Título">
                                        <input type="text" class="edit-year" value="${escapeHtml(anio, true)}" placeholder="Año">
                                    </div>
                                </div>
                                <div class="album-actions">
                                    <button class="btn-edit-album" title="Editar">
                                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41z"/></svg>
                                    </button>
                                    <button class="btn-reset-album" title="Restaurar">
                                        <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                });
                if (albumsHtml === "") albumsHtml = `<div style="padding:20px; text-align:center; color:#8fa0aa;">🎵 Sin discografía detectada</div>`;
                container.innerHTML = albumsHtml;
                document.querySelectorAll("#omc-albums-metallum .album-item").forEach(item => {
                    const editBtn = item.querySelector(".btn-edit-album");
                    const resetBtn = item.querySelector(".btn-reset-album");
                    const displayDiv = item.querySelector(".album-title-display");
                    const metaStatic = item.querySelector(".album-meta-static");
                    const yearSpan = metaStatic.querySelector(".badge-anio");
                    const tipoSpan = metaStatic.querySelector(".badge-tipo");
                    const editableDiv = item.querySelector(".album-editable");
                    const editTitle = editableDiv.querySelector(".edit-title");
                    const editYear = editableDiv.querySelector(".edit-year");

                    editBtn.addEventListener("click", () => {
                        displayDiv.style.display = "none";
                        metaStatic.style.display = "none";
                        editableDiv.style.display = "flex";
                        editBtn.style.display = "none";
                        resetBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
                        resetBtn.classList.add("save-edit");
                    });

                    const saveEdit = () => {
                        const newTitle = editTitle.value.trim();
                        const newYear = editYear.value.trim();
                        if (newTitle === "") return;
                        displayDiv.innerText = escapeHtml(newTitle);
                        yearSpan.innerText = escapeHtml(newYear);
                        displayDiv.style.display = "block";
                        metaStatic.style.display = "block";
                        editableDiv.style.display = "none";
                        editBtn.style.display = "inline-flex";
                        resetBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
                        resetBtn.classList.remove("save-edit");
                        const idx = parseInt(item.dataset.idx);
                        if (metallumAlbums[idx]) {
                            metallumAlbums[idx].Titulo = newTitle;
                            metallumAlbums[idx].Anio = newYear;
                        }
                        applyFilterToColumn('metallum');
                    };

                    resetBtn.addEventListener("click", (e) => {
                        if (resetBtn.classList.contains("save-edit")) {
                            saveEdit();
                        } else {
                            const idx = parseInt(item.dataset.idx);
                            const orig = metallumAlbums[idx];
                            if (orig) {
                                displayDiv.innerText = escapeHtml(orig.Titulo);
                                yearSpan.innerText = escapeHtml(orig.Anio);
                                editTitle.value = orig.Titulo;
                                editYear.value = orig.Anio;
                                if (editableDiv.style.display === "flex") {
                                    displayDiv.style.display = "block";
                                    metaStatic.style.display = "block";
                                    editableDiv.style.display = "none";
                                    editBtn.style.display = "inline-flex";
                                    resetBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
                                    resetBtn.classList.remove("save-edit");
                                }
                                applyFilterToColumn('metallum');
                            }
                        }
                    });
                });
                applyFilterToColumn('metallum');
            } catch (e) {
                container.innerHTML = `<div style="padding:20px; color:#ff6b6b;">Error: ${e.message}</div>`;
                log(`Error cargarAlbumesMetallum: ${e.message}`, 'error');
                metallumAlbums = [];
            }
        }

        function setupFilter(columnId, filterInputId) {
            const input = document.getElementById(filterInputId);
            if (!input) return;
            input.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const container = document.getElementById(columnId);
                if (!container) return;
                const items = container.querySelectorAll('.album-item');
                items.forEach(item => {
                    const titleElem = item.querySelector('.album-title-display');
                    const title = titleElem ? titleElem.innerText.toLowerCase() : '';
                    if (title.includes(searchTerm) || searchTerm === '') {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }

        function applyFilterToColumn(columnType) {
            const inputId = columnType === 'metallum' ? 'omc-filter-metallum' : 'omc-filter-bd';
            const input = document.getElementById(inputId);
            if (input && input.value) {
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
        }

        function vincularSeleccionados() {
            const selectedRadio = document.querySelector("#omc-albums-metallum .album-radio:checked");
            if (!selectedRadio) { showToast("Selecciona un álbum de Metallum (radio).", "warning"); return; }
            const metallumIdx = selectedRadio.dataset.i;
            if (metallumIdx === undefined) return;
            const metallumAlbum = metallumAlbums[metallumIdx];
            if (!metallumAlbum) return;

            const selectedBD = document.querySelectorAll("#omc-albums-bd .album-check:checked");
            if (selectedBD.length === 0) { showToast("Selecciona al menos un álbum de BD (checkbox).", "warning"); return; }

            for (let chk of selectedBD) {
                const bdIdx = chk.dataset.i;
                const bdAlbum = bdAlbums[bdIdx];
                if (!bdAlbum) continue;

                bdAlbum.MetallumId = metallumAlbum.AlbumId;
                const suffix = extractSuffix(bdAlbum.Titulo);
                let newTitle = metallumAlbum.Titulo;
                if (suffix) newTitle += " " + suffix;
                bdAlbum.Titulo = newTitle;
                bdAlbum.Anio = metallumAlbum.Anio;

                const itemDiv = chk.closest(".album-item");
                if (itemDiv) {
                    const titleDiv = itemDiv.querySelector(".album-title-display");
                    if (titleDiv) titleDiv.innerText = escapeHtml(newTitle);
                    const metaStatic = itemDiv.querySelector(".album-meta-static");
                    if (metaStatic) {
                        const yearSpan = metaStatic.querySelector(".badge-anio");
                        if (yearSpan) yearSpan.innerText = escapeHtml(metallumAlbum.Anio);
                        const midSpan = metaStatic.querySelector(".badge-mid");
                        if (midSpan) midSpan.innerText = escapeHtml(metallumAlbum.AlbumId);
                    }
                    const editableDiv = itemDiv.querySelector(".album-editable");
                    if (editableDiv) {
                        if (editableDiv.querySelector(".edit-title")) editableDiv.querySelector(".edit-title").value = newTitle;
                        if (editableDiv.querySelector(".edit-year")) editableDiv.querySelector(".edit-year").value = metallumAlbum.Anio;
                        if (editableDiv.querySelector(".edit-mid")) editableDiv.querySelector(".edit-mid").value = metallumAlbum.AlbumId;
                    }
                    itemDiv.style.borderColor = "#00e676";
                    setTimeout(() => { itemDiv.style.borderColor = "transparent"; }, 1500);
                }
                chk.checked = false;
            }
            selectedRadio.checked = false;
            showToast(`Vinculados ${selectedBD.length} álbumes temporalmente. Guarda los cambios de BD.`, "success");
            applyFilterToColumn('bd');
        }

        function cargarLinks(id) {
            const sel = document.getElementById("omc-support-sel");
            sel.innerHTML = '<option value="">-- Cargando enlaces --</option>';
            fetch(`https://www.metal-archives.com/link/ajax-list/type/band/id/${id}`)
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");
                    let selectHtml = '<option value="">-- Seleccionar desde Metallum --</option>';
                    doc.querySelectorAll("a").forEach(link => {
                        const href = link.href;
                        if (!href.includes("metal-archives.com") && href.trim() !== "") {
                            selectHtml += `<option value="${escapeHtml(href, true)}">${escapeHtml(link.innerText)}</option>`;
                        }
                    });
                    sel.innerHTML = selectHtml;
                    sel.onchange = () => {
                        if (sel.value) document.getElementById("omc-support-manual").value = sel.value;
                    };
                })
                .catch(err => {
                    sel.innerHTML = '<option value="">-- Error al cargar enlaces --</option>';
                    log(`Error cargarLinks: ${err.message}`, 'error');
                });
        }

        function setupSelectors() {
            document.getElementById("omc-select-all-metallum").onclick = () => {
                const checks = document.querySelectorAll("#omc-albums-metallum .album-check");
                const someUnchecked = Array.from(checks).some(c => !c.checked);
                checks.forEach(c => c.checked = someUnchecked);
            };
            document.getElementById("omc-select-all-bd").onclick = () => {
                const checks = document.querySelectorAll("#omc-albums-bd .album-check");
                const someUnchecked = Array.from(checks).some(c => !c.checked);
                checks.forEach(c => c.checked = someUnchecked);
            };
        }

        async function infiltrar() {
            btn.innerHTML = `<span class="spinner"></span> CONECTANDO...`;
            const urlMatch = window.location.href.match(/\/(\d+)(?:[/?#]|$)/);
            const bandaId = urlMatch ? urlMatch[1] : null;
            if (!bandaId) { showToast("No se detectó ID de Metallum en la URL.", "error"); btn.innerHTML = "❌ ERROR"; return; }
            currentBandaId = bandaId;

            const mName = document.querySelector(".band_name a")?.innerText.trim() || "";
            const mLogo = document.querySelector("#logo img")?.src || "";
            const mStats = document.querySelectorAll("#band_stats dd");
            const mCountry = mStats[0]?.innerText.trim() || "N/A";
            const mLoc = mStats[1]?.innerText.trim() || "N/A";
            const mYear = mStats[3]?.innerText.trim() || "N/A";
            const mGenre = mStats[4]?.innerText.trim() || "N/A";
            currentLogo = mLogo;

            document.getElementById("omc-id").value = bandaId;
            document.getElementById("omc-name").value = mName;
            document.getElementById("omc-country").value = mCountry;
            document.getElementById("omc-loc").value = mLoc;
            document.getElementById("omc-year").value = mYear;
            document.getElementById("omc-genre").value = mGenre;
            document.getElementById("omc-support-manual").value = "";
            document.getElementById("omc-desc").value = "";

            await cargarAlbumesMetallum(bandaId);
            await cargarAlbumesBD(bandaId);
            cargarLinks(bandaId);
            overlay.style.display = "flex";
            btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> INFILTRAR OMC`;

            const data = await obtenerBandaLocal(bandaId);
            const statusDiv = document.getElementById("omc-status");
            if (data.Existe) {
                const setIfNotEmpty = (id, value) => { if (value && value.trim()) document.getElementById(id).value = value; };
                setIfNotEmpty("omc-name", data.Nombre);
                setIfNotEmpty("omc-country", data.Pais);
                setIfNotEmpty("omc-loc", data.Localizacion);
                setIfNotEmpty("omc-year", data.AnioFormacion);
                setIfNotEmpty("omc-genre", data.Genero);
                if (data.SupportUrl?.trim()) document.getElementById("omc-support-manual").value = data.SupportUrl;
                if (data.Descripcion?.trim()) document.getElementById("omc-desc").value = data.Descripcion;
                statusDiv.innerText = `📀 EN BÓVEDA (DESKTOP)`;
                statusDiv.className = "status-pill pill-exists";
            } else {
                statusDiv.innerText = `🆕 NUEVA BANDA (DESKTOP)`;
                statusDiv.className = "status-pill pill-new";
            }
        }

        window.guardarDatosBanda = async function() {
            const bandaId = document.getElementById("omc-id").value;
            if (!bandaId) { showToast("No hay ID de Metallum cargado.", "warning"); return; }
            const payload = {
                BandaId: bandaId,
                NombreBanda: document.getElementById("omc-name").value.trim(),
                Pais: getSafeString("omc-country"),
                Localizacion: getSafeString("omc-loc"),
                AnioFormacion: getSafeString("omc-year"),
                Genero: getSafeString("omc-genre"),
                SupportUrl: getSafeString("omc-support-manual"),
                Descripcion: getSafeString("omc-desc"),
                LogoUrl: currentLogo,
                Albums: []
            };
            const btnSave = document.getElementById("save-band-btn");
            const originalText = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = `<span class="spinner"></span> GUARDANDO...`;
            try {
                await guardarBanda(payload);
                showToast("Datos de banda guardados correctamente.", "success");
                const statusDiv = document.getElementById("omc-status");
                statusDiv.innerText = `📀 EN BÓVEDA (DESKTOP)`;
                statusDiv.className = "status-pill pill-exists";
                await window.refreshBandDataFromBD();
                notificarBoveda();
            } catch (err) { showToast("Error al guardar banda: " + err.message, "error"); }
            finally { btnSave.disabled = false; btnSave.innerHTML = originalText; }
        };

        window.guardarCambiosBD = async function() {
            const modificados = bdAlbums.filter(alb => alb.Titulo !== alb.originalTitulo || alb.Anio !== alb.originalAnio || alb.MetallumId !== alb.originalMetallumId);
            if (modificados.length === 0) { showToast("No hay cambios pendientes en álbumes.", "warning"); return; }
            const saveBtn = document.getElementById("omc-update-bd-btn");
            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<span class="spinner"></span> GUARDANDO...`;
            try {
                await actualizarAlbumes(modificados);
                showToast("Cambios de álbumes guardados.", "success");
                bdAlbums.forEach(alb => { alb.originalTitulo = alb.Titulo; alb.originalAnio = alb.Anio; alb.originalMetallumId = alb.MetallumId; });
                notificarBoveda();
            } catch (err) { showToast("Error al guardar álbumes: " + err.message, "error"); }
            finally { saveBtn.disabled = false; saveBtn.innerHTML = originalText; }
        };

        window.sincronizarNuevosAlbumes = async function() {
            const selectedChecks = document.querySelectorAll("#omc-albums-metallum .album-check:checked");
            const albumes = [];
            for (let chk of selectedChecks) {
                const idx = chk.dataset.i;
                if (idx !== undefined && metallumAlbums[idx]) {
                    const alb = metallumAlbums[idx];
                    albumes.push({
                        AlbumId: alb.AlbumId,
                        Titulo: alb.Titulo,
                        Anio: alb.Anio,
                        TipoNombre: alb.Tipo || null
                    });
                }
            }
            if (albumes.length === 0) { showToast("Selecciona al menos un checkbox en Metallum.", "warning"); return; }
            const payload = {
                BandaId: document.getElementById("omc-id").value,
                NombreBanda: document.getElementById("omc-name").value.trim(),
                Pais: getSafeString("omc-country"),
                Localizacion: getSafeString("omc-loc"),
                AnioFormacion: getSafeString("omc-year"),
                Genero: getSafeString("omc-genre"),
                SupportUrl: getSafeString("omc-support-manual"),
                Descripcion: getSafeString("omc-desc"),
                LogoUrl: currentLogo,
                Albums: albumes,
                TipoNombre: null
            };
            const syncBtn = document.getElementById("omc-sync-new-btn");
            const originalText = syncBtn.innerHTML;
            syncBtn.disabled = true;
            syncBtn.innerHTML = `<span class="spinner"></span> SINCRONIZANDO...`;
            try {
                await sincronizarNuevosAlbumes(payload);
                showToast("Sincronización completada.", "success");
                selectedChecks.forEach(chk => chk.checked = false);
                await cargarAlbumesBD(document.getElementById("omc-id").value);
                notificarBoveda();
            } catch (err) { showToast("Error al sincronizar: " + err.message, "error"); }
            finally { syncBtn.disabled = false; syncBtn.innerHTML = originalText; }
        };

        window.refreshBandDataFromBD = async function() {
            const bandaId = document.getElementById("omc-id").value;
            if (!bandaId) { showToast("No hay ID de Metallum cargado.", "warning"); return; }
            await cargarAlbumesMetallum(bandaId);
            await cargarAlbumesBD(bandaId);
            try {
                const data = await obtenerBandaLocal(bandaId);
                if (data.Existe) {
                    const setIfNotEmpty = (id, value) => { if (value && value.trim()) document.getElementById(id).value = value; };
                    setIfNotEmpty("omc-name", data.Nombre);
                    setIfNotEmpty("omc-country", data.Pais);
                    setIfNotEmpty("omc-loc", data.Localizacion);
                    setIfNotEmpty("omc-year", data.AnioFormacion);
                    setIfNotEmpty("omc-genre", data.Genero);
                    document.getElementById("omc-support-manual").value = data.SupportUrl?.trim() || "";
                    document.getElementById("omc-desc").value = data.Descripcion?.trim() || "";
                    const statusDiv = document.getElementById("omc-status");
                    statusDiv.innerText = `📀 EN BÓVEDA (DESKTOP)`;
                    statusDiv.className = "status-pill pill-exists";
                } else {
                    const statusDiv = document.getElementById("omc-status");
                    statusDiv.innerText = `🆕 NUEVA BANDA (DESKTOP)`;
                    statusDiv.className = "status-pill pill-new";
                }
            } catch (err) { log(`Error refresh: ${err.message}`, 'error'); }
        };

        // =========== CREACIÓN DE LA UI ===========
        const overlay = document.createElement('div');
        overlay.id = 'omc-modal-overlay';
        overlay.innerHTML = `
            <div id="omc-modal">
                <button id="omc-close" class="omc-close-icon">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
                <div class="omc-topbar">
                    <div class="dual-toggle" id="omc-dual-toggle" style="display:none;">
                        <span class="prod-span active">🌐 PROD</span>
                        <span class="local-span">💻 LOCAL</span>
                    </div>
                    <div id="omc-status" class="status-pill">CARGANDO...</div>
                </div>
                <h2>
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    OMC <span>MATCHING MANUAL</span>
                </h2>
                <div class="band-search-group">
                    <div class="omc-form-group" style="flex:1">
                        <label>Nombre de la Banda</label>
                        <input type="text" id="omc-name" autocomplete="off">
                    </div>
                    <button id="refreshBdBtn" class="search-band-btn">
                        <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4C7.58 4 4.01 7.58 4.01 12S7.58 20 12 20c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        Refrescar BD
                    </button>
                </div>
                <div class="band-details-grid">
                    <div class="omc-form-group"><label>Metallum ID</label><input type="text" id="omc-id" readonly></div>
                    <div class="omc-form-group"><label>País</label><input type="text" id="omc-country"></div>
                    <div class="omc-form-group"><label>Localización</label><input type="text" id="omc-loc"></div>
                    <div class="omc-form-group"><label>Año Formación</label><input type="text" id="omc-year"></div>
                    <div class="omc-form-group"><label>Género</label><input type="text" id="omc-genre"></div>
                </div>
                <div class="omc-form-group"><label>Descripción / Biografía</label><textarea id="omc-desc"></textarea></div>
                <div class="support-group omc-form-group">
                    <label>Enlace de Apoyo (Support URL)</label>
                    <select id="omc-support-sel"></select>
                    <input type="text" id="omc-support-manual" placeholder="O escribe URL manualmente">
                </div>
                <div class="band-actions">
                    <button id="save-band-btn" class="omc-secondary-btn">
                        <svg viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                        GUARDAR DATOS DE BANDA
                    </button>
                </div>
                <div class="omc-two-columns">
                    <div class="omc-column">
                        <div class="omc-column-header">
                            <span><svg viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"/></svg> ÁLBUMES METALLUM</span>
                            <button id="omc-select-all-metallum" class="select-all-link">
                                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> SEL. TODO
                            </button>
                        </div>
                        <input type="text" id="omc-filter-metallum" class="omc-filter-input" placeholder="Filtrar por título..." autocomplete="off">
                        <div class="album-container" id="omc-albums-metallum"><div class="loading-spinner">Cargando discografía...</div></div>
                    </div>
                    <div class="omc-column">
                        <div class="omc-column-header">
                            <span><svg viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"/></svg> ÁLBUMES EN BD</span>
                            <button id="omc-select-all-bd" class="select-all-link">
                                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> SEL. TODO
                            </button>
                        </div>
                        <input type="text" id="omc-filter-bd" class="omc-filter-input" placeholder="Filtrar por título..." autocomplete="off">
                        <div class="album-container" id="omc-albums-bd"><div class="loading-spinner">Cargando álbumes de BD...</div></div>
                    </div>
                </div>
                <div class="match-bar">
                    <button id="omc-match-btn" class="omc-btn">
                        <svg viewBox="0 0 24 24"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z"/></svg>
                        VINCULAR SELECCIONADOS
                    </button>
                    <button id="omc-update-bd-btn" class="omc-btn omc-btn-update">
                        <svg viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                        GUARDAR CAMBIOS BD
                    </button>
                    <button id="omc-sync-new-btn" class="omc-btn omc-btn-save">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        SINCRONIZAR NUEVOS ÁLBUMES
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const btn = document.createElement("button");
        btn.className = "omc-floating-btn";
        btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> INFILTRAR OMC`;
        document.body.appendChild(btn);

        const toggle = document.getElementById("omc-dual-toggle");
        if (toggle) toggle.style.display = "none";

        // Asignar eventos
        btn.onclick = infiltrar;
        document.getElementById("omc-close").onclick = () => {
            overlay.style.display = "none";
            log('Modal cerrado');
        };
        document.getElementById("save-band-btn").onclick = window.guardarDatosBanda;
        document.getElementById("omc-match-btn").onclick = vincularSeleccionados;
        document.getElementById("omc-update-bd-btn").onclick = window.guardarCambiosBD;
        document.getElementById("omc-sync-new-btn").onclick = window.sincronizarNuevosAlbumes;
        document.getElementById("refreshBdBtn").addEventListener("click", window.refreshBandDataFromBD);
        setupSelectors();
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") overlay.style.display = "none"; });

        setupFilter('omc-albums-metallum', 'omc-filter-metallum');
        setupFilter('omc-albums-bd', 'omc-filter-bd');

        log("Script completamente inicializado (con iconos SVG y diseño mejorado).");
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        // Si el DOM ya está listo, ejecutar inmediatamente
        setTimeout(iniciar, 0);
    }
})();