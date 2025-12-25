const params = new URLSearchParams(window.location.search);
const username = params.get("user");
const iconDownload = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="m8 12 4 4m0 0 4-4m-4 4V4M4 20h16"/></svg>`;
const iconCheck = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const iconLoading = `<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`;

if (!username) window.location.href = "index.html";

// Globais
let currentPeriod = "1month";
let selectedAccentColor = "#bb86fc";
let selectedFormat = "story";
let chartsToInclude = ["artists", "tracks"];
let elements = {};
let globalTopArtistImage = "";
let cachedData = { artists: [], tracks: [], albums: [] };
let spotifyTokenCache = null;
let studioScale = 1;

async function carregarTudo() {
    elements = {
        bannerBackground: document.getElementById("bannerBackground"),
        userFoto: document.getElementById("userFoto"),
        userName: document.getElementById("userName"),
        userScrobbles: document.getElementById("userScrobbles"),
        scrobblesPerDay: document.getElementById("scrobblesPerDay"),
        monthlyLabel: document.querySelector(".monthly-label"),
        glider: document.querySelector(".toggle-glider"),
        
        // Studio
        studioModal: document.getElementById("studioModal"),
        studioPreviewContainer: document.getElementById("studioPreviewContainer"),
        btnGerarRelatorio: document.getElementById("btnGerarRelatorio"),
        btnCloseStudio: document.getElementById("btnCloseStudio"),
        btnDownloadStudio: document.getElementById("btnDownloadStudio"),
        
        // Cards
        storyCardContainer: document.getElementById("storyCardContainer"),
        storyCard: document.getElementById("storyCard"),
        storyUserImg: document.getElementById("storyUserImg"),
        storyTitle: document.getElementById("storyTitle"),
        storySubtitle: document.getElementById("storySubtitle"),
        storyScrobblesValue: document.getElementById("storyScrobblesValue"),
        storyScrobblesLabel: document.getElementById("storyScrobblesLabel"),
        storyDisclaimer: document.getElementById("storyDisclaimer"),
        storyCol1Title: document.getElementById("storyCol1Title"),
        storyCol1List: document.getElementById("storyCol1List"),
        storyCol2Title: document.getElementById("storyCol2Title"),
        storyCol2List: document.getElementById("storyCol2List"),
        
        squareCardContainer: document.getElementById("squareCardV2Container"),
        squareCard: document.getElementById("squareCardV2"),
        sqUserImg: document.getElementById("sqUserImg"),
        sqUsername: document.getElementById("sqUsername"),
        sqReportTitle: document.getElementById("sqReportTitle"),
        sqCol1Title: document.getElementById("sqCol1Title"),
        sqCol1List: document.getElementById("sqCol1List"),
        sqCol2Title: document.getElementById("sqCol2Title"),
        sqCol2List: document.getElementById("sqCol2List"),
        sqScrobblesLabel: document.getElementById("sqScrobblesLabel"),
        sqScrobblesValue: document.getElementById("sqScrobblesValue"),
    };

    configurarEventosHub();
    configurarTogglePeriodo();
    await buscarPerfil();
    atualizarDadosDoPeriodo(true);
}

// Adicione esta nova função global no result.js para controlar o fluxo
function goToStep(stepName) {
    // 1. Atualiza visual dos indicadores (bolinhas/texto no topo)
    document.querySelectorAll(".progress-step").forEach(el => {
        el.classList.remove("active");
        if(el.getAttribute("data-step") === stepName) el.classList.add("active");
    });

    // 2. Troca a tela ativa
    document.querySelectorAll(".studio-step").forEach(step => {
        step.classList.remove("active");
        if(step.id === `step-${stepName}`) step.classList.add("active");
    });
}

// Atualize a função configurarEventosHub
function configurarEventosHub() {
    // ... (Listeners de abrir/fechar continuam iguais)
    if (elements.btnGerarRelatorio) elements.btnGerarRelatorio.addEventListener("click", () => {
        openStudio();
        goToStep('format'); // Sempre reseta para o passo 1 ao abrir
    });

    if (elements.btnCloseStudio) elements.btnCloseStudio.addEventListener("click", closeStudio);

    // --- LÓGICA DO FORMATO (Auto-Advance) ---
    document.querySelectorAll(".studio-format-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            // Visual do botão
            document.querySelectorAll(".studio-format-btn").forEach((b) => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            
            // Lógica
            selectedFormat = e.currentTarget.getAttribute("data-format");
            updateStudioVisuals();

            // AUTO-ADVANCE: Se estiver no mobile, vai pro próximo passo
            if (window.innerWidth <= 768) {
                setTimeout(() => goToStep('data'), 200); // Pequeno delay pra sentir o clique
            }
        });
    });

    // --- LÓGICA DA COR (Só atualiza) ---
    document.querySelectorAll(".color-option").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".color-option").forEach(b => b.style.transform = "scale(1)");
            e.currentTarget.style.transform = "scale(1.15)";
            selectedAccentColor = e.currentTarget.getAttribute("data-color");
            updateStudioVisuals();
        });
    });

    // --- LÓGICA DAS COLUNAS (Mantém igual, sem auto-advance) ---
    document.querySelectorAll(".studio-col-option").forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
            // ... (Sua lógica de limitar a 2 colunas continua aqui igualzinha)
            const currentList = [];
            document.querySelectorAll(".studio-col-option").forEach((chk) => {
                if (chk.checked) currentList.push(chk.getAttribute("data-list"));
            });
            if (currentList.length > 2) {
                const toRemove = chartsToInclude.find(item => item !== e.target.getAttribute("data-list"));
                const chkToRemove = document.querySelector(`.studio-col-option[data-list="${toRemove}"]`);
                if(chkToRemove) chkToRemove.checked = false;
            }
            if (currentList.length === 0 && !e.target.checked) {
                e.target.checked = true;
            }
            chartsToInclude = [];
            document.querySelectorAll(".studio-col-option").forEach((chk) => {
                if (chk.checked) chartsToInclude.push(chk.getAttribute("data-list"));
            });
            updateStudioVisuals();
        });
    });

    // Download
    if (elements.btnDownloadStudio) {
        elements.btnDownloadStudio.addEventListener("click", () => {
            gerarImagemFinal(selectedFormat, selectedAccentColor, chartsToInclude);
        });
    }
}

function openStudio() {
    if (!elements.studioModal) return;
    elements.studioModal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Garante display flex para cálculos
    elements.storyCard.style.display = "flex";
    elements.squareCard.style.display = "flex";

    elements.studioPreviewContainer.innerHTML = "";
    updateStudioVisuals();
    
    setTimeout(fitCardToScreen, 50);
    window.addEventListener("resize", fitCardToScreen);
}

function closeStudio() {
    if (!elements.studioModal) return;
    elements.studioModal.style.display = "none";
    document.body.style.overflow = "";
    window.removeEventListener("resize", fitCardToScreen);
    
    // Devolve cards ao limbo (opcional, mas bom pra limpeza)
    if (elements.storyCardContainer) elements.storyCardContainer.appendChild(elements.storyCard);
    if (elements.squareCardContainer) elements.squareCardContainer.appendChild(elements.squareCard);
}

function updateStudioVisuals() {
    const container = elements.studioPreviewContainer;
    
    if (selectedFormat === "story") {
        elements.squareCard.style.display = "none";
        elements.storyCard.style.display = "flex"; // Força flex
        if (elements.storyCard.parentElement !== container) {
            container.appendChild(elements.storyCard);
        }
    } else {
        elements.storyCard.style.display = "none";
        elements.squareCard.style.display = "flex"; // Força flex
        if (elements.squareCard.parentElement !== container) {
            container.appendChild(elements.squareCard);
        }
    }

    preencherDadosNoCard(selectedFormat, chartsToInclude, selectedAccentColor);
    requestAnimationFrame(fitCardToScreen);
}

function fitCardToScreen() {
    const container = elements.studioPreviewContainer;
    const previewArea = document.querySelector(".studio-preview-area");
    const cardWidth = 1080;
    const cardHeight = selectedFormat === "story" ? 1920 : 1080;
    
    if (!container || !previewArea) return;

    const availableWidth = previewArea.clientWidth - 40;
    const availableHeight = previewArea.clientHeight - 40;

    const scaleX = availableWidth / cardWidth;
    const scaleY = availableHeight / cardHeight;
    studioScale = Math.min(scaleX, scaleY);

    container.style.width = `${cardWidth}px`;
    container.style.height = `${cardHeight}px`;
    container.style.transform = `scale(${studioScale})`;
}

function preencherDadosNoCard(format, selectedCharts, accentColor) {
    let col1, col1Title, col1List, col2, col2Title, col2List;
    let cardElement = format === "story" ? elements.storyCard : elements.squareCard;

    if (format === "story") {
        col1 = cardElement.querySelector(".story-column:nth-child(1)");
        col1Title = elements.storyCol1Title;
        col1List = elements.storyCol1List;
        col2 = cardElement.querySelector(".story-column:nth-child(2)");
        col2Title = elements.storyCol2Title;
        col2List = elements.storyCol2List;
    } else {
        col1 = cardElement.querySelector(".sq-v2-column:nth-child(1)");
        col1Title = elements.sqCol1Title;
        col1List = elements.sqCol1List;
        col2 = cardElement.querySelector(".sq-v2-column:nth-child(2)");
        col2Title = elements.sqCol2Title;
        col2List = elements.sqCol2List;
    }

    // Helper para pegar título bonito
    const getTitle = (type) => {
        const checkbox = document.querySelector(`.studio-col-option[data-list="${type}"]`);
        return checkbox ? checkbox.parentElement.parentElement.querySelector('.toggle-label').textContent : "Top Chart";
    };

    if (selectedCharts.length === 1) {
        const type = selectedCharts[0];
        const data = cachedData[type] || [];
        
        col1.style.display = "flex";
        col2.style.display = "none";
        if (format === "square") col1.style.width = "100%";
        
        // No Story, com 1 coluna, podemos mostrar 10 itens.
        // Se ficar muito grande, o CSS overflow:hidden vai cortar, mas geralmente cabe.
        const limit = format === "story" ? 10 : 5;
        
        col1Title.textContent = getTitle(type);
        col1List.innerHTML = formatarListaHTML(data, limit, type, format);
    } else {
        // Garante 2 itens
        const types = selectedCharts.length >= 2 ? selectedCharts : ["artists", "tracks"];
        const [type1, type2] = types;
        
        const data1 = cachedData[type1] || [];
        const data2 = cachedData[type2] || [];

        col1.style.display = "flex";
        col2.style.display = "flex";
        if (format === "square") col1.style.width = "50%";

        // Com 2 colunas, limitamos a 5 itens cada para caber
        const limit = 5; 
        col1Title.textContent = getTitle(type1);
        col1List.innerHTML = formatarListaHTML(data1, limit, type1, format);
        col2Title.textContent = getTitle(type2);
        col2List.innerHTML = formatarListaHTML(data2, limit, type2, format);
    }

    aplicarCoresDinamicas(cardElement, accentColor, format);
}

// Download com Ghost Container
async function gerarImagemFinal(format, accentColor, selectedCharts) {
    const btn = elements.btnDownloadStudio;
    const originalText = btn.innerHTML;
    btn.innerHTML = `${iconLoading} Generating...`;
    btn.disabled = true;

    const cardElement = format === "story" ? elements.storyCard : elements.squareCard;
    const container = elements.studioPreviewContainer;

    const ghostContainer = document.createElement("div");
    ghostContainer.style.position = "fixed";
    ghostContainer.style.top = "-9999px";
    ghostContainer.style.left = "0";
    ghostContainer.style.zIndex = "99999";
    ghostContainer.style.width = format === "story" ? "1080px" : "1080px";
    ghostContainer.style.height = format === "story" ? "1920px" : "1080px";
    
    document.body.appendChild(ghostContainer);
    ghostContainer.appendChild(cardElement);

    try {
        await new Promise((r) => setTimeout(r, 100));
        const canvas = await html2canvas(cardElement, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#0f0f0f",
            width: format === "story" ? 1080 : 1080,
            height: format === "story" ? 1920 : 1080,
            logging: false,
        });

        const link = document.createElement("a");
        link.download = `TuneCharts-${username}-${currentPeriod}-${format}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        btn.innerHTML = `${iconCheck} Done!`;
        btn.style.backgroundColor = "#28a745";
    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    } finally {
        container.appendChild(cardElement);
        document.body.removeChild(ghostContainer);
        fitCardToScreen();
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.backgroundColor = "";
        }, 3000);
    }
}

