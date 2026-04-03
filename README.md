# RoboQuest 3D - Forest Expedition

Ein interaktives 3D-Lernspiel für Kinder, bei dem ein Eco-Bot durch einen sich entwickelnden Wald gesteuert wird. Die Programmierung erfolgt visuell über Google Blockly und nutzt eine echte **AST-Interpreter-Engine** für logische Entscheidungsfindungen in Echtzeit.

## 🚀 Features

- **3D-Simulation**: Realistische Waldumgebung mit Hügeln, Tälern, Seen und einem dynamischen Terrain-System.
- **Eco-Bot v4**: Detailreicher Roboter mit Kettenantrieb, Solarpanel und reaktiver Neigungsphysik (Pitch & Roll).
- **Blockly IDE**: Visuelle Programmierung mit Fokus auf Robotik-Grundlagen.
- **Intelligente Sensoren**: Echtzeit-Raycasting zur Hinderniserkennung ("Hindernis voraus?").
- **Level-Progression**: Die Welt entwickelt sich mit dem Fortschritt (Level 1: Ebene -> Level 2: See -> Level 3: Canyon -> Level 4: Sammel-Quest -> Level 5: Wald-Slalom -> Level 6: Höhlen-Erkundung).
- **Sammel-System**: Mechanik zum Einsammeln von Items (Energiezellen) in der 3D-Welt.
- **Modernes IDE-Layout**: Überarbeitetes, (halb-)transparentes Code-Fenster mit Fenster-Header und verbesserter Skalierung (Glassmorphism).
- **Infinite World Illusion**: Große 450x450 Map mit atmosphärischem Horizon-Nebel und Weltgrenzen-Warnung.

## 📁 Projektstruktur

- `/index.html`: Der Einstiegspunkt der Anwendung.
- `/css/style.css`: Modernes UI-Design mit Glassmorphism-Effekten und Responsive Layout.
- `/js/app.js`: Die 3D-Engine (Three.js), Physik-Loop, Welt-Generation und der **AST-Interpreter**.
- `/js/blockly_setup.js`: Konfiguration der benutzerdefinierten Blockly-Blöcke und Toolbox-Logik.
- `/js/archive/`: Veraltete 2D/2.5D Prototypen.
- `/backups/`: Snapshots stabiler Versionen.

## 🔧 Installation & Betrieb

1. Öffne ein Terminal im Verzeichnis `/roboquest`.
2. Starte einen lokalen Server (z. B. Python):
   ```bash
   python3 -m http.server 8000
   ```
3. Öffne im Browser: `http://localhost:8000`

## 💡 Technische Details (AST-Interpreter)

Im Gegensatz zu statischen Compilern nutzt RoboQuest einen stapelbasierten Interpreter (`rStack`). Jeder Blockly-Block wird zur Laufzeit ausgewertet. Dies ermöglicht komplexe Logiken wie:
- Unendliche Schleifen, die auf Sensoren reagieren.
- Bedingte Anweisungen (IF/ELSE), die Laser-Raycasts in die 3D-Szene feuern.
- Unterbrechbare Ausführung durch den Benutzer.

---
*Entwickelt für pädagogische Anwendungen in der Robotik.*
