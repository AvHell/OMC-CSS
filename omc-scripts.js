/* ============================================================
   OMC - OLD METAL COMMANDER
   TODOS LOS SCRIPTS UNIFICADOS (v1.0)
   ============================================================ */

/* ============================================================
   MÓDULO: SCRIPTS GLOBALES DEL TEMA (HEAD)
   Contiene: bandasMap, cargarBandas, inicializarBusqueda,
             cargarSliderMarquee, procesarEntradas e
             inicialización principal.
   ============================================================ */
// VARIABLES GLOBALES
var bandasMap = {};
var todasBandas = [];

// 1. CARGA DE BANDAS
function cargarBandas() {
    var links = document.querySelectorAll('#Label1 a');
    todasBandas = [];
    bandasMap = {};
    links.forEach(function(l) {
        var n = l.textContent.trim();
        var u = l.getAttribute('href');
        if(n && u) {
            todasBandas.push({nombre: n, url: u, lower: n.toLowerCase()});
            bandasMap[n.toLowerCase()] = u;
        }
    });
}

// 2. BUSCADOR (versión antigua, se mantiene por compatibilidad)
function inicializarBusqueda() {
    var form = document.querySelector('.search-container form');
    if(!form) return;
    
    var sugg = document.createElement('div');
    sugg.id = 'search-suggestions';
    document.body.appendChild(sugg);
    
    var input = form.querySelector('input[name="q"]');
    
    input.addEventListener('input', function(e) { mostrarSugerencias(e.target.value); });
    input.addEventListener('focus', function(e) { mostrarSugerencias(e.target.value); });
    
    function reubicar() {
        var rect = input.getBoundingClientRect();
        sugg.style.top = (rect.bottom + window.scrollY) + 'px';
        sugg.style.left = (rect.left + window.scrollX) + 'px';
    }
    window.addEventListener('resize', reubicar);
    window.addEventListener('scroll', reubicar);
    
    document.addEventListener('click', function(e) {
        if(!form.contains(e.target) && !sugg.contains(e.target)) sugg.style.display = 'none';
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var t = input.value.trim().toLowerCase();
        if(!t) return;
        if(bandasMap[t]) window.location.href = bandasMap[t];
        else {
            var found = todasBandas.find(b => b.lower.includes(t));
            if(found) window.location.href = found.url;
            else form.submit();
        }
    });
    
    function mostrarSugerencias(term) {
        if(!term) { sugg.style.display = 'none'; return; }
        reubicar();
        var matches = todasBandas.filter(b => b.lower.includes(term.toLowerCase())).slice(0,10);
        if(matches.length === 0) {
            sugg.innerHTML = '<div class="search-suggestion-item">Sin resultados...</div>';
        } else {
            var html = '';
            matches.forEach(m => {
                html += `<div class="search-suggestion-item" onclick="window.location.href='${m.url}'">${m.nombre}</div>`;
            });
            sugg.innerHTML = html;
        }
        sugg.style.display = 'block';
    }
}

// 3. SLIDER MARQUEE INFINITO (ALEATORIO) - SOLO "FRONT"
function cargarSliderMarquee() {
    fetch('/feeds/posts/default?alt=json&max-results=0')
    .then(res => res.json())
    .then(data => {
        const totalPosts = parseInt(data.feed.openSearch$totalResults.$t);
        const cantidadAPedir = 150; 
        
        let startIndex = Math.floor(Math.random() * Math.max(1, (totalPosts - cantidadAPedir))) + 1;

        const feedUrl = '/feeds/posts/default?alt=json&max-results=' + cantidadAPedir + '&start-index=' + startIndex;
        return fetch(feedUrl);
    })
    .then(res => res.json())
    .then(data => {
        if (data.feed && data.feed.entry) {
            procesarEntradas(data.feed.entry);
        } else {
            fetch('/feeds/posts/default?alt=json&max-results=50').then(r => r.json()).then(d => procesarEntradas(d.feed.entry));
        }
    })
    .catch(err => console.error("Error cargando feed:", err));
}