// --- Funções de Apoio (API / HTML) ---

function configurarTogglePeriodo() {
    const buttons = document.querySelectorAll(".toggle-option");
    buttons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".toggle-option").forEach((b) => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentPeriod = e.currentTarget.getAttribute("data-period");
            moveGlider(e.currentTarget);
            atualizarDadosDoPeriodo(false);
        });
    });
}

function moveGlider(targetButton) {
    if (!elements.glider || !targetButton) return;
    elements.glider.style.width = `${targetButton.offsetWidth}px`;
    elements.glider.style.transform = `translateX(${targetButton.offsetLeft}px)`;
}

async function atualizarDadosDoPeriodo(isInitialLoad = false) {
    let reportSubtitle = currentPeriod === "7day" ? "Last 7 Days" : (currentPeriod === "1month" ? "Last 30 Days" : "Last 12 Months");
    let labelText = currentPeriod === "7day" ? "In the last 7 days" : (currentPeriod === "1month" ? "In the last 30 days" : "In the last 12 months");
    let scrobblesLabel = currentPeriod === "7day" ? "Weekly Scrobbles" : (currentPeriod === "1month" ? "Monthly Scrobbles" : "Annual Scrobbles");

    elements.storySubtitle.textContent = reportSubtitle;
    elements.sqReportTitle.textContent = reportSubtitle;
    elements.storyScrobblesLabel.textContent = scrobblesLabel;
    elements.sqScrobblesLabel.textContent = scrobblesLabel;
    if (elements.monthlyLabel) elements.monthlyLabel.textContent = labelText;
    if (elements.storyDisclaimer) elements.storyDisclaimer.textContent = labelText;
    
    resetarChartsParaSkeleton();
    globalTopArtistImage = "";
    atualizarBanner("");
    
    await Promise.all([
        buscarScrobblesDoPeriodo(),
        buscarCharts("user.gettopartists", "artist", "cardArtists"),
        buscarCharts("user.gettoptracks", "track", "cardTracks"),
        buscarCharts("user.gettopalbums", "album", "cardAlbums"),
    ]);
    
    if (isInitialLoad) {
        const activeBtn = document.querySelector(".toggle-option.active");
        if (activeBtn) setTimeout(() => moveGlider(activeBtn), 100);
    }
}

