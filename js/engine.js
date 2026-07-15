/**
 * RoboQuest 3D - Core Engine (v23 Modular)
 * Main game loop, initialization, input handling.
 * Domain logic is in: sensors.js, world.js, robot.js, quests.js, effects.js
 */
/**
 * RoboQuest 3D - Core Engine (v5 Story Exploration)
 * Features: Fog of War, Collectibles, Secret Zones, Story Quests, Score Multipliers
 */
let scene, camera, renderer;
let roverGroup, trackLeft, trackRight, lidar;
let isRunning = false;
let clock = new THREE.Clock();
let controls;
let animals = [];
let worldModifications = [];

// Load saved world mods
try {
    const savedMods = localStorage.getItem('roboquest_world_mods');
    if (savedMods) worldModifications = JSON.parse(savedMods);
} catch(e) {}

function saveWorldModifications() {
    localStorage.setItem('roboquest_world_mods', JSON.stringify(worldModifications));
}

// ── Input State ─────────────────────────────────────────────────
let inputState = { forward: false, backward: false, left: false, right: false };

// ── Game / Score State ──────────────────────────────────────────
let score = 0;
let targetMesh = null;
let targetPosition = new THREE.Vector3(0, 0, 50);
let targetReached = false;
let goalCheckDelay = 0;
let moveSpeed = 8;
const TURN_SPEED = 2.0;
const CAM_DISTANCE = 14;
const CAM_HEIGHT = 9;
const CAM_LERP = 0.04;
var cameraChaseMode = true;

// ── Collisions ──────────────────────────────────────────────────
let obstacles = [];

// ── Tire Trails ─────────────────────────────────────────────────
let trails = [];
const TRAIL_INTERVAL = 0.08;
const TRAIL_LIFETIME = 12;
let trailTimer = 0;
const trailMat = new THREE.MeshBasicMaterial({ color: 0x3a2510, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
const trailGeo = new THREE.PlaneGeometry(0.5, 0.4);

function meshAt(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
}

// Logic variables (Blockly execution)
let rStack = [];
let currentCommandObj = null;
let currentCommand = null;
let commandProgress = 0;
let gripperState = 'OPEN';
let programDriven = false; // Track if items collected via program
let programMotorState = { forward: false, backward: false, left: false, right: false }; // Continuous programmatic motion
let foxes = [];
let turbines = [];

function rPush(block) {
    if (block) rStack.push({ block: block, state: 0, totalDist: 0, waitTime: 0 });
}

// ════════════════════════════════════════════════════════════════
// STORY QUEST SYSTEM
// ════════════════════════════════════════════════════════════════
var storyState = {
    currentAct: 1,
    objectives: {},
    completedActs: [],
    unlockedFeatures: ['drive'],
    zonesDiscovered: [],
    itemsCollected: { trash: 0, seed: 0, datachip: 0, key: 0 },
    itemsPickedUp: { trash: 0, seed: 0, datachip: 0, key: 0 },
    totalItemsCollected: 0,
    seedsPlanted: 0,
    turbinesRepaired: 0,
    blocksUsedLastRun: 0,
    blocksDetailed: { move: 0, turn: 0, loop: 0, logic: 0, action: 0 },
    batteryLevel: 100
};



// ════════════════════════════════════════════════════════════════
// MINI MAP
// ════════════════════════════════════════════════════════════════
function initMiniMap() {
    minimapCanvas = document.getElementById('minimap-canvas');
    if (!minimapCanvas) return;
    minimapCanvas.width = MINIMAP_SIZE;
    minimapCanvas.height = MINIMAP_SIZE;
    minimapCtx = minimapCanvas.getContext('2d');
}

function drawMiniMap() {
    if (!minimapCtx || !roverGroup) return;
    const ctx = minimapCtx;
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
    
    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    const worldScale = MINIMAP_SIZE / WORLD_SIZE;
    const toMap = (wx, wz) => ({
        x: (wx + WORLD_SIZE/2) * worldScale,
        y: (wz + WORLD_SIZE/2) * worldScale
    });

    // Obstacles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    obstacles.forEach(obs => {
        const p = toMap(obs.x, obs.z);
        ctx.beginPath();
        ctx.arc(p.x, p.y, obs.radius * worldScale, 0, Math.PI*2);
        ctx.fill();
    });

    // Collectibles (if discovered by fog or nearby)
    collectibles.forEach(item => {
        if (item.collected || (fogEnabled && !item.discovered)) return;
        const p = toMap(item.mesh.position.x, item.mesh.position.z);
        ctx.fillStyle = (item.type === 'trash') ? '#ef4444' : (item.type === 'key' ? '#fbbf24' : '#4ade80');
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2); ctx.fill();
    });

    // Charging stations
    chargingStations.forEach(station => {
        const p = toMap(station.x, station.z);
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = '6px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⚡', p.x, p.y);
    });

    // Robot
    const rp = toMap(roverGroup.position.x, roverGroup.position.z);
    ctx.save();
    ctx.translate(rp.x, rp.y);
    ctx.rotate(-roverGroup.rotation.y + Math.PI); // Adjust for 2D orientation
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(-4, 4); ctx.lineTo(4, 4); ctx.closePath();
    ctx.fill();
    // Front light dot
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.arc(0, -3, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}
let fogCanvas, fogCtx;
const FOG_RES = 512;
const FOG_WORLD = 450;
let fogRevealData;
let mapCoveragePercent = 0;
let fogEnabled = false;

function initFog() {
    fogCanvas = document.getElementById('fog-canvas');
    fogCanvas.width = FOG_RES;
    fogCanvas.height = FOG_RES;
    fogCtx = fogCanvas.getContext('2d');
    fogRevealData = new Uint8Array(FOG_RES * FOG_RES);
    // Check if current act uses fog
    const act = STORY_ACTS[storyState.currentAct];
    fogEnabled = act && act.hasFog === true;
    if (fogEnabled) {
        fogCanvas.style.display = 'block';
        fogCtx.fillStyle = 'rgba(15, 23, 42, 1)';
        fogCtx.fillRect(0, 0, FOG_RES, FOG_RES);
        revealFog(0, 0, 20);
    } else {
        fogCanvas.style.display = 'none';
    }
}

function setFogForAct(act) {
    fogEnabled = act && act.hasFog === true;
    if (fogEnabled) {
        fogCanvas.style.display = 'block';
        fogRevealData = new Uint8Array(FOG_RES * FOG_RES);
        fogCtx.fillStyle = 'rgba(15, 23, 42, 1)';
        fogCtx.fillRect(0, 0, FOG_RES, FOG_RES);
        revealFog(roverGroup ? roverGroup.position.x : 0, roverGroup ? roverGroup.position.z : 0, 20);
        document.getElementById('hud-map-coverage').style.display = 'block';
    } else {
        fogCanvas.style.display = 'none';
        document.getElementById('hud-map-coverage').style.display = 'none';
    }
}

function worldToFog(wx, wz) {
    return {
        fx: Math.floor((wx + FOG_WORLD / 2) / FOG_WORLD * FOG_RES),
        fy: Math.floor((-wz + FOG_WORLD / 2) / FOG_WORLD * FOG_RES)
    };
}

function revealFog(wx, wz, radius) {
    if (!fogEnabled) return;
    const { fx, fy } = worldToFog(wx, wz);
    const pr = Math.floor(radius / FOG_WORLD * FOG_RES);
    fogCtx.globalCompositeOperation = 'destination-out';
    const grad = fogCtx.createRadialGradient(fx, fy, 0, fx, fy, pr);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    fogCtx.fillStyle = grad;
    fogCtx.beginPath();
    fogCtx.arc(fx, fy, pr, 0, Math.PI * 2);
    fogCtx.fill();
    fogCtx.globalCompositeOperation = 'source-over';
    
    // Update coverage tracking
    for (let dy = -pr; dy <= pr; dy++) {
        for (let dx = -pr; dx <= pr; dx++) {
            const px = fx + dx, py = fy + dy;
            if (px >= 0 && px < FOG_RES && py >= 0 && py < FOG_RES) {
                if (dx*dx + dy*dy <= pr*pr * 0.5) {
                    fogRevealData[py * FOG_RES + px] = 1;
                }
            }
        }
    }
}

function updateMapCoverage() {
    let revealed = 0;
    // Sample every 4th pixel for performance
    for (let i = 0; i < fogRevealData.length; i += 4) {
        if (fogRevealData[i]) revealed++;
    }
    mapCoveragePercent = Math.round(revealed / (fogRevealData.length / 4) * 100);
    document.getElementById('map-coverage').innerText = mapCoveragePercent;
}

// ════════════════════════════════════════════════════════════════
// SECRET ZONE CHECKING
// ════════════════════════════════════════════════════════════════
function checkSecretZones() {
    if (window.missionManager && window.missionManager.missionActive) return;
    if (!roverGroup) return;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;

    for (const zone of SECRET_ZONES) {
        if (zone.id === 'base') continue; // Skip home base zone
        if (storyState.zonesDiscovered.includes(zone.id)) continue;
        if (Math.hypot(rx - zone.x, rz - zone.z) < zone.radius) {
            if (zone.requireKey && storyState.itemsCollected.key < 1) {
                document.getElementById('sensor-output').innerText = "🔒 Dieser Ort braucht einen Schlüssel!";
                return;
            }
            if (zone.requireScan) {
                document.getElementById('sensor-output').innerText = "🔍 Nutze den 'Scanne Umgebung' Block hier!";
                return;
            }
            discoverZone(zone);
        }
    }
}