function procesarEntradas(entradas) {
    if (!entradas || entradas.length === 0) return;

    entradas.sort(() => Math.random() - 0.5);

    let slidesHTML = '';
    let count = 0;
    const maxSlides = 50; 
    
    const tempDiv = document.createElement('div');

    for (let i = 0; i < entradas.length; i++) {
        if (count >= maxSlides) break;

        let entry = entradas[i];
        
        let categorias = entry.category ? entry.category.map(c => c.term) : [];
        if (categorias.includes('Avisos')) continue;

        let titulo = entry.title.$t;
        let contenido = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : "");
        let imgUrl = "";

        tempDiv.innerHTML = contenido;
        const images = tempDiv.getElementsByTagName('img');
        
        for (let img of images) {
            let alt = (img.getAttribute('alt') || "").toLowerCase();
            let title = (img.getAttribute('title') || "").toLowerCase();
            
            if (alt.includes('front') || title.includes('front')) {
                imgUrl = img.src;
                break; 
            }
        }

        if (!imgUrl) continue;

        if (imgUrl.includes('googleusercontent') || imgUrl.includes('blogspot')) {
            imgUrl = imgUrl.replace(/\/s\d+(-c)?\//, '/w250-h250-c/').replace(/=s\d+(-c)?/, '=w250-h250-c');
        }

        let link = "";
        for (let j = 0; j < entry.link.length; j++) {
            if (entry.link[j].rel === 'alternate') { link = entry.link[j].href; break; }
        }

        slidesHTML += '<div class="slide-card">' +
                        '<a href="' + link + '">' +
                            '<img src="' + imgUrl + '" alt="' + titulo + '" loading="lazy" width="250" height="250">' +
                            '<div class="slide-overlay"><p class="slide-title">' + titulo + '</p></div>' +
                        '</a>' +
                      '</div>';
        count++;
    }

    const marqueeInner = document.getElementById('marquee-inner');
    if (marqueeInner && slidesHTML !== '') {
        marqueeInner.innerHTML = '<div class="marquee-content">' + slidesHTML + '</div><div class="marquee-content">' + slidesHTML + '</div>';
        
        const duracion = count * 4;
        marqueeInner.style.animationDuration = duracion + 's';
    }
}

// --- INICIALIZACIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', function() {
    cargarSliderMarquee(); 

    if(typeof cargarBandas === 'function') cargarBandas();
    if(typeof inicializarBusqueda === 'function') inicializarBusqueda();
    
    var marqueeContainer = document.getElementById('marquee-container');
    if(marqueeContainer) {
        marqueeContainer.addEventListener('mouseenter', function() {
            var inner = document.getElementById('marquee-inner');
            if(inner) inner.style.animationPlayState = 'paused';
        });
        marqueeContainer.addEventListener('mouseleave', function() {
            var inner = document.getElementById('marquee-inner');
            if(inner) inner.style.animationPlayState = 'running';
        });
    }
});


