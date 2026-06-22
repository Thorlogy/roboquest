// game.js - Game Logic and Pseudo-Code Interpreter

// World Generation (0 = sand, 1 = rock, 2 = scrap)
let mapData = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

class Robot {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.targetX = startX;
        this.targetY = startY;
        this.angle = 0; // 0=right, 90=down, 180=left, 270=up
        this.targetAngle = 0;
        
        this.isMoving = false;
        this.moveSpeed = 3; // Grid tiles per second
        this.turnSpeed = 180; // Degrees per second
    }

    update(dt) {
        // Normalize angles
        if (this.angle >= 360) this.angle -= 360;
        if (this.angle < 0) this.angle += 360;
        if (this.targetAngle >= 360) this.targetAngle -= 360;
        if (this.targetAngle < 0) this.targetAngle += 360;

        let reachedPos = false;
        let reachedAngle = false;

        // Position interpolation
        if (this.x !== this.targetX || this.y !== this.targetY) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 0.05) { reachedPos = true; } 
            else {
                this.x += (dx / dist) * this.moveSpeed * dt;
                this.y += (dy / dist) * this.moveSpeed * dt;
            }
        } else {
            reachedPos = true;
        }

        // Angle interpolation (naive shortest path)
        if (this.angle !== this.targetAngle) {
            let diff = this.targetAngle - this.angle;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            
            if (Math.abs(diff) < 2) { 
                this.angle = this.targetAngle; 
                reachedAngle = true; 
            } else {
                this.angle += Math.sign(diff) * this.turnSpeed * dt;
            }
        } else {
            reachedAngle = true;
        }

        this.isMoving = !(reachedPos && reachedAngle);
        if (!this.isMoving) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.angle = this.targetAngle;
        }
    }

    draw(ctx, tileSize) {
        ctx.save();
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(tileSize/2, tileSize/2 + 10, tileSize/3, tileSize/6, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.translate(tileSize/2, tileSize/2);
        ctx.rotate(this.angle * Math.PI / 180);

        // Rover Body
        ctx.fillStyle = '#cbd5e1'; 
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-tileSize/3, -tileSize/4, tileSize/1.5, tileSize/2, 4);
        else ctx.rect(-tileSize/3, -tileSize/4, tileSize/1.5, tileSize/2);
        ctx.fill();

        // Solar panels (upgrades showcase)
        ctx.fillStyle = '#0284c7'; // dark blue panels
        ctx.fillRect(-tileSize/4, -tileSize/3, tileSize/4, tileSize/6);
        ctx.fillRect(-tileSize/4, tileSize/6, tileSize/4, tileSize/6);
        
        // Frame/lines on solar panels
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(-tileSize/4, -tileSize/3, tileSize/4, tileSize/6);
        ctx.strokeRect(-tileSize/4, tileSize/6, tileSize/4, tileSize/6);

        // Scanner Head (Camera)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(tileSize/6, 0, tileSize/8, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#38bdf8'; // Glowing eye
        ctx.beginPath();
        ctx.arc(tileSize/6 + 2, 0, Math.max(2, tileSize/16), 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const engine = new GameEngine('game-canvas');
    engine.setMap(mapData);
    
    // Spawn Robot
    const rover = new Robot(1, 1);
    engine.addEntity(rover);
    engine.setCameraFocus(rover);

    // Game state
    let energy = 100;
    let inventory = 0;
    
    // UI Elements
    const energyFill = document.getElementById('energy-fill');
    const energyText = document.getElementById('energy-text');
    const invCount = document.getElementById('inventory-count');
    const termLog = document.getElementById('terminal-log');
    const editor = document.getElementById('code-editor');
    const btnRun = document.getElementById('btn-run');
    const btnStop = document.getElementById('btn-stop');
    const lineNumbers = document.getElementById('line-numbers');

    function log(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `log-${type}`;
        div.innerText = `> ${msg}`;
        termLog.appendChild(div);
        termLog.scrollTop = termLog.scrollHeight;
    }

    function updateHUD() {
        energyFill.style.width = `${energy}%`;
        energyFill.style.background = energy < 20 ? 'red' : 'linear-gradient(90deg, #ffcc00, #ff6b35)';
        energyText.innerText = `${Math.floor(energy)}/100`;
        invCount.innerText = `${inventory} Schrottteile`;
    }

    // Editor logic - Line numbers sync
    function updateLineNumbers() {
        const lines = editor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    }
    editor.addEventListener('input', updateLineNumbers);

    // Sync scrolling between textarea and line numbers
    editor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = editor.scrollTop;
    });

    // Snippet Buttons
    document.querySelectorAll('.snippet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const snip = btn.getAttribute('data-snip');
            const start = editor.selectionStart;
            editor.value = editor.value.substring(0, start) + snip + "\n" + editor.value.substring(editor.selectionEnd);
            updateLineNumbers();
            editor.focus();
            editor.selectionStart = editor.selectionEnd = start + snip.length + 1;
        });
    });

    // Interpreter execution loop
    let executionQueue = [];
    let isExecuting = false;
    let abortExecution = false;

    async function runProgram() {
        if (isExecuting) return;
        isExecuting = true;
        abortExecution = false;
        log('Kompiliere ROV-OS Skript...', 'info');

        // Simple parser
        const code = editor.value;
        const commands = code.split('\n');
        
        executionQueue = [];

        // Parse simplified pseudo-code
        for(let line of commands) {
            line = line.trim();
            if (line.startsWith('//') || line === '') continue;
            
            if (line.includes('moveForward')) executionQueue.push('move');
            else if (line.includes('turnRight')) executionQueue.push('right');
            else if (line.includes('turnLeft')) executionQueue.push('left');
            else if (line.includes('scan')) executionQueue.push('scan');
            else {
                log(`Syntaxfehler: Unbekannter Befehl "${line}"`, 'error');
                isExecuting = false;
                return;
            }
        }

        log(`Programm erfolgreich geparsed. Ausführung startet.`, 'info');

        // Execute commands sequentially
        for (let action of executionQueue) {
            if (abortExecution) {
                log('Ausführung vom Benutzer abgebrochen.', 'warn');
                break;
            }

            if (energy <= 0) {
                log('Kritischer Fehler: Batteriestatus 0%.', 'error');
                break;
            }

            await executeAction(action);
            
            // Check Map Interactions
            const rx = Math.round(rover.x);
            const ry = Math.round(rover.y);
            if (mapData[ry] && mapData[ry][rx] === 2) {
                mapData[ry][rx] = 0; // Remove item from map
                inventory++;
                energy = Math.min(100, energy + 10); // Restore some energy as reward
                log('Schrottteil gesammelt! +10 Energie.', 'info');
                updateHUD();
            }
            
            energy -= 2; // Energy cost per command
            updateHUD();
        }

        isExecuting = false;
        if (!abortExecution && energy > 0) log('Programmzyklus abgeschlossen.', 'info');
    }

    function executeAction(action) {
        return new Promise(resolve => {
            if (action === 'move') {
                let tx = Math.round(rover.x);
                let ty = Math.round(rover.y);
                const a = Math.round(rover.targetAngle);
                
                if (a === 0 || a === 360) tx++;
                else if (a === 90 || a === -270) ty++;
                else if (a === 180 || a === -180) tx--;
                else if (a === 270 || a === -90) ty--;

                // Collision pass
                if (tx >= 0 && ty >= 0 && mapData[ty] && mapData[ty][tx] !== 1) {
                    rover.targetX = tx;
                    rover.targetY = ty;
                } else {
                    log('Kollision! Bewegung blockiert durch Felsen.', 'error');
                }
            } else if (action === 'right') {
                rover.targetAngle += 90;
            } else if (action === 'left') {
                rover.targetAngle -= 90;
            } else if (action === 'scan') {
                log('Scanner-Modul aktiv... Kartiere Sektor.', 'info');
                // Could highlight tiles ahead
            }

            // Wait until robot physically finishes the animation
            const checkDone = setInterval(() => {
                if (!rover.isMoving) {
                    clearInterval(checkDone);
                    setTimeout(resolve, 200); // Tiny pause between code blocks
                }
            }, 50);
        });
    }

    btnRun.addEventListener('click', runProgram);
    btnStop.addEventListener('click', () => {
        if (isExecuting) abortExecution = true;
    });

    // Init display
    updateHUD();
    updateLineNumbers();
    
    // Quick mission splash screen
    const modal = document.getElementById('overlay-msg');
    const modalBtn = document.getElementById('modal-btn');
    modal.classList.remove('hidden');
    modalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        log('Mission gestartet: Sammle Schrottteile in Sektor 7G.', 'info');
    });
});