function discoverZone(zone) {
    storyState.zonesDiscovered.push(zone.id);
    let mult = programDriven ? 3 : 1;
    const pts = zone.points * mult;
    score += pts;
    document.getElementById('score-display').innerText = score;
    showMultiplier(mult);

    // Big reveal fog
    revealFog(zone.x, zone.z, 35);

    if (window.audioEngine) window.audioEngine.playDiscoverySound();

    // Show discovery popup
    document.getElementById('zone-icon').innerText = zone.icon;
    document.getElementById('zone-title').innerText = zone.name + " entdeckt!";
    document.getElementById('zone-story').innerText = zone.story;
    document.getElementById('zone-reward').innerText = "+" + pts + " Punkte" + (mult > 1 ? " • ×" + mult + " Multiplikator!" : "");
    document.getElementById('zone-discovery').style.display = 'block';

    checkQuestProgress();
}
// ════════════════════════════════════════════════════════════════
// RECURSIVE BLOCK EVALUATOR
// ════════════════════════════════════════════════════════════════
function evaluateSensorBlock(block) {
    if (!block) return false;
    const sensorOutput = document.getElementById('sensor-output');
    const type = block.type;

    switch (type) {
        case 'sensor_touch': { const v = sensorTouch(); sensorOutput.innerText = v ? '👆 Berührt!' : '👆 Kein Kontakt.'; return v; }
        case 'sensor_obstacle_ahead': { const v = checkSensorObstacle(); sensorOutput.innerText = v ? '👁 Hindernis erkannt!' : '👁 Weg ist frei.'; return v; }
        case 'sensor_ultrasonic': { const v = sensorUltrasonic(); sensorOutput.innerText = '📏 Ultraschall: ' + v + ' cm'; return v; }
        case 'sensor_camera': { const d = sensorCamera(); const n = sensorCameraObjectName(); sensorOutput.innerText = '📸 Kamera: ' + n; return d; }
        case 'sensor_light': { const v = sensorLight(); sensorOutput.innerText = '☀️ Licht: ' + v + '%'; return v; }
        case 'sensor_rotation': { const v = sensorRotation(); sensorOutput.innerText = '🔄 Drehung: ' + v + '°'; return v; }
        case 'sensor_tilt': { const v = sensorTilt(); sensorOutput.innerText = '⛰️ Neigung: ' + v + '°'; return v; }
        case 'sensor_battery': { const v = Math.round(storyState.batteryLevel); sensorOutput.innerText = '🔋 Batterie: ' + v + '%'; return v; }
        case 'logic_compare': {
            const leftBlock = block.getInputTargetBlock('LEFT');
            const rightBlock = block.getInputTargetBlock('RIGHT');
            const l = evaluateSensorBlock(leftBlock);
            const r = evaluateSensorBlock(rightBlock);
            const op = block.getFieldValue('OP');
            let res = false;
            // Ensure we compare numbers as numbers
            const valL = Number(l), valR = Number(r);
            if (op === 'LT') res = valL < valR; else if (op === 'GT') res = valL > valR;
            else if (op === 'EQ') res = valL == valR; else if (op === 'LTE') res = valL <= valR;
            else if (op === 'GTE') res = valL >= valR;
            sensorOutput.innerText = '⑂ ' + valL + ' ' + op + ' ' + valR + ' → ' + (res ? 'WAHR' : 'FALSCH');
            return res;
        }
        case 'logic_not': return !evaluateSensorBlock(block.getInputTargetBlock('BOOL'));
        case 'number_value':
        case 'math_number':
        case 'math_integer':
        case 'math_whole_number':
             const fieldVal = block.getFieldValue('NUM') || block.getFieldValue('num') || block.getFieldValue('NUMBER');
             return parseFloat(fieldVal) || 0;
        case 'sense_distance': return sensorUltrasonic();
        default: 
            console.warn("Unknown sensor block type:", type);
            return false;
    }
}

// ════════════════════════════════════════════════════════════════
// AST INTERPRETER (rStep)
// ════════════════════════════════════════════════════════════════
function getColorUnderRobot() {
    if (!roverGroup) return 'none';
    const rx = roverGroup.position.x;
    const rz = roverGroup.position.z;
    
    // Check if robot is near a collectible with color
    if (typeof collectibles !== 'undefined') {
        for (const c of collectibles) {
            if (!c.collected) {
                const dist = Math.hypot(rx - c.x, rz - c.z);
                if (dist < 2.0 && c.color) {
                    return c.color;
                }
            }
        }
    }
    
    if (window.missionManager && window.missionManager.currentMission) {
        const mission = window.missionManager.currentMission;
        
        // Mission 8: Zielfeld ist blau
        if (mission.id === 8 && mission.goalPos) {
            const dist = Math.hypot(rx - mission.goalPos.x, rz - mission.goalPos.z);
            if (dist < 3.0) return 'blue';
        }
        
        // Allgemeine Farbbereiche für Missionen
        if (mission.colorZones) {
            for (const zone of mission.colorZones) {
                const dist = Math.hypot(rx - zone.x, rz - zone.z);
                if (dist < (zone.radius || 2.0)) {
                    return zone.color;
                }
            }
        }
    }
    return 'none';
}

function skipUntilBranch(targetActions) {
    while (rStack.length > 0) {
        const popped = rStack.pop();
        if (popped && popped.block && targetActions.includes(popped.block.action)) {
            break;
        }
    }
}