/* ============================================================
   MÓDULO: BUSCADOR INTELIGENTE (Widget HTML2)
   ============================================================ */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    function normalizeSearch(str) {
      if (!str) return '';
      return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
    }

    var searchFantasma = document.getElementById('omc-search-fantasma');
    var searchBox = document.getElementById('omc-smart-search');
    var placeholder = document.getElementById('omc-search-placeholder');
    var mainWrapper = document.querySelector('.main-wrapper');

    var searchForm = document.getElementById('omc-search-form');
    var searchInput = document.getElementById('omc-search-input');
    var searchIcon = document.getElementById('omc-search-icon');
    var closeBtn = document.getElementById('omc-search-close');
    var overlay = document.getElementById('omc-search-overlay');
    var liveResults = document.getElementById('omc-live-results');
    var clearBtn = document.getElementById('omc-search-clear');

    var omcBandasCache = [];
    var currentFocus = -1;
    var allTitlesNormalized = [];
    var debounceTimer;

    if (searchFantasma) {
      var widgetParent = searchFantasma.closest('.widget');
      if (widgetParent) {
        widgetParent.style.display = 'none';
        widgetParent.style.margin = '0';
        widgetParent.style.padding = '0';
      }
    }

    if (mainWrapper && searchBox) {
      mainWrapper.parentNode.insertBefore(placeholder, mainWrapper);
      mainWrapper.parentNode.insertBefore(searchBox, mainWrapper);
    }

    var labelLinks = document.querySelectorAll('#Label1 .widget-content ul li a');
    if (labelLinks.length > 0) {
      labelLinks.forEach(function(a) {
        var title = a.textContent.trim();
        omcBandasCache.push({ title: title, link: a.href });
      });
    }
    allTitlesNormalized = omcBandasCache.map(function(item) {
      return normalizeSearch(item.title);
    });

    window.addEventListener('scroll', function() {
      if (searchBox.classList.contains('expanded')) return;
      var triggerPoint = placeholder.offsetTop + 50;
      if (window.scrollY > triggerPoint) {
        if (!searchBox.classList.contains('omc-floating')) {
          searchBox.classList.remove('omc-search-normal');
          searchBox.classList.add('omc-floating');
        }
      } else {
        if (searchBox.classList.contains('omc-floating')) {
          searchBox.classList.remove('omc-floating');
          searchBox.classList.add('omc-search-normal');
        }
      }
    });

    searchIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      if (searchBox.classList.contains('omc-floating')) {
        searchBox.classList.add('expanded');
        document.body.style.overflow = 'hidden';
        setTimeout(function() { searchInput.focus(); }, 400);
      }
    });

    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      cerrarBuscador();
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) cerrarBuscador();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && searchBox.classList.contains('expanded')) {
        if (searchInput.value.length > 0) limpiarBusqueda();
        else cerrarBuscador();
      }
    });

    function cerrarBuscador() {
      searchBox.classList.remove('expanded');
      document.body.style.overflow = '';
      liveResults.classList.remove('active');
      searchInput.value = '';
      clearBtn.style.display = 'none';
      currentFocus = -1;
    }

    function limpiarBusqueda() {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      liveResults.classList.remove('active');
      liveResults.innerHTML = '';
      currentFocus = -1;
      searchInput.focus();
    }

    clearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      limpiarBusqueda();
    });

    searchForm.addEventListener('submit', function(e) {
      var query = searchInput.value.trim();
      if (!query) { e.preventDefault(); return; }
      var queryNorm = normalizeSearch(query);
      var index = allTitlesNormalized.indexOf(queryNorm);
      if (index !== -1) {
        e.preventDefault();
        var linkLimpio = omcBandasCache[index].link.replace(/\+/g, '%20');
        window.location.href = linkLimpio;
      } else {
        if (searchInput.value.indexOf('"') === -1) {
          searchInput.value = '"' + query + '"';
        }
        cerrarBuscador();
      }
    });

    searchInput.addEventListener('input', function(e) {
      var query = e.target.value.trim();
      clearBtn.style.display = query.length > 0 ? 'block' : 'none';
      currentFocus = -1;

      if (query.length < 1) {
        liveResults.classList.remove('active');
        liveResults.innerHTML = '';
        clearTimeout(debounceTimer);
        return;
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        liveResults.innerHTML = '<div class="omc-live-msg">⏳ Buscando...</div>';
        liveResults.classList.add('active');

        var queryNorm = normalizeSearch(query);

        var bandasMatch = [];
        for (var i = 0; i < omcBandasCache.length; i++) {
          if (allTitlesNormalized[i].indexOf(queryNorm) !== -1) {
            bandasMatch.push(omcBandasCache[i]);
            if (bandasMatch.length >= 10) break;
          }
        }

        var apiUrl = 'https://avhell.bsite.net/Albumes.ashx?q=' + encodeURIComponent(query);

        fetch(apiUrl)
          .then(function(response) {
            if (!response.ok) throw new Error('Error en la red');
            return response.json();
          })
          .then(function(data) {
            var html = '';
            var albumMatches = data || [];

            if (bandasMatch.length > 0) {
              for (var j = 0; j < bandasMatch.length; j++) {
                var b = bandasMatch[j];
                var linkLimpio = b.link.replace(/\+/g, '%20');
                html += '<a href="' + linkLimpio + '" class="omc-live-item">' + b.title + ' <span style="color:#b30000; font-size:12px; text-transform:uppercase;">BANDA</span></a>';
              }
              html += '<div class="omc-live-divisor">ÁLBUMES</div>';
            }

            if (albumMatches.length > 0) {
              var maxAlbums = Math.min(albumMatches.length, 30);
              for (var k = 0; k < maxAlbums; k++) {
                var item = albumMatches[k];
                html += '<a href="' + item.Link + '" class="omc-live-item">' + item.Titulo + ' <span style="color:#b30000; font-size:12px; text-transform:uppercase;">' + item.Banda + ' (' + item.Anio + ')</span></a>';
              }
            }

            if (!html) {
              html = '<div class="omc-live-msg">No hay coincidencias.</div>';
            }

            html += '<div class="omc-live-divisor">¿No encuentras lo que buscas?</div>';
            html += '<a href="/search?q=%22' + encodeURIComponent(query) + '%22" class="omc-live-item" style="color: #ff4444; text-align: center; font-weight: bold; padding: 12px;">🔎 Buscar "' + query + '" en todo el blog</a>';

            liveResults.innerHTML = html;
            liveResults.classList.add('active');
          })
          .catch(function(error) {
            console.error('Error en búsqueda de álbumes:', error);
            if (bandasMatch.length > 0) {
              var html = '';
              for (var m = 0; m < bandasMatch.length; m++) {
                var b2 = bandasMatch[m];
                var linkLimpio = b2.link.replace(/\+/g, '%20');
                html += '<a href="' + linkLimpio + '" class="omc-live-item">' + b2.title + ' <span style="color:#b30000; font-size:12px; text-transform:uppercase;">BANDA</span></a>';
              }
              html += '<div class="omc-live-msg">⚠️ No se pudieron cargar los álbumes.</div>';
              liveResults.innerHTML = html;
              liveResults.classList.add('active');
            } else {
              liveResults.innerHTML = '<div class="omc-live-msg">Error de conexión.</div>';
              liveResults.classList.add('active');
            }
          });
      }, 300);
    });

    searchInput.addEventListener('keydown', function(e) {
      var items = liveResults.querySelectorAll('.omc-live-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentFocus++;
        if (currentFocus >= items.length) currentFocus = items.length - 1;
        addActive(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentFocus--;
        if (currentFocus < -1) currentFocus = -1;
        addActive(items);
      } else if (e.key === 'Enter') {
        if (currentFocus > -1 && items.length > 0) {
          e.preventDefault();
          items[currentFocus].click();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (searchInput.value.length > 0) limpiarBusqueda();
        else cerrarBuscador();
      }
    });

    function addActive(items) {
      if (!items) return;
      removeActive(items);
      if (currentFocus >= 0 && currentFocus < items.length) {
        items[currentFocus].classList.add('omc-item-focused');
        items[currentFocus].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    function removeActive(items) {
      for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('omc-item-focused');
      }
    }

    document.addEventListener('click', function(e) {
      if (!searchBox.contains(e.target)) {
        liveResults.classList.remove('active');
      }
    });
  });
})();


