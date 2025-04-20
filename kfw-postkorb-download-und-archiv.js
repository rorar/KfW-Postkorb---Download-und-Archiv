// ==UserScript==
// @name         KfW Postkorb - Download & Archiv mit eigenem Dateinamen (Popup, Shift-Auswahl)
// @namespace    http://tampermonkey.net/
// @version      1.3.6
// @description  Ermöglicht das Herunterladen bzw. Archivieren von Postkorb-Dokumenten. Der Dateiname wird anhand eines benutzerdefinierten Formats erstellt. Der Benutzer kann das Format per Popup einstellen und eine Vorschau sehen. Zusätzlich gibt es Optionen für "Alle", "Ausgewählte" und "Ungesehene" Downloads sowie "Alle", "Ausgewählte" und "Gesehene" Archivierungen. Mit Shift lässt sich eine Mehrfachauswahl treffen. Archivfunktionen werden auf bestimmten Seiten ausgeblendet.
// @author       rorar
// @match        https://onlinekreditportal.kfw.de/BK_KNPlattform/KfwFormularServer/BK_KNPlattform/Postkorb*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_registerMenuCommand
// @connect      onlinekreditportal.kfw.de
// ==/UserScript==

(function() {
    'use strict';

    /********* Globale Konfiguration *********/
    // Standard-Format (Platzhalter: {datum} (YYYYMMDD), {YYYY}, {MM}, {DD}, {dokumentenart}, {darlehensnummer}, {internetreferenz}, {kfwid})
    // Spacer definieren mit {spacer-" - "}
    let FILE_NAME_PATTERN = "{datum} {dokumentenart}{spacer-\" - \"}{darlehensnummer}{spacer-\" - \"}{internetreferenz}{spacer-\" - \"}{kfwid}.pdf";

    /********* Utility Funktionen *********/
    function sanitizeFilename(name) {
        return name.replace(/[\\\/:\*\?"<>\|]/g, "_");
    }

    function generateFileName(data) {
        let name = FILE_NAME_PATTERN;
        // Extrahiere Jahr, Monat, Tag aus data.datum (Format: YYYYMMDD)
        let YYYY = data.datum.substring(0, 4);
        let MM = data.datum.substring(4, 6);
        let DD = data.datum.substring(6, 8);

        name = name.replace(/{datum}/g, data.datum);
        name = name.replace(/{YYYY}/g, YYYY);
        name = name.replace(/{MM}/g, MM);
        name = name.replace(/{DD}/g, DD);
        name = name.replace(/{dokumentenart}/g, data.dokumentenart);
        name = name.replace(/{darlehensnummer}/g, data.darlehensnummer);
        name = name.replace(/{internetreferenz}/g, data.internetreferenz);
        name = name.replace(/{kfwid}/g, data.kfwid);

        // Ersetze Spacer-Definitionen: {spacer-"TEXT"} wird durch TEXT ersetzt.
        name = name.replace(/{spacer-"([^"]+)"}/g, "$1");
        // Entferne überflüssige Spacer
        name = name.replace(/(?:\s*-\s*)(?:ohne)?\s*-\s*/gi, " - ");
        name = name.replace(/^\s*-\s*/,"").replace(/\s*-\s*$/,"");
        return sanitizeFilename(name.trim());
    }

    /********* Zeilenanzahl setzen anhand von class="current" *********/
    function setMaxRows() {
        // Suche das Element mit class "current", z.B. "Anzahl Zeilen: 50 von 103"
        let currentDiv = document.querySelector("div.current");
        if (currentDiv) {
            let text = currentDiv.textContent;
            let match = text.match(/(\d+)\s+von\s+(\d+)/);
            if (match) {
                let currentNum = parseInt(match[1], 10);
                let totalNum = parseInt(match[2], 10);
                // Klick nur, wenn nicht alle Einträge geladen sind und mindestens 50 angezeigt werden
                if (currentNum < totalNum && currentNum >= 50) {
                    let select = document.querySelector("select[name='NUMBER_OF_ROWS']");
                    if (select && select.value !== "100000") {
                        select.value = "100000";
                        let event = new Event("change", { bubbles: true });
                        select.dispatchEvent(event);
                    }
                    let submitButton = document.querySelector("input[name='cmdbtn_ctrl:postkorb_action:ShowRows']");
                    if (submitButton) {
                        submitButton.click();
                    }
                }
            }
        }
    }

    /********* Popup für Dateinamens‑Einstellungen *********/
    function openSettingsPopup() {
        let overlay = document.createElement('div');
        overlay.id = "settingsOverlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
        overlay.style.zIndex = "100000";

        let modal = document.createElement('div');
        modal.id = "settingsModal";
        modal.style.position = "fixed";
        modal.style.top = "50%";
        modal.style.left = "50%";
        modal.style.transform = "translate(-50%, -50%)";
        modal.style.backgroundColor = "#fff";
        modal.style.padding = "20px";
        modal.style.borderRadius = "8px";
        modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.5)";
        modal.style.width = "400px";
        modal.style.fontFamily = "Arial, sans-serif";
        modal.style.fontSize = "14px";

        let title = document.createElement('h3');
        title.textContent = "Dateinamens‑Einstellungen";
        modal.appendChild(title);

        let label = document.createElement('label');
        label.textContent = "Dateinamensformat:";
        modal.appendChild(label);

        let textarea = document.createElement('textarea');
        textarea.style.width = "100%";
        textarea.style.height = "80px";
        textarea.style.margin = "10px 0";
        textarea.value = FILE_NAME_PATTERN;
        modal.appendChild(textarea);

        let info = document.createElement("div");
        info.style.fontSize = "12px";
        info.style.color = "#555";
        info.style.marginBottom = "10px";
        info.textContent = "Platzhalter: {datum} (YYYYMMDD), {YYYY}, {MM}, {DD}, {dokumentenart}, {darlehensnummer}, {internetreferenz}, {kfwid}. Spacer definieren mit {spacer-\" - \"}.";
        modal.appendChild(info);

        let previewLabel = document.createElement('div');
        previewLabel.textContent = "Vorschau:";
        previewLabel.style.fontWeight = "bold";
        modal.appendChild(previewLabel);

        let preview = document.createElement('div');
        preview.id = "previewOutput";
        preview.style.padding = "5px";
        preview.style.backgroundColor = "#f0f0f0";
        preview.style.border = "1px solid #ccc";
        preview.style.marginBottom = "10px";
        let sampleData = {
            datum: "20211019",
            dokumentenart: "Nachweis Termininformation",
            darlehensnummer: "12345678",
            internetreferenz: "",
            kfwid: "9876543210"
        };
        preview.textContent = generateFileName(sampleData);
        modal.appendChild(preview);

        textarea.addEventListener("input", function() {
            FILE_NAME_PATTERN = textarea.value;
            preview.textContent = generateFileName(sampleData);
        });

        let btnContainer = document.createElement('div');
        btnContainer.style.textAlign = "right";

        let saveBtn = document.createElement('button');
        saveBtn.textContent = "Speichern";
        saveBtn.style.marginRight = "10px";
        saveBtn.style.padding = "5px 10px";
        saveBtn.style.border = "none";
        saveBtn.style.borderRadius = "3px";
        saveBtn.style.backgroundColor = "#28a745";
        saveBtn.style.color = "white";
        saveBtn.style.cursor = "pointer";
        saveBtn.addEventListener("click", function() {
            document.body.removeChild(overlay);
        });
        btnContainer.appendChild(saveBtn);

        let cancelBtn = document.createElement('button');
        cancelBtn.textContent = "Abbrechen";
        cancelBtn.style.padding = "5px 10px";
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = "3px";
        cancelBtn.style.backgroundColor = "#dc3545";
        cancelBtn.style.color = "white";
        cancelBtn.style.cursor = "pointer";
        cancelBtn.addEventListener("click", function() {
            document.body.removeChild(overlay);
        });
        btnContainer.appendChild(cancelBtn);

        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    /********* Tabellen-Erweiterungen *********/
    function addCheckboxColumn() {
        let table = document.querySelector("table");
        if (!table) return;
        let thead = table.querySelector("thead");
        if (thead) {
            let headerRow = thead.querySelector("tr");
            if (headerRow) {
                let th = document.createElement("th");
                th.textContent = "Auswahl";
                th.style.textAlign = "center";
                headerRow.insertBefore(th, headerRow.firstChild);
            }
        }
        let rows = table.querySelectorAll("tbody tr");
        let lastChecked = null;
        rows.forEach(row => {
            let td = document.createElement("td");
            td.style.textAlign = "center";
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "row-select";
            checkbox.title = "Mit Shift klicken: Mehrfachauswahl";
            td.appendChild(checkbox);
            row.insertBefore(td, row.firstChild);
            row.addEventListener("click", function(e) {
                if (e.target.tagName.toLowerCase() === "input") return;
                row.classList.toggle("seen");
                row.style.backgroundColor = row.classList.contains("seen") ? "#d4edda" : "";
            });
            checkbox.addEventListener("click", function(e) {
                if (lastChecked && e.shiftKey) {
                    let checkboxes = Array.from(document.querySelectorAll("input.row-select"));
                    let start = checkboxes.indexOf(lastChecked);
                    let end = checkboxes.indexOf(checkbox);
                    checkboxes.slice(Math.min(start, end), Math.max(start, end) + 1)
                        .forEach(chk => chk.checked = lastChecked.checked);
                }
                lastChecked = checkbox;
                e.stopPropagation();
            });
        });
    }

    /********* Download & Archiv Funktionen *********/
    function downloadDocument(row, callback) {
        let cells = row.querySelectorAll("td");
        if (cells.length < 8) return;
        let downloadForm = cells[2].querySelector("form");
        if (!downloadForm) return;
        let formData = new FormData(downloadForm);
        let params = new URLSearchParams();
        for (let [key, value] of formData.entries()) {
            params.append(key, value);
        }
        let rowData = extractRowData(row);
        let filename = generateFileName(rowData);
        GM_xmlhttpRequest({
            method: "POST",
            url: downloadForm.action,
            data: params.toString(),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            responseType: "blob",
            onload: function(response) {
                if (response.status === 200) {
                    let blobUrl = URL.createObjectURL(response.response);
                    GM_download({
                        url: blobUrl,
                        name: filename,
                        onerror: function(err) { console.error("Download-Fehler:", err); }
                    });
                    if (callback) callback(true);
                } else {
                    console.error("Fehler beim Abruf:", response.status, response.statusText);
                    if (callback) callback(false);
                }
            },
            onerror: function(err) {
                console.error("GM_xmlhttpRequest Fehler:", err);
                if (callback) callback(false);
            }
        });
    }

    function archiveDocument(row, callback) {
        let cells = row.querySelectorAll("td");
        if (cells.length < 8) return;
        let archiveForm = cells[1].querySelector("form");
        if (!archiveForm) return;
        let formData = new FormData(archiveForm);
        let params = new URLSearchParams();
        for (let [key, value] of formData.entries()) {
            params.append(key, value);
        }
        GM_xmlhttpRequest({
            method: "POST",
            url: archiveForm.action,
            data: params.toString(),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            onload: function(response) {
                if (response.status === 200) {
                    row.style.opacity = "0.5";
                    if (callback) callback(true);
                } else {
                    console.error("Archivierungsfehler:", response.status, response.statusText);
                    if (callback) callback(false);
                }
            },
            onerror: function(err) {
                console.error("Archivierungsfehler:", err);
                if (callback) callback(false);
            }
        });
    }

    function extractRowData(row) {
        let cells = row.querySelectorAll("td");
        if (cells.length < 8) return null;
        let rawDate = cells[3].textContent.trim();
        let parts = rawDate.split(".");
        let datum = (parts.length === 3) ? parts[2] + parts[1] + parts[0] : rawDate;
        return {
            datum: datum,
            dokumentenart: cells[4].textContent.trim(),
            darlehensnummer: cells[5].textContent.trim(),
            internetreferenz: cells[6].textContent.trim(),
            kfwid: cells[7].textContent.trim()
        };
    }

    function getRows(filterFn) {
        let table = document.querySelector("table");
        if (!table) return [];
        let rows = Array.from(table.querySelectorAll("tbody tr"));
        return rows.filter(filterFn);
    }

    /********* Button‑Eventhandler *********/
    function downloadAll() {
        let rows = getRows(() => true);
        rows.forEach(row => downloadDocument(row));
    }
    function downloadSelected() {
        let rows = getRows(row => row.querySelector("input.row-select").checked);
        rows.forEach(row => downloadDocument(row));
    }
    function downloadUnseen() {
        let rows = getRows(row => !row.classList.contains("seen"));
        rows.forEach(row => downloadDocument(row));
    }
    function archiveAll() {
        let rows = getRows(() => true);
        rows.forEach(row => archiveDocument(row));
    }
    function archiveSelected() {
        let rows = getRows(row => row.querySelector("input.row-select").checked);
        rows.forEach(row => archiveDocument(row));
    }
    function archiveSeen() {
        let rows = getRows(row => row.classList.contains("seen"));
        rows.forEach(row => archiveDocument(row));
    }

    /********* Steuerungs-Panel erstellen *********/
    function createControlPanel() {
        let panel = document.createElement("div");
        panel.id = "kfwpanel";
        // Panel fest positionieren (rechts oben, 195px von oben, 10px vom rechten Rand) mit fester Breite 145px
        panel.style.position = "fixed";
        panel.style.top = "195px";
        panel.style.right = "10px";
        panel.style.width = "145px";
        panel.style.zIndex = "10000";
        panel.style.backgroundColor = "#f8f9fa";
        panel.style.border = "1px solid #ced4da";
        panel.style.padding = "10px";
        panel.style.borderRadius = "5px";
        panel.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.3)";
        panel.style.fontFamily = "Arial, sans-serif";
        panel.style.fontSize = "14px";

        function createButton(text, onClick, color) {
            let btn = document.createElement("button");
            btn.textContent = text;
            btn.style.margin = "5px 0"; // Obere und untere Margin, da Buttons 100% breit sein sollen
            btn.style.padding = "5px 10px";
            btn.style.width = "100%"; // Buttons über die ganze Breite
            btn.style.border = "none";
            btn.style.borderRadius = "3px";
            btn.style.backgroundColor = color;
            btn.style.color = "white";
            btn.style.cursor = "pointer";
            btn.addEventListener("mouseover", () => { btn.style.opacity = "0.8"; });
            btn.addEventListener("mouseout", () => { btn.style.opacity = "1"; });
            btn.addEventListener("click", onClick);
            return btn;
        }

        // Ändere "Dateinamens‑Einstellungen" zu "⚙️Dateinamen"
        panel.appendChild(createButton("⚙️Dateinamen", openSettingsPopup, "#6f42c1"));

        let dlHeader = document.createElement("div");
        dlHeader.textContent = "Download Optionen:";
        dlHeader.style.fontWeight = "bold";
        panel.appendChild(dlHeader);
        panel.appendChild(createButton("Alle", downloadAll, "#155724"));
        panel.appendChild(createButton("Ausgewählte", downloadSelected, "#218838"));
        panel.appendChild(createButton("Ungesehene", downloadUnseen, "#28a745"));

        const url = window.location.href;
        const hideArchive = url.indexOf("PostkorbAllgemeinBrowseAction") !== -1 ||
                            url.indexOf("PostkorbKontoBrowseAction") !== -1;
        if (!hideArchive) {
            let archHeader = document.createElement("div");
            archHeader.textContent = "Archiv Optionen:";
            archHeader.style.fontWeight = "bold";
            archHeader.style.marginTop = "10px";
            panel.appendChild(archHeader);
            panel.appendChild(createButton("Alle", archiveAll, "#17a2b8"));
            panel.appendChild(createButton("Ausgewählte", archiveSelected, "#0069d9"));
            panel.appendChild(createButton("Gesehene", archiveSeen, "#007bff"));
        }

        document.body.appendChild(panel);
    }

    /********* Initialisierung *********/
    function init() {
        setMaxRows();
        addCheckboxColumn();
        createControlPanel();
    }

    window.addEventListener("load", init);

})();
