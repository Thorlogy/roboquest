# RoboQuest – Konzept- und Umsetzungsdokument

Zweck dieses Dokuments: Vollständiges Konzept für die Lern-App RoboQuest, aufbereitet zur Umsetzung durch eine KI. Es beschreibt Story, Spielstruktur, Lerninhalte, UX/UI und das Hilfesystem. Technische Constraints sind markiert. Wo Inhalte noch nicht final ausgearbeitet sind, steht [SKIZZE].

## 0. Kurzüberblick (TL;DR für die umsetzende KI)
**Was ist RoboQuest?**
Ein Smartphone-Lernspiel, in dem Kinder (9–12 J.) einen Roboter namens ROBO durch eine 3D-Welt steuern und blockbasiert programmieren. Über 5 Welten lernen sie Programmier-Grundlagen, Robotik, KI-Prinzipien und Umweltbewusstsein. Das ästhetische und thematische Zielbild ist Solarpunk: eine hoffnungsvolle, grüne Zukunft, die das Kind durch ROBO aktiv aufblühen lässt.

**Technischer Stand & Constraints:**
- Lauffähiger Prototyp existiert bereits, basiert auf Three.js (Browser/JavaScript).
- Smartphone-first, Hochformat, Touch, oft einhändig bedient.
- Empfehlung Block-Editor: Blockly (Google) oder vergleichbar – generiert JS, das die bestehenden ROBO-Funktionen ansteuert.
- Fortschritt wird lokal gespeichert (localStorage/IndexedDB), komplett offline-fähig. Cloud-Sync ist explizit KEIN MVP-Feature.
- Low-Poly-Ästhetik ist Pflicht (Performance auf Schul-/Smartphone-Hardware).

**MVP-Korridor:**
Welt 1 wird vollständig spezifiziert und gebaut. Welten 2–5 sind als Vision beschrieben (Richtung, nicht jedes Detail). Die KI soll Welt 1 fertig bauen und die Architektur so anlegen, dass Welten 2–5 problemlos andocken.

## 1. Story & Thema
### 1.1 Das Zielbild: Solarpunk
Kein Kampf gegen eine Dystopie, sondern der Aufbau einer hoffnungsvollen, grünen Zukunft. Technik und Natur im Einklang. Das Kind erlebt: Mit Wissen und cleverer Technik kann man die Welt heilen.

### 1.2 Die Geschichte
Die Welt ist von Müll und Verschmutzung überwältigt. In einer alten Werkstatt findet das Kind ROBO – einen vergessenen Reinigungsroboter, halb kaputt. Professorin Ada (Hologramm, benannt nach Ada Lovelace) hilft dem Kind, ROBO Stück für Stück zu reparieren und ihm beizubringen, die Welt zu retten. Jede gesäuberte Welt blüht sichtbar wieder auf. Am Ende ist ROBO klug genug, selbst zu denken – und kann die Mission autonom fortsetzen.

**Der entscheidende erzählerische Kniff:**
Nicht das Kind rettet die Welt – ROBO tut es. Das Kind macht ROBO dazu fähig. Das Kind ist Schöpfer/Lehrer, nicht Spielfigur. Das ist emotional stärker und verbindet direkt mit dem Lernziel KI ("Ich habe ROBO schlau gemacht").

### 1.3 Das übergeordnete Ziel: KI
Der Spannungsbogen führt über 5 Welten zur KI: ROBO entwickelt sich vom stummen, kaputten Gerät zur autonom denkenden Maschine. Wichtig (Realismus-Constraint): Die "KI" in Welt 4/5 ist eine nachvollziehbare Simulation des Prinzips (überwachtes Lernen via Beispiele → Klassifikation, z.B. visueller Entscheidungsbaum). Kein echtes neuronales Netz-Training im Browser. Es vermittelt das echte Prinzip ehrlich vereinfacht.

### 1.4 Wie die Story vermittelt wird
- Zeigen statt erzählen: Die Welt wird mit jedem Erfolg sichtbar grüner. Das erzählt die Story ohne Worte.
- Kurze Momente: Ada sagt einen Satz, dann passiert etwas. Cutscenes max. 15 Sekunden.
- ROBOs Wandel ist die Story: Von "piep" zu ganzen Sätzen über die 5 Welten.
- Optionale Lore-Fragmente beim freien Erkunden für neugierige Kinder – nie aufgezwungen.

