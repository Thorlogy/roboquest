# Implementation Plan: Einstellungen & UI-Optimierung (D-Pad Overlap, Camera Toggle)

Dieses Dokument beschreibt den Plan zur Anpassung des Einstellungs-Menüs, zur Behebung des Überlagerungsproblems der Steuerungstasten (D-Pad) im Hochformat und zur Verbesserung des Kamera-Buttons.

## User Review Required

> [!IMPORTANT]
> - **D-Pad Positionierung**: Anstatt das D-Pad unter die Programmierfläche rutschen zu lassen oder es starr zu überlagern, werden D-Pad und Sensor-Ausgabe nun dynamisch nach oben geschoben, wenn die Programmierleiste geöffnet wird. Dies geschieht mit einer flüssigen CSS-Transition.
> - **Kamera-Button**: Der Text ("Ansicht: Follow/Orbit") wird komplett entfernt. Der Button zeigt nun standardmäßig `🎥` (Follow) und wechselt im Orbit-Modus zu `🌐` mit einem dezenten, grün leuchtenden Aktiv-Zustand.

## Proposed Changes

---

### 1. UI & Layout (HTML)

#### [MODIFY] [index.html](file:///Users/tleimbach/.gemini/antigravity/scratch/roboquest/index.html)
* **Settings Modal**:
  * Entfernen der Emojis aus den Button-Texten (nur noch "AN" und "AUS").
  * Hinzufügen einer Option zum Ein-/Ausblenden der **Pfeilsteuerung** (D-Pad).
  * Hinzufügen einer Option zum Ein-/Ausblenden des **Orientierungskreises** (Minimap).

---

### 2. Styling (CSS)

#### [MODIFY] [style.css](file:///Users/tleimbach/.gemini/antigravity/scratch/roboquest/css/style.css)
* **Transition & Position**:
  * CSS-Transition für `bottom` auf `.dpad` und `.sensor-overlay` hinzufügen.
  * Definition von `.hidden-by-setting { display: none !important; }` zum Ausblenden.
  * Regeln für das dynamische Verschieben:
    * `body.editor-mode-a .dpad`, `body.editor-mode-a .sensor-overlay` -> `bottom: 150px !important;` (über der eingeklappten Leiste).
    * `body.editor-mode-b .dpad`, `body.editor-mode-b .sensor-overlay` -> `bottom: calc(50vh + 30px) !important;` (über dem aufgezogenen Editor).
* **Kamera-Button Aktiv-Staat**:
  * `.top-bar-icon-btn.active` stylen (grüner Hintergrund/Glow).

---

### 3. Logic & State (JS)

#### [MODIFY] [simple_coding.js](file:///Users/tleimbach/.gemini/antigravity/scratch/roboquest/js/simple_coding.js)
* **setMode(m)**:
  * Aktualisieren der Klassen auf `document.body` (`editor-mode-a` oder `editor-mode-b`), damit das CSS weiß, wie hoch die Programmierleiste ist und das D-Pad entsprechend verschieben kann.

#### [MODIFY] [ui.js](file:///Users/tleimbach/.gemini/antigravity/scratch/roboquest/js/ui.js)
* **Settings Toggling (Zahnrad)**:
  * Beim erneuten Klick auf das Zahnrad bei geöffnetem Einstellungsfenster wird dieses wieder geschlossen.
* **Toggles für D-Pad & Orientierungskreis**:
  * Einbindung der Logik für die beiden neuen Einstellungen.
  * Speichern und Laden der Zustände (Sound, Musik, Pfeilsteuerung, Orientierungskreis) im `localStorage` für Persistenz.
* **Camera-Button**:
  * Text entfernen und nur noch Emojis (`🎥` für Follow, `🌐` für Orbit) anzeigen.
  * Umschalten der CSS-Klasse `.active` auf dem Button für die visuelle Kennzeichnung.

## Verification Plan

### Manual Verification
1. Öffnen der App auf Android.
2. **Kamera-Button**: Prüfen, ob der Button ohne Text umschaltet (`🎥` / `🌐`) und bei `🌐` grün hinterlegt ist.
3. **Einstellungen (Zahnrad)**:
   * Prüfen, ob wiederholter Klick auf das Zahnrad das Menü schließt.
   * Prüfen, ob die AN/AUS-Buttons keine Emojis mehr enthalten.
   * **Pfeilsteuerung ausblenden**: D-Pad sollte sofort verschwinden; beim Anschalten wieder erscheinen.
   * **Orientierungskreis ausblenden**: Der Kompass/Minimap oben rechts im Querformat sollte verschwinden; beim Anschalten wieder erscheinen.
4. **Verschiebungstest**:
   * Editor einklappen: D-Pad und Sensor-Ausgabe gleiten sanft nach unten (bleiben über der eingeklappten Leiste).
   * Editor ausziehen (Mode B): D-Pad und Sensor-Ausgabe gleiten sanft nach oben über das Editorfenster und bleiben bedienbar.
