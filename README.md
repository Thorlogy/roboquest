# RoboQuest 3D — Solarpunk & Robotik Simulator (v23 Release)

Ein interaktiver, webbasierter 3D-Robotik-Simulator mit starkem Fokus auf **Pädagogik, Storytelling und Open-Source-Architektur**. Spieler steuern einen kleinen "Eco-Bot" durch eine Solarpunk-Welt, programmieren ihn per Blockly oder Python und reparieren die Natur.

## 🌍 Solarpunk-Welt & Story (Akt 4)
- **Umwelt-Reparatur**: Finde und repariere defekte Windräder via LiDAR-Scan (`mod.scan()`), um erneuerbare Energien in der "Solarpunk-City" zu aktivieren.
- **Lebendige Natur**: Wilde Tiere (Füchse) durchstreifen den Wald und reagieren dynamisch (Fluchtverhalten) auf die Annäherung des Roboters.
- **Recycling-Hub**: Die Basisstation erstrahlt nun als futuristischer, leuchtender Solarpunk-Ring.

## 📖 Interaktives Handbuch (Codex)
- **Onboarding**: Beim allerersten Start des Spiels öffnet sich automatisch das Handbuch, um neue Spieler in die Story und Steuerung einzuführen.
- **Wissens-Datenbank**: Das UI-Overlay (Glassmorphism) enthält 4 Tabs: Geschichte, Steuerung, Blockly-Tutorials und eine detaillierte Python-API-Referenz.

## 📱 Mobile Optimierung (Responsive Design)
- **Vollbild-IDE**: Das Programmier-Fenster nimmt auf Smartphones automatisch 100% des Platzes ein, für perfekte Touch-Bedienbarkeit.
- **Kompaktes UI**: Das Handbuch ordnet seine Tabs auf kleinen Bildschirmen vertikal/horizontal platzsparend an, und störende HUD-Elemente (Minimap) werden ausgeblendet.
- **Touch-Steuerung**: Voller Support über das digitale On-Screen-Steuerkreuz (D-Pad).

## 🧩 Bidirektionaler Python-Sync
- **Live-Synchronisation**: Änderungen an den Blockly-Blöcken erscheinen sofort als Python-Code. Python-Code wird (bei korrekter API-Nutzung) zurück in Blöcke übersetzt.
- **Ace Editor**: Professioneller Code-Editor mit IntelliSense und Syntax-Highlighting.

## 💡 Technische Architektur (Modularisiert)
- **Core**: Three.js (WebGL), Skulpt (Python Interpreter im Browser).
- **ES6-ready via Global Namespace**: Die ehemalige monolithische 2.900-Zeilen-Datei wurde für Open-Source-Beiträge in logische Komponenten aufgeteilt:
  - `config.js` (Story & Konstanten)
  - `ui.js` (DOM & Handbuch)
  - `pythonBridge.js` (Skulpt Interpreter)
  - `engine.js` (Game Loop & Three.js 3D-Welt)
- **Serverless**: Läuft zu 100% im Browser (via GitHub Pages). Es ist kein Backend oder Docker-Container zur Code-Ausführung nötig.

## 🔧 Installation & Betrieb
1. Repository klonen.
2. Lokalen Webserver starten (z.B. `python3 -m http.server 8080`).
3. Im Browser öffnen: `http://localhost:8080` (Oder direkt über GitHub Pages nutzen).

---
*Entwickelt für pädagogische Anwendungen in der Informatik. Solarpunk Release — April 2026.*