## 2. Charaktere
| Figur | Rolle | Funktion |
| :--- | :--- | :--- |
| **ROBO** | Hauptcharakter, der Roboter | Emotionale Bindung. Entwickelt sich mit dem Kind: anfangs kaputt/stumm, am Ende sprechend & denkend. Reagiert auf Code (freut sich / Fragezeichen). Customization als Belohnung. |
| **Professorin Ada** | Mentorin (Hologramm) | Gibt Missionen, erklärt neue Sensoren/Blöcke, stellt Verständnisfragen, gibt gestufte Hilfe. |

Arbeitsteilung: ROBO ist der Freund, Ada ist die Lehrerin.

## 3. Lernprogression: Welten, Blöcke, Sensoren
### 3.1 Die 5 Welten (je 5–7 Missionen + 1 Bonus + freies Erkunden)
| Welt | Hauptkonzept (NUR eins pro Welt!) | Umgebung | ROBO-Zustand |
| :--- | :--- | :--- | :--- |
| 1 | Grundbewegung + erster Sensor | Verlassene Werkstatt/Fabrik | Kaputt, piepst nur |
| 2 | Schleifen | Verschmutzter Stadtpark | Erste Worte |
| 3 | Bedingungen (If/Else) + Variablen | Überflutete Küste | Kurze Sätze |
| 4 | Funktionen + KI-Grundlagen | Zerstörter Wald | Spricht klarer, "denkt" mit |
| 5 | KI trainieren + Autonomie | Globale Schaltzentrale | Autonom, ganze Sätze |

Prinzip (Portal-Lektion): Pro Welt nur EIN neues Hauptkonzept, dafür aus vielen Winkeln geübt.

### 3.2 Block-Freischaltung (kumulativ)
- **Welt 1:** [Vor] [Zurück] [Links] [Rechts] [Greifer auf/zu]
- **Welt 2:** + [Wiederhole X mal] [Warte]
- **Welt 3:** + [Wenn…dann] [Sonst] [Variable setzen/lesen]
- **Welt 4:** + [Funktion definieren] [Funktion aufrufen] + [KI: Zeige Beispiel] [KI: Erkenne]
- **Welt 5:** + [Ziel setzen] [Autonomer Modus] [Wenn KI sagt…]

Farbkodierung: Bewegung = blau · Sensoren = gelb · Logik = orange · KI = lila.

### 3.3 Sensor-Freischaltung & Vorstellung
Jeder neue Sensor bekommt einen Reveal-Moment (Minecraft-Crafting-Prinzip):
- Kurze Animation: Was "sieht" der Sensor? (visuell in ROBOs Wahrnehmung)
- Realer Bezug: "Genau so findet ein Staubsaugerroboter die Wand." / Mars-Rover / Tesla.
- Sofort ausprobieren: 30-Sekunden-Spielwiese nur mit diesem Sensor, vor der Mission.

| Erste Nutzung | Sensor | Funktion | Lernkonzept |
| :--- | :--- | :--- | :--- |
| Welt 1 | Distanzsensor | Hindernisse/Abstand messen | Messen & Reagieren |
| Welt 2 | Farbsensor | Objekte unterscheiden | Klassifikation |
| Welt 3 | Feuchtigkeitssensor | Boden analysieren | Umweltdaten |
| Welt 3 | Temperatursensor | Gefahrenzonen meiden | Schwellenwerte |
| Welt 4 | Kamera (simpel) | Muster erkennen | Grundlage KI |
| Welt 5 | GPS/Positionsmodul | Routen planen | Autonomie |

Sensordaten sichtbar machen (didaktischer Kern): Live-Daten wie "Distanz: 255cm" werden zusätzlich in der 3D-Welt visualisiert (z.B. Kegel/Strahl vor ROBO, der bei Nähe rot wird). Kinder verstehen so körperlich, was ein Sensor "sieht".

## 4. Missionsdesign
### 4.1 Länge & Rhythmus
Eine Mission = 5–10 Minuten. Immer derselbe Ablauf (verlässliche Struktur, überraschender Inhalt):
Problem zeigen (30 Sek) → Erkunden (1 Min) → Bauen (3 Min) → Zusehen (1 Min) → Verstehen (30 Sek) → Belohnung (Sammeln)

### 4.2 Aufbau-Prinzip ("Treppe")
Jede Mission baut auf der vorigen auf und fügt genau eine neue Sache hinzu:
- Mission 1: Fahre vor               → Bewegung
- Mission 2: + drehe ab              → nutzt M1 + Drehung
- Mission 3: + weiche aus            → nutzt M1+M2 + Sensor
- Mission 4: + wiederhole            → nutzt alles + Schleife
- Mission 5 (Meisterprüfung): alles kombinieren, KEINE neuen Werkzeuge