function resetarChartsParaSkeleton() {
    const skeletonHTML = `<div class="chart-item skeleton top-1"><div class="cover-placeholder" style="background: #333;"></div><span class="skeleton-text" style="width: 60%;"></span></div>` + `<div class="chart-item skeleton"></div>`.repeat(9);
    document.querySelectorAll(".lista-top").forEach(el => el.innerHTML = skeletonHTML);
}

async function buscarPerfil() {
    try {
        const res = await fetch(`/api/?method=user.getinfo&user=${username}`);
        const data = await res.json();
        const user = data.user;
        const displayName = user.realname || user.name;
        
        elements.userName.textContent = displayName;
        elements.storyTitle.textContent = displayName;
        elements.sqUsername.textContent = displayName;
        elements.userName.classList.remove("skeleton");
        
        const img = user.image.find(i => i.size === "extralarge") || user.image.pop();
        if (img && img["#text"]) {
            [elements.userFoto, elements.storyUserImg, elements.sqUserImg].forEach(el => {
                if(el) { el.src = img["#text"]; el.crossOrigin = "anonymous"; }
            });
        }
        elements.userFoto.classList.remove("skeleton");
    } catch (e) {
        elements.userName.textContent = username;
        elements.userName.classList.remove("skeleton");
    }
}