// ════════════════════════════════════════════════════════════════
// AST INTERPRETER (rStep)
// ════════════════════════════════════════════════════════════════
function rStep() {
    if (rStack.length === 0) return null;
    let ctx = rStack[rStack.length - 1];
    let b = ctx.block;

    // Track block usage at start
    if (ctx.state === 0) {
        storyState.blocksUsedLastRun++;
        const type = b.type;
        if (type.includes('move') || type.includes('turn') || type.includes('motor')) storyState.blocksDetailed.move++;
        else if (type.includes('repeat') || type.includes('while')) storyState.blocksDetailed.loop++;
        else if (type.includes('logic')) storyState.blocksDetailed.logic++;
        else if (type.includes('wait')) storyState.blocksDetailed.action++;
        else storyState.blocksDetailed.action++;
        // Highlight current block in editor (GDD 10.2)
        if (window.gameEngine && window.gameEngine.onBlockExecute) {
            window.gameEngine.onBlockExecute(b);
        }
    }

    if (b.type === 'move_robot') {
        if (ctx.state === 0) { 
            ctx.totalDist = parseInt(b.getFieldValue('DISTANCE'), 10) || 1; 
            ctx.state = 1; 
            programMotorState = { forward: false, backward: false, left: false, right: false };
        }
        if (ctx.state <= ctx.totalDist) { ctx.state++; return { action: b.getFieldValue('DIRECTION') === 'BACKWARD' ? 'moveBackward' : 'move', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'start_motor') {
        if (ctx.state === 0) {
            ctx.state = 1;
            const dir = b.getFieldValue('DIRECTION');
            programMotorState = { forward: false, backward: false, left: false, right: false };
            if (dir === 'FORWARD') programMotorState.forward = true;
            else if (dir === 'BACKWARD') programMotorState.backward = true;
            else if (dir === 'LEFT') programMotorState.left = true;
            else if (dir === 'RIGHT') programMotorState.right = true;
            return { action: 'startMotor', id: b.id };
        } else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'stop_motor') {
        if (ctx.state === 0) {
            ctx.state = 1;
            programMotorState = { forward: false, backward: false, left: false, right: false };
            return { action: 'stopMotor', id: b.id };
        } else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'turn_robot') {
        if (ctx.state === 0) { 
            ctx.totalDist = parseInt(b.getFieldValue('DISTANCE'), 10) || 1; 
            ctx.state = 1; 
            programMotorState = { forward: false, backward: false, left: false, right: false };
        }
        if (ctx.state <= ctx.totalDist) { ctx.state++; return { action: b.getFieldValue('DIRECTION') === 'LEFT' ? 'turnLeft' : 'turnRight', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'scan_object') {
        if (ctx.state === 0) {
            ctx.state = 1;
            const missionId = window.missionManager && window.missionManager.currentMission && window.missionManager.missionActive ? window.missionManager.currentMission.id : 0;
            if (missionId === 5) {
                document.getElementById('sensor-output').innerText = '🔍 Scan: ' + sensorCameraObjectName() + ' | 📏' + sensorUltrasonic() + 'cm';
            } else {
                document.getElementById('sensor-output').innerText = '🔍 Scan: ' + sensorCameraObjectName() + ' | 📏' + sensorUltrasonic() + 'cm | ☀️' + sensorLight() + '%';
            }
            revealFog(roverGroup.position.x, roverGroup.position.z, 35);
            for (const zone of SECRET_ZONES) {
                if (zone.requireScan && !storyState.zonesDiscovered.includes(zone.id)) {
                    if (Math.hypot(roverGroup.position.x - zone.x, roverGroup.position.z - zone.z) < zone.radius + 5) {
                        discoverZone(zone);
                    }
                }
            }
            return { action: 'scan', id: b.id };
        } else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'repeat_n') {
        if (ctx.state === 0) { ctx.totalDist = parseInt(b.getFieldValue('TIMES'), 10) || 1; ctx.state = 1; }
        if (ctx.state <= ctx.totalDist) { ctx.state++; rPush(b.getInputTargetBlock('DO')); return rStep(); }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'while_sensor') {
        if (ctx.state === 0) { ctx.totalDist = 0; ctx.state = 1; }
        if (ctx.totalDist >= 100) { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
        if (evaluateSensorBlock(b.getInputTargetBlock('CONDITION'))) { ctx.totalDist++; rPush(b.getInputTargetBlock('DO')); return rStep(); }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'logic_if_else') {
        if (ctx.state === 0) { ctx.state = 1; if (evaluateSensorBlock(b.getInputTargetBlock('IF_COND'))) rPush(b.getInputTargetBlock('DO_IF')); else rPush(b.getInputTargetBlock('DO_ELSE')); return rStep(); }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'motor') {
        if (b.action === 'MOTOR_FWD') {
            programMotorState.forward = true;
            programMotorState.backward = false;
        } else if (b.action === 'MOTOR_BWD') {
            programMotorState.backward = true;
            programMotorState.forward = false;
        } else if (b.action === 'MOTOR_STOP') {
            programMotorState.forward = false;
            programMotorState.backward = false;
            programMotorState.left = false;
            programMotorState.right = false;
        }
        rStack.pop();
        rPush(b.getNextBlock());
        return rStep();
    }
    else if (b.type === 'wait_seconds') {
        if (ctx.state === 0) { ctx.totalDist = parseFloat(b.getFieldValue('SECONDS')) || 1; ctx.state = 1; document.getElementById('sensor-output').innerText = '⏱ Warte ' + ctx.totalDist + 's...'; return { action: 'wait', id: b.id, duration: ctx.totalDist }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'wait_until_sensor') {
        if (ctx.state === 0) { ctx.waitTimer = 0; ctx.state = 1; }
        ctx.waitTimer = (ctx.waitTimer || 0) + 0.016;
        if (ctx.waitTimer > 30) {
            document.getElementById('sensor-output').innerText = '⏱ Timeout: Bedingung nie erfüllt!';
            rStack.pop(); rPush(b.getNextBlock()); return rStep();
        }
        return { action: 'waitUntil', id: b.id, conditionBlock: b.getInputTargetBlock('CONDITION') };
    }
    else if (b.type === 'wait_until') {
        if (ctx.state === 0) {
            ctx.state = 1;
            ctx.waitTimer = 0;
        }
        ctx.waitTimer = (ctx.waitTimer || 0) + 0.016;
        if (ctx.waitTimer > 30) {
            document.getElementById('sensor-output').innerText = '⏳ Timeout: Bedingung nie erfüllt!';
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }

        let conditionMet = false;
        let message = '';

        if (b.param === 'touch') {
            if (sensorTouch()) {
                conditionMet = true;
                message = '🧱 Hindernis erkannt!';
            }
        } else if (b.param.startsWith('color_')) {
            const targetColor = b.param.split('_')[1];
            const colorUnder = getColorUnderRobot();
            if (colorUnder === targetColor) {
                conditionMet = true;
                message = '⏳ Farbe ' + targetColor.toUpperCase() + ' erkannt!';
            }
        }

        if (conditionMet) {
            window.debugSensorText = '';
            document.getElementById('sensor-output').innerText = message;
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        } else {
            window.debugSensorText = '🐛 Debug: Warte auf ' + b.param;
        }
        
        return { action: 'wait', id: b.id, duration: 0.1 };
    }
    else if (b.type === 'if_color') {
        if (ctx.state === 0) {
            ctx.state = 1;
            const colorUnder = getColorUnderRobot();
            if (colorUnder === b.param) {
                rStack.pop();
                return rStep();
            } else {
                rStack.pop();
                skipUntilBranch(['ELSE', 'END_IF']);
                return rStep();
            }
        } else {
            rStack.pop();
            return rStep();
        }
    }
    else if (b.type === 'else_branch') {
        rStack.pop();
        skipUntilBranch(['END_IF']);
        return rStep();
    }
    else if (b.type === 'end_if_branch') {
        rStack.pop();
        return rStep();
    }
    else if (b.type === 'action_build') {
        if (ctx.state === 0) { ctx.state = 1; return { action: 'build', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'action_dig') {
        if (ctx.state === 0) { ctx.state = 1; return { action: 'dig', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'action_remove') {
        if (ctx.state === 0) { ctx.state = 1; return { action: 'remove', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'gripper_action') {
        if (ctx.state === 0) { ctx.state = 1; gripperState = b.getFieldValue('ACTION'); return { action: 'gripper', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'push_action') {
        if (ctx.state === 0) { ctx.totalDist = parseInt(b.getFieldValue('DURATION'), 10) || 1; ctx.state = 1; }
        if (ctx.state <= ctx.totalDist) { ctx.state++; return { action: 'push', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    rStack.pop(); rPush(b.getNextBlock()); return rStep();
}

// ════════════════════════════════════════════════════════════════
// COLLISION
// ════════════════════════════════════════════════════════════════
function checkCollision(x, z, yaw, isRotation) {
    const robotRadius = 1.3;
    for (const obs of obstacles) {
        if (obs.w !== undefined && obs.d !== undefined) {
            // Box-based collision (AABB vs Circle)
            const minX = obs.x - obs.w / 2;
            const maxX = obs.x + obs.w / 2;
            const minZ = obs.z - obs.d / 2;
            const maxZ = obs.z + obs.d / 2;
            const closestX = Math.max(minX, Math.min(x, maxX));
            const closestZ = Math.max(minZ, Math.min(z, maxZ));
            const distX = x - closestX;
            const distZ = z - closestZ;
            if (Math.hypot(distX, distZ) < robotRadius) return true;
        } else {
            // Circle-based collision (fallback)
            if (Math.hypot(x - obs.x, z - obs.z) < robotRadius + obs.radius) return true;
        }
    }
    return false;
}

// ════════════════════════════════════════════════════════════════
// REWARDS & HUD
// ════════════════════════════════════════════════════════════════
function showReward(reward) {
    document.getElementById('reward-icon').innerText = reward.icon;
    document.getElementById('reward-title').innerText = reward.title;
    document.getElementById('reward-desc').innerText = reward.desc;
    document.getElementById('reward-popup').style.display = 'block';
}

function updateHUD() {
    updateStoryUI();
    updateMapCoverage();
    updateEnergyHUD();
}

function updateEnergyHUD() {
    const el = document.getElementById('energy-level');
    const icon = document.getElementById('energy-icon');
    const container = document.getElementById('hud-energy');
    if (!el || !icon || !container) return;
    
    el.innerText = Math.round(storyState.batteryLevel);
    
    container.classList.remove('warn', 'crit', 'charging');
    const nearStation = roverGroup && isNearChargingStation(roverGroup.position.x, roverGroup.position.z);
    if (storyState.batteryLevel <= 20) {
        container.classList.add('crit');
    } else if (storyState.batteryLevel <= 50) {
        container.classList.add('warn');
    } else if (nearStation) {
        container.classList.add('charging');
    }
}

// ════════════════════════════════════════════════════════════════
// TARGET & MOVE
// ════════════════════════════════════════════════════════════════
function buildTargetRing() {
    if (targetMesh) scene.remove(targetMesh);
    const ringGeo = new THREE.TorusGeometry(2.5, 0.3, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.8 });
    targetMesh = new THREE.Mesh(ringGeo, ringMat);
    targetMesh.rotation.x = Math.PI / 2;
    const ty = getTerrainYGlobal(targetPosition.x, targetPosition.z);
    targetMesh.position.set(targetPosition.x, ty + 1.5, targetPosition.z);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 8), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.3 }));
    beam.position.set(targetPosition.x, ty + 4, targetPosition.z);
    scene.add(beam);
    targetMesh.userData.beam = beam;

    const cGeo = new THREE.RingGeometry(1, 3, 32, 4);
    const cpos = cGeo.attributes.position;
    for(let j=0; j<cpos.count; j++) {
        cpos.setZ(j, getTerrainYGlobal(targetPosition.x + cpos.getX(j), targetPosition.z - cpos.getY(j)) - ty);
    }
    const circle = new THREE.Mesh(cGeo, new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.2, side: THREE.DoubleSide }));
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(targetPosition.x, ty + 0.15, targetPosition.z);
    scene.add(circle);
    targetMesh.userData.circle = circle;
    scene.add(targetMesh);
    targetReached = false;
}

function spawnNextTarget() {
    if (targetMesh) {
        if (targetMesh.userData.beam) scene.remove(targetMesh.userData.beam);
        if (targetMesh.userData.circle) scene.remove(targetMesh.userData.circle);
        scene.remove(targetMesh);
    }
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    let tx, tz, attempts = 0;
    do {
        tx = (Math.random() - 0.5) * 300;
        tz = (Math.random() - 0.5) * 400 + 40;
        attempts++;
    } while (Math.hypot(tx-rx, tz-rz) < 30 && attempts < 20);
    targetPosition.set(tx, 0, tz);
    goalCheckDelay = 0;
    buildTargetRing();
}

function applyGoldSkin() {
    if (!roverGroup) return;
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    roverGroup.traverse(node => {
        if (node.isMesh && node.material.color && node.material.color.getHex() === 0xf8fafc) node.material = goldMat;
    });
}

function tryMove(distance) {
    const oldX = roverGroup.position.x, oldZ = roverGroup.position.z;
    const oldY = getTerrainYGlobal(oldX, oldZ);
    roverGroup.translateZ(distance);
    const newY = getTerrainYGlobal(roverGroup.position.x, roverGroup.position.z);
    
    // Stufen-Logik (Minecraft-Treppen/Gräben): 
    // Der Bot darf Steigungen oder Abgründe > 1.2 Einheiten (ein ganzer Block) nicht einfach befahren.
    if (Math.abs(newY - oldY) > 1.2) {
        roverGroup.position.x = oldX; roverGroup.position.z = oldZ;
        document.getElementById('sensor-output').innerText = "⚠️ Weg zu steil/tief! Baue eine Treppe/Brücke.";
        return false;
    }

    if (Math.abs(roverGroup.position.x) > 440 || Math.abs(roverGroup.position.z) > 440) {
        roverGroup.position.x = oldX; roverGroup.position.z = oldZ;
        document.getElementById('sensor-output').innerText = "Warnung: Ende des erforschten Waldes!";
        return false;
    }
    if (checkCollision(roverGroup.position.x, roverGroup.position.z, roverGroup.rotation.y)) {
        roverGroup.position.x = oldX; roverGroup.position.z = oldZ;
        return false;
    }
    return true;
}

const BRANCH_PATHS = [
    {x: 40, z: -20, r: Math.PI/4},
    {x: -60, z: 40, r: -Math.PI/3}, 
    {x: -20, z: -40, r: Math.PI/2.5}, 
    {x: 20, z: 80, r: -Math.PI/4}
];

function isOnBranchPath(px, pz) {
    for (const b of BRANCH_PATHS) {
        // transform px, pz into local coords of the branch
        const dx = px - b.x;
        const dz = pz - b.z;
        // inverse rotation
        const lx = dx * Math.cos(-b.r) - dz * Math.sin(-b.r);
        const lz = dx * Math.sin(-b.r) + dz * Math.cos(-b.r);
        if (Math.abs(lx) < 4.0 && Math.abs(lz) < 50.0) return true; // width 8, height 100
    }
    return false;
}

function getTerrainVisualYGlobal(x, z) {
    const hills = Math.sin(x*0.15) * Math.cos(z*0.15) * 0.4;
    let y = Math.sin(x*0.05) * Math.cos(z*0.05) * 1.5 + Math.sin(x*0.01) * 2 + hills;

    // 1. Fluss (River) - Quert die Map weiträumig bei z = -35
    const distToRiver = Math.abs(z - (-35));
    if (distToRiver < 8.0) {
        // U-förmiger Graben, bis zu 3.5 Einheiten tief
        let edge = 1 - (distToRiver / 8.0);
        y -= Math.sin(edge * Math.PI/2) * 3.5;
    }

    // 2. Steiles Hochplateau (Plateau) - Bei x=60, z=-60 (Nähe Hütte)
    const plateauDist = Math.hypot(x - 60, z - (-60));
    if (plateauDist < 12.0) {
        const pHeight = 4.0; // Zu hoch, um direkt raufzufahren
        if (plateauDist < 8.0) {
            y += pHeight; // Flache Spitze
        } else {
            y += ((12.0 - plateauDist) / 4.0) * pHeight; // Steiler Anstieg
        }
    }

    return y;
}

function getTerrainYGlobal(x, z) {
    if (window.missionManager && window.missionManager.missionActive) {
        return 0.1;
    }
    let y = getTerrainVisualYGlobal(x, z);
    if (Math.abs(x) < 6.0 || isOnBranchPath(x, z)) {
        y += 0.1;
    }
    let blockMax = -999;
    for (let i = 0; i < worldModifications.length; i++) {
        const mod = worldModifications[i];
        if (mod.type === 'dig') {
            const dist = Math.hypot(x - mod.x, z - mod.z);
            if (dist < 3.0) y -= Math.cos((dist / 3.0) * (Math.PI / 2)) * 1.5;
        } else if (mod.type === 'build') {
            if (Math.abs(x - mod.x) < 1.0 && Math.abs(z - mod.z) < 1.0) {
                 if (mod.y + 0.5 > blockMax) blockMax = mod.y + 0.5; // Top of the block
            }
        }
    }
    
    // Moat (Graben) um den See für Akt 2
    const dLake = Math.hypot(x - 90, z - (-30));
    if (dLake > 20 && dLake < 35 && isOnBranchPath(x, z) === false) {
        // Absenkung: tiefe Schlucht von 4m
        y -= 4.0;
    }
    
    if (blockMax > -999) return blockMax;
    return y;
}

// ════════════════════════════════════════════════════════════════
// ENVIRONMENT
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════
/**
 * Initialisiert die Three.js 3D-Engine, die Kameras, Lichter und das UI.
 * Wird beim Start der Anwendung aufgerufen.
 */
function init() {
    console.log("RoboQuest v5: Story Exploration Engine");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0d8ef);
    scene.fog = new THREE.FogExp2(0xa0d8ef, 0.012);

    let aspect = container.clientWidth / container.clientHeight;
    if (isNaN(aspect) || aspect === 0) aspect = 1;
    camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
    camera.position.set(0, CAM_HEIGHT, -CAM_DISTANCE);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 2; controls.maxDistance = 60;
    controls.enableDamping = true; controls.dampingFactor = 0.1;
    controls.enabled = false;

    window.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(window.ambientLight);
    window.sunLight = new THREE.DirectionalLight(0xfffbdd, 1.2);
    window.sunLight.position.set(30, 60, -30); window.sunLight.castShadow = true;
    window.sunLight.shadow.mapSize.width = 2048; window.sunLight.shadow.mapSize.height = 2048;
    scene.add(window.sunLight);

    buildEnvironment();
    buildClouds();
    buildEcoBot();
    buildTargetRing();
    setupInputHandlers();
    initFog();
    initMiniMap();
    spawnChargingStations();
    // Hide map coverage if no fog
    if (!fogEnabled) document.getElementById('hud-map-coverage').style.display = 'none';

    // Spawn initial collectibles for Act 1
    const act = STORY_ACTS[storyState.currentAct];
    if (act && act.spawnItems) spawnCollectibles(act.spawnItems);

    if (window.ResizeObserver) new ResizeObserver(onWindowResize).observe(container);
    else { window.addEventListener('resize', onWindowResize); setTimeout(onWindowResize, 100); }

    window.executingMode = 'blocks';
    window.pyResolveCallback = null;

    // Expose engine API for simple_coding.js
    window.gameEngine = {
        _executingIndex: -1,
        startSimpleQueue: function(queue) {
            document.getElementById('sensor-output').innerText = '▶ Programm gestartet (' + queue.length + ' Befehle)';
            window.executingMode = 'simple';
            this._executingIndex = -1;
            this.lastExecutedQueue = queue; // Store for mission validation
            
            // "Klammer-Schleife" Logik
            let expandedQueue = [];
            let expandedIndices = [];
            
            let insideLoop = false;
            let currentLoopBlocks = [];
            let currentLoopIndices = [];
            let repeatCount = 1;

            for (let i = 0; i < queue.length; i++) {
                const item = queue[i];
                const action = (typeof item === 'string') ? item : item.action;
                
                if (action === 'REPEAT_ALL') {
                    // Start der Schleife
                    insideLoop = true;
                    repeatCount = (typeof item === 'string') ? 1 : (item.param || 1);
                    currentLoopBlocks = [];
                    currentLoopIndices = [];
                } else if (action === 'LOOP_END') {
                    // Ende der Schleife
                    insideLoop = false;
                    for (let r = 0; r < repeatCount; r++) {
                        expandedQueue = expandedQueue.concat(currentLoopBlocks);
                        expandedIndices = expandedIndices.concat(currentLoopIndices);
                    }
                    currentLoopBlocks = [];
                    currentLoopIndices = [];
                } else {
                    if (insideLoop) {
                        currentLoopBlocks.push(item);
                        currentLoopIndices.push(i);
                    } else {
                        expandedQueue.push(item);
                        expandedIndices.push(i);
                    }
                }
            }

            // Falls vergessen wurde, die Schleife zu schließen, trotzdem ausführen
            if (insideLoop) {
                for (let r = 0; r < repeatCount; r++) {
                    expandedQueue = expandedQueue.concat(currentLoopBlocks);
                    expandedIndices = expandedIndices.concat(currentLoopIndices);
                }
            }
            
            // Build a simple rStack from expanded queue
            rStack = [];
            
            // Reverse so we can pop from the end
            for (let i = expandedQueue.length - 1; i >= 0; i--) {
                const item = expandedQueue[i];
                const action = (typeof item === 'string') ? item : item.action;
                const param = (typeof item === 'string') ? 1 : (item.param || 1);
                
                let blockType = '';
                let distance = param; // Absolute parameter count (steps)
                const blockIndex = expandedIndices[i]; // Capture original index for highlight

                if (action === 'MOVE_FWD') blockType = 'move_robot';
                else if (action === 'MOVE_BWD') blockType = 'move_robot';
                else if (action === 'TURN_LEFT') blockType = 'turn_robot';
                else if (action === 'TURN_RIGHT') blockType = 'turn_robot';
                else if (action === 'GRAB') blockType = 'gripper_action';
                else if (action === 'DROP') blockType = 'gripper_action';
                else if (action === 'SCAN') blockType = 'scan_object';
                else if (action === 'WAIT_UNTIL') blockType = 'wait_until';
                else if (action === 'WAIT_SEC') blockType = 'wait_sec';
                else if (action === 'IF_COLOR') blockType = 'logic_if_else';
                else if (action === 'ELSE') blockType = 'else_branch';
                else if (action === 'END_IF') blockType = 'end_if_branch';
                else if (action === 'MOTOR_FWD') blockType = 'motor';
                else if (action === 'MOTOR_BWD') blockType = 'motor';
                else if (action === 'MOTOR_STOP') blockType = 'motor';

                // We mock the block methods needed by rStep
                const bMock = { 
                    type: blockType, 
                    id: i.toString(),
                    action: action, // Store action for runtime evaluation
                    param: param,   // Store param (e.g. 'blue', 'red')
                    _simpleIndex: blockIndex, // For highlight tracking
                    getFieldValue: function(field) {
                        if (field === 'DIRECTION') {
                            if (action === 'MOVE_FWD') return 'FORWARD';
                            if (action === 'MOVE_BWD') return 'BACKWARD';
                            if (action === 'TURN_LEFT') return 'LEFT';
                            if (action === 'TURN_RIGHT') return 'RIGHT';
                        }
                        if (field === 'DISTANCE') return distance;
                        if (field === 'ACTION') {
                            if (action === 'GRAB') return 'CLOSE';
                            if (action === 'DROP') return 'OPEN';
                            return 'TOGGLE';
                        }
                        return null;
                    },
                    getNextBlock: function() { return null; }
                };
                rStack.push({ block: bMock, state: 0, totalDist: 1 });
            }
            
            isRunning = true;
            programDriven = true;
            currentCommand = null;
        },
        stopExecution: function() {
            document.getElementById('sensor-output').innerText = '⏹ Programm abgebrochen';
            rStack = [];
            currentCommandObj = null;
            currentCommand = null;
            isRunning = false;
            this._executingIndex = -1;
            programMotorState = { forward: false, backward: false, left: false, right: false };
            // Clear highlights
            if (window.simpleCoding) window.simpleCoding.clearHighlights();
            // Reset arm rotations
            if (roverGroup && roverGroup.userData.armL && roverGroup.userData.armR) {
                roverGroup.userData.armL.rotation.x = 0;
                roverGroup.userData.armR.rotation.x = 0;
            }
        },
        // Called by animate loop when a block starts executing
        onBlockExecute: function(block) {
            if (block && block._simpleIndex !== undefined) {
                this._executingIndex = block._simpleIndex;
                if (window.simpleCoding) {
                    window.simpleCoding.highlightBlock(block._simpleIndex);
                }
            }
        },
        // Called when execution finishes
        onExecutionComplete: function() {
            this._executingIndex = -1;
            if (window.simpleCoding) window.simpleCoding.clearHighlights();
            
            document.getElementById('sensor-output').innerText = '✅ Programm beendet!';
            isRunning = false;
            programMotorState = { forward: false, backward: false, left: false, right: false };

            // Mission-Abschluss prüfen (GDD 4)
            if (window.missionManager) {
                setTimeout(() => {
                    const success = window.missionManager.checkCompletion();
                    if (!success && window.missionManager.missionActive && window.missionManager.currentMission && window.missionManager.currentMission.goalPos) {
                        const rx = roverGroup.position.x.toFixed(1);
                        const rz = roverGroup.position.z.toFixed(1);
                        const gx = window.missionManager.currentMission.goalPos.x;
                        const gz = window.missionManager.currentMission.goalPos.z;
                        
                        // Optimierte Distanzberechnung per Math.hypot
                        const dist = Math.hypot(roverGroup.position.x - gx, roverGroup.position.z - gz).toFixed(1);
                        
                        document.getElementById('sensor-output').innerText = `❌ Ziel verfehlt! Pos:(${rx}, ${rz}) Ziel:(${gx}, ${gz}) Dist: ${dist}m`;
                    }
                }, 500);
            }
        }
    };

    document.getElementById('btn-stop').addEventListener('click', () => {
        document.getElementById('sensor-output').innerText = 'Eco-Bot pausiert.';
        isRunning = false; programDriven = false;
        rStack = []; currentCommandObj = null; currentCommand = null;
        window.pyResolveCallback = null;
        if (window.Sk) window.Sk.hardInterrupt = true; // Stop Skulpt if supported
        setTimeout(() => { if (window.Sk) window.Sk.hardInterrupt = false; }, 100);
        programMotorState = { forward: false, backward: false, left: false, right: false };
        if (window.highlightBlock) window.highlightBlock(null);
    });

    document.getElementById('btn-reset-pos').addEventListener('click', () => {
        document.getElementById('btn-stop').click();
        if (window.missionManager && window.missionManager.currentMission) {
            window.missionManager.loadMission(window.missionManager.currentMission.id);
            document.getElementById('sensor-output').innerText = '🔄 Mission zurückgesetzt!';
        } else if (window.roverGroup) {
            window.roverGroup.position.set(0, 0.2, 0); 
            window.roverGroup.rotation.set(0, 0, 0);
            document.getElementById('sensor-output').innerText = '🔄 Roboter zurückgesetzt!';
        }
    });

    const editorResetBtn = document.getElementById('btn-reset-pos-editor');
    if (editorResetBtn) {
        editorResetBtn.addEventListener('click', () => {
            document.getElementById('btn-stop-editor').click(); // stop code
            document.getElementById('btn-reset-pos').click();   // reset pos
        });
    }

    const worldResetBtn = document.getElementById('btn-reset-pos-world');
    if (worldResetBtn) {
        worldResetBtn.addEventListener('click', () => {
            document.getElementById('btn-stop').click(); // stop code
            document.getElementById('btn-reset-pos').click();   // reset pos
        });
    }

    // Category sidebar buttons
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const ide = document.getElementById('code-ide');
            const categoryName = btn.getAttribute('data-category');
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            if (ide.classList.contains('hidden')) {
                ide.classList.remove('hidden');
                btn.classList.add('active');
                if (typeof injectBlockly === 'function') {
                    setTimeout(() => { window.injectBlockly(storyState.unlockedFeatures); setTimeout(() => window.selectBlocklyCategory(categoryName), 100); }, 50);
                }
            } else {
                if (btn.classList.contains('_wasActive')) { ide.classList.add('hidden'); btn.classList.remove('_wasActive'); return; }
                btn.classList.add('active');
                if (typeof window.selectBlocklyCategory === 'function') window.selectBlocklyCategory(categoryName);
            }
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('_wasActive'));
            btn.classList.add('_wasActive');
        });
    });

    document.getElementById('btn-next-quest').addEventListener('click', () => {
        document.getElementById('success-overlay').style.display = 'none';
        
        // Custom-Missionsmodus abfangen
        if (window.missionManager && window.missionManager.currentMission !== null) {
            return;
        }
        
        completeAct();       // unlock reward & features
        advanceToNextAct();  // move to next story act
    });

    document.getElementById('btn-reward-close').addEventListener('click', () => {
        document.getElementById('reward-popup').style.display = 'none';
        advanceToNextAct();
    });

    document.getElementById('btn-zone-close').addEventListener('click', () => {
        document.getElementById('zone-discovery').style.display = 'none';
    });

    updateHUD();
    updateSidebarVisibility();
    animate();
}

/**
 * Hides or shows sidebar category buttons based on unlocked features.
 */
function updateSidebarVisibility() {
    const loopsBtn = document.getElementById('cat-schleifen');
    const logicBtn = document.getElementById('cat-logik');
    
    if (loopsBtn) {
        if (storyState.unlockedFeatures.includes('loops')) loopsBtn.classList.remove('hidden');
        else loopsBtn.classList.add('hidden');
    }
    
    if (logicBtn) {
        if (storyState.unlockedFeatures.includes('logic')) logicBtn.classList.remove('hidden');
        else logicBtn.classList.add('hidden');
    }
}

// ════════════════════════════════════════════════════════════════
// INPUT HANDLERS
// ════════════════════════════════════════════════════════════════
function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'w': case 'W': case 'ArrowUp': inputState.forward = true; break;
            case 's': case 'S': case 'ArrowDown': inputState.backward = true; break;
            case 'a': case 'A': case 'ArrowLeft': inputState.left = true; break;
            case 'd': case 'D': case 'ArrowRight': inputState.right = true; break;
            case ' ': tryGrabItem(); break;
        }
    });
    window.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'w': case 'W': case 'ArrowUp': inputState.forward = false; break;
            case 's': case 'S': case 'ArrowDown': inputState.backward = false; break;
            case 'a': case 'A': case 'ArrowLeft': inputState.left = false; break;
            case 'd': case 'D': case 'ArrowRight': inputState.right = false; break;
        }
    });
    const dirMap = { 'up': 'forward', 'down': 'backward', 'left': 'left', 'right': 'right' };
    document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
        const dir = dirMap[btn.getAttribute('data-dir')];
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); inputState[dir] = true; btn.classList.add('pressed'); }, { passive: false });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); inputState[dir] = false; btn.classList.remove('pressed'); }, { passive: false });
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); inputState[dir] = true; btn.classList.add('pressed'); });
        btn.addEventListener('mouseup', () => { inputState[dir] = false; btn.classList.remove('pressed'); });
        btn.addEventListener('mouseleave', () => { inputState[dir] = false; btn.classList.remove('pressed'); });
    });
    const grabBtn = document.getElementById('dpad-center');
    if (grabBtn) {
        grabBtn.addEventListener('click', () => {
            tryGrabItem();
            grabBtn.classList.add('pressed');
            setTimeout(() => grabBtn.classList.remove('pressed'), 200);
        });
    }

    // Intro Button Logic
    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) {
        btnStartGame.addEventListener('click', () => {
            if (window.closeAllModals) window.closeAllModals();
            const intro = document.getElementById('intro-overlay');
            if (intro) {
                intro.style.transition = 'opacity 0.5s ease';
                intro.style.opacity = '0';
            }
            setTimeout(() => {
                if (intro) intro.style.display = 'none';
                if (window.missionManager) {
                    window.missionManager.showHub();
                    if (window.ada) window.ada.say('Lass uns mit Mission 1 beginnen! Wähle sie auf der Karte aus.', 5000);
                }
            }, 500);
        });
    }
    
    const btnTutorial = document.getElementById('btn-tutorial');
    if (btnTutorial) {
        btnTutorial.addEventListener('click', () => {
            if (window.closeAllModals) window.closeAllModals();
            const handbook = document.getElementById('handbook-modal');
            if (handbook) handbook.style.display = 'flex';
        });
    }
}

