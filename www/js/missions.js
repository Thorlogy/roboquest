// js/missions.js – Missions-System für Welt 1 (GDD Kap. 4.5)

class MissionManager {
    constructor() {
        // Fortschritt aus localStorage laden
        this.progress = this._loadProgress();
        this.currentMission = null;
        this.missionActive = false;

        // ═══════════════════════════════════════════════
        // MISSIONS-DATEN: Welt 1 (GDD Kap. 4.5)
        // ═══════════════════════════════════════════════
        this.missions = [
            {
                id: 1,
                title: 'Erste Schritte',
                adaIntro: 'ROBO muss zum grünen Feld fahren! Tippe auf ⬆️ Vor, um einen Befehl hinzuzufügen.',
                adaSuccess: 'Super! ROBO kann sich bewegen! Du hast ihm das beigebracht.',
                adaQuestion: {
                    text: 'Warum ist ROBO zum Ziel gefahren?',
                    options: ['Weil ich den Vor-Befehl gegeben habe', 'Weil ROBO selbst denken kann', 'Zufall'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD'],
                silverLimit: 3,
                // Welt-Setup
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: { x: 0, z: -6 },
                goalRadius: 2,
                obstacles: [],
                collectibles: [],
                requiredCollectibles: 0,
                fogEnabled: false,
                description: 'Fahre ROBO zum grünen Zielfeld.'
            },
            {
                id: 2,
                title: 'Um die Ecke',
                adaIntro: 'Ein Hindernis blockiert den Weg! Du musst abbiegen. Nutze ⟲ Links oder ⟳ Rechts.',
                adaSuccess: 'Großartig! ROBO kann jetzt Hindernissen ausweichen!',
                adaQuestion: {
                    text: 'Was hast du gerade gelernt?',
                    options: ['ROBO kann abbiegen, wenn ich Links/Rechts sage', 'ROBO sucht sich den Weg selbst', 'Hindernisse verschwinden von allein'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT'],
                silverLimit: 5,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: { x: 6, z: -6 },
                goalRadius: 2,
                obstacles: [
                    { x: 0, z: -3, w: 4, d: 1, h: 2, color: 0x8b5e3c } // Kiste
                ],
                collectibles: [],
                requiredCollectibles: 0,
                fogEnabled: false,
                description: 'Fahre um das Hindernis herum zum Ziel.'
            },
            {
                id: 3,
                title: 'Sammle 3 Schrotteile',
                adaIntro: 'ROBO braucht Ersatzteile für die Reparatur! Sammle 3 Schrotteile mit 🖐️ Greifen.',
                adaSuccess: 'Perfekt! ROBO wird Stück für Stück repariert. Du bist ein toller Ingenieur!',
                adaQuestion: {
                    text: 'Warum musste ROBO direkt beim Schrottteil stehen?',
                    options: ['Weil der Greifer nur ganz nah funktioniert', 'Weil ROBO Angst hat', 'Das war Zufall'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'GRAB'],
                silverLimit: 8,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: null, // Kein Zielpunkt, nur Sammeln
                goalRadius: 0,
                obstacles: [
                    { x: -3, z: -4, w: 1, d: 1, h: 1.5, color: 0x6b7280 }
                ],
                collectibles: [
                    { x: 0, z: -3, type: 'scrap', icon: '⚙️' },
                    { x: 3, z: -3, type: 'scrap', icon: '🔩' },
                    { x: 3, z: -6, type: 'scrap', icon: '🔧' }
                ],
                requiredCollectibles: 3,
                fogEnabled: false,
                description: 'Sammle alle 3 Schrotteile ein.'
            },
            {
                id: 4,
                title: 'Der Kisten-Umweg',
                adaIntro: 'Eine riesige Kiste versperrt den Weg! Wir müssen außen herum fahren (3 Seiten eines Quadrats). Nutze [Vorwärts] und [Links] und hänge am Ende den [Wiederhole alles]-Block an. Die Zahl am Wiederholungs-Block sagt dir, wie oft der Code ausgeführt wird. Stelle sie auf 3!',
                adaSuccess: 'Genial! Du bist erfolgreich um das Quadrat gefahren. Mit Schleifen sparst du extrem viel Platz im Code!',
                adaQuestion: {
                    text: 'Warum haben wir den Code 3 mal wiederholt?',
                    options: ['Weil wir 3 Seiten des Quadrats fahren mussten', 'Weil 3 eine Glückszahl ist', 'Weil die Batterie 3% hat'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'GRAB', 'REPEAT_ALL'],
                silverLimit: 4,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: { x: 10, z: 0 }, // Ziel auf der anderen Seite
                goalRadius: 2.5,
                obstacles: [
                    // Kiste in der Mitte, verkleinert auf halbe Kachelbreite
                    { x: 5, z: -5, w: 2.5, d: 2.5, h: 4, color: 0x8b5e3c }
                ],
                collectibles: [],
                requiredCollectibles: 0,
                fogEnabled: false,
                description: 'Fahre um die große Kiste herum ins Ziel.'
            },
            {
                id: 5,
                title: 'Meisterprüfung Werkstatt',
                adaIntro: 'Die letzte Prüfung! Kombiniere alles: Fahren, Abbiegen, Sammeln und Scannen. Zeig was du kannst!',
                adaSuccess: 'Unglaublich! Du hast Welt 1 gemeistert! ROBO ist bereit für das nächste Abenteuer!',
                adaQuestion: {
                    text: 'Was hat dir am meisten geholfen?',
                    options: ['Alle Befehle zusammen kombinieren', 'Nur einen Befehl ganz oft nutzen', 'Gar nichts programmieren'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'GRAB', 'SCAN'],
                silverLimit: 10,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: { x: 6, z: -10 },
                goalRadius: 2.5,
                obstacles: [
                    { x: 0, z: -3, w: 3, d: 1, h: 2, color: 0x8b5e3c },
                    { x: 4, z: -5, w: 1, d: 4, h: 2, color: 0x6b7280 },
                    { x: -2, z: -8, w: 2, d: 1, h: 1.5, color: 0x4a5568 }
                ],
                collectibles: [
                    { x: 3, z: -1, type: 'scrap', icon: '⚙️' },
                    { x: 6, z: -4, type: 'scrap', icon: '🔩' }
                ],
                requiredCollectibles: 2,
                fogEnabled: false,
                description: 'Sammle die Teile und erreiche das Ziel!'
            },
            {
                id: 6,
                title: 'Die Flaschen-Jagd',
                adaIntro: 'Willkommen im Stadtpark! Er ist voller Plastikmüll. Nutze eine Schleife mit 🔁 Wiederhole alles, um alle 5 Flaschen in einer Reihe zu sammeln!',
                adaSuccess: 'Fantastisch! Die Schleife hat perfekt funktioniert und die Flaschen sind sicher im Greifer!',
                adaQuestion: {
                    text: 'Welchen Vorteil bieten Schleifen?',
                    options: ['Sie machen den Code kürzer', 'Sie machen den Roboter schneller', 'Nichts'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'GRAB', 'REPEAT_ALL'],
                silverLimit: 4,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: null,
                goalRadius: 0,
                obstacles: [],
                collectibles: [
                    { x: 0, z: -5, type: 'scrap', icon: '🥤' },
                    { x: 0, z: -10, type: 'scrap', icon: '🥤' },
                    { x: 0, z: -15, type: 'scrap', icon: '🥤' },
                    { x: 0, z: -20, type: 'scrap', icon: '🥤' },
                    { x: 0, z: -25, type: 'scrap', icon: '🥤' }
                ],
                requiredCollectibles: 5,
                fogEnabled: false,
                description: 'Sammle 5 Plastikflaschen mit einer Schleife.'
            },
            {
                id: 7,
                title: 'Slalom-Pfad',
                adaIntro: 'Einige Parkbänke versperren uns den direkten Weg. Programmiere eine Schleife, die ROBO im Slalom um die Bänke führt!',
                adaSuccess: 'Unglaublich! ROBO ist elegant um alle Bänke gefahren!',
                adaQuestion: {
                    text: 'Was darf in einer Slalom-Schleife stehen?',
                    options: ['Sowohl Vorwärts- als auch Drehbefehle', 'Nur Vorwärtsbefehle', 'Nichts'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'GRAB', 'REPEAT_ALL'],
                silverLimit: 6,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: { x: 5, z: -15 },
                goalRadius: 2.5,
                obstacles: [
                    { x: 0, z: -5, w: 2.5, d: 2.5, h: 1.5, color: 0x8b5e3c },
                    { x: 5, z: -10, w: 2.5, d: 2.5, h: 1.5, color: 0x8b5e3c }
                ],
                collectibles: [
                    { x: 5, z: -5, type: 'scrap', icon: '🥤' },
                    { x: 0, z: -10, type: 'scrap', icon: '🥤' }
                ],
                requiredCollectibles: 2,
                fogEnabled: false,
                description: 'Fahre Slalom um die Bänke, um den Müll zu sammeln.'
            },
            {
                id: 8,
                title: 'Warten auf Blau',
                adaIntro: 'Wir haben Müll geladen! Neu: Der Roboter-Motor läuft jetzt asynchron! Schalte den "Motor an: Vorwärts", nutze "Warte bis" (wähle Farbe Blau aus dem Dropdown) zum Pausieren des Programms, und setze dann "Motor: Stopp" gefolgt von "Ablegen".',
                adaSuccess: 'Wunderbar! ROBO hat den Müll zielgenau bei der blauen Recyclingtonne abgeliefert!',
                adaQuestion: {
                    text: 'Warum müssen wir den Motor am Ende manuell stoppen?',
                    options: ['Weil der Motor sonst endlos weiterläuft', 'Weil der Farbsensor kaputt ist', 'Damit die Batterie geschont wird'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'GRAB', 'DROP', 'WAIT_UNTIL', 'MOTOR_FWD', 'MOTOR_BWD', 'MOTOR_STOP'],
                silverLimit: 4,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: { x: 0, z: -10 },
                goalRadius: 2.5,
                obstacles: [],
                colorZones: [
                    { x: 0, z: -10, radius: 2.5, color: 'blue' }
                ],
                collectibles: [],
                requiredCollectibles: 0,
                fogEnabled: false,
                description: 'Fahre bis zur blauen Recyclingtonnen-Zone.'
            },
            {
                id: 9,
                title: 'Der Tastsensor',
                adaIntro: 'Der Weg ist blockiert! Schalte den Motor ein ("Motor an: Vorwärts") und nutze den Sensor ("Warte bis", wähle Hindernis). Stoppe dann den Motor, drehe dich nach rechts und fahre ins Ziel.',
                adaSuccess: 'Fantastisch! Du bist sicher am Hindernis vorbeigesteuert und hast die asynchrone Motorsteuerung verstanden.',
                adaQuestion: {
                    text: 'Was macht der Block "Warte bis Hindernis"?',
                    options: ['Er pausiert das Programm, bis der Sensor auslöst', 'Er schaltet den Motor ab', 'Er lässt den Roboter rückwärts fahren'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'WAIT_UNTIL', 'MOTOR_FWD', 'MOTOR_BWD', 'MOTOR_STOP'],
                silverLimit: 4,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: { x: 5, z: -11.5 },
                goalRadius: 2.5,
                obstacles: [
                    { x: 0, z: -15, w: 5.0, d: 2.0, h: 2.5, color: 0x333333 }
                ],
                colorZones: [],
                collectibles: [],
                requiredCollectibles: 0,
                fogEnabled: false,
                description: 'Fahre bis zum Hindernis, drehe dich und fahre ins Ziel.'
            },
            {
                id: 10,
                title: 'Meisterprüfung Park',
                adaIntro: 'Die letzte Prüfung im Stadtpark! Kombiniere alles: Fahre die Wiese im S-Kurven-Muster ab, sammle den Müll und sortiere ihn an den Tonnen. Zeig, was du gelernt hast!',
                adaSuccess: 'Unglaublich! Du hast den gesamten Stadtpark gereinigt! Er blüht wieder voll auf!',
                adaQuestion: {
                    text: 'Was hast du in Welt 2 gemeistert?',
                    options: ['Schleifen und Wenn/Dann-Bedingungen zur Automatisierung', 'Nur einfaches Geradeausfahren', 'Nichts'],
                    correct: 0
                },
                unlockedBlocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'GRAB', 'REPEAT_ALL', 'IF_COLOR', 'ELSE', 'END_IF', 'WAIT_UNTIL_COLOR'],
                silverLimit: 12,
                startPos: { x: 0, z: 0, rot: Math.PI },
                goalPos: { x: 5, z: 0 },
                goalRadius: 2.5,
                obstacles: [
                    { x: 2.5, z: -5, w: 2.0, d: 2.0, h: 2.5, color: 0x22c55e }
                ],
                colorZones: [
                    { x: 5, z: 0, radius: 2.5, color: 'blue' }
                ],
                collectibles: [
                    { x: 0, z: -5, type: 'scrap', icon: '🥤', color: 'blue' },
                    { x: 5, z: -5, type: 'scrap', icon: '🥤', color: 'blue' }
                ],
                requiredCollectibles: 2,
                fogEnabled: false,
                description: 'Säuber die gesamte Wiese im systematischen Raster.'
            }
        ];
    }

    // ═══════════════════════════════════════════════
    // FORTSCHRITT (localStorage)
    // ═══════════════════════════════════════════════
    _loadProgress() {
        try {
            const data = localStorage.getItem('roboquest_progress');
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === 'object') {
                    if (!parsed.missionResults) parsed.missionResults = {};
                    parsed.highestMission = 10; // FORCED TO UNLOCK ALL MISSIONS (1-10)
                    if (parsed.currentWorld === undefined) parsed.currentWorld = 1;
                    return parsed;
                }
            }
        } catch(e) { console.warn('Progress load failed:', e); }
        return {
            currentWorld: 1,
            highestMission: 10, // FORCED TO UNLOCK ALL MISSIONS (1-10)
            missionResults: {}  // { "1": { completed: true, stars: 2, blockCount: 4 }, ... }
        };
    }

    _saveProgress() {
        try {
            localStorage.setItem('roboquest_progress', JSON.stringify(this.progress));
        } catch(e) { console.warn('Progress save failed:', e); }
    }

    // ═══════════════════════════════════════════════
    // MISSION LADEN (GDD 4.1 Ablauf)
    // ═══════════════════════════════════════════════
    // ═══════════════════════════════════════════════
    // FREIE ERKUNDUNG (GDD 7: Sandbox)
    // ═══════════════════════════════════════════════
    startFreeExplore() {
        if (window.closeAllModals) window.closeAllModals();
        this.currentMission = null;
        this.missionActive = false;

        // Hub ausblenden
        const hub = document.getElementById('mission-hub');
        if (hub) hub.style.display = 'none';

        // UI Overlay einblenden
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) uiOverlay.style.display = 'flex';

        // Editor einblenden (damit man in der Sandbox programmieren kann)
        const editor = document.getElementById('simple-coding-bar');
        if (editor) editor.style.display = 'flex';

        // Alle Blöcke freischalten
        if (window.simpleCoding) {
            // In Sandbox sind alle Blöcke aus Level 3 verfügbar
            window.simpleCoding.unlockBlocksForMission(3);
            window.simpleCoding.clearProgram();
        }

        // Normale Welt aufbauen (Natur)
        if (typeof buildEnvironment === 'function') {
            buildEnvironment();
        }

        // Roboter zentrieren
        if (typeof roverGroup !== 'undefined' && roverGroup) {
            roverGroup.position.set(0, 0.1, 0);
            roverGroup.rotation.set(0, 0, 0);
        }

        // Ada Info
        if (window.ada) {
            window.ada.introduceFeature("Freier Modus", "Erkunde die Welt! Du kannst programmieren oder das Steuerkreuz nutzen, um versteckte Winkel zu entdecken.", () => {
                window.ada.say("Die Welt liegt dir zu Füßen, ROBO.");
            });
        }

        // HUD Text anpassen
        const questText = document.getElementById('quest-text');
        if (questText) questText.textContent = '🌍 Freie Erkundung';
        const levelBadge = document.getElementById('level-badge');
        if (levelBadge) levelBadge.textContent = 'Sandbox';
    }

    loadMission(missionId) {
        if (window.closeAllModals) window.closeAllModals();
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission) { console.error('Mission not found:', missionId); return; }

        this.currentMission = mission;
        this.missionActive = true;
        this._collectedItems = 0;

        // Blöcke freischalten
        if (window.simpleCoding) {
            window.simpleCoding.unlockBlocksForMission(missionId);
            window.simpleCoding.clearProgram();
        }

        // Welt aufbauen
        if (window.missionWorld) {
            window.missionWorld.setup(mission);
        }

        // Hub ausblenden
        const hub = document.getElementById('mission-hub');
        if (hub) hub.style.display = 'none';

        // UI Overlay einblenden
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) uiOverlay.style.display = 'flex';

        // Editor einblenden
        const editor = document.getElementById('simple-coding-bar');
        if (editor) editor.style.display = 'flex';

        // Ada-Intro & Feature-Tutorial
        let hasTutorial = false;
        if (missionId > 1 && window.ada) {
            const prevMission = this.missions.find(m => m.id === missionId - 1);
            if (prevMission) {
                const newBlocks = mission.unlockedBlocks.filter(b => !prevMission.unlockedBlocks.includes(b));
                if (newBlocks.length > 0) {
                    hasTutorial = true;
                    let title = "Neue Befehle!";
                    let text = "Du hast neue Blöcke freigeschaltet.";
                    if (newBlocks.includes('TURN_LEFT')) {
                        title = "Dreh dich!";
                        text = "Du kannst jetzt <b>⟲ Links</b> und <b>⟳ Rechts</b> nutzen. Wenn ROBO vor einem Hindernis steht, drehe ihn, bevor er weiterfährt.";
                    } else if (newBlocks.includes('GRAB')) {
                        title = "Greifarm aktiviert!";
                        text = "Nutze den neuen Block <b>🖐️ Greifen</b>, um Schrott aufzusammeln. ROBO muss direkt auf dem Schrott stehen!";
                    } else if (newBlocks.includes('SCAN')) {
                        title = "Sensoren online!";
                        text = "Der Block <b>📡 Scan</b> lässt ROBO seine Umgebung prüfen. Das HUD oben rechts zeigt jetzt genaue Distanz-Werte!";
                    } else if (newBlocks.includes('WAIT_UNTIL_COLOR')) {
                        title = "Farbsensor online!";
                        text = "Nutze den neuen Block <b>⏳ Warte bis</b>, damit ROBO fährt, bis er die ausgewählte Farbe auf dem Boden erkennt.";
                    } else if (newBlocks.includes('IF_COLOR')) {
                        title = "Entscheidungen treffen!";
                        text = "Mit <b>❓ Wenn Farbe</b>, <b>❔ Sonst</b> und <b>❓ Ende Wenn</b> kann ROBO entscheiden, was er tut – z. B. blaue Flaschen links sortieren, rote rechts!";
                    }
                    setTimeout(() => {
                        window.ada.introduceFeature(title, text, () => {
                            window.ada.say(mission.adaIntro);
                        });
                    }, 500);
                }
            }
        }

        if (!hasTutorial && window.ada) {
            window.ada.say(mission.adaIntro);
        }

        // HUD aktualisieren
        const questText = document.getElementById('quest-text');
        if (questText) questText.textContent = '🎯 ' + mission.description;
        const levelBadge = document.getElementById('level-badge');
        if (levelBadge) levelBadge.textContent = 'Mission ' + missionId;

        const worldBadge = document.getElementById('hud-world-badge');
        if (worldBadge) {
            const worldNum = missionId <= 5 ? 1 : 2;
            const worldName = worldNum === 1 ? "Welt 1" : "Welt 2";
            worldBadge.textContent = worldName;
            if (worldNum === 2) {
                worldBadge.style.color = '#166534';
                worldBadge.style.background = '#dcfce7';
                worldBadge.style.borderColor = '#bbf7d0';
            } else {
                worldBadge.style.color = '#1e293b';
                worldBadge.style.background = '#f1f5f9';
                worldBadge.style.borderColor = '#cbd5e1';
            }
        }
    }

    // ═══════════════════════════════════════════════
    // MISSION-ABSCHLUSS PRÜFEN
    // ═══════════════════════════════════════════════
    /**
     * Prüft, ob die aktuelle Mission erfolgreich abgeschlossen wurde.
     * Dies wird aufgerufen, wenn das Roboter-Programm durchgelaufen ist, 
     * oder wenn Items gesammelt wurden.
     * @returns {boolean} True, wenn Mission abgeschlossen, sonst False.
     */
    checkCompletion() {
        if (!this.currentMission || !this.missionActive) return false;
        const m = this.currentMission;

        // Sammel-Missionen
        if (m.requiredCollectibles > 0) {
            if (this._collectedItems < m.requiredCollectibles) return false;
            // Wenn kein Zielpunkt definiert, reicht Sammeln
            if (!m.goalPos) {
                this._completeMission();
                return true;
            }
        }

        // Zielpunkt-Check
        if (m.goalPos && window.roverGroup) {
            const dx = window.roverGroup.position.x - m.goalPos.x;
            const dz = window.roverGroup.position.z - m.goalPos.z;
            const dist = Math.hypot(dx, dz); // Optimiert mit Math.hypot

            
            // Debugging: Distanzanzeige im HUD
            const sensorOut = document.getElementById('sensor-output');
            if (sensorOut && (!window.gameEngine || !window.gameEngine.isRunning)) {
                sensorOut.innerText = `Distanz zum Ziel: ${dist.toFixed(1)}m (Ziel-Radius: ${m.goalRadius}m)`;
            }

            if (dist <= m.goalRadius) {
                this._completeMission();
                return true;
            }
        }

        return false;
    }

    collectItem() {
        if (!this.missionActive) return;
        this._collectedItems++;
        const sensorOut = document.getElementById('sensor-output');
        if (sensorOut && this.currentMission) {
            const remaining = this.currentMission.requiredCollectibles - this._collectedItems;
            if (remaining > 0) {
                sensorOut.innerText = '✅ Gesammelt! Noch ' + remaining + ' übrig.';
            } else {
                sensorOut.innerText = '✅ Alle Teile gesammelt!';
            }
        }
        this.checkCompletion();
    }

    _completeMission() {
        if (!this.missionActive) return;
        this.missionActive = false;
        const m = this.currentMission;

        // Blockanzahl für Sterne-Bewertung
        const blockCount = window.simpleCoding ? window.simpleCoding.program.length : 99;

        // Sterne berechnen (GDD 4.3)
        let stars = 1; // Bronze: immer
        if (blockCount <= m.silverLimit) stars = 2; // Silber
        if (blockCount <= Math.ceil(m.silverLimit * 0.6)) stars = 3; // Gold

        // Fortschritt speichern
        const prevResult = this.progress.missionResults[m.id];
        const prevStars = prevResult ? prevResult.stars : 0;
        this.progress.missionResults[m.id] = {
            completed: true,
            stars: Math.max(stars, prevStars),
            blockCount: Math.min(blockCount, prevResult ? prevResult.blockCount : 999)
        };

        // Nächste Mission freischalten
        if (m.id >= this.progress.highestMission && m.id < this.missions.length) {
            this.progress.highestMission = m.id + 1;
        }
        this._saveProgress();

        // Erfolg anzeigen (GDD 4.3)
        this._showSuccess(m, stars, blockCount);
    }

    _showSuccess(mission, stars, blockCount) {
        // Success-Overlay füllen
        const overlay = document.getElementById('success-overlay');
        const emoji = document.getElementById('success-emoji');
        const title = document.getElementById('success-title');
        const starsEl = document.getElementById('code-result-stars');
        const blocksEl = document.getElementById('code-result-blocks');
        const msgEl = document.getElementById('code-result-msg');
        const pointsEl = document.getElementById('success-points');

        if (emoji) emoji.textContent = stars >= 3 ? '🏆' : stars >= 2 ? '⭐' : '🎉';
        if (title) title.textContent = 'Mission geschafft: ' + mission.title;
        if (starsEl) starsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        if (blocksEl) blocksEl.textContent = 'Befehle genutzt: ' + blockCount + (stars >= 2 ? ' (Effizient! 💪)' : '');
        if (msgEl) msgEl.textContent = mission.adaSuccess;
        if (pointsEl) {
            const addedPoints = stars * 100;
            pointsEl.textContent = '+' + addedPoints + ' Punkte';
            if (typeof score !== 'undefined') {
                score += addedPoints;
                const sd = document.getElementById('score-display');
                if (sd) sd.innerText = score;
            }
        }

        if (overlay) overlay.style.display = 'flex';

        // "Weiter"-Button zur Verständnisfrage oder zur nächsten Mission / zurück zum Hub
        const btnNext = document.getElementById('btn-next-quest');
        if (btnNext) {
            btnNext.onclick = () => {
                overlay.style.display = 'none';
                
                const nextMissionId = mission.id + 1;
                const hasNextMission = this.missions.some(m => m.id === nextMissionId);
                
                const proceedToNext = () => {
                    if (hasNextMission) {
                        this.loadMission(nextMissionId);
                    } else {
                        this.showHub();
                    }
                };

                // Verständnisfrage (GDD 4.4)
                if (mission.adaQuestion && window.ada) {
                    window.ada.askComprehension(
                        mission.adaQuestion.text,
                        mission.adaQuestion.options,
                        mission.adaQuestion.correct,
                        proceedToNext
                    );
                } else {
                    proceedToNext();
                }
            };
        }
    }

    // ═══════════════════════════════════════════════
    // HUB ANZEIGEN (GDD 6: Weltkarte)
    // ═══════════════════════════════════════════════
    showHub() {
        if (window.closeAllModals) window.closeAllModals();
        // Editor ausblenden
        const editor = document.getElementById('simple-coding-bar');
        if (editor) editor.style.display = 'none';

        // Hub einblenden
        const hub = document.getElementById('mission-hub');
        if (!hub) return;
        hub.style.display = 'flex';

        // Sync real score
        const realScore = parseInt(document.getElementById('score-display')?.innerText || '0', 10);
        const hubScoreEl = document.getElementById('hub-score-display');
        if (hubScoreEl) hubScoreEl.innerText = realScore.toLocaleString('de-DE');

        // Sync real eco-status
        const ecoVal = typeof vitalityScore !== 'undefined' ? vitalityScore : 0;
        const hubEcoPercent = document.getElementById('hub-eco-percent');
        const hubEcoBar = document.getElementById('hub-eco-bar-fill');
        if (hubEcoPercent) hubEcoPercent.innerText = ecoVal + '%';
        if (hubEcoBar) hubEcoBar.style.width = ecoVal + '%';

        // Missions-Buttons aktualisieren
        const stationsContainer = hub.querySelector('.hub-stations-modern');
        if (!stationsContainer) return;
        stationsContainer.innerHTML = '';

        for (let i = 0; i < this.missions.length; i++) {
            // Insert separator at the very beginning (index 0, mission 1)
            if (i === 0) {
                const sep = document.createElement('div');
                sep.className = 'world-separator';
                sep.innerHTML = `
                    <div class="world-separator-badge" style="background: linear-gradient(135deg, #1e293b, #475569); border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                        <span class="world-separator-icon">🛠️</span>
                        <span class="world-separator-text">Welt 1: Werkstatt</span>
                    </div>
                `;
                stationsContainer.appendChild(sep);
            }
            
            // Insert separator before World 2 (index 5, mission 6)
            if (i === 5) {
                const sep = document.createElement('div');
                sep.className = 'world-separator';
                sep.innerHTML = `
                    <div class="world-separator-badge">
                        <span class="world-separator-icon">🌳</span>
                        <span class="world-separator-text">Welt 2: Stadtpark</span>
                    </div>
                `;
                stationsContainer.appendChild(sep);
            }

            const mission = this.missions[i];
            const result = this.progress.missionResults[mission.id];
            const isUnlocked = mission.id <= this.progress.highestMission;
            const isCompleted = result && result.completed;
            const isNext = mission.id === this.progress.highestMission && !isCompleted;

            const row = document.createElement('div');
            row.className = 'hub-station-row ' + (i % 2 === 0 ? 'left' : 'right');

            const card = document.createElement('div');
            card.className = 'hub-station-card';
            if (isCompleted) card.classList.add('completed');
            else if (isNext) card.classList.add('next');
            else if (!isUnlocked) card.classList.add('locked');

            const stars = isCompleted ? '⭐'.repeat(result.stars) + '☆'.repeat(3 - result.stars) : '☆☆☆';
            
            let statusText = `Mission 0${mission.id}`;
            if (isNext) statusText = 'JETZT SPIELEN';

            card.innerHTML = `
                <div class="hub-station-stars">${stars}</div>
                <div class="hub-station-name">${statusText}</div>
                <div class="hub-station-title">${mission.title}</div>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => this.loadMission(mission.id));
            }

            const icon = document.createElement('div');
            icon.className = 'hub-station-icon';
            if (isCompleted) {
                icon.classList.add('completed');
                icon.innerHTML = '✓';
            } else if (isNext) {
                icon.classList.add('next');
                icon.innerHTML = '▷';
                icon.addEventListener('click', () => this.loadMission(mission.id));
            } else {
                icon.classList.add('locked');
                icon.innerHTML = '🔒';
            }

            row.appendChild(card);
            row.appendChild(icon);
            stationsContainer.appendChild(row);
        }

        // Insert separator for World 3 at the end of the timeline
        const sep3 = document.createElement('div');
        sep3.className = 'world-separator';
        sep3.innerHTML = `
            <div class="world-separator-badge" style="background: linear-gradient(135deg, #0f172a, #1e293b); border-color: #475569; opacity: 0.65; box-shadow: none;">
                <span class="world-separator-icon">🔒 🌊</span>
                <span class="world-separator-text" style="color: #94a3b8;">Welt 3: Küsten-Rettung</span>
            </div>
        `;
        stationsContainer.appendChild(sep3);
    }

    init() {
        // Binde "Missionen" HUD Button
        const btnHub = document.getElementById('hub-btn');
        if (btnHub) {
            btnHub.addEventListener('click', () => {
                // Stop any running execution first
                if (window.gameEngine) window.gameEngine.stopExecution();
                this.showHub();
            });
        }

        // Binde "Frei Erkunden" Button
        const btnExplore = document.getElementById('btn-start-explore');
        if (btnExplore) {
            btnExplore.addEventListener('click', () => {
                this.missionActive = false;
                this.currentMission = null;
                
                // Hide hub
                const hub = document.getElementById('mission-hub');
                if (hub) hub.style.display = 'none';

                // Close handbook if open
                const handbook = document.getElementById('handbook-modal');
                if (handbook) handbook.style.display = 'none';
                
                // Show editor
                const editor = document.getElementById('simple-coding-bar');
                if (editor) editor.style.display = 'flex';
                
                // Unlock all blocks in editor
                if (window.simpleCoding) {
                    window.simpleCoding.unlockAllBlocks();
                    window.simpleCoding.clearProgram();
                }
                
                // Restore standard environment
                if (typeof buildEnvironment === 'function') {
                    buildEnvironment();
                }
                
                // Reset robot to origin
                if (window.roverGroup) {
                    window.roverGroup.position.set(0, 0.2, 0);
                    window.roverGroup.rotation.set(0, 0, 0);
                }
                
                // Restore standard camera position
                const camDist = typeof CAM_DISTANCE !== 'undefined' ? CAM_DISTANCE : 14;
                const camHeight = typeof CAM_HEIGHT !== 'undefined' ? CAM_HEIGHT : 9;
                camera.position.set(0, camHeight, -camDist);
                if (typeof controls !== 'undefined' && controls) {
                    controls.target.set(0, 0.2 + 1.5, 0);
                    controls.update();
                }
                
                // Restore standard fog
                if (typeof scene !== 'undefined' && scene.fog) {
                    scene.fog.color.setHex(0xe2e8f0);
                    scene.fog.near = 20;
                    scene.fog.far = 100;
                    if (typeof renderer !== 'undefined') renderer.setClearColor(0xe2e8f0, 1);
                }
                
                // Update HUD
                const questText = document.getElementById('quest-text');
                if (questText) questText.textContent = '🔍 Erkunde die Welt und löse Quests!';
                const levelBadge = document.getElementById('level-badge');
                if (levelBadge) levelBadge.textContent = 'Freies Spiel';

                const worldBadge = document.getElementById('hud-world-badge');
                if (worldBadge) {
                    worldBadge.textContent = 'Freies Spiel';
                    worldBadge.style.color = '#1e293b';
                    worldBadge.style.background = '#f1f5f9';
                    worldBadge.style.borderColor = '#cbd5e1';
                }
            });
        }

        // Binde "Alle freischalten" Button
        const btnUnlockAll = document.getElementById('btn-unlock-all');
        if (btnUnlockAll) {
            btnUnlockAll.addEventListener('click', () => {
                this.progress.highestMission = 10;
                this._saveProgress();
                this.showHub();
            });
        }
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.missionManager = new MissionManager();
    window.missionManager.init();
    window.missionManager.showHub();
});