Die letzte Mission jeder Welt = Meisterprüfung: alles Gelernte clever kombinieren → Kompetenzgefühl.

### 4.3 Belohnung: 3 Stufen statt Versagen
- **Bronze:** Mission gelöst, egal wie.
- **Silber:** Mit weniger Blöcken als ein Limit (Effizienz → echtes Programmierdenken).
- **Gold:** Plus optionale Knobel-Bonusaufgabe.

So bleiben schnelle Kinder gefordert, langsame fühlen sich nie schlecht.

### 4.4 Verständnis verankern
Nach gelöster Mission fragt ROBO/Ada kurz: "Warum hat das funktioniert?" mit 2–3 Antwortoptionen (Retrieval Practice). Kurz, spielerisch, kein Quiz-Gefühl.

### 4.5 Beispielwelt: WELT 1 vollständig [SKIZZE – von KI auszudetaillieren]
| # | Titel | Problem | Neu | Lernziel |
| :--- | :--- | :--- | :--- | :--- |
| 1 | "Erste Schritte" | ROBO soll von A nach B fahren | [Vor] | Bewegung, ein Block |
| 2 | "Um die Ecke" | Ein Hindernis blockiert den Weg | [Links]/[Rechts] | Drehung kombinieren |
| 3 | "Sammle 3 Schrotteile" | 3 Teile einsammeln (vgl. Screenshot) | [Greifer] | Werkzeug nutzen |
| 4 | "Im Dunkeln" | Weg im Dunkeln finden | Distanzsensor | Sensor lesen & reagieren |
| 5 | "Meisterprüfung Werkstatt" | Alles zusammen: Weg + Hindernis + Sammeln | – | Kombination |

### 4.6 Beispiel-Missionen Welten 2–5 [SKIZZE]
- **Welt 2 (Schleifen):** "Sammle alle 10 Flaschen" (repeat 10) · "Fahre bis zur Mülltonne" (while Distanz > 50cm) · "Sortiere Müll nach Farbe" (Farbsensor + Schleife).
- **Welt 3 (If/Else, Variablen):** "Überquere Wasser nur auf sicheren Feldern" · "Miss Wasserstand an 5 Stationen" (Variablen) · "Rette nur gesunde Tiere" (UND/ODER).
- **Welt 4 (Funktionen, KI):** "Erkenne Baumkrankheiten" · "Lerne aus Beispielen: krank vs. gesund" (KI-Training visuell) · "Modell wird getestet" (Genauigkeit als Score).
- **Welt 5 (Autonomie):** "Plane autonome Reinigungsroute" · "ROBO bekommt freien Willen, du gibst nur Ziele" · "Finales Projekt: ROBOs KI vollständig programmieren".

## 5. Designprinzipien (Leitsätze für JEDE Entscheidung)
1. **Die Welt spricht, nicht die Zahlen.** Fortschritt zeigt sich sichtbar (Pflanzen wachsen, Tiere kehren zurück, Licht wird wärmer). Zahlen sind Beiwerk.
2. **Eine Daumen-Reichweite.** Smartphone, Hochformat, einhändig. Wichtige Aktionen im unteren Drittel.
3. **Immer nur eine neue Sache.** Nie zwei neue Konzepte gleichzeitig (Mission, Sensor, Block oder UI).
4. **Zeigen, antippen, verstehen – nie nur lesen.** Jede Erklärung wird zur Handlung. Max. 1–2 Sätze pro Moment.
5. **Scheitern ist Information, nie Strafe.** Kein Game-Over, kein Punkteverlust. ROBO gegen die Wand = Hinweis, nicht Versagen.
6. **Verlässliche Struktur, überraschender Inhalt.** Gleicher Ablauf (Sicherheit), frisches Innenleben.

Nutzen für die KI: Diese Prinzipien lösen Detailfragen automatisch. (Großer Punktezähler oben? Prinzip 1 = nein. Alle Blöcke von Anfang an? Prinzip 3 = nein.)

## 6. Informationsarchitektur (Bildschirm-Landkarte)
        [Start / Weltansicht]
                 │
                 ▼
         [Weltkarte / Hub]  ◄──────┐
          │      │      │          │
          ▼      ▼      ▼          │
     [Mission][Erkunden][Sammlung] │
          │                        │
          ▼                        │
   [Missions-Ansicht]              │
    (3D-Welt + Editor)             │
          │                        │
          ▼                        │
     [Belohnung] ──────────────────┘

