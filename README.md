# KfW Postkorb Downloader & Archiv UserScript

Dieses Tampermonkey‑Userscript ermöglicht es, Dokumente im KfW Postkorb automatisch herunterzuladen und/oder zu archivieren. Der Dateiname wird dabei anhand eines benutzerdefinierten Formats generiert – inklusive dynamischer Platzhalter für Datum, Dokumentenart, Darlehensnummer, Internetreferenz und KfW‑Ident‑Nummer.

## Features

- **Benutzerdefinierte Dateinamen**  
  Der Dateiname kann über ein Popup konfiguriert werden. Unterstützte Platzhalter sind:
  - `{datum}` – vollständiges Datum im Format `YYYYMMDD`
  - `{YYYY}`, `{MM}`, `{DD}` – einzelne Bestandteile des Datums
  - `{dokumentenart}`, `{darlehensnummer}`, `{internetreferenz}`, `{kfwid}`
  - Spacer können über `{spacer-" - "}` definiert werden  
  Eine Vorschau des generierten Dateinamens (mit Beispiel-Daten) wird im Popup angezeigt.

- **Automatisches Laden weiterer Zeilen**  
  Das Script liest die Anzeige im Element mit der Klasse `current` aus (z. B. "Anzahl Zeilen: 50 von 103") und löst den Klick auf den OK‑Button aus, um die Anzeige auf mehr Zeilen (bis >500) zu erweitern – _sofern die Anzahl der aktuell angezeigten Zeilen mindestens 50 beträgt_ und noch nicht alle Einträge geladen sind. Wird der Hinweis "Es wurden keine Nachrichten gefunden!" angezeigt, erfolgt keine Aktion.

- **Mehrfachauswahl mit Shift‑Klick**  
  Checkboxen in der Tabelle unterstützen Shift‑Klick, sodass mehrere Einträge einfach ausgewählt werden können. Beim Hovern über eine Checkbox wird ein Tooltip angezeigt, der über diese Funktion informiert.

- **Download- und Archivierungsmöglichkeiten**  
  Im Steuerungs‑Panel (rechts oben) stehen folgende Optionen zur Verfügung:
  - **Download Optionen:**  
    - **Alle:** Alle Einträge herunterladen  
    - **Ausgewählte:** Nur Einträge herunterladen, die über die Checkbox selektiert wurden  
    - **Ungesehene:** Nur Einträge herunterladen, die noch nicht als "gelesen" markiert wurden
  - **Archiv Optionen:** (Ausgeblendet auf bestimmten Seiten, z. B. `PostkorbAllgemeinBrowseAction` und `PostkorbKontoBrowseAction`)  
    - **Alle:** Alle Einträge archivieren  
    - **Ausgewählte:** Nur selektierte Einträge archivieren  
    - **Gesehene:** Nur als "gelesen" markierte Einträge archivieren

- **Integrierte Steuerung**  
  Das Bedienfeld zeigt alle Aktionen übersichtlich an und wird an der rechten oberen Seite (195px von oben, 10px vom rechten Rand) fixiert.

## Installation

1. **Tampermonkey installieren:**  
   Stelle sicher, dass Du [Tampermonkey](https://www.tampermonkey.net/) in Deinem Browser installiert hast.

2. **Script hinzufügen:**  
   Klicke auf das Userscript [kfw-postkorb-download-und-archiv.js](https://github.com/rorar/KfW-Postkorb---Download-und-Archiv/blob/main/kfw-postkorb-download-und-archiv.js) und klicke auf den Button "RAW" um es zu installieren.
   Erstelle in Tampermonkey ein neues Script und kopiere den gesamten Code aus diesem Repository hinein. Speichere das Script.

4. **Anwendung:**  
   Öffne die Seite des KfW Postkorbs (z. B. `https://onlinekreditportal.kfw.de/BK_KNPlattform/KfwFormularServer/BK_KNPlattform/Postkorb...`) – das Script wird automatisch ausgeführt.

## Konfiguration

- **Dateinamensformat anpassen:**  
  Klicke im Steuerungs‑Panel auf **"Dateinamens‑Einstellungen"**. Im erscheinenden Popup kannst Du das gewünschte Format anpassen. Eine Vorschau zeigt Dir, wie der Dateiname mit Beispiel-Daten aussehen wird.

- **Zeilenanzahl und automatische Aktualisierung:**  
  Das Script prüft automatisch die Anzahl der angezeigten Zeilen (aus dem Element mit class `current`) und löst, wenn nötig, den Klick auf den OK‑Button aus, um weitere Einträge zu laden.

## Nutzung

- **Download & Archiv:**  
  Verwende die Buttons im Steuerungs‑Panel, um alle, ausgewählte oder ungesehene Dokumente herunterzuladen bzw. zu archivieren.  
  Wähle Einträge über die zusätzlichen Checkboxen aus – mit Shift‑Klick kannst Du mehrere Checkboxen in einem Bereich markieren.

## Hinweise

- Das Script wurde speziell für den KfW Postkorb entwickelt und basiert auf der aktuellen Seitenstruktur. Änderungen an der Seite können Anpassungen im Script erforderlich machen.
- Auf Seiten, die `PostkorbAllgemeinBrowseAction` oder `PostkorbKontoBrowseAction` in der URL enthalten, werden die Archiv‑Funktionen automatisch ausgeblendet.

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Details findest Du in der [LICENSE](LICENSE) Datei.

## Credits

- Entwickelt von *rorar*  
- Inspiration und Ideen basieren auf Anforderungen zur Automatisierung im KfW Postkorb. Weil Banken und UX/UI - hussaaaa!

---

Viel Erfolg beim Einsatz und bei der weiteren Anpassung des Scripts!
