// js/simple_coding.js – Tap-basierter Block-Editor (GDD Kap. 8)
// Blöcke werden angetippt, nicht gezogen. Einfügemarke bestimmt Position.

/**
 * Verwaltet den visuellen Block-Editor für die Roboter-Steuerung.
 * Unterstützt Touch/Tap-Bedienung und ein aufziehbares Overlay ("Mode A" / "Mode B").
 */
class SimpleCoding {
    constructor() {
        // Programm-Daten: Array von {action, icon, label, type}
        this.program = [];
        // Cursor-Position: 0 = vor erstem Block, N = nach letztem
        this.cursorIndex = 0;
        // Welche Blöcke sind freigeschaltet? (Mission-basiert)
        this.unlockedBlocks = ['MOVE_FWD']; // Mission 1: nur Vorwärts
        // Modus: 'a' (kompakt) oder 'b' (Editor groß)
        this.mode = 'b';

        // Block-Definitionen (alle Welt-1 & Welt-2 Blöcke)
        this.blockDefs = {
            'MOVE_FWD':    { icon: '⬆️', label: 'Fahre Strecke (Vor)', type: 'move',   unlock: 1 },
            'MOVE_BWD':    { icon: '⬇️', label: 'Fahre Strecke (Zurück)', type: 'move', unlock: 1 },
            'TURN_LEFT':   { icon: '⟲',  label: 'Links drehen',    type: 'move',   unlock: 2 },
            'TURN_RIGHT':  { icon: '⟳',  label: 'Rechts drehen',   type: 'move',   unlock: 2 },
            'MOTOR_FWD':   { icon: '🚀', label: 'Motor an: Vorwärts', type: 'motor', unlock: 8 },
            'MOTOR_BWD':   { icon: '🚀', label: 'Motor an: Rückwärts', type: 'motor', unlock: 8 },
            'MOTOR_STOP':  { icon: '🛑', label: 'Motor: Stopp', type: 'motor', unlock: 8 },
            'GRAB':        { icon: '🖐️', label: 'Greifen',  type: 'action', unlock: 3 },
            'DROP':        { icon: '👇', label: 'Ablegen', type: 'action', unlock: 3 },
            'WAIT_SEC':    { icon: '⏱️', label: 'Warte x Sekunden', type: 'wait', unlock: 8 },
            'REPEAT_ALL':  { icon: '🔁', label: 'Wiederhole alles', type: 'loop', unlock: 4 },
            'LOOP_END':    { icon: '🔁', label: 'Schleife Ende', type: 'loop', unlock: 4 },
            'SCAN':        { icon: '📡', label: 'Ultraschallsensor: Distanz prüfen', type: 'action', unlock: 5 },
            'WAIT_UNTIL':  { icon: '⏳', label: 'Warte bis', type: 'sensor', unlock: 8 },
            'IF_COLOR':    { icon: '❓', label: 'Farbsensor: Wenn Farbe', type: 'condition', unlock: 9 },
            'ELSE':        { icon: '❔', label: 'Sonst', type: 'condition', unlock: 9 },
            'END_IF':      { icon: '❓', label: 'Ende Wenn', type: 'condition', unlock: 9 },
        };

        // DOM-Referenzen
        this.editorBar = document.getElementById('simple-coding-bar');
        this.codeArea = document.getElementById('code-area');
        this.paletteCategories = document.getElementById('palette-categories');
        this.paletteBar = document.getElementById('palette-bar');

        // Kategorien (Solarpunk Style)
        this.categoryMap = {
            'Aktion': { color: '#d97706', blocks: ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'MOTOR_FWD', 'MOTOR_BWD', 'MOTOR_STOP', 'GRAB', 'DROP'] },
            'Sensoren': { color: '#2e7d32', blocks: ['SCAN'] },
            'Kontrolle': { color: '#0284c7', blocks: ['WAIT_SEC', 'WAIT_UNTIL', 'REPEAT_ALL', 'LOOP_END'] },
            'Logik': { color: '#7c3aed', blocks: ['IF_COLOR', 'ELSE', 'END_IF'] }
        };
        this.currentCategory = 'Aktion';