async function buscarScrobblesDoPeriodo() {
    try {
        let fromDate = 0;
        if (currentPeriod === "7day") fromDate = Math.floor((Date.now() - 7 * 86400000) / 1000);
        else if (currentPeriod === "1month") fromDate = Math.floor((Date.now() - 30 * 86400000) / 1000);
        else if (currentPeriod === "12month") fromDate = Math.floor((Date.now() - 365 * 86400000) / 1000);

        const res = await fetch(`/api/?method=user.getrecenttracks&user=${username}&limit=1&from=${fromDate}`);
        const data = await res.json();
        let total = data.recenttracks?.["@attr"]?.total || "0";
        const totalInt = parseInt(total);
        
        elements.userScrobbles.textContent = totalInt.toLocaleString("pt-BR");
        if (elements.storyScrobblesValue) elements.storyScrobblesValue.textContent = totalInt.toLocaleString("en-US");
        if (elements.sqScrobblesValue) elements.sqScrobblesValue.textContent = totalInt.toLocaleString("en-US");
        
        let daysDivisor = currentPeriod === "7day" ? 7 : (currentPeriod === "1month" ? 30 : 365);
        if (elements.scrobblesPerDay) elements.scrobblesPerDay.textContent = Math.round(totalInt / daysDivisor).toLocaleString("pt-BR");
    } catch (e) {
        elements.userScrobbles.textContent = "-";
    } finally {
        elements.userScrobbles.classList.remove("skeleton");
        if (elements.scrobblesPerDay) elements.scrobblesPerDay.classList.remove("skeleton");
    }
}

