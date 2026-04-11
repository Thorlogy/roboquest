# RoboQuest 3D — Forest Expedition (v16 Story Edition)

Ein interaktives 3D-Lernspiel für Kinder. Der Eco-Bot erkundet einen kranken Wald, sammelt Proben und löst Missionen. Die Programmierung erfolgt visuell über Google Blockly mit Fokus auf Code-Effizienz und Sensor-Logik.

## 🚀 Neue Features (v16 Update)

### ⚙️ Motor-Dauerlauf & Autonomie
- **Motor Start/Stopp Blöcke**: Der Eco-Bot kann nun ohne feste Zeitvorgabe fahren. Dies ermöglicht komplexere, reaktive Verhaltensweisen.
- **Echtzeit-Sensorik (60Hz)**: Der "Warte bis"-Block wurde von zeitbasierten Ticks auf Frame-basierte Echtzeit-Überprüfung umgestellt. Der Roboter stoppt nun verzögerungsfrei vor Hindernissen.
- **Präzise Logik-Echtzeit-Analyse**: Der Interpreter unterstützt nun alle Standard-Blockly-Zahlentypen und führt Vergleiche (Abstand < X) in Mikrosekunden-Geschwindigkeit aus.

### 📖 Story-Quests (Akt 1-3)
- **Akt 1: Der kranke Wald**: Sammle Müll und finde die alte Hütte. (Fog: Off)
- **Akt 2: Die Schatzsuche**: Finde Datenchips und den versteckten See. (Fog: On - Missions-spezifisch!)
- **Akt 3: Der Waldgeist**: Erreiche den Eulenbaum.
- **Missions-Fog**: Der Nebel ist nun kein globales Feature mehr, sondern wird gezielt pro Akt aktiviert.

### 🗺️ Navigation & HUD
- **Mini-Map (Top-Right)**: Echtzeit-2D-Karte mit Anzeige von Roboter, Hindernissen und entdeckten Objekten.
- **Live Sensor-HUD**: Kontinuierliche Anzeige von Distanz, Licht, Rotation und Objekterkennung.
- **Sammel-Items**: 4 Typen (Müll, Samen, Datenchips, Schlüssel) mit Sound-Feedback und UI-Zähler.

### 💻 Live-Code Preview (Python)
- **Echtzeit Code-Vorschau**: Die blockbasierten Skripte werden nun dynamisch als lesbarer (Python-ähnlicher) Code in einem dedizierten Panel dargestellt. Dies erleichtert den Übergang zur textbasierten Programmierung.
- **Custom Generator**: Ein spezieller Blockly-Generator wandelt Bewegungs-, Sensor- und Logikblöcke sofort in Code-Text um, mit Syntax-Highlighting im Glassmorphism-Design.

### 📊 Code-Analyse & Upgrades
- **Effizienz-Check**: Nach dem Run bewertet das System die Anzahl der genutzten Blöcke mit **1 bis 3 Sternen**.
- **Block-Statistik**: Alle neuen Motor- und Logik-Blöcke werden in die finale Effizienz-Bewertung einbezogen.
- **Visuelle Upgrades**: Der Eco-Bot erhält Module (Kühlrippen, CPU-Kern) direkt am 3D-Modell, sobald Meilensteine erreicht werden.

### ✨ Welt-Details (Aesthetics)
- **Flora**: Hunderte bunte Blumen und Pilze (randomisiert generiert).
- **FX**: Leuchtende Glühwürmchen in Geheimzonen und Staubwolken hinter den Ketten beim Fahren.

## 🔧 Installation & Betrieb

1. Terminal im Verzeichnis `/roboquest` öffnen.
2. Lokalen Server starten: `python3 -m http.server 8080` (Standardport).
3. Im Browser öffnen: `http://localhost:8080`

## 💡 Technische Architektur

### Stack
- **Engine**: Three.js (WebGL)
- **Logik**: Vanilla JavaScript (ES6)
- **IDE**: Google Blockly (Custom Blocks)
- **UI**: HTML5 / CSS3 (Glassmorphism Design)

### Speicher-System
- Alle Quest-Fortschritte, Item-Zähler und freigeschaltete Features werden im `storyState`-Objekt verwaltet.
- Der Blockly-Workspace wird automatisch im `localStorage` gesichert.

---
*Entwickelt für pädagogische Anwendungen in der Robotik. v16 Checkpoint - April 2026.*
