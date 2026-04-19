# RoboQuest 3D — Robotics Simulator (v22 Robotics Refocus)

Ein authentischer 3D-Robotik-Simulator für Bildungszwecke. Der Fokus liegt auf der Programmierung von Sensoren, Logistik-Algorithmen und autonomer Pfadfindung. Die visuelle Blockly-Programmierung ist vollständig bidirektional mit dem Python-Editor synchronisiert.

## 🤖 Real-Life Robotik Fokus (v22 Update)

### 📦 Logistik- & Greifarm-Mechanik
- **Physisches Greifen**: Der Roboter sammelt Objekte nicht mehr durch bloßes Drüberfahren. Er muss mit `eco_bot.gripper("CLOSE")` gezielt zugreifen.
- **Cargo-Management**: Aufgenommener Schrott oder Datenchips werden physisch am Chassis befestigt. Der aktuelle Ladestatus wird im HUD (📦 Cargo) angezeigt.
- **Recycling-Hub**: Items müssen zur Basis (Recycling-Hub) transportiert und dort mit `OPEN` entladen werden, um Missionspunkte zu erhalten.

### 🧱 Fels-Labyrinth & Pfadfindung
- **Start-Herausforderung**: Der Roboter startet in einem dichten Labyrinth aus unzerstörbaren Felsbrocken.
- **Sensor-Pflicht**: Um zu entkommen, müssen Spieler den Ultraschall-Sensor (`ultrasonic()`) und LiDAR-Scan (`scan()`) nutzen, um Hindernisse autonom zu umfahren.
- **Minecraft-Features entfernt**: Terraform-Befehle (build/dig) wurden entfernt, um den Fokus zu 100% auf industrielle Robotik zu legen.

### 🔄 Bidirektionaler Python-Sync
- **🧩 ↔ 🐍 Live-Synchronisation**: Änderungen an den Blockly-Blöcken erscheinen sofort als Python-Code. Ebenso wird Python-Code (bei korrekter API-Nutzung) zurück in Blöcke übersetzt.
- **IntelliSense & Hover**: Der Code-Editor bietet nun Autovervollständigung mit Dokumentation und Hover-Tooltips inklusive Code-Beispielen für alle `eco_bot.*` Befehle.

## 🔋 Energie- & Ressourcen-Management

| Situation | Ladung | Verbrauch | Netto |
|---|---|---|---|
| Recycling-Hub 🏠 | +20.0/s | 0 | **+20.0/s** 🚀 |
| Fahren in Sonne ☀️ | +6.0/s | -8.0/s | **-2.0/s** ⬇️ |
| Fahren im Schatten ☁️ | +0.5/s | -8.0/s | **-7.5/s** ⚠️ |

## 📖 Story-Missions (Robotik-Spezifisch)

- **Akt 1: Logistik-Einheit**: Finde 3 Schrottteile im Wald und liefere sie sicher im Recycling-Center ab.
- **Akt 2: Das Felsen-Labyrinth**: Nutze Ultraschall-Sensoren, um einen Weg aus dem engen Fels-Irrgarten zu finden.
- **Akt 3: Autonomer Sammler**: Programmiere eine Routine, die Datenchips im unwegsamen Gelände aufspürt und recycelt.

## 🗺️ Interface & Navigation
- **HUD (Glassmorphism)**: Echtzeit-Anzeige für Score, Quest-Fortschritt, Karten-Erkundung (Fog of War) und Cargo-Status.
- **IDE-Tabs**: Nahtloser Wechsel zwischen visueller (🧩) und textbasierter (🐍) Programmierung.

## 🔧 Installation & Betrieb

1. Terminal im Verzeichnis `/roboquest` öffnen.
2. Lokalen Server starten: `python3 -m http.server 8080`.
3. Im Browser öffnen: `http://localhost:8080`

## 💡 Technische Architektur
- **Core**: Three.js (WebGL), Skulpt (Python Interpreter), Ace Editor.
- **Sync**: Custom Regex-Parser für Python-to-Blockly Übersetzung.
- **Aesthetics**: Glassmorphism UI, atmosphärische Glühwürmchen, reaktive Partikel-Effekte für alle Roboter-Aktionen.

---
*Entwickelt für pädagogische Anwendungen in der Informatik. v22 Robotics Refocus — April 2026.*