**7 Kernbildschirme:**
1. **Start / Weltansicht** – Erstes beim Öffnen. 3D-Welt im aktuellen (grünen) Zustand, ROBO winkt, EIN Button "Weiter". Die Welt selbst zeigt sofort den Fortschritt.
2. **Weltkarte / Hub** – Herzstück. Missionen als Stationen auf einem Pfad (Mario/Candy-Crush-Prinzip): erledigt (grün+Sterne), nächste (leuchtet), gesperrt (ausgegraut). Heimathafen – immer leicht erreichbar.
3. **Missions-Auswahl** (Teil der Karte) – Vorschau: Problem + neues Werkzeug + "Los". Nur Missionen bis zum eigenen Spielstand wählbar.
4. **Missions-Ansicht** – Das Spiel (3D + Editor). Siehe Abschnitt 7.
5. **Freies Erkunden** – Gleiche Welt ohne Aufgabe. Pfeiltasten-Steuerung, alle freigeschalteten Sensoren live, Lore-Fragmente. Kein Versagen möglich (sicherer Spielplatz).
6. **Sammlung ("Pokédex")** – Vitrine: freigeschaltete Sensoren, Blöcke, Customization. Jeder Sensor mit Erklärung. Weckt Sammeldrang ("3 von 8").
7. **Belohnung** – Sterne, gefeierte Freischaltung, Blick auf die grünere Welt, ROBO entwickelt sich minimal weiter.

Bewusst NICHT vorhanden: Einstellungs-Wust, Shop, Werbung, tiefe Menü-Ebenen. Radikal schlank.

## 7. Wireframes der Missions-Ansicht (wichtigster Bildschirm)
### 7.1 Kernproblem
3D-Welt und Code-Editor brauchen beide Platz auf kleinem Hochformat-Screen. Lösung: nicht teilen, sondern zwischen zwei Modi wechseln (sanfte Animation).

### 7.2 Modus A – "Schauen" (3D dominiert ~65%)
┌─────────────────────────┐
│ ⭐0  AKT1  🔋100%  [≡]  │  schlanke Statusleiste
├─────────────────────────┤
│      3D-WELT            │
│      (ROBO groß)        │
│   📏 Distanz: 255cm     │  Sensor-Ausgabe schwebt
├─────────────────────────┤
│  [▶ Programm starten]   │  großer Daumen-Button
│  ┌───────────────────┐  │
│  │ Dein Code (klein) │  │  antippbare Vorschau
│  └───────────────────┘  │
└─────────────────────────┘

### 7.3 Modus B – "Bauen" (Editor dominiert, 3D ~25%)
┌─────────────────────────┐
│  3D-Welt (geschrumpft)  │  ROBO bleibt sichtbar!
├─────────────────────────┤
│   CODE-BEREICH          │
│   [Vor]                 │
│   [Wiederhole 3x]       │
│     [Vor]               │  eingerückter Innenraum
│     [Greif]             │
├─────────────────────────┤
│ [Vor][Dreh][Greif][🔁]  │  Block-Palette, scrollbar
├─────────────────────────┤
│       [▶ Start]         │
└─────────────────────────┘
Regeln:
- ROBO ist immer sichtbar, auch beim Bauen (emotionale Bindung, Prinzip 1).
- Alles Wichtige unten in Daumenreichweite (Prinzip 2).
- Tipp auf Code-Vorschau → Modus B; Tipp auf "Start"/kleine Welt → Modus A.

## 8. Block-Editor-Verhalten (kritisch!)
### 8.1 Eingabe: Tippen, NICHT Drag & Drop
Blöcke werden angetippt (leicht für Kinderhände auf kleinem Touch-Screen), nicht gezogen.

### 8.2 Aber: Struktur bleibt Entscheidung des Kindes
Wichtigster didaktischer Punkt: Die App darf Blöcke NICHT automatisch "richtig" einsortieren – sonst lernt das Kind nichts über Verschachtelung. Lösung: aktive Einfügemarke (blinkender Cursor wie im Texteditor).

┌─────────────────────────┐
│   [Wiederhole 3x]       │
│   ┌─────────────────┐   │  Schleife öffnet
│   │  [Vor]          │   │  sichtbaren Innenraum
│   │  ▏ ← Marke hier │   │
│   └─────────────────┘   │  Innenraum endet
│   ▏                     │  oder Marke hier (danach)
└─────────────────────────┘