/* ============================================================
   MÓDULO: AVISOS FLOTANTES (Widget HTML3)
   ============================================================ */
(function() {
    function cargarUltimoAviso() {
        var feedURL = '/feeds/posts/default/-/Avisos?alt=json&max-results=1&callback=mostrarAvisoOMC';
        var script = document.createElement('script');
        script.src = feedURL;
        document.head.appendChild(script);
    }

    function mostrarAvisoOMC(json) {
        var entry = json.feed.entry;
        if (!entry || entry.length === 0) return;

        var titulo = entry[0].title.$t;
        var link = '';
        for (var i = 0; i < entry[0].link.length; i++) {
            if (entry[0].link[i].rel === 'alternate') {
                link = entry[0].link[i].href;
                break;
            }
        }

        var avisoGuardado = localStorage.getItem('omc_ultimo_aviso');
        if (avisoGuardado === link) {
            return; 
        }
        localStorage.setItem('omc_ultimo_aviso', link);

        var contenido = entry[0].content ? entry[0].content.$t : '';
        var textoLimpio = '';
        if (contenido) {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = contenido;
            var scripts = tempDiv.querySelectorAll('script, style');
            scripts.forEach(function(el) { el.remove(); });
            textoLimpio = tempDiv.textContent || tempDiv.innerText || '';
            textoLimpio = textoLimpio.replace(/\s+/g, ' ').trim();
        }

        if (!textoLimpio) {
            textoLimpio = 'Haz clic aquí para leer la información completa.';
        }

        var avisoEnlace = document.createElement('a');
        avisoEnlace.id = 'omc-aviso-flotante';
        avisoEnlace.href = link;
        
        avisoEnlace.innerHTML = `
            <div class="omc-aviso-icono">📢</div>
            <div class="omc-aviso-textos">
                <div class="omc-aviso-titulo">${titulo}</div>
                <div class="omc-aviso-desc">${textoLimpio}</div>
            </div>
            <div class="omc-btn-cerrar" onclick="cerrarAvisoManual(event, this)">✖</div>
        `;

        document.body.appendChild(avisoEnlace);

        setTimeout(function() {
            var aviso = document.getElementById('omc-aviso-flotante');
            if (aviso) {
                aviso.classList.add('oculto');
                setTimeout(function() { aviso.remove(); }, 300);
            }
        }, 6000); 
    }

    function cerrarAvisoManual(evento, elemento) {
        evento.preventDefault();
        evento.stopPropagation();
        var aviso = elemento.closest('#omc-aviso-flotante');
        if (aviso) {
            aviso.classList.add('oculto');
            setTimeout(function() { aviso.remove(); }, 300);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        cargarUltimoAviso();
        
        var fantasma = document.getElementById('omc-aviso-fantasma');
        if (fantasma) {
            var bloggerContainer = fantasma.closest('.widget');
            if (bloggerContainer) {
                bloggerContainer.style.display = 'none';
                bloggerContainer.style.margin = '0';
                bloggerContainer.style.padding = '0';
            }
        }
    });
})();


