# RoboQuest 3D - Forest Expedition

Ein interaktives 3D-Lernspiel für Kinder, bei dem ein Eco-Bot durch einen Wald gesteuert wird. Die Programmierung erfolgt visuell über Google Blockly mit einer **Flyout-Sidebar** und einem echten **AST-Interpreter** für Echtzeit-Ausführung.

## 🚀 Features

### 3D-Umgebung
- Realistische Waldumgebung mit Hügeln, Tälern, Seen und dynamischem Terrain
- Eco-Bot v4 mit Kettenantrieb, Solarpanel und reaktiver Neigungsphysik (Pitch & Roll)
- Level-Progression (6 Level: Ebene → See → Canyon → Sammel-Quest → Slalom → Höhle)
- Infinite-World-Illusion mit 450×450 Map und Horizon-Nebel

### Blockly IDE
- **Flyout-Sidebar**: 6 farbige Kategorie-Buttons am linken Rand steuern direkt den Block-Flyout
- **18 benutzerdefinierte Blöcke** in 6 Kategorien
- **Zelos-Renderer** für kindgerechte, abgerundete Block-Optik
- Kompakte Darstellung (Skalierung 0.65)
- Automatische Speicherung des Workspace in `localStorage`

### Programmier-Kategorien & Blöcke

| Sidebar | Kategorie | Blöcke |
|---------|-----------|--------|
| 🚗 Grün | **Bewegung** | Fahre vorwärts/rückwärts, Drehe links/rechts |
| 🔁 Orange | **Schleifen** | Wiederhole N mal, Wiederhole solange... |
| ⑂ Blau | **Logik** | WENN/DANN/SONST, Vergleiche (<, >, =), NICHT, Zahlenwert |
| ⏳ Gelb | **Warten** | Warte N Sekunden, Warte bis Sensor-Bedingung |
| 🤖 Lila | **Aktionen** | Greifer öffnen/schließen, Schieben, Scanne Umgebung |
| 📡 Teal | **Sensoren** | Berührung, Ultraschall, Kamera, Licht, Drehsensor, Neigungssensor, Hindernis |

### Sensor-Simulation
- **Ultraschall**: Echte Distanzmessung via Three.js Raycasting
- **Kamera**: Erkennt Objekte (Batterien, Ziele, Felsen, Bäume) im Umkreis
- **Licht**: Helligkeitswert basierend auf Umgebung (Wald vs. offener Pfad)
- **Rotation/Tilt**: Physikalische Werte des Roboters aus der 3D-Engine
- **Berührung**: Kollisionserkennung

## 📁 Projektstruktur

```
roboquest/
├── index.html              # Einstiegspunkt (v14)
├── css/
│   └── style.css           # UI-Design mit Glassmorphism, Sidebar-Farben
├── js/
│   ├── app.js              # 3D-Engine, Physik, Welt-Generation, AST-Interpreter
│   ├── blockly_setup.js    # Block-Definitionen, Flyout-Toolbox, Kategorie-Verwaltung
│   └── archive/            # Veraltete 2D/2.5D Prototypen
└── backups/
    └── v4_stable/          # Snapshot der stabilen v4 (vor Blockly-Erweiterung)
```

## 🔧 Installation & Betrieb

1. Terminal im Verzeichnis `/roboquest` öffnen.
2. Lokalen Server starten:
   ```bash
   python3 -m http.server 8000
   ```
3. Im Browser öffnen: `http://localhost:8000`

> **Hinweis**: Alternativ kann die `index.html` direkt im Browser geöffnet werden (`file://`-Protokoll).

## 💡 Technische Architektur

### AST-Interpreter
Der stapelbasierte Interpreter (`rStack` / `rStep()`) wertet jeden Blockly-Block zur Laufzeit aus:
- Unendliche Schleifen mit Sensor-Bedingungen
- Bedingte Anweisungen (IF/ELSE) mit Raycasts in die 3D-Szene
- Rekursive `evaluateSensorBlock()`-Funktion für verschachtelte Logik-Ausdrücke
- Unterbrechbare Ausführung durch den Benutzer

### Sidebar → Flyout-System
Statt einer internen Blockly-Kategorie-Liste werden die Blöcke über externe Sidebar-Buttons gesteuert:
1. Klick auf farbigen Button → IDE öffnet sich + Flyout zeigt passende Blöcke
2. Klick auf anderen Button → Flyout-Inhalt wird via `updateToolbox()` gewechselt
3. Erneuter Klick auf aktiven Button → IDE schließt sich

### Versionierung
- **v14**: Cache-Busting-Version für CSS/JS-Dateien
- **Git**: Lokales Repository mit Initial-Commit `v1.4`

---
*Entwickelt für pädagogische Anwendungen in der Robotik.*
