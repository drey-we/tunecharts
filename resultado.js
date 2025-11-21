const params = new URLSearchParams(window.location.search);
const username = params.get("user");
if (!username) window.location.href = "index.html";
let currentPeriod = "1month";
let selectedAccentColor = "#bb86fc";
let selectedFormat = "story";
let chartsToInclude = ["artists", "tracks"];
let elements = {};
let cachedData = { artists: [], tracks: [], albums: [] };
async function carregarTudo() {
    elements = {
        userFoto: document.getElementById("userFoto"),
        userName: document.getElementById("userName"),
        userScrobbles: document.getElementById("userScrobbles"),
        monthlyLabel: document.querySelector(".monthly-label"),
        glider: document.querySelector(".toggle-glider"),
        formatModal: document.getElementById("formatPickerModal"),
        colorModal: document.getElementById("colorPickerModal"),
        columnModal: document.getElementById("columnPickerModal"),
        closeBtns: document.querySelectorAll(".close-button"),
        genReportBtn: document.getElementById("btnGerarRelatorio"),
        formatOptions: document.querySelectorAll(".format-option"),
        colorOptions: document.querySelectorAll(".color-option"),
        chartColOptions: document.querySelectorAll(".chart-col-option"),
        confirmColumnsBtn: document.getElementById("confirmColumnsBtn"),
        skipColorBtn: document.getElementById("skipColorBtn"),
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
    atualizarDadosDoPeriodo(!0);
}
function configurarTogglePeriodo() {
    const buttons = document.querySelectorAll(".toggle-option");
    buttons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const clickedButton = e.currentTarget;
            buttons.forEach((b) => b.classList.remove("active"));
            clickedButton.classList.add("active");
            currentPeriod = clickedButton.getAttribute("data-period");
            moveGlider(clickedButton);
            atualizarDadosDoPeriodo(!1);
        });
    });
}
function moveGlider(targetButton) {
    if (!elements.glider || !targetButton) return;
    const parentRect = targetButton.parentElement.getBoundingClientRect();
    const targetRect = targetButton.getBoundingClientRect();
    const offsetLeft = targetRect.left - parentRect.left + targetButton.parentElement.scrollLeft;
    elements.glider.style.width = `${targetButton.offsetWidth}px`;
    elements.glider.style.transform = `translateX(${offsetLeft}px)`;
}
async function atualizarDadosDoPeriodo(isInitialLoad = !1) {
    const date = new Date();
    let reportSubtitle = "";
    let labelText = "";
    let scrobblesLabel = "";
    if (currentPeriod === "7day") {
        reportSubtitle = "My Week";
        labelText = "Showing last 7 days";
        scrobblesLabel = "Weekly Scrobbles";
    } else if (currentPeriod === "1month") {
        const monthName = date.toLocaleString("en-US", { month: "long" });
        reportSubtitle = `My ${monthName}`;
        labelText = "Showing last 30 days";
        scrobblesLabel = "Monthly Scrobbles";
    } else if (currentPeriod === "12month") {
        const year = date.getFullYear();
        reportSubtitle = `My ${year}`;
        labelText = "Showing last 12 months";
        scrobblesLabel = "Annual Scrobbles";
    }
    elements.storySubtitle.textContent = reportSubtitle;
    elements.sqReportTitle.textContent = reportSubtitle;
    elements.storyScrobblesLabel.textContent = scrobblesLabel;
    elements.sqScrobblesLabel.textContent = scrobblesLabel;
    if (elements.monthlyLabel) elements.monthlyLabel.textContent = labelText;
    if (elements.storyDisclaimer) elements.storyDisclaimer.textContent = labelText;
    const skeletonHTML = Array(5).fill('<div class="chart-item skeleton"></div>').join("");
    document.querySelectorAll(".lista-top").forEach((el) => (el.innerHTML = skeletonHTML));
    await Promise.all([
        buscarScrobblesDoPeriodo(),
        buscarCharts("user.gettopartists", "artist", "cardArtists"),
        buscarCharts("user.gettoptracks", "track", "cardTracks"),
        buscarCharts("user.gettopalbums", "album", "cardAlbums"),
    ]);
    if (isInitialLoad) {
        const activeButton = document.querySelector(".toggle-option.active");
        if (activeButton) setTimeout(() => moveGlider(activeButton), 100);
    }
}
async function buscarPerfil() {
    try {
        const url = `/api/?method=user.getinfo&user=${username}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.message);
        const user = data.user;
        const displayName = user.realname || user.name;
        elements.userName.textContent = displayName;
        elements.storyTitle.textContent = displayName;
        elements.sqUsername.textContent = displayName;
        elements.userName.classList.remove("skeleton");
        const img = user.image.find((i) => i.size === "extralarge") || user.image.pop();
        if (img && img["#text"]) {
            const tempImg = new Image();
            tempImg.onload = () => {
                elements.userFoto.src = img["#text"];
                elements.userFoto.classList.remove("skeleton");
            };
            tempImg.src = img["#text"];
            elements.storyUserImg.crossOrigin = "anonymous";
            elements.storyUserImg.src = img["#text"];
            elements.sqUserImg.crossOrigin = "anonymous";
            elements.sqUserImg.src = img["#text"];
        } else {
            elements.userFoto.classList.remove("skeleton");
        }
    } catch (error) {
        console.error("Erro perfil:", error);
        elements.userName.textContent = username;
        elements.storyTitle.textContent = username;
        elements.sqUsername.textContent = username;
        elements.userName.classList.remove("skeleton");
    }
}
async function buscarScrobblesDoPeriodo() {
    try {
        let fromDate = 0;
        if (currentPeriod === "7day") fromDate = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
        else if (currentPeriod === "1month") fromDate = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
        else if (currentPeriod === "12month") fromDate = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);
        const url = `/api/?method=user.getrecenttracks&user=${username}&limit=1&from=${fromDate}`;
        const res = await fetch(url);
        const data = await res.json();
        let total = "0";
        if (data.recenttracks && data.recenttracks["@attr"]) {
            total = data.recenttracks["@attr"].total;
        }
        const totalBR = parseInt(total).toLocaleString("pt-BR");
        const totalUS = parseInt(total).toLocaleString("en-US");
        elements.userScrobbles.textContent = totalBR;
        if (elements.storyScrobblesValue) elements.storyScrobblesValue.textContent = totalUS;
        if (elements.sqScrobblesValue) elements.sqScrobblesValue.textContent = totalUS;
    } catch (error) {
        elements.userScrobbles.textContent = "-";
    } finally {
        elements.userScrobbles.classList.remove("skeleton");
    }
}
async function buscarCharts(method, type, mainId) {
    try {
        const url = `/api/?method=${method}&user=${username}&limit=10&period=${currentPeriod}`;
        const res = await fetch(url);
        const data = await res.json();
        const rootKey = "top" + type + "s";
        const items = data[rootKey]
            ? Array.isArray(data[rootKey][type])
                ? data[rootKey][type]
                : [data[rootKey][type]]
            : [];
        cachedData[type + "s"] = items;
        const mainItems = items.slice(0, 5);
        let htmlMain = "";
        mainItems.forEach((item, i) => {
            let text = item.name;
            let artistName = item.artist ? item.artist.name : "";
            if (type !== "artist") text += ` <span style="opacity:0.6">- ${artistName}</span>`;
            htmlMain += `<div class="chart-item ${i === 0 ? "top-1" : ""}">#${i + 1} - ${text}</div>`;
        });
        document.querySelector(`#${mainId} .lista-top`).innerHTML = htmlMain || "No data.";
    } catch (error) {
        document.querySelector(`#${mainId} .lista-top`).innerHTML = "Error loading.";
    }
}
function configurarEventosHub() {
    if (!elements.genReportBtn) return;
    elements.genReportBtn.addEventListener("click", () => {
        elements.formatModal.style.display = "flex";
    });
    elements.closeBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const modalId = e.currentTarget.getAttribute("data-modal");
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = "none";
        });
    });
    window.addEventListener("click", (e) => {
        if (e.target === elements.colorModal) elements.colorModal.style.display = "none";
        if (e.target === elements.formatModal) elements.formatModal.style.display = "none";
        if (e.target === elements.columnModal) elements.columnModal.style.display = "none";
    });
    elements.formatOptions.forEach((btn) => {
        btn.onclick = (e) => {
            selectedFormat = e.currentTarget.getAttribute("data-format");
            elements.formatModal.style.display = "none";
            elements.columnModal.style.display = "flex";
            setupColumnPicker();
        };
    });
    function setupColumnPicker() {
        const updateSelection = () => {
            chartsToInclude = [];
            elements.chartColOptions.forEach((checkbox) => {
                if (checkbox.checked) {
                    chartsToInclude.push(checkbox.getAttribute("data-list"));
                }
            });
            elements.confirmColumnsBtn.disabled = chartsToInclude.length === 0 || chartsToInclude.length > 2;
        };
        elements.chartColOptions.forEach((checkbox) => {
            checkbox.onchange = () => {
                updateSelection();
                if (chartsToInclude.length > 2) {
                    checkbox.checked = !1;
                    updateSelection();
                }
            };
        });
        updateSelection();
    }
    elements.confirmColumnsBtn.onclick = () => {
        if (chartsToInclude.length < 1 || chartsToInclude.length > 2) return;
        elements.columnModal.style.display = "none";
        if (elements.colorModal) {
            elements.colorModal.style.display = "flex";
        } else {
            gerarImagemFinal(selectedFormat, selectedAccentColor, chartsToInclude);
        }
    };
    if (elements.skipColorBtn) {
        elements.skipColorBtn.onclick = () => {
            elements.colorModal.style.display = "none";
            gerarImagemFinal(selectedFormat, selectedAccentColor, chartsToInclude);
        };
    }
    elements.colorOptions.forEach((btn) => {
        btn.onclick = (e) => {
            const target = e.currentTarget;
            elements.colorOptions.forEach((b) => b.classList.remove("selected"));
            target.classList.add("selected");
            selectedAccentColor = target.getAttribute("data-color");
            elements.colorModal.style.display = "none";
            setTimeout(() => gerarImagemFinal(selectedFormat, selectedAccentColor, chartsToInclude), 50);
        };
    });
}
async function gerarImagemFinal(format, accentColor, selectedCharts) {
    const btn = elements.genReportBtn;
    const originalText = btn.textContent;
    btn.textContent = "⏳ Generating...";
    btn.disabled = !0;
    let cardElement, cardWidth, cardHeight, col1, col1Title, col1List, col2, col2Title, col2List;
    if (format === "story") {
        cardElement = elements.storyCard;
        cardWidth = 1080;
        cardHeight = 1920;
        col1 = cardElement.querySelector(".story-column:nth-child(1)");
        col1Title = elements.storyCol1Title;
        col1List = elements.storyCol1List;
        col2 = cardElement.querySelector(".story-column:nth-child(2)");
        col2Title = elements.storyCol2Title;
        col2List = elements.storyCol2List;
    } else {
        cardElement = elements.squareCard;
        cardWidth = 1080;
        cardHeight = 1080;
        col1 = cardElement.querySelector(".sq-v2-column:nth-child(1)");
        col1Title = elements.sqCol1Title;
        col1List = elements.sqCol1List;
        col2 = cardElement.querySelector(".sq-v2-column:nth-child(2)");
        col2Title = elements.sqCol2Title;
        col2List = elements.sqCol2List;
    }
    if (selectedCharts.length === 1) {
        const type = selectedCharts[0];
        const data = cachedData[type] || [];
        const title = document.querySelector(`.chart-col-option[data-list="${type}"]`).getAttribute("data-title");
        col1.style.display = "flex";
        col2.style.display = "none";
        if (format === "square") col1.style.width = "100%";
        const limit = format === "story" ? 10 : 6;
        col1Title.textContent = title;
        col1List.innerHTML = formatarListaHTML(data, limit, type, format);
    } else {
        const [type1, type2] = selectedCharts;
        const data1 = cachedData[type1] || [];
        const data2 = cachedData[type2] || [];
        const title1 = document.querySelector(`.chart-col-option[data-list="${type1}"]`).getAttribute("data-title");
        const title2 = document.querySelector(`.chart-col-option[data-list="${type2}"]`).getAttribute("data-title");
        col1.style.display = "flex";
        col2.style.display = "flex";
        if (format === "square") col1.style.width = "50%";
        const limit = format === "story" ? 5 : 6;
        col1Title.textContent = title1;
        col1List.innerHTML = formatarListaHTML(data1, limit, type1, format);
        col2Title.textContent = title2;
        col2List.innerHTML = formatarListaHTML(data2, limit, type2, format);
    }
    try {
        aplicarCoresDinamicas(cardElement, accentColor, format);
        await new Promise((r) => setTimeout(r, 300));
        const canvas = await html2canvas(cardElement, {
            scale: 1,
            useCORS: !0,
            allowTaint: !0,
            backgroundColor: "#0f0f0f",
            width: cardWidth,
            height: cardHeight,
            windowWidth: cardWidth,
            windowHeight: cardHeight,
            scrollX: 0,
            scrollY: 0,
            logging: !1,
        });
        const link = document.createElement("a");
        link.download = `TuneCharts-${username}-${currentPeriod}-${format}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        btn.textContent = "Done!";
    } catch (err) {
        console.error(err);
        alert("Error generating image: " + err.message);
    } finally {
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = !1;
            resetarCores(cardElement, format);
        }, 2000);
    }
}
function formatarListaHTML(items, limit, type, format) {
    let html = "";
    const itemsToShow = items.slice(0, limit);
    itemsToShow.forEach((item, i) => {
        let artistName = item.artist ? item.artist.name : "";
        let text = item.name;
        if (format === "story") {
            html += `
                <div class="story-item ${i === 0 ? "top-1" : ""}">
                    <span class="story-rank">#${i + 1}</span>
                    <span class="story-text">${text}</span>
                </div>
            `;
        } else {
            if (type !== "artist") text = `${item.name} - ${artistName}`;
            html += `
                <li class="${i === 0 ? "top-1" : ""}">
                    <span class="sq-v2-rank">#${i + 1}</span>
                    <span class="sq-v2-text">${text}</span>
                </li>
            `;
        }
    });
    return html || "No data.";
}
function aplicarCoresDinamicas(card, accentColor, format) {
    if (format === "story") {
        card.querySelectorAll(".story-subtitle, .story-rank, .stat-label, .stat-disclaimer").forEach(
            (el) => (el.style.color = accentColor)
        );
        card.querySelectorAll(".story-column h3").forEach((el) => (el.style.borderLeftColor = accentColor));
        card.querySelectorAll(".story-stat, .story-item.top-1").forEach((el) => {
            el.style.borderColor = accentColor;
            el.style.backgroundColor = accentColor + "33";
        });
        card.style.background = `radial-gradient(circle at top right, ${accentColor}66, #0f0f0f 65%)`;
    } else {
        card.querySelectorAll(".sq-v2-report-title, .sq-v2-list li.top-1 span, .sq-v2-stat-label").forEach(
            (el) => (el.style.color = accentColor)
        );
        card.querySelectorAll(".sq-v2-column h3").forEach((el) => (el.style.borderLeftColor = accentColor));
        card.querySelectorAll(".sq-v2-avatar").forEach((el) => (el.style.borderColor = accentColor));
        card.querySelectorAll(".sq-v2-stat, .sq-v2-list li.top-1").forEach((el) => {
            el.style.borderColor = accentColor;
            el.style.backgroundColor = accentColor + "33";
        });
        card.style.background = `radial-gradient(circle at top right, ${accentColor}66, #0f0f0f 65%)`;
    }
}
function resetarCores(card, format) {
    const defaultColor = "#bb86fc";
    const defaultBorder = "rgba(187, 134, 252, 0.3)";
    const defaultBg = "rgba(187, 134, 252, 0.2)";
    if (format === "story") {
        card.querySelectorAll(".story-subtitle, .story-rank, .stat-label, .stat-disclaimer").forEach(
            (el) => (el.style.color = defaultColor)
        );
        card.querySelectorAll(".story-column h3").forEach((el) => (el.style.borderLeftColor = defaultColor));
        card.querySelectorAll(".story-stat, .story-item.top-1").forEach((el) => {
            el.style.borderColor = defaultBorder;
            el.style.backgroundColor = defaultBg;
        });
        card.style.background = `radial-gradient(circle at top right, #3a0050, #0f0f0f 60%)`;
    } else {
        card.querySelectorAll(".sq-v2-report-title, .sq-v2-list li.top-1 span, .sq-v2-stat-label").forEach(
            (el) => (el.style.color = defaultColor)
        );
        card.querySelectorAll(".sq-v2-column h3").forEach((el) => (el.style.borderLeftColor = defaultColor));
        card.querySelectorAll(".sq-v2-avatar").forEach((el) => (el.style.borderColor = defaultColor));
        card.querySelectorAll(".sq-v2-stat, .sq-v2-list li.top-1").forEach((el) => {
            el.style.borderColor = defaultBorder;
            el.style.backgroundColor = defaultBg;
        });
        card.style.background = `radial-gradient(circle at top right, #3a0050, #0f0f0f 60%)`;
    }
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", carregarTudo);
} else {
    carregarTudo();
}