function onWindowResize() {
    const c = document.getElementById('canvas-container');
    camera.aspect = c.clientWidth / c.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(c.clientWidth, c.clientHeight);
}

// ════════════════════════════════════════════════════════════════
// ANIMATE LOOP
// ════════════════════════════════════════════════════════════════
let fogUpdateTimer = 0;
let coverageUpdateTimer = 0;
let sensorDisplayTimer = 0;
let lastTrailPos = new THREE.Vector3();
let creatures = [];

function updateLiveSensors() {
    if (!roverGroup || isRunning) return; // Don't override program output

    const header = document.querySelector('.sensor-overlay .overlay-header');
    const out = document.getElementById('sensor-output');

    let missionId = 0;
    let isMissionActive = false;
    if (window.missionManager) {
        isMissionActive = window.missionManager.missionActive;
        if (isMissionActive && window.missionManager.currentMission) {
            missionId = window.missionManager.currentMission.id;
        }
    }

    // Bestimme, ob für diese Mission Sensoren freigeschaltet sind
    // Sensoren sind freigeschaltet in Mission 5, 8, 9, 10 und im Freien Spiel (missionId === 0)
    const sensorsUnlocked = !isMissionActive || missionId === 5 || missionId === 8 || missionId === 9 || missionId === 10;

    if (!sensorsUnlocked) {
        if (header) header.innerHTML = '<span>▼</span> System-Status:';
        if (out) {
            let statusText = 'Eco-Bot bereit. Nutze WASD zum Steuern oder klicke links [⚏] zum Programmieren!';
            if (missionId === 1) {
                statusText = 'Eco-Bot bereit. Ziehe den Befehl [Vor] in dein Programm und klicke auf Start, um das grüne Feld zu erreichen!';
            } else if (missionId === 2) {
                statusText = 'Umgehe das Hindernis! Nutze die Befehle [Drehe Links] und [Drehe Rechts], um den Weg zum Ziel zu finden.';
            } else if (missionId === 3) {
                statusText = 'Sammle Ersatzteile! Steuere den Eco-Bot direkt über ein Schrotteil und nutze den Befehl [Greifen].';
            } else if (missionId === 4) {
                statusText = 'Nutze den neuen Schleifen-Block [Wiederhole alles], um den Code für die Umfahrung der Kiste abzukürzen!';
            } else if (missionId === 6) {
                statusText = 'Eco-Bot im Stadtpark bereit! Nutze eine Schleife [Wiederhole alles], um alle 5 Flaschen in einer Reihe zu sammeln.';
            } else if (missionId === 7) {
                statusText = 'Plane deinen Slalom! Verwende eine Schleife mit Rechts- und Linksdrehungen, um geschickt um die Parkbänke herumzufahren.';
            }
            out.innerText = statusText;
        }
        return;
    }

    // Sensoren sind freigeschaltet: Zeige Header und Live-Werte
    if (header) header.innerHTML = '<span>▼</span> Sensor Ausgabe:';

    const dist = sensorUltrasonic();
    const light = sensorLight();
    const rot = sensorRotation();
    const nearest = sensorCameraObjectName();
    const touch = sensorTouch();
    
    if (out) {
        let lines = [];
        
        if (missionId === 0) {
            // Freies Spiel: Zeige alle relevanten Sensoren an
            lines.push('📏 Distanz: ' + dist + 'cm' + (dist < 30 ? ' ⚠️' : ''));
            lines.push('☀️ Licht: ' + light + '%  🔄 Kompass: ' + rot + '°');
            const colorVal = getColorUnderRobot();
            const colorEmojis = { 'blue': '🔵 Blau', 'red': '🔴 Rot', 'green': '🟢 Grün', 'none': '⚪ Keine' };
            const colorText = '  🎨 Bodenfarbe: ' + (colorEmojis[colorVal] || '⚪ Keine');
            lines.push('📸 ' + nearest + (touch ? '  👆 Kontakt!' : '') + colorText);
        } else {
            // Missions-Modus: Zeige nur die Sensoren, die für diese Mission wirklich hilfreich und gelernt sind!
            
            // Mission 5: LiDAR Scan (Ultraschall & Kamera)
            if (missionId === 5) {
                lines.push('📏 Distanz: ' + dist + 'cm' + (dist < 30 ? ' ⚠️' : ''));
                lines.push('📸 Kamera: ' + nearest + (touch ? '  👆 Kontakt!' : ''));
            }
            
            // Mission 8, 9, 10: Farbsensor
            if (missionId === 8 || missionId === 9 || missionId === 10) {
                const colorVal = getColorUnderRobot();
                const colorEmojis = { 'blue': '🔵 Blau', 'red': '🔴 Rot', 'green': '🟢 Grün', 'none': '⚪ Keine' };
                lines.push('🎨 Farbsensor: ' + (colorEmojis[colorVal] || '⚪ Keine'));
            }
        }
        
        out.innerText = lines.join('\n');
    }
    
    // --- Live Sensor Dashboard ---
    const dashboard = document.getElementById('sensor-dashboard');
    if (dashboard && !dashboard.classList.contains('hidden')) {
        document.getElementById('dash-val-ultra').innerText = dist + ' cm';
        document.getElementById('dash-val-touch').innerText = touch ? 'Ja' : 'Nein';
        
        const colorVal = getColorUnderRobot();
        const colorEmojis = { 'blue': 'Blau', 'red': 'Rot', 'green': 'Grün', 'none': 'Keine' };
        document.getElementById('dash-val-color').innerText = colorEmojis[colorVal] || 'Keine';
        
        document.getElementById('dash-val-rot').innerText = rot + '°';
        document.getElementById('dash-val-tilt').innerText = sensorTilt() + '°';
    }
}