async function buscarCharts(method, type, mainId) {
    try {
        const res = await fetch(`/api/?method=${method}&user=${username}&limit=10&period=${currentPeriod}`);
        const data = await res.json();
        const rootKey = "top" + type + "s";
        const items = data[rootKey]?.[type] ? (Array.isArray(data[rootKey][type]) ? data[rootKey][type] : [data[rootKey][type]]) : [];
        
        cachedData[type + "s"] = items;
        if(type === 'artist') cachedData.artists = items;
        if(type === 'track') cachedData.tracks = items;
        if(type === 'album') cachedData.albums = items;

        const container = document.querySelector(`#${mainId} .lista-top`);
        if (!container) return;
        
        let htmlMain = "";
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const item = items[i];
            const isTop1 = i === 0;
            let text = item.name;
            let artistName = item.artist ? item.artist.name : "";
            const imgId = `img-${type}-${i}`;
            
            if (isTop1) {
                let subtitle = type !== "artist" ? `<span style="display:block; font-size: 0.85em; opacity: 0.7; font-weight: normal;">${artistName}</span>` : "";
                htmlMain += `<div class="chart-item top-1"><div id="${imgId}" class="cover-placeholder"></div><div class="text-content"><span class="rank-number">#1</span><div><span>${text}</span>${subtitle}</div></div></div>`;
                
                buscarImagemSpotify(type === "artist" ? text : artistName, type === "artist" ? "" : text, type).then(url => {
                    if (url) {
                        const el = document.getElementById(imgId);
                        if (el) {
                            const img = new Image();
                            img.src = url;
                            img.onload = () => { el.innerHTML = ""; el.appendChild(img); img.classList.add('loaded'); };
                        }
                        if (type === "artist") { atualizarBanner(url); globalTopArtistImage = url; }
                    }
                });
            } else {
                if (type !== "artist") text += ` <span style="opacity:0.6"> - ${artistName}</span>`;
                htmlMain += `<div class="chart-item">#${i + 1} - ${text}</div>`;
            }
        }
        container.innerHTML = htmlMain || "No data.";
    } catch (e) {
        const container = document.querySelector(`#${mainId} .lista-top`);
        if(container) container.innerHTML = "Error loading.";
    }
}

async function obterTokenSpotify() {
    if (spotifyTokenCache) return spotifyTokenCache;
    try {
        const res = await fetch("/api/spotify-token");
        const data = await res.json();
        if (data.access_token) {
            spotifyTokenCache = data.access_token;
            return data.access_token;
        }
    } catch (e) { console.warn("Spotify Token Error", e); }
    return null;
}