- Neuer Block erscheint dort, wo die Marke blinkt – nicht automatisch "richtig".
- Marke per Antippen verschiebbar: in die Schleife hinein oder dahinter.
- Schleifen-Innenraum körperlich sichtbar (eingerückt, umrahmt, leicht eingefärbt): "drinnen" vs. "draußen" räumlich klar.
- Das Kind entscheidet bewusst "drinnen oder danach?" – genau das ist das Lernen.

### 8.3 Helfer, der nicht schummelt
Landet ein Block an einer technisch unmöglichen Stelle → sanfter Hinweis ("Hier kann der nicht stehen"). Bei der inhaltlichen Frage (drinnen/draußen) hält die App sich raus – das ist die Lernentscheidung. Unterschied: technischen Unsinn verhindern, produktive Denkfehler zulassen.

### 8.4 Vorbild-Apps
ScratchJr (Tippen, Kind bestimmt Reihenfolge) und Lightbot (sichtbare eingerückte Prozedur-Boxen). Beide vermeiden automatisches Richtig-Einsortieren.

## 9. User Flows
### 9.1 Wiedereinstieg (häufigster Moment, max. wenige Tipps)
App öffnen → Weltansicht (grüne Welt, ROBO winkt, "Weiter")
→ Hub (nächste Mission leuchtet) → Vorschau → "Los" → Missions-Ansicht
Die leuchtende Station zieht den Blick automatisch – kein Suchen.

### 9.2 Mission spielen (Herzstück)
Ada sagt EINEN Satz zum Problem
→ [bei neuem Sensor/Block: Vorstellung + 30-Sek-Spielwiese]
→ Erkundungsphase (frei fahren, Lage verstehen)
→ Bauphase (Blöcke tippen)
→ "Start" → ROBO führt aus
   ├─ klappt → ROBO freut sich → Belohnung
   └─ klappt nicht → ROBO Fragezeichen, Ada-Tipp → zurück zur Bauphase
Die Schleife Bauen→Zusehen→Anpassen wiederholt sich beliebig oft, immer ermutigend.

### 9.3 Belohnung & Rückkehr
Sterne (Bronze/Silber/Gold) → ggf. Freischaltung gefeiert
→ Schlüsselmoment: Welt wird sichtbar grüner, Pflanze wächst
→ ROBO entwickelt sich minimal weiter → "Weiter" → Hub (nächste Station leuchtet)
Die grünere Welt ist die eigentliche Belohnung; Sterne sind das Sahnehäubchen.
Zwei Flow-Regeln: Jeder Flow endet, wo der nächste leicht beginnt ("nur noch eine Mission"-Sog). Niemals eine Sackgasse.

## 10. Hilfesystem (gegen Abbruch an Hürden)
### 10.1 Gestufte Hilfe-Leiter (angeboten, nie aufgedrängt)
- **Stufe 0 – Automatischer Schubs:** Bei erkanntem Festhängen (z.B. 3× "Start" mit gleichem Fehler, oder lange Pause) taucht ROBO/Ada sanft auf: "Soll ich dir einen Tipp geben?" Wegtippbar.
- **Stufe 1 – Die richtige Frage:** Keine Lösung, sondern eine lenkende Frage: "Was sagt dein Distanzsensor, kurz bevor ROBO stehenbleiben soll?"
- **Stufe 2 – Die Richtung:** "Du brauchst etwas, das ROBO wiederholt – schau bei den orangen Blöcken." (Welches Werkzeug, nicht wie.)
- **Stufe 3 – Ein Schritt vorzeigen:** Nur als Letztes, nur EIN konkreter Schritt mit Highlight: "Zieh den Wiederhole-Block hierhin." Danach macht das Kind selbst weiter.

### 10.2 Zweiter Kanal: Debugging als Hilfe (oft die beste Hilfe)
Zeitlupen-Modus: "Schritt-für-Schritt"-Knopf lässt ROBO langsam ablaufen, der aktive Block leuchtet. Das Kind entdeckt selbst den Fehler. Baut Kompetenz auf, statt sie zu ersetzen.

### 10.3 Drei Regeln
1. Hilfe ist nie eine Niederlage (kein Stern-Malus für Tipp-Nutzung).
2. Hilfe respektiert das Tempo (drängt sich nie nach 10 Sek. auf).
3. Das Handbuch ist die ruhige Nachschlage-Ebene: alle Blöcke/Sensoren erklärt, jederzeit, wertfrei.