/* ============================================================
   MÓDULO: CHAT (Widget HTML4)
   ============================================================ */
(function() {
    let chatLoaded = false;

    function toggleChat() {
        var popup = document.getElementById("chat-window-popup");
        
        if (popup.style.display === "flex") {
            popup.style.display = "none";
        } else {
            popup.style.display = "flex";
            
            if (!chatLoaded) {
                var iframe = document.createElement("iframe");
                iframe.src = "https://avhell.bsite.net/Default.aspx";
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "none";
                iframe.setAttribute("allowtransparency", "true");
                
                document.getElementById("chat-frame-popup").appendChild(iframe);
                chatLoaded = true;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        var fantasma = document.getElementById('omc-chat-fantasma');
        if (fantasma) {
            var bloggerContainer = fantasma.closest('.widget');
            if (bloggerContainer) {
                bloggerContainer.style.display = 'none';
                bloggerContainer.style.margin = '0';
                bloggerContainer.style.padding = '0';
            }
        }
        
        var floatContainer = document.getElementById("avhell-float-container");
        if (floatContainer && floatContainer.parentNode !== document.body) {
            document.body.appendChild(floatContainer);
        }
    });

    // Exponer toggleChat globalmente para onclick
    window.toggleChat = toggleChat;
})();


/* ============================================================
   MÓDULO: REPRODUCTOR OMC (Widget HTML5)
   ============================================================ */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        let playlist = [];
        let currentTrackIndex = 0;
        let waveInterval = null;

        const audioEl = document.getElementById('omc-audio-element');
        const playPauseBtn = document.getElementById('omc-play-pause');
        const bandNameEl = document.getElementById('omc-band-name');
        const trackTitleEl = document.getElementById('omc-track-title');
        const trackNumberEl = document.getElementById('omc-track-number');
        const coverEl = document.getElementById('omc-cover');
        const volumeSlider = document.getElementById('omc-volume');
        const progressSlider = document.getElementById('omc-progress');
        const currentTimeEl = document.getElementById('omc-current-time');
        const durationEl = document.getElementById('omc-duration');
        const widgetEl = document.getElementById('omc-player-widget');
        const toggleBtn = document.getElementById('omc-toggle-btn');
        const playlistBtn = document.getElementById('omc-playlist-btn');
        const playlistOverlay = document.getElementById('omc-playlist-overlay');
        const playlistList = document.getElementById('omc-playlist-list');

        const iconPlay = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        const iconPause = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

        function generarOndaIrregular() {
            const barras = 50;
            let svgWave = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>`;
            for (let i = 0; i < barras; i++) {
                const altura = Math.floor(Math.random() * 50) + 30;
                const y = (100 - altura) / 2;
                const x = i * (100 / barras);
                svgWave += `<rect x='${x}%' y='${y}%' width='1.5%' height='${altura}%' fill='black' rx='1'/>`;
            }
            svgWave += `</svg>`;
            const encoded = "data:image/svg+xml;utf8," + encodeURIComponent(svgWave);
            progressSlider.style.webkitMaskImage = `url("${encoded}")`;
            progressSlider.style.maskImage = `url("${encoded}")`;
        }

        function groupByBand(tracks) {
            const map = {};
            tracks.forEach(t => {
                if (!map[t.band]) map[t.band] = [];
                map[t.band].push(t);
            });
            return Object.keys(map).sort().map(band => ({ band, tracks: map[band] }));
        }

        function renderPlaylist() {
            playlistList.innerHTML = '';

            const allBtn = document.createElement('li');
            allBtn.className = 'all-songs-btn';
            allBtn.innerHTML = '▶ Todas las Canciones';
            allBtn.addEventListener('click', function() {
                currentTrackIndex = 0;
                loadTrack(currentTrackIndex);
                audioEl.play();
                playPauseBtn.innerHTML = iconPause;
                playlistOverlay.classList.remove('active');
                renderPlaylist();
                generarOndaIrregular();
                updateTrackNumber();
                startWaveAnimation();
                updateMediaSession();
            });
            playlistList.appendChild(allBtn);

            const groups = groupByBand(playlist);
            groups.forEach(group => {
                const header = document.createElement('li');
                header.className = 'group-header';
                header.innerHTML = `<span>${group.band}</span><span class="group-count">${group.tracks.length}</span>`;
                playlistList.appendChild(header);

                group.tracks.forEach(track => {
                    const globalIndex = playlist.indexOf(track);
                    const li = document.createElement('li');
                    li.className = 'group-item';
                    if (globalIndex === currentTrackIndex) li.classList.add('playing');

                    li.innerHTML = `
                        <img src="${track.cover || 'https://via.placeholder.com/60'}" />
                        <div class="pl-info">
                            <span class="pl-title">${track.title}</span>
                            <span class="pl-band">${track.band}</span>
                        </div>
                        <svg class="pl-active-icon" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    `;
                    li.addEventListener('click', function() {
                        currentTrackIndex = globalIndex;
                        loadTrack(currentTrackIndex);
                        audioEl.play();
                        playPauseBtn.innerHTML = iconPause;
                        playlistOverlay.classList.remove('active');
                        renderPlaylist();
                        generarOndaIrregular();
                        updateTrackNumber();
                        startWaveAnimation();
                        updateMediaSession();
                    });
                    playlistList.appendChild(li);
                });
            });
        }

        function loadTrack(index) {
            if (playlist.length === 0) return;
            const track = playlist[index];
            audioEl.src = track.url;
            bandNameEl.textContent = track.band;
            trackTitleEl.textContent = track.title;
            coverEl.src = track.cover || 'https://via.placeholder.com/250';
            updateTrackNumber();
            progressSlider.value = 0;
            progressSlider.style.setProperty('--progress', '0%');
            currentTimeEl.textContent = "0:00";
            durationEl.textContent = "0:00";
            checkMarquee();
            renderPlaylist();
            updateMediaSession();
        }

        function updateTrackNumber() {
            const total = playlist.length;
            const current = currentTrackIndex + 1;
            trackNumberEl.textContent = `Track ${current} de ${total}`;
        }

        function checkMarquee() {
            const el = trackTitleEl;
            const wrapper = el.closest('.omc-title-wrapper');
            const containerWidth = wrapper.clientWidth;
            el.style.display = 'inline-block';
            el.style.whiteSpace = 'nowrap';
            const textWidth = el.scrollWidth;
            if (textWidth > containerWidth) {
                el.classList.remove('no-marquee');
                el.style.animation = 'none';
                void el.offsetWidth;
                el.style.animation = 'scrollTitle 12s linear infinite';
            } else {
                el.classList.add('no-marquee');
                el.style.animation = 'none';
                el.style.display = 'block';
                el.style.whiteSpace = 'nowrap';
                el.style.overflow = 'hidden';
                el.style.textOverflow = 'ellipsis';
                el.style.maxWidth = '100%';
            }
        }

        function updateMediaSession() {
            if (playlist.length === 0) return;
            const track = playlist[currentTrackIndex];
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.title,
                    artist: track.band,
                    album: 'OMC Playlist',
                    artwork: [
                        { src: track.cover || 'https://via.placeholder.com/250', sizes: '512x512', type: 'image/jpeg' }
                    ]
                });
                navigator.mediaSession.playbackState = audioEl.paused ? 'paused' : 'playing';
            }
        }

        function setupMediaSessionControls() {
            if (!('mediaSession' in navigator)) return;

            navigator.mediaSession.setActionHandler('play', function() {
                if (playlist.length === 0) return;
                audioEl.play();
                playPauseBtn.innerHTML = iconPause;
                startWaveAnimation();
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            });

            navigator.mediaSession.setActionHandler('pause', function() {
                audioEl.pause();
                playPauseBtn.innerHTML = iconPlay;
                stopWaveAnimation();
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            });

            navigator.mediaSession.setActionHandler('nexttrack', function() {
                if (playlist.length === 0) return;
                currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
                loadTrack(currentTrackIndex);
                audioEl.play();
                playPauseBtn.innerHTML = iconPause;
                generarOndaIrregular();
                updateTrackNumber();
                startWaveAnimation();
                updateMediaSession();
            });

            navigator.mediaSession.setActionHandler('previoustrack', function() {
                if (playlist.length === 0) return;
                currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
                loadTrack(currentTrackIndex);
                audioEl.play();
                playPauseBtn.innerHTML = iconPause;
                generarOndaIrregular();
                updateTrackNumber();
                startWaveAnimation();
                updateMediaSession();
            });
        }

        function startWaveAnimation() {
            if (waveInterval) clearInterval(waveInterval);
            if (!audioEl.paused && !audioEl.ended) {
                waveInterval = setInterval(function() {
                    generarOndaIrregular();
                }, 250);
            }
        }

        function stopWaveAnimation() {
            if (waveInterval) {
                clearInterval(waveInterval);
                waveInterval = null;
            }
        }

        // CARGA INICIAL
        fetch('https://avhell.bsite.net/PlaylistApi.ashx')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data && data.length > 0) {
                    playlist = data;
                    loadTrack(0);
                    renderPlaylist();
                    generarOndaIrregular();
                    updateTrackNumber();
                    setupMediaSessionControls();
                    updateMediaSession();
                } else {
                    trackTitleEl.textContent = "Sin pistas activas";
                    bandNameEl.textContent = "Old Metal Commander";
                }
            })
            .catch(function(error) {
                console.error("Error al cargar la música:", error);
                trackTitleEl.textContent = "Error de servidor";
            });

        // CONTROLES
        playlistBtn.addEventListener('click', function() {
            playlistOverlay.classList.toggle('active');
        });

        playPauseBtn.addEventListener('click', function() {
            if (playlist.length === 0) return;
            if (audioEl.paused) {
                audioEl.play();
                playPauseBtn.innerHTML = iconPause;
                startWaveAnimation();
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            } else {
                audioEl.pause();
                playPauseBtn.innerHTML = iconPlay;
                stopWaveAnimation();
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            }
        });

        document.getElementById('omc-next').addEventListener('click', function() {
            if (playlist.length === 0) return;
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            loadTrack(currentTrackIndex);
            audioEl.play();
            playPauseBtn.innerHTML = iconPause;
            generarOndaIrregular();
            updateTrackNumber();
            startWaveAnimation();
            updateMediaSession();
        });

        document.getElementById('omc-prev').addEventListener('click', function() {
            if (playlist.length === 0) return;
            currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            loadTrack(currentTrackIndex);
            audioEl.play();
            playPauseBtn.innerHTML = iconPause;
            generarOndaIrregular();
            updateTrackNumber();
            startWaveAnimation();
            updateMediaSession();
        });

        // PROGRESO Y VOLUMEN
        audioEl.addEventListener('timeupdate', function() {
            if (audioEl.duration) {
                const percent = (audioEl.currentTime / audioEl.duration) * 100;
                progressSlider.value = percent;
                progressSlider.style.setProperty('--progress', percent + '%');
                currentTimeEl.textContent = formatTime(audioEl.currentTime);
                durationEl.textContent = formatTime(audioEl.duration);
            }
        });

        progressSlider.addEventListener('input', function(e) {
            if (audioEl.duration) {
                const percent = e.target.value;
                const seekTime = (percent / 100) * audioEl.duration;
                audioEl.currentTime = seekTime;
                progressSlider.style.setProperty('--progress', percent + '%');
            }
        });

        audioEl.addEventListener('loadedmetadata', function() {
            durationEl.textContent = formatTime(audioEl.duration);
        });

        volumeSlider.addEventListener('input', function(e) {
            audioEl.volume = e.target.value;
            volumeSlider.style.setProperty('--progress', (e.target.value * 100) + '%');
            localStorage.setItem('omc_volume', e.target.value);
        });

        const savedVolume = localStorage.getItem('omc_volume');
        if (savedVolume !== null) {
            volumeSlider.value = savedVolume;
            volumeSlider.style.setProperty('--progress', (savedVolume * 100) + '%');
        }
        audioEl.volume = volumeSlider.value;

        // MINIMIZAR / MAXIMIZAR
        widgetEl.addEventListener('click', function(e) {
            if (widgetEl.classList.contains('minimized')) {
                widgetEl.classList.remove('minimized');
                playlistOverlay.classList.remove('active');
            }
        });

        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            widgetEl.classList.add('minimized');
        });

        audioEl.addEventListener('ended', function() {
            document.getElementById('omc-next').click();
        });

        audioEl.addEventListener('pause', stopWaveAnimation);
        audioEl.addEventListener('ended', stopWaveAnimation);
        audioEl.addEventListener('play', startWaveAnimation);

        audioEl.addEventListener('play', function() {
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        });
        audioEl.addEventListener('pause', function() {
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        });
        audioEl.addEventListener('ended', function() {
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
        });

        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return min + ":" + (sec < 10 ? '0' : '') + sec;
        }

        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(checkMarquee, 200);
        });
    });

    // Limpia estilos de Blogger
    (function() {
        var playerWidget = document.getElementById("omc-player-widget");
        if (playerWidget) {
            var bloggerContainer = playerWidget.closest('.widget');
            if (bloggerContainer) {
                bloggerContainer.style.display = 'none';
                bloggerContainer.style.margin = '0';
                bloggerContainer.style.padding = '0';
            }
            if (playerWidget.parentNode !== document.body) {
                document.body.appendChild(playerWidget);
            }
        }
    })();
})();


/* ============================================================
   MÓDULO: FOOTER (Widget HTML6)
   ============================================================ */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        var fantasma = document.getElementById('omc-footer-fantasma');
        if (fantasma) {
            var bloggerWidget = fantasma.closest('.widget');
            if (bloggerWidget) {
                bloggerWidget.style.display = 'none';
                bloggerWidget.style.margin = '0';
                bloggerWidget.style.padding = '0';
            }
        }
        
        var footerReal = document.getElementById("omc-footer-global");
        if (footerReal && footerReal.parentNode !== document.body) {
            document.body.appendChild(footerReal);
        }
    });
})();


/* ============================================================
   MÓDULO: FONDO ANIMADO MATRIX ROJO (Widget HTML666)
   ============================================================ */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        var blobBg = document.getElementById("omc-blob-bg");
        if (blobBg && blobBg.parentNode !== document.body) {
            document.body.appendChild(blobBg);
        }

        var fantasma = document.getElementById('omc-blob-fantasma');
        if (fantasma) {
            var widgetParent = fantasma.closest('.widget');
            if (widgetParent) {
                widgetParent.style.display = 'none';
                widgetParent.style.margin = '0';
                widgetParent.style.padding = '0';
            }
        }
    });
})();


/* ============================================================
   MÓDULO: BANDAS – NAVEGACIÓN POR LETRA (Widget Label1)
   ============================================================ */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        try {
            const bandsWidget = document.getElementById('Label1');
            if (!bandsWidget) return;
            
            const widgetContent = bandsWidget.querySelector('.widget-content');
            const originalUl = widgetContent.querySelector('ul');
            if (!originalUl) return;

            const listItems = Array.from(originalUl.querySelectorAll('li'));
            if (listItems.length === 0) return;

            originalUl.style.display = 'none';

            const letras = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
            const diccionarioBandas = {};
            letras.forEach(function(l) { diccionarioBandas[l] = []; });

            listItems.forEach(function(li) {
                const enlace = li.querySelector('a');
                if (enlace) {
                    let text = enlace.textContent.trim();
                    let primerCaracter = text.charAt(0).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
                    let primeraLetra = /^[A-Z]$/.test(primerCaracter) ? primerCaracter : '#';
                    diccionarioBandas[primeraLetra].push(li);
                }
            });

            const navContainer = document.createElement('div');
            navContainer.id = 'omc-az-nav';
            
            const contentContainer = document.createElement('div');
            contentContainer.id = 'omc-az-content';
            
            let primerBotonActivo = null;

            letras.forEach(function(letra) {
                const btn = document.createElement('button');
                btn.className = 'omc-az-btn';
                btn.textContent = letra;

                if (diccionarioBandas[letra].length === 0) {
                    btn.disabled = true;
                } else {
                    if (!primerBotonActivo) primerBotonActivo = btn;

                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        navContainer.querySelectorAll('.omc-az-btn').forEach(function(b) { b.classList.remove('active'); });
                        btn.classList.add('active');

                        contentContainer.innerHTML = '';
                        const nuevaUl = document.createElement('ul');
                        diccionarioBandas[letra].forEach(function(bandaItem) {
                            const clon = bandaItem.cloneNode(true);
                            clon.style.display = 'list-item';
                            nuevaUl.appendChild(clon);
                        });
                        contentContainer.appendChild(nuevaUl);
                    });
                }
                navContainer.appendChild(btn);
            });

            widgetContent.appendChild(navContainer);
            widgetContent.appendChild(contentContainer);

            if (primerBotonActivo) {
                primerBotonActivo.click();
            }

        } catch (error) {
            console.warn("Fallo leve en el abecedario OMC, manteniendo lista original:", error);
            const originalUl = document.querySelector('#Label1 ul');
            if(originalUl) originalUl.style.display = 'block';
        }
    });
})();


/* ============================================================
   MÓDULO: BOTÓN SUBIR ARRIBA (Script suelto al final del body)
   ============================================================ */
(function() {
    window.addEventListener('scroll', function() {
        var btnSubir = document.getElementById('btn-subir-arriba');
        if (!btnSubir) return;
        
        if (window.getComputedStyle(btnSubir).display !== 'none') {
            if (window.scrollY > 300) {
                btnSubir.classList.add('visible');
            } else {
                btnSubir.classList.remove('visible');
            }
        }
    });
})();