function animate() {
    try {
        requestAnimationFrame(animate);
        // Clamp delta to 0.1s to prevent energy/physics spikes after tab switch
        const delta = Math.min(clock.getDelta(), 0.1);
        let isMoving = false;
        // Declare early so fog-reveal below can access it outside the roverGroup block
        const anyInput = inputState.forward || inputState.backward || inputState.left || inputState.right;

        if (lidar) lidar.rotation.y += 2 * delta;

        // Solarpunk Turbines
        for (const t of turbines) {
            if (t.userData.isRepaired) {
                t.userData.rotor.rotation.z += 2.0 * delta;
            }
        }

        // Foxes AI
        for (const f of foxes) {
            const dist = Math.hypot(roverGroup.position.x - f.position.x, roverGroup.position.z - f.position.z);
            if (dist < 15) {
                // Flee
                const angleAway = Math.atan2(f.position.x - roverGroup.position.x, f.position.z - roverGroup.position.z);
                f.userData.targetRot = angleAway;
                f.userData.speed = 4.0;
            } else {
                f.userData.timer -= delta;
                if (f.userData.timer <= 0) {
                    f.userData.targetRot = Math.random() * Math.PI * 2;
                    f.userData.speed = 0.5;
                    f.userData.timer = 1 + Math.random() * 3;
                }
            }
            
            let diff = f.userData.targetRot - f.rotation.y;
            while(diff < -Math.PI) diff += Math.PI * 2;
            while(diff > Math.PI) diff -= Math.PI * 2;
            f.rotation.y += diff * 5 * delta;

            const nx = f.position.x + Math.sin(f.rotation.y) * f.userData.speed * delta;
            const nz = f.position.z + Math.cos(f.rotation.y) * f.userData.speed * delta;
            if (!checkCollision(nx, nz, 0, false)) {
                f.position.x = nx;
                f.position.z = nz;
                f.position.y = getTerrainYGlobal(nx, nz);
                f.children[0].position.y = 0.5 + Math.sin(Date.now() * 0.01 * f.userData.speed) * 0.1;
            } else {
                f.userData.targetRot += Math.PI;
            }
        }

        // Collectible bobbing animation
        for (const c of collectibles) {
            if (c.mesh) c.mesh.position.y = getTerrainYGlobal(c.x, c.z) + 1.0 + Math.sin(Date.now() * 0.003 + c.x) * 0.3;
            if (c.mesh) c.mesh.rotation.y += delta * 0.8;
        }

        // Plant spot pulsing
        for (const s of plantSpots) {
            if (!s.planted && s.mesh) s.mesh.material.opacity = 0.3 + Math.sin(Date.now() * 0.004) * 0.2;
        }

        // Arm animations for gripper
        if (roverGroup && roverGroup.userData.armL && roverGroup.userData.armR) {
            // Check if manual grab button is pressed to briefly animate arms too
            const grabBtn = document.getElementById('dpad-center');
            const isManualGrab = grabBtn && grabBtn.classList.contains('pressed');
            
            let targetY = gripperState === 'CLOSE' || isManualGrab ? 0.6 : -0.2;
            let targetX = gripperState === 'CLOSE' || isManualGrab ? -0.4 : 0.0;
            
            roverGroup.userData.armL.rotation.y += (targetY - roverGroup.userData.armL.rotation.y) * 10 * delta;
            roverGroup.userData.armR.rotation.y += (-targetY - roverGroup.userData.armR.rotation.y) * 10 * delta;
            
            roverGroup.userData.armL.rotation.x += (targetX - roverGroup.userData.armL.rotation.x) * 10 * delta;
            roverGroup.userData.armR.rotation.x += (targetX - roverGroup.userData.armR.rotation.x) * 10 * delta;
        }

        if (targetMesh && !targetReached) {
            const pulse = (Math.sin(Date.now() * 0.003) + 1) / 2;
            targetMesh.scale.setScalar(0.9 + pulse * 0.2);
            targetMesh.material.opacity = 0.5 + pulse * 0.4;
            targetMesh.position.y = getTerrainYGlobal(targetPosition.x, targetPosition.z) + 1.5 + pulse * 0.5;
            if (targetMesh.userData.beam) targetMesh.userData.beam.material.opacity = 0.15 + pulse * 0.2;
        }

        // --- Solar Energy Logic ---
        let inSun = true;
        // Cache result — also used in updateEnergyHUD this frame
        const nearStation = isNearChargingStation(roverGroup.position.x, roverGroup.position.z);
        for (const obs of obstacles) {
            if (Math.hypot(roverGroup.position.x - obs.x, roverGroup.position.z - obs.z) < obs.radius + 4) {
                inSun = false; break;
            }
        }
        
        const eIcon = document.getElementById('energy-icon');
        if (nearStation) {
            storyState.batteryLevel += CHARGE_STATION_RATE * delta;
            if (eIcon) eIcon.innerText = '⚡';
        } else if (inSun) {
            let rate = window.isSolarTracking ? 12.0 : 6.0;
            storyState.batteryLevel += rate * delta;
            if (eIcon) eIcon.innerText = window.isSolarTracking ? '✨☀️' : '☀️';
        } else {
            storyState.batteryLevel += 0.5 * delta;
            if (eIcon) eIcon.innerText = '☁️';
        }

        const canMove = storyState.batteryLevel > 0;

        // Manual & Continuous Program input (anyInput declared at top of animate for fog-reveal scope)
        const anyProgramInput = programMotorState.forward || programMotorState.backward || programMotorState.left || programMotorState.right;
        
        if ((anyInput || anyProgramInput) && canMove) {
            if (anyInput) programDriven = false;
            const fwd = inputState.forward || programMotorState.forward;
            const bwd = inputState.backward || programMotorState.backward;
            const lft = inputState.left || programMotorState.left;
            const rgt = inputState.right || programMotorState.right;
            
            const rotDelta = TURN_SPEED * delta;
            if (lft) { const ny = roverGroup.rotation.y + rotDelta; if (!checkCollision(roverGroup.position.x, roverGroup.position.z, ny, true)) roverGroup.rotation.y = ny; }
            if (rgt) { const ny = roverGroup.rotation.y - rotDelta; if (!checkCollision(roverGroup.position.x, roverGroup.position.z, ny, true)) roverGroup.rotation.y = ny; }
            if (fwd) { isMoving = tryMove(moveSpeed * delta); }
            if (bwd) isMoving = tryMove(-moveSpeed * delta * 0.6);
            if (lft || rgt) isMoving = true;
        }

        // Program execution
        if (isRunning) {
            if (!canMove) {
                document.getElementById('sensor-output').innerText = '⚠️ Batterie leer! Unterbreche Programm...';
                isRunning = false;
                programMotorState = { forward: false, backward: false, left: false, right: false }; // Auto-stop
                if (window.highlightBlock) window.highlightBlock(null);
            } else if ((window.executingMode === 'blocks' || window.executingMode === 'simple') && !currentCommandObj && rStack.length > 0) {
                currentCommandObj = rStep();
                if (currentCommandObj) {
                    currentCommand = currentCommandObj.action;
                    commandProgress = 0;
                    if (window.highlightBlock && currentCommandObj.id) window.highlightBlock(currentCommandObj.id);
                }
            }
            if (window.executingMode === 'blocks' && !currentCommandObj && rStack.length === 0) {
                isRunning = false;
                programMotorState = { forward: false, backward: false, left: false, right: false }; // Auto-stop at end
                if (window.highlightBlock) window.highlightBlock(null);
                document.getElementById('sensor-output').innerText = '✅ Programm beendet!';
            }
            // Simple mode completion (Mission-System)
            if (window.executingMode === 'simple' && !currentCommandObj && rStack.length === 0) {
                if (window.gameEngine && window.gameEngine.onExecutionComplete) {
                    window.gameEngine.onExecutionComplete();
                }
            }
            if (currentCommandObj) {
                // Adjust ALL automated speeds by programSpeed for debugging
                let speedM = typeof programSpeed !== 'undefined' ? programSpeed : 1.0;
                let animSpeed = 1.0 * delta * speedM;
                let cmdDuration = currentCommandObj.duration || 1.0;

                if (currentCommand === 'move') { tryMove(5.0 * delta * speedM); commandProgress += delta * speedM; isMoving = true; }
                else if (currentCommand === 'moveBackward') { tryMove(-5.0 * delta * speedM); commandProgress += delta * speedM; isMoving = true; }
                else if (currentCommand === 'turnLeft') { const ny = roverGroup.rotation.y + (Math.PI/2)*animSpeed; if(!checkCollision(roverGroup.position.x, roverGroup.position.z, ny, true)) roverGroup.rotation.y = ny; commandProgress += animSpeed; isMoving = true; }
                else if (currentCommand === 'turnRight') { const ny = roverGroup.rotation.y - (Math.PI/2)*animSpeed; if(!checkCollision(roverGroup.position.x, roverGroup.position.z, ny, true)) roverGroup.rotation.y = ny; commandProgress += animSpeed; isMoving = true; }
                else if (currentCommand === 'scan') {
                    commandProgress += animSpeed;
                    if (lidar) lidar.rotation.y += 12 * delta * speedM;
                    // Spawn scan rings once at start
                    if (!currentCommandObj._effectFired) {
                        currentCommandObj._effectFired = true;
                        spawnActionRings(roverGroup.position);
                        
                        let repairedAny = false;
                        for (const t of turbines) {
                            if (!t.userData.isRepaired && Math.hypot(roverGroup.position.x - t.position.x, roverGroup.position.z - t.position.z) < 15) {
                                t.userData.isRepaired = true;
                                t.userData.glowMat.emissiveIntensity = 1.0;
                                storyState.turbinesRepaired++;
                                repairedAny = true;
                                showPickupFlash("⚙️ Windrad repariert!");
                                if (window.audioEngine) window.audioEngine.playHappyBeep();
                                score += 200;
                                document.getElementById('score-display').innerText = score;
                            }
                        }

                        if (!repairedAny) showActionFlash('🔍 Scanne Umgebung...');
                        storyState.scanCount = (storyState.scanCount || 0) + 1;
                        checkQuestProgress();
                    }
                }
                else if (currentCommand === 'wait') { commandProgress += (delta * speedM) / cmdDuration; }
                else if (currentCommand === 'waitUntil') { 
                    // REAL-TIME CHECK: Evaluated every frame instead of once per tick
                    if (evaluateSensorBlock(currentCommandObj.conditionBlock)) {
                        commandProgress = 1.0; // Finish immediately!
                    }
                }
                else if (currentCommand === 'gripper') {
                    commandProgress += animSpeed;
                    
                    // Animate arms reaching forward and returning (sine curve based on progress)
                    if (roverGroup && roverGroup.userData.armL && roverGroup.userData.armR) {
                        const angle = -Math.PI / 3 * Math.sin(commandProgress * Math.PI);
                        roverGroup.userData.armL.rotation.x = angle;
                        roverGroup.userData.armR.rotation.x = angle;
                    }

                    // Visual feedback for gripper
                    if (commandProgress >= 0.5 && commandProgress - animSpeed < 0.5) {
                        const gPos = roverGroup.position.clone();
                        gPos.y += 1.5;
                        if (gripperState === 'CLOSE') {
                            spawnActionParticles('gripper_close', gPos);
                            showActionFlash('✊ Greifer schließen');
                        } else {
                            spawnActionParticles('gripper_open', gPos);
                            showActionFlash('✋ Greifer öffnen');
                        }
                    }
                }
                else if (currentCommand === 'cleanWater') {
                    commandProgress += animSpeed * 0.5; // Cleaning takes longer
                    if (!currentCommandObj._effectFired) {
                        currentCommandObj._effectFired = true;
                        // Check if near river (z is -35)
                        if (Math.abs(roverGroup.position.z - (-35)) < 15) {
                            cleanWater();
                        } else {
                            showActionFlash('⚠️ Nicht nah genug am Wasser!');
                        }
                    }
                }
                else if (currentCommand === 'push') {
                    tryMove(2.5 * delta * speedM);
                    commandProgress += delta * speedM;
                    isMoving = true;
                    // Lean robot forward slightly while pushing
                    if (roverGroup) roverGroup.children[0].position.z = 0.15;
                }
                else if (currentCommand === 'startMotor' || currentCommand === 'stopMotor') { commandProgress = 1.0; } // Immediate blocks
                else if (currentCommand === 'plantVertical') {
                    if (!currentCommandObj._effectFired) {
                        currentCommandObj._effectFired = true;
                        if (window.plantVertical) window.plantVertical();
                    }
                    commandProgress += animSpeed * 0.5;
                }
                else if (currentCommand === 'solarTrack') {
                    if (!currentCommandObj._effectFired) {
                        currentCommandObj._effectFired = true;
                        if (window.solarTrack) window.solarTrack();
                    }
                    commandProgress += animSpeed * 0.2;
                }
                else if (currentCommand === 'build') {
                    // Place block 2 units in front
                    const py = getTerrainYGlobal(roverGroup.position.x, roverGroup.position.z);
                    const fx = Math.sin(roverGroup.rotation.y) * 2.0;
                    const fz = Math.cos(roverGroup.rotation.y) * 2.0;
                    const buildPos = new THREE.Vector3(roverGroup.position.x + fx, py + 0.5, roverGroup.position.z + fz);
                    worldModifications.push({ type: 'build', x: buildPos.x, y: buildPos.y, z: buildPos.z, id: Date.now() });
                    saveWorldModifications();
                    storyState.blocksBuilt = (storyState.blocksBuilt || 0) + 1;
                    buildEnvironment(); // Rebuild visually
                    // Visual effects
                    spawnActionParticles('build', buildPos);
                    showActionFlash('🧱 Block gebaut!');
                    document.getElementById('sensor-output').innerText = '🧱 Block erfolgreich gebaut!';
                    commandProgress = 1.0;
                }
                else if (currentCommand === 'dig') {
                    const fx = Math.sin(roverGroup.rotation.y) * 2.0;
                    const fz = Math.cos(roverGroup.rotation.y) * 2.0;
                    const digPos = new THREE.Vector3(roverGroup.position.x + fx, roverGroup.position.y, roverGroup.position.z + fz);
                    worldModifications.push({ type: 'dig', x: digPos.x, z: digPos.z, id: Date.now() });
                    saveWorldModifications();
                    buildEnvironment();
                    // Visual effects - dirt particles flying up
                    spawnActionParticles('dig', digPos);
                    showActionFlash('⛏️ Loch gegraben!');
                    document.getElementById('sensor-output').innerText = '⛏️ Loch erfolgreich gegraben!';
                    commandProgress = 1.0;
                }
                else if (currentCommand === 'remove') {
                    const py = getTerrainYGlobal(roverGroup.position.x, roverGroup.position.z);
                    const fx = Math.sin(roverGroup.rotation.y) * 2.0;
                    const fz = Math.cos(roverGroup.rotation.y) * 2.0;
                    const targetX = roverGroup.position.x + fx;
                    const targetZ = roverGroup.position.z + fz;
                    // Find built block nearby
                    const modIdx = worldModifications.findIndex(m => m.type === 'build' && Math.hypot(m.x - targetX, m.z - targetZ) < 1.5);
                    if(modIdx > -1) {
                        const removePos = new THREE.Vector3(targetX, py, targetZ);
                        spawnActionParticles('remove', removePos);
                        showActionFlash('🧹 Block entfernt!');
                        worldModifications.splice(modIdx, 1);
                        saveWorldModifications();
                        buildEnvironment();
                    } else {
                        showActionFlash('⚠️ Kein Block hier!');
                    }
                    commandProgress = 1.0;
                }

                if (commandProgress >= 1.0) {
                    if (currentCommand === 'gripper') {
                        if (gripperState === 'CLOSE') {
                            tryGrabItem();
                        } else if (gripperState === 'OPEN') {
                            tryDropItem();
                        } else {
                            // 'TOGGLE' behavior
                            if (typeof storyState !== 'undefined' && storyState.carriedItem) {
                                tryDropItem();
                            } else {
                                tryGrabItem();
                            }
                        }
                        
                        // Reset arm rotations
                        if (roverGroup && roverGroup.userData.armL && roverGroup.userData.armR) {
                            roverGroup.userData.armL.rotation.x = 0;
                            roverGroup.userData.armR.rotation.x = 0;
                        }
                    }
                    if (currentCommand === 'push' && roverGroup) roverGroup.children[0].position.z = 0; // Reset lean
                    if (currentCommand && currentCommand.includes('turn')) roverGroup.rotation.y = Math.round(roverGroup.rotation.y / (Math.PI/2)) * (Math.PI/2);
                    currentCommandObj = null; currentCommand = null;
                    if (window.executingMode === 'python' && window.pyResolveCallback) {
                        const cb = window.pyResolveCallback;
                        window.pyResolveCallback = null;
                        cb();
                    }
                }
            }
        }

        // Physics: height & tilt
        const rx = roverGroup.position.x, rz = roverGroup.position.z, yaw = roverGroup.rotation.y;
        const rDX = Math.cos(yaw), rDZ = -Math.sin(yaw), fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
        const yL = getTerrainYGlobal(rx - rDX*1.6, rz - rDZ*1.6), yR = getTerrainYGlobal(rx + rDX*1.6, rz + rDZ*1.6);
        const yF = getTerrainYGlobal(rx + fDX*2.2, rz + fDZ*2.2), yB = getTerrainYGlobal(rx - fDX*2.2, rz - fDZ*2.2);
        const terrainY = (yL+yR+yF+yB)/4 + 0.18;
        const pitch = Math.max(-0.8, Math.min(0.8, Math.atan2(yB - yF, 4.4)));
        const roll  = Math.max(-0.8, Math.min(0.8, Math.atan2(yR - yL, 3.2)));
        roverGroup.position.y = terrainY;
        roverGroup.rotation.set(pitch, yaw, roll, 'YXZ');

        // Fog of war reveal
        if (isMoving || anyInput) {
            fogUpdateTimer += delta;
            if (fogUpdateTimer > 0.15) {
                revealFog(roverGroup.position.x, roverGroup.position.z, 20);
                fogUpdateTimer = 0;
            }
        }
        // Live sensor display
        sensorDisplayTimer += delta;
        if (sensorDisplayTimer > 0.5) { updateLiveSensors(); sensorDisplayTimer = 0; }

        coverageUpdateTimer += delta;
        if (coverageUpdateTimer > 2.0) { updateMapCoverage(); coverageUpdateTimer = 0; }

        updateTrails(delta);
        updateActionEffects(delta);
        drawMiniMap();
        updateAtmosphere(delta, clock.elapsedTime);
        updateChargingStations(clock.elapsedTime);

        // Update Animals (Foxes)
        const rp = roverGroup ? roverGroup.position : null;
        animals.forEach(fox => {
            const ud = fox.userData;
            ud.timer -= delta;
            
            let fleeing = false;
            if (rp && Math.hypot(fox.position.x - rp.x, fox.position.z - rp.z) < 15) {
                ud.state = 'flee';
                ud.timer = 1.5;
                const ang = Math.atan2(fox.position.x - rp.x, fox.position.z - rp.z);
                ud.tx = fox.position.x + Math.sin(ang) * 12;
                ud.tz = fox.position.z + Math.cos(ang) * 12;
                fleeing = true;
            }

            if (ud.timer <= 0) {
                if (Math.random() < 0.4) {
                    ud.state = 'wander'; ud.timer = 2.0 + Math.random()*3.0;
                    ud.tx = fox.position.x + (Math.random()-0.5)*15; ud.tz = fox.position.z + (Math.random()-0.5)*15;
                } else {
                    ud.state = 'idle'; ud.timer = 1.0 + Math.random()*2.0;
                }
            }

            if (ud.state === 'wander' || ud.state === 'flee') {
                const moveSpeed = fleeing ? ud.speed * 2.5 : ud.speed;
                const dx = ud.tx - fox.position.x, dz = ud.tz - fox.position.z;
                const dist = Math.hypot(dx, dz);
                if (dist > 0.1) {
                    const ax = dx / dist, az = dz / dist;
                    fox.position.x += ax * moveSpeed * delta;
                    fox.position.z += az * moveSpeed * delta;
                    let tYaw = Math.atan2(ax, az);
                    let diff = tYaw - fox.rotation.y;
                    while(diff < -Math.PI) diff += Math.PI*2;
                    while(diff > Math.PI) diff -= Math.PI*2;
                    fox.rotation.y += diff * 5.0 * delta;
                    
                    ud.jumpPhase += moveSpeed * delta * 5.0;
                    fox.position.y = getTerrainYGlobal(fox.position.x, fox.position.z) + Math.abs(Math.sin(ud.jumpPhase)) * 0.4;
                } else {
                    ud.timer = 0;
                }
            } else {
                fox.position.y = getTerrainYGlobal(fox.position.x, fox.position.z);
            }
        });

        if (isMoving) {
            storyState.batteryLevel -= 8.0 * delta;
        }
        if (storyState.batteryLevel > 100) storyState.batteryLevel = 100;
        if (storyState.batteryLevel < 0) storyState.batteryLevel = 0;
        
        updateEnergyHUD();

        // Track and Wheel Animation
        let tDirL = 0, tDirR = 0;
        if (anyInput || anyProgramInput) {
            const fwd = inputState.forward || programMotorState.forward;
            const bwd = inputState.backward || programMotorState.backward;
            const lft = inputState.left || programMotorState.left;
            const rgt = inputState.right || programMotorState.right;
            if (fwd) { tDirL = 1; tDirR = 1; }
            if (bwd) { tDirL = -1; tDirR = -1; }
            if (lft) { tDirL = -1; tDirR = 1; }
            if (rgt) { tDirL = 1; tDirR = -1; }
        } else if (isRunning && currentCommandObj) {
            if (currentCommand === 'move' || currentCommand === 'push') { tDirL = 1; tDirR = 1; }
            else if (currentCommand === 'moveBackward') { tDirL = -1; tDirR = -1; }
            else if (currentCommand === 'turnLeft') { tDirL = -1; tDirR = 1; }
            else if (currentCommand === 'turnRight') { tDirL = 1; tDirR = -1; }
        }

        if (tDirL !== 0 || tDirR !== 0) {
            if (roverGroup.userData.wheels) {
                roverGroup.userData.wheels.forEach(w => {
                    w.wheel.rotation.y += (w.side === 'L' ? tDirL : tDirR) * 6 * delta;
                });
            }
            if (roverGroup.userData.trackMatL && roverGroup.userData.trackMatR) {
                roverGroup.userData.trackMatL.map.offset.y -= tDirL * 1.5 * delta;
                roverGroup.userData.trackMatR.map.offset.y -= tDirR * 1.5 * delta;
            }
        }

        // Trail generation
        if (isMoving && roverGroup.position.distanceTo(lastTrailPos) > 0.4) {
            spawnTrailMark();
            lastTrailPos.copy(roverGroup.position);
        }

        if (window.missionManager && window.missionManager.missionActive) {
            window.missionManager.checkCompletion();
        } else {
            checkGoal(delta);
        }

        // Camera
        if (cameraChaseMode) {
            // Mobile Optimization: increase distance on narrow screens
            const dynamicDist = camera.aspect < 1 ? CAM_DISTANCE / camera.aspect : CAM_DISTANCE;
            const behindX = rx - Math.sin(yaw) * dynamicDist;
            const behindZ = rz - Math.cos(yaw) * dynamicDist;
            camera.position.x += (behindX - camera.position.x) * CAM_LERP;
            camera.position.y += (terrainY + CAM_HEIGHT - camera.position.y) * CAM_LERP;
            camera.position.z += (behindZ - camera.position.z) * CAM_LERP;
            camera.lookAt(new THREE.Vector3(rx, terrainY + 3, rz));
            if (controls) controls.enabled = false;
        } else {
            if (controls) { controls.target.set(rx, terrainY + 1.5, rz); controls.enabled = true; controls.update(); }
        }

        renderer.render(scene, camera);
    } catch (err) { console.error("ANIMATE ERROR:", err); }
}

let programSpeed = 1.0;

init();
setupDPad();

// Start ambient sound loop
if (window.audioEngine) window.audioEngine.startAmbientSounds();