## 11. Speichern & Fortschritt
- Lokal gespeichert (localStorage/IndexedDB), offline-fähig. Kein Cloud-Sync im MVP.
- Pro Mission: abgeschlossen / Sterne (1–3) / bester Code gespeichert.
- Freigeschaltete Blöcke + Sensoren persistent.
- ROBO-Customization (Belohnungen) persistent.
- KI-Modell aus Welt 4 bleibt erhalten und "wächst".
- Missions-Auswahl ist an den Spielstand gekoppelt: wählbar nur bis zur zuletzt erreichten Mission bzw. passend zu freigeschalteter Sensorik/Codeblöcken.

## 12. Visuelles Design (Solarpunk) [SKIZZE – Stufe 5, noch nicht final]
Richtung: hell, freundlich, viel Grün, kindlich. Low-Poly (Pflicht).
- **Farben:** Warme, helle Grundstimmung. Viel sattes Grün, sanfte Sonnentöne, freundliches Blau (Wasser/Himmel). Müll/Verschmutzung in stumpferen Tönen → mit Fortschritt weichen sie lebendigen Farben.
- **Licht:** Warmes Tageslicht, weiche Schatten. Mit jeder gesäuberten Zone wird das Licht wärmer/heller.
- **Formen:** Runde, freundliche Low-Poly-Formen. ROBO niedlich, leicht tollpatschig (WALL-E-Anmutung wie im Prototyp).
- **Welt-Heilung sichtbar:** Pflanzen sprießen, Blumen blühen, Tiere kehren zurück, Wasser wird klar. Das ist die zentrale visuelle Belohnung (Prinzip 1).
- **UI-Stil:** Große, runde Touch-Flächen, klare Icons, wenig Text. Statusleiste schlank und oben, Aktionen unten.
- **ROBOs Entwicklung visuell:** Über die Welten von rostig/kaputt zu sauber/leuchtend.

## 13. Best Practices (Begründung der Designentscheidungen)
- **Minecraft – "Sanfter Einstieg, tiefe Decke":** Mission 1 ohne Anleitung schaffbar, System trägt monatelang. Nie alle Werkzeuge auf einmal.
- **Pokémon – "Sammeln & Wachsen":** Sensoren/Blöcke/Customization als sichtbare Sammlung ("4 von 8") erzeugen Sammeldrang.
- **Portal – "Eine Mechanik, voll ausgereizt":** Pro Welt EIN Konzept, vielfach variiert.
- **Duolingo:** Kurze Sessions, klarer nächster Schritt, sanfter Sog statt Druck.
- **ScratchJr / Lightbot:** Tippen statt Drag & Drop auf kleinen Screens; Struktur bleibt Kind-Entscheidung.

Kern-Erkenntnis: Kinder lernen nicht, weil die App lehrreich ist, sondern weil sie ROBO mögen und ihm helfen wollen. Die emotionale Bindung an den Charakter ist der eigentliche Motor.

## 14. Zusammenfassung: Der rote Faden
Emotionale Bindung (ROBO)
  → Neugier (Freies Erkunden)
    → Herausforderung (Missionen)
      → Kompetenz (Blöcke meistern)
        → Stolz (Sterne + ROBO wächst + grünere Welt)
          → KI verstehen (Welt 4–5)
            → Übertrag auf die echte Welt (Solarpunk-Botschaft)
Die App lehrt nicht Programmieren. Sie erzählt eine Geschichte – und Programmieren ist das Werkzeug, um diese Geschichte voranzutreiben.

## 15. Was noch offen ist (für spätere Iterationen)
- [SKIZZE] Stufe 5: konkretes visuelles Designsystem (Designtokens, Typo, Komponenten).
- [SKIZZE] Vollständige Ausdetaillierung der Missionen Welten 2–5.
- [OFFEN] Technische Anbindung Blockly ↔ bestehende Three.js-ROBO-Funktionen (Code-Generierung, Ausführungs-Loop, Zeitlupen-Modus).
- [OFFEN] Datenmodell (Block-Struktur, Missions-Zustand, Fortschritts-Serialisierung).
- [OFFEN] Wireframes der übrigen Bildschirme (Hub, Sammlung, Belohnung im Detail).
- [SPÄTER] Cloud-Sync, Eltern-Dashboard, Lehrermodul, Accessibility-Feinschliff, Lokalisierung.