        this.init();
    }

    /**
     * Initialisiert die DOM-Events für den Editor (Drag-To-Resize, Toggle, Clicks).
     */
    init() {
        // Drag/Swipe-to-resize mechanism for the editor bar
        const toggle = document.getElementById('editor-toggle');
        if (toggle && this.editorBar) {
            let startY = 0;
            let startHeight = 0;
            let isDragging = false;
            let hasMoved = false;

            const onStart = (clientY) => {
                startY = clientY;
                startHeight = this.editorBar.offsetHeight;
                isDragging = true;
                hasMoved = false;
                this.editorBar.style.transition = 'none'; // Disable transition for 1:1 feel
            };

            const onMove = (clientY) => {
                if (!isDragging) return;
                const deltaY = clientY - startY;
                if (Math.abs(deltaY) > 5) {
                    hasMoved = true;
                }
                let newHeight = startHeight - deltaY;
                
                // Clamp height between 110px (mode-a) and 80% of window height
                const minHeight = 110;
                const maxHeight = window.innerHeight * 0.8;
                newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
                
                this.editorBar.style.height = newHeight + 'px';
            };

            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                this.editorBar.style.transition = ''; // Restore transitions

                if (!hasMoved) {
                    // Tap/Click behavior: toggle mode
                    this.toggleMode();
                } else {
                    // Snap behavior: find closest mode
                    const currentHeight = this.editorBar.offsetHeight;
                    const vh55 = window.innerHeight * 0.55;
                    const midpoint = (110 + vh55) / 2;
                    
                    this.editorBar.style.height = ''; // Clear inline styles so class style applies
                    if (currentHeight < midpoint) {
                        this.setMode('a');
                    } else {
                        this.setMode('b');
                    }
                }
            };

            // Touch events
            toggle.addEventListener('touchstart', (e) => {
                if (e.touches.length > 0) onStart(e.touches[0].clientY);
            }, { passive: true });
            
            window.addEventListener('touchmove', (e) => {
                if (isDragging && e.touches.length > 0) {
                    onMove(e.touches[0].clientY);
                }
            }, { passive: true });
            
            window.addEventListener('touchend', onEnd);

            // Mouse events
            toggle.addEventListener('mousedown', (e) => {
                onStart(e.clientY);
                e.preventDefault();
            });
            
            window.addEventListener('mousemove', (e) => {
                if (isDragging) onMove(e.clientY);
            });
            
            window.addEventListener('mouseup', onEnd);
        }

        // Tipp auf die Programmierfläche (oder Teile davon) → Modus B öffnen
        if (this.editorBar) {
            this.editorBar.addEventListener('click', (e) => {
                if (this.mode === 'a') {
                    // Falls wir in Modus A sind, öffnet jeder Klick/Tipp auf die Bar den Editor
                    e.stopPropagation();
                    this.setMode('b');
                }
            });
        }

        // Tipp auf die Roboterumgebung → Modus A schließen
        let pointerStartX = 0;
        let pointerStartY = 0;
        document.addEventListener('pointerdown', (e) => {
            pointerStartX = e.clientX;
            pointerStartY = e.clientY;
        });
        document.addEventListener('pointerup', (e) => {
            if (this.mode !== 'b') return;
            
            // Distanziere Klick von Drag (z.B. Kamera-Orbit)
            const dx = e.clientX - pointerStartX;
            const dy = e.clientY - pointerStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 8) return; // War ein Drag

            // Wenn Klick innerhalb des Editors war, ignorieren
            if (this.editorBar && this.editorBar.contains(e.target)) return;

            // Liste von Menüs/Overlays, bei deren Klick der Editor NICHT schließen soll
            const isHUDElement = e.target.closest('#hud-panel') ||
                                 e.target.closest('#minimap-container') ||
                                 e.target.closest('#story-panel') ||
                                 e.target.closest('.sensor-overlay') ||
                                 e.target.closest('#dpad') ||
                                 e.target.closest('.bottom-bar') ||
                                 e.target.closest('#success-overlay') ||
                                 e.target.closest('#zone-discovery') ||
                                 e.target.closest('#reward-popup') ||
                                 e.target.closest('#handbook-modal') ||
                                 e.target.closest('#mission-hub') ||
                                 e.target.closest('#ada-bubble') ||
                                 e.target.closest('.hb-tab-btn') ||
                                 e.target.closest('.hud-action-btn') ||
                                 e.target.closest('.action-btn');

            if (!isHUDElement) {
                this.setMode('a');
            }
        });

        // Palette-Blöcke: Tipp → Block einfügen
        this.setupPalette();

        // Play / Stop / Clear Buttons
        const btnPlay = document.getElementById('btn-play');
        const btnStop = document.getElementById('btn-stop-editor');
        const btnClear = document.getElementById('btn-clear-editor');

        if (btnPlay) {
            btnPlay.addEventListener('click', (e) => {
                e.stopPropagation();
                this.runProgram();
            });
        }
        if (btnStop) {
            btnStop.addEventListener('click', (e) => {
                e.stopPropagation();
                this.stopProgram();
            });
        }
        if (btnClear) {
            btnClear.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearProgram();
            });
        }
        
        const btnHint = document.getElementById('btn-hint');
        if (btnHint) {
            btnHint.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.missionManager) {
                    window.missionManager.showHint();
                }
            });
        }

        // Erstes Rendern
        this.setMode('b');
        this.render();
    }

    // ═══════════════════════════════════════════════
    // BLOCK-FREISCHALTUNG (pro Mission)
    // ═══════════════════════════════════════════════
    unlockBlocksForMission(missionId) {
        this.unlockedBlocks = [];
        this.newBlocks = [];
        const prevMissionBlocks = [];

        for (const [action, def] of Object.entries(this.blockDefs)) {
            if (def.unlock <= missionId) {
                this.unlockedBlocks.push(action);
            }
            if (def.unlock <= missionId - 1) {
                prevMissionBlocks.push(action);
            }
        }

        if (missionId > 1) {
            this.newBlocks = this.unlockedBlocks.filter(b => !prevMissionBlocks.includes(b));
        }

        this.setupPalette();
        this.render();
    }

    unlockAllBlocks() {
        this.unlockedBlocks = Object.keys(this.blockDefs);
        this.newBlocks = [];
        this.setupPalette();
        this.render();
    }

    setupPalette() {
        if (this.paletteCategories) {
            this.paletteCategories.innerHTML = '';
            for (const [catName, catData] of Object.entries(this.categoryMap)) {
                // Prüfen ob die Kategorie freigeschaltete Blöcke enthält
                const hasUnlockedBlocks = catData.blocks.some(b => this.unlockedBlocks.includes(b));
                if (!hasUnlockedBlocks) continue; // Zeige Kategorie nicht an, wenn komplett gesperrt

                const tab = document.createElement('button');
                tab.className = 'palette-category-tab';
                if (this.currentCategory === catName) tab.classList.add('active');
                tab.style.backgroundColor = catData.color;
                tab.textContent = catName;
                tab.addEventListener('click', () => {
                    this.currentCategory = catName;
                    this.setupPalette();
                });
                this.paletteCategories.appendChild(tab);
            }
        }

        if (!this.paletteBar) return;
        this.paletteBar.innerHTML = '';

        // Falls die aktuelle Kategorie leer ist, wähle die erste verfügbare
        if (this.categoryMap[this.currentCategory]) {
            const hasUnlockedInCurrent = this.categoryMap[this.currentCategory].blocks.some(b => this.unlockedBlocks.includes(b));
            if (!hasUnlockedInCurrent) {
                for (const catName of Object.keys(this.categoryMap)) {
                    if (this.categoryMap[catName].blocks.some(b => this.unlockedBlocks.includes(b))) {
                        this.currentCategory = catName;
                        if (this.paletteCategories) {
                            this.setupPalette(); // re-render tabs
                            return;
                        }
                        break;
                    }
                }
            }
        }

        for (const [action, def] of Object.entries(this.blockDefs)) {
            // Nur Blöcke der aktuellen Kategorie anzeigen
            const cat = this.categoryMap[this.currentCategory];
            if (cat && !cat.blocks.includes(action)) continue;

            const el = document.createElement('div');
            el.className = 'palette-block';
            el.dataset.action = action;
            el.dataset.type = def.type;
            el.textContent = def.icon + ' ' + def.label;
            el.title = def.label; // Tooltip added for hover

            if (!this.unlockedBlocks.includes(action)) {
                el.classList.add('locked');
            } else {
                if (this.newBlocks && this.newBlocks.includes(action)) {
                    el.classList.add('is-new');
                }
                el.addEventListener('click', () => this.insertBlock(action));
            }

            this.paletteBar.appendChild(el);
        }
    }

    // ═══════════════════════════════════════════════
    // BLOCK EINFÜGEN / ENTFERNEN (GDD 8.1 + 8.2)
    // ═══════════════════════════════════════════════
    insertBlock(action) {
        const def = this.blockDefs[action];
        if (!def) return;

        let defaultParam = undefined;
        if (action === 'IF_COLOR' || action === 'WAIT_UNTIL') {
            defaultParam = 'color_blue';
        } else if (action === 'MOVE_FWD' || action === 'MOVE_BWD' || action === 'TURN_LEFT' || action === 'TURN_RIGHT' || action === 'WAIT_SEC') {
            defaultParam = 1;
        }

        const block = {
            action: action,
            param: defaultParam,
            icon: def.icon,
            label: def.label,
            type: def.type,
            isNew: true
        };

        // An Cursor-Position einfügen
        this.program.splice(this.cursorIndex, 0, block);
        // Cursor rückt eins weiter
        this.cursorIndex++;

        this.render();

        // Haptic Feedback (wenn verfügbar)
        if (navigator.vibrate) navigator.vibrate(15);
    }

    removeBlock(index) {
        if (index < 0 || index >= this.program.length) return;

        // Animierte Entfernung
        const lines = this.codeArea.querySelectorAll('.code-line');
        if (lines[index]) {
            lines[index].classList.add('removing');
            setTimeout(() => {
                this.program.splice(index, 1);
                // Cursor anpassen
                if (this.cursorIndex > index) this.cursorIndex--;
                if (this.cursorIndex > this.program.length) this.cursorIndex = this.program.length;
                this.render();
            }, 250);
        } else {
            this.program.splice(index, 1);
            if (this.cursorIndex > index) this.cursorIndex--;
            if (this.cursorIndex > this.program.length) this.cursorIndex = this.program.length;
            this.render();
        }

        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    }

    moveBlock(index, direction) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= this.program.length) return;

        // Tausche Blöcke im Array
        const temp = this.program[index];
        this.program[index] = this.program[targetIndex];
        this.program[targetIndex] = temp;

        // Passe den Cursor-Index an, damit er mitwandert
        if (this.cursorIndex === index) {
            this.cursorIndex = targetIndex;
        } else if (this.cursorIndex === index + 1) {
            this.cursorIndex = targetIndex + 1;
        }

        this.render();

        if (navigator.vibrate) navigator.vibrate(10);
    }

    setCursor(index) {
        this.cursorIndex = Math.max(0, Math.min(index, this.program.length));
        this.render();
    }

    clearProgram() {
        this.program = [];
        this.cursorIndex = 0;
        this.render();
    }

    // ═══════════════════════════════════════════════
    // RENDERN (Code-Bereich mit Blöcken + Cursor)
    // ═══════════════════════════════════════════════
    render() {
        if (!this.codeArea) return;
        this.codeArea.innerHTML = '';

        if (this.program.length === 0 && this.mode === 'a') {
            this.codeArea.innerHTML = '<div class="code-area-empty">Tippe unten auf Blöcke ▼</div>';
            return;
        }

        if (this.program.length === 0) {
            // Leerer Zustand: nur blinkende Marke
            const cursor = this._createCursor(0, true);
            this.codeArea.appendChild(cursor);
            const hint = document.createElement('div');
            hint.className = 'code-area-empty';
            hint.textContent = 'Tippe auf einen Befehl unten, um dein Programm zu bauen';
            this.codeArea.appendChild(hint);
            return;
        }

        // Cursor VOR erstem Block (Position 0)
        this.codeArea.appendChild(this._createCursor(0, this.cursorIndex === 0));

        // Blöcke mit Cursors dazwischen
        for (let i = 0; i < this.program.length; i++) {
            const block = this.program[i];
            const line = this._createCodeLine(block, i);
            this.codeArea.appendChild(line);

            // Cursor NACH diesem Block (Position i+1)
            const isActive = (this.cursorIndex === i + 1);
            this.codeArea.appendChild(this._createCursor(i + 1, isActive));
        }

        this._initSortable();

        // Auto-Scroll zum Cursor
        this._scrollToCursor();
    }

    _createCodeLine(block, index) {
        const line = document.createElement('div');
        line.className = 'code-line';
        line.dataset.type = block.type;
        line.dataset.index = index;

        if (block.isNew) {
            line.classList.add('pop-in-animation');
            delete block.isNew;
        }

        // Visuelles Highlighting für das Klammer-System (Schleifen & Bedingungen)
        let nestLevel = 0;
        for (let i = 0; i < index; i++) {
            const act = this.program[i].action;
            if (act === 'REPEAT_ALL' || act === 'IF_COLOR') {
                nestLevel++;
            }
            if (act === 'LOOP_END' || act === 'END_IF') {
                nestLevel = Math.max(0, nestLevel - 1);
            }
        }
        
        // Der End-Block selbst und ELSE dürfen nicht eingerückt sein (sie gehören auf das übergeordnete Level)
        let visualIndent = nestLevel;
        if (block.action === 'LOOP_END' || block.action === 'END_IF' || block.action === 'ELSE') {
            visualIndent = Math.max(0, nestLevel - 1);
        }
        
        if (visualIndent > 0) {
            line.style.borderLeft = `${6 * visualIndent}px solid #d946ef`; // Logik-Violett
            line.style.backgroundColor = `rgba(217, 70, 239, ${0.1 * visualIndent + 0.1})`; 
            line.style.boxShadow = 'inset 0 0 10px rgba(217, 70, 239, 0.1)';
            line.style.marginLeft = `${20 * visualIndent}px`; // Einrücken für visuelles Feedback
            line.style.width = `calc(100% - ${20 * visualIndent}px)`; // Breite anpassen
        } else {
            line.style.borderLeft = '';
            line.style.backgroundColor = '';
            line.style.boxShadow = '';
            line.style.marginLeft = '0px';
            line.style.width = '100%';
        }

        // Sicherstellen, dass ein Standardparameter existiert
        if (block.param === undefined) {
            if (block.action === 'WAIT_UNTIL') {
                block.param = 'color_blue';
            } else if (block.action === 'IF_COLOR') {
                block.param = 'blue';
            } else {
                block.param = 1;
            }
        }

        let stepperHTML = '';
        const hasParam = ['MOVE_FWD', 'MOVE_BWD', 'TURN_LEFT', 'TURN_RIGHT', 'REPEAT_ALL', 'WAIT_SEC'].includes(block.action);
        if (hasParam) {
            const displayVal = block.action.startsWith('TURN') ? (block.param * 90) + '°' : (block.action === 'WAIT_SEC' ? block.param + 's' : block.param);
            stepperHTML = `
                <div class="block-stepper">
                    <button class="stepper-btn btn-minus">-</button>
                    <span class="stepper-value">${displayVal}</span>
                    <button class="stepper-btn btn-plus">+</button>
                </div>
            `;
        } else if (block.action === 'IF_COLOR') {
            const val = block.param || 'blue';
            stepperHTML = `
                <select class="block-select" style="margin-left: 8px; background: #ffffff; border: 1px solid #bbf7d0; border-radius: 4px; padding: 2px 4px; color: #064e3b; font-size: 0.9rem; font-family: inherit; pointer-events: auto; outline: none; cursor: pointer;">
                    <option value="blue" ${val === 'blue' ? 'selected' : ''}>Blau 🔵</option>
                    <option value="red" ${val === 'red' ? 'selected' : ''}>Rot 🔴</option>
                </select>
            `;
        } else if (block.action === 'WAIT_UNTIL') {
            const val = block.param || 'color_blue';
            stepperHTML = `
                <select class="block-select" style="margin-left: 8px; background: #ffffff; border: 1px solid #bbf7d0; border-radius: 4px; padding: 2px 4px; color: #064e3b; font-size: 0.9rem; font-family: inherit; pointer-events: auto; outline: none; cursor: pointer;">
                    <option value="color_blue" ${val === 'color_blue' ? 'selected' : ''}>Farbe: Blau 🔵</option>
                    <option value="color_red" ${val === 'color_red' ? 'selected' : ''}>Farbe: Rot 🔴</option>
                    <option value="touch" ${val === 'touch' ? 'selected' : ''}>Hindernis (Tastsensor) 🧱</option>
                </select>
            `;
        }

        line.innerHTML = `
            <span class="block-drag-handle" title="Block verschieben (Ziehen)">☰</span>
            <span class="block-icon" title="${block.label}">${block.icon}</span>
            <span class="block-label" title="${block.label}">${block.label}</span>
            ${stepperHTML}
            <span class="block-index" title="Schritt-Nummer">${index + 1}</span>
            <div class="block-move-btns">
                <button class="block-move-btn btn-up" aria-label="Nach oben" title="Block nach oben verschieben" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="block-move-btn btn-down" aria-label="Nach unten" title="Block nach unten verschieben" ${index === this.program.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
            <button class="block-delete-btn" aria-label="Löschen" title="Block löschen">×</button>
        `;

        // Lösch-Button Event-Listener (Propagation stoppen, damit die Zeile nicht selektiert/gedrückt wird)
        const deleteBtn = line.querySelector('.block-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
            });
            deleteBtn.addEventListener('pointerup', (e) => {
                e.stopPropagation();
            });
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBlock(index);
            });
        }

        // Verschiebe-Buttons Event-Listener
        const btnUp = line.querySelector('.btn-up');
        const btnDown = line.querySelector('.btn-down');
        if (btnUp) {
            btnUp.addEventListener('pointerdown', (e) => e.stopPropagation());
            btnUp.addEventListener('pointerup', (e) => e.stopPropagation());
            btnUp.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveBlock(index, -1);
            });
        }
        if (btnDown) {
            btnDown.addEventListener('pointerdown', (e) => e.stopPropagation());
            btnDown.addEventListener('pointerup', (e) => e.stopPropagation());
            btnDown.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveBlock(index, 1);
            });
        }

        // Stepper Event-Listener (Wert ändern ohne komplettes Neu-Rendern)
        if (hasParam) {
            const btnMinus = line.querySelector('.btn-minus');
            const btnPlus = line.querySelector('.btn-plus');
            const valSpan = line.querySelector('.stepper-value');
            if (btnMinus && btnPlus && valSpan) {
                btnMinus.addEventListener('pointerdown', (e) => e.stopPropagation());
                btnMinus.addEventListener('pointerup', (e) => e.stopPropagation());
                btnMinus.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (block.param > 1) {
                        block.param--;
                        const displayVal = block.action.startsWith('TURN') ? (block.param * 90) + '°' : (block.action === 'WAIT_SEC' ? block.param + 's' : block.param);
                        valSpan.textContent = displayVal;
                    }
                });

                btnPlus.addEventListener('pointerdown', (e) => e.stopPropagation());
                btnPlus.addEventListener('pointerup', (e) => e.stopPropagation());
                btnPlus.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const maxVal = block.action.startsWith('TURN') ? 4 : 10;
                    if (block.param < maxVal) {
                        block.param++;
                        const displayVal = block.action.startsWith('TURN') ? (block.param * 90) + '°' : (block.action === 'WAIT_SEC' ? block.param + 's' : block.param);
                        valSpan.textContent = displayVal;
                    }
                });
            }
        }

        const selectEl = line.querySelector('.block-select');
        if (selectEl) {
            selectEl.addEventListener('pointerdown', (e) => e.stopPropagation());
            selectEl.addEventListener('pointerup', (e) => e.stopPropagation());
            selectEl.addEventListener('change', (e) => {
                block.param = e.target.value;
            });
        }

        // 1. Drag & Drop Reordering (only on drag handle)
        let startY = 0;
        const dragHandle = line.querySelector('.block-drag-handle');
        
        // 2. Click & Long-Press Delete (on the rest of the block)
        let pressTimer = null;
        let didLongPress = false;

        const startPress = (e) => {
            if (e.target.closest('.block-delete-btn') || e.target.closest('.block-stepper') || e.target.closest('.block-move-btns') || e.target.closest('.block-drag-handle')) return;
            didLongPress = false;
            pressTimer = setTimeout(() => {
                didLongPress = true;
                this.removeBlock(index);
            }, 500);
        };

        const endPress = (e) => {
            if (e.target.closest('.block-delete-btn') || e.target.closest('.block-stepper') || e.target.closest('.block-move-btns') || e.target.closest('.block-drag-handle')) return;
            clearTimeout(pressTimer);
            if (!didLongPress) {
                this.setCursor(index + 1);
            }
        };

        const cancelPress = () => {
            clearTimeout(pressTimer);
        };

        line.addEventListener('pointerdown', startPress);
        line.addEventListener('pointerup', endPress);
        line.addEventListener('pointerleave', cancelPress);
        line.addEventListener('pointercancel', cancelPress);

        return line;
    }

    _createCursor(position, isActive) {
        const cursor = document.createElement('div');
        cursor.className = 'insertion-cursor' + (isActive ? ' active' : '');
        cursor.innerHTML = '<div class="cursor-line"></div>';

        cursor.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setCursor(position);
        });

        return cursor;
    }

    _scrollToCursor() {
        requestAnimationFrame(() => {
            const activeCursor = this.codeArea.querySelector('.insertion-cursor.active');
            if (activeCursor) {
                activeCursor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    _initSortable() {
        if (!window.Sortable) return;
        
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
        }

        this.sortableInstance = new Sortable(this.codeArea, {
            animation: 150,
            handle: '.block-drag-handle',
            draggable: '.code-line', // Nur die Blöcke sind draggable, Cursor bleiben stehen
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                // Hole die neue Reihenfolge anhand der DOM-Elemente
                const lines = Array.from(this.codeArea.querySelectorAll('.code-line'));
                const newProgram = lines.map(line => this.program[parseInt(line.dataset.index)]);
                this.program = newProgram;
                
                // Setze den Cursor am besten ans Ende, da sich die Indizes verschoben haben könnten
                this.cursorIndex = this.program.length;
                
                // Neu rendern
                setTimeout(() => this.render(), 10);
            }
        });
    }

    // ═══════════════════════════════════════════════
    // MODUS A/B TOGGLE (GDD 7.2 / 7.3)
    // ═══════════════════════════════════════════════
    toggleMode() {
        this.setMode(this.mode === 'a' ? 'b' : 'a');
    }

    setMode(m) {
        this.mode = m;
        if (this.editorBar) {
            this.editorBar.classList.remove('mode-a', 'mode-b');
            this.editorBar.classList.add('mode-' + m);
        }
        document.body.classList.remove('editor-mode-a', 'editor-mode-b');
        document.body.classList.add('editor-mode-' + m);
        this.render();
    }

    // ═══════════════════════════════════════════════
    // PROGRAMM AUSFÜHREN
    // ═══════════════════════════════════════════════
    runProgram() {
        if (this.program.length === 0) {
            // Ada-style Hinweis statt alert
            const sensorOut = document.getElementById('sensor-output');
            if (sensorOut) sensorOut.innerText = '💡 Füge zuerst Befehle hinzu!';
            return;
        }

        // In Modus A wechseln (3D groß zum Zusehen)
        this.setMode('a');

        // Queue an Engine senden (Aktion + Parameter)
        const queue = this.program.map(b => ({ action: b.action, param: b.param || 1 }));
        if (window.gameEngine) {
            window.gameEngine.startSimpleQueue(queue);
        }
    }

    stopProgram() {
        if (window.gameEngine) {
            window.gameEngine.stopExecution();
        }
        this.setMode('b');
    }

    // ═══════════════════════════════════════════════
    // BLOCK-HIGHLIGHT bei Ausführung (GDD 10.2 Vorbereitung)
    // ═══════════════════════════════════════════════
    highlightBlock(index) {
        const lines = this.codeArea.querySelectorAll('.code-line');
        lines.forEach((l, i) => {
            l.classList.toggle('executing', i === index);
        });
    }

    clearHighlights() {
        const lines = this.codeArea.querySelectorAll('.code-line');
        lines.forEach(l => l.classList.remove('executing'));
    }
}

// Initialisierung nach DOM-Load
document.addEventListener('DOMContentLoaded', () => {
    window.simpleCoding = new SimpleCoding();
});