async function buscarImagemSpotify(artist, trackName, type) {
    const token = await obterTokenSpotify();
    if (!token) return null;
    const cleanArtist = encodeURIComponent(artist);
    const cleanTrack = encodeURIComponent(trackName.split(" - ")[0].split("(")[0]);
    let query = type === "artist" ? `q=artist:"${cleanArtist}"` : (type === "album" ? `q=album:"${cleanTrack}" artist:"${cleanArtist}"` : `q=track:"${cleanTrack}" artist:"${cleanArtist}"`);
    let searchType = type === "artist" ? "artist" : (type === "album" ? "album" : "track");
    
    try {
        const res = await fetch(`https://api.spotify.com/v1/search?${query}&type=${searchType}&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (type === "artist") return data.artists?.items[0]?.images[0]?.url;
        if (type === "album") return data.albums?.items[0]?.images[0]?.url;
        if (type === "track") return data.tracks?.items[0]?.album?.images[0]?.url;
    } catch (e) { return null; }
    return null;
}

function atualizarBanner(imgUrl) {
    if (!elements.bannerBackground) return;
    if (imgUrl) {
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => { elements.bannerBackground.style.backgroundImage = `url('${imgUrl}')`; elements.bannerBackground.style.opacity = 1; };
    } else {
        elements.bannerBackground.style.opacity = 0;
        setTimeout(() => { if (elements.bannerBackground.style.opacity == "0") elements.bannerBackground.style.backgroundImage = "none"; }, 500);
    }
}

function formatarListaHTML(items, limit, type, format) {
    let html = "";
    (items || []).slice(0, limit).forEach((item, i) => {
        let text = item.name;
        if (format === "story") {
            const scrobbles = item.playcount ? parseInt(item.playcount).toLocaleString("en-US") : "";
            html += `<div class="story-item ${i === 0 ? "top-1" : ""}"><span class="story-rank">#${i + 1}</span><span class="story-text" style="flex:1;">${text}</span><span style="font-size:0.9em; opacity:0.9; margin-left:8px; white-space:nowrap;">${scrobbles} scrobbles</span></div>`;
        } else {
            html += `<li class="${i === 0 ? "top-1" : ""}"><span class="sq-v2-rank">#${i + 1}</span><span class="sq-v2-text">${text}</span></li>`;
        }
    });
    return html || "No data.";
}

function aplicarCoresDinamicas(card, accentColor, format) {
    if (format === "story") {
        // Textos e Bordas
        card.querySelectorAll(".story-subtitle, .story-rank, .stat-label, .stat-disclaimer").forEach(el => el.style.color = accentColor);
        card.querySelectorAll(".story-column h3").forEach(el => el.style.borderLeftColor = accentColor);
        card.querySelectorAll(".story-stat, .story-item.top-1").forEach(el => { 
            el.style.borderColor = accentColor; 
            el.style.backgroundColor = accentColor + "33"; 
        });
        
        // Fundo do Header e do Card
        const headerElement = card.querySelector(".story-header");
        if (headerElement) {
            // Se tiver imagem, usa ela + gradiente grande. Se não, usa gradiente grande (700px)
            headerElement.style.background = globalTopArtistImage ? 
                `radial-gradient(circle 700px at top right, ${accentColor}66, transparent), 
                 linear-gradient(to bottom, transparent 0%, rgba(15,15,15,0.2) 30%, rgba(15,15,15,0.8) 80%, #0f0f0f 100%), 
                 linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), 
                 url('${globalTopArtistImage}') no-repeat center center / cover` 
                : 
                `radial-gradient(circle 700px at top right, ${accentColor}66, transparent)`;
        }
        
        // Fundo do Card Geral (Aumentado de 100px para 700px para dar o efeito de glow real)
        card.style.background = `radial-gradient(circle 300px at top right, ${accentColor}66, transparent), #0f0f0f`;

    } else {
        // Lógica do Square (mantida igual, mas ajustei o gradiente se quiser mais forte também)
        card.querySelectorAll(".sq-v2-report-title, .sq-v2-list li.top-1 span, .sq-v2-stat-label").forEach(el => el.style.color = accentColor);
        card.querySelectorAll(".sq-v2-column h3").forEach(el => el.style.borderLeftColor = accentColor);
        card.querySelectorAll(".sq-v2-avatar, .sq-v2-stat, .sq-v2-list li.top-1").forEach(el => { 
            el.style.borderColor = accentColor; 
            if(!el.classList.contains('sq-v2-avatar')) el.style.backgroundColor = accentColor + "33"; 
        });
        
        // Square Background
        card.style.background = `radial-gradient(circle at top right, ${accentColor}66, #0f0f0f 40%)`;
    }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", carregarTudo);
else carregarTudo();