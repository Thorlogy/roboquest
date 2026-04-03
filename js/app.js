/**
 * RoboQuest 3D - Core Engine (v4 Stable)
 * Handles Three.js rendering, dynamic terrain generation, physics-based robot movement
 * and the Runtime AST Interpreter for Blockly logic.
 */
let scene, camera, renderer;
let roverGroup, trackLeft, trackRight, lidar;
let isRunning = false;
let clock = new THREE.Clock();
let controls;

// ── Input State ─────────────────────────────────────────────────
let inputState = { forward: false, backward: false, left: false, right: false };

// ── Game / Level State ──────────────────────────────────────────
let score = 0;
let targetMesh = null;
let targetPosition = new THREE.Vector3(0, 0, 50);
let targetReached = false;
let goalCheckDelay = 0;

var gameState = {
    currentLevel: 1,
    unlockedFeatures: ['drive'], // 'turbo', 'loops', 'sensor'
    levelActive: true
};
var cameraChaseMode = true; // Toggle for camera mode

const levels = {
    1: { 
        text: "🎯 Fahre manuell zum Ziel!", 
        reward: { id: 'turbo', title: "Turbo-Tuning!", desc: "Dein Eco-Bot fährt jetzt deutlich schneller.", icon: "🚀" } 
    },
    2: { 
        text: "🧩 Programmiere den Weg zum Ziel!", 
        reward: { id: 'loops', title: "Schleifen-Modul!", desc: "Ab jetzt kannst du 'Wiederholen'-Blöcke nutzen.", icon: "🔁" } 
    },
    3: { 
        text: "🎯 Nutze Schleifen für das Ziel!", 
        reward: { id: 'sensor', title: "Sensor-Upgrade!", desc: "Distanz-Sensor ist jetzt im Editor verfügbar.", icon: "📡" } 
    },
    4: {
        text: "🔋 Sammle 3 Batterien im Wald!",
        type: "collect",
        targetCount: 3,
        reward: { id: 'logic', title: "Logik-Modul!", desc: "WENN/DANN Blöcke sind jetzt freigeschaltet.", icon: "⑂" }
    },
    5: {
        text: "🧩 Slalom: Weiche den Bäumen aus!",
        reward: { id: 'gold', title: "Goldener Eco-Bot!", desc: "Deine Hülle glänzt jetzt in edlem Gold.", icon: "✨" }
    },
    6: {
        text: "🔦 Finde den versteckten Höhleneingang!",
        reward: { id: 'win', title: "Waldmeister!", desc: "Du hast alle Missionen im Wald abgeschlossen!", icon: "🏆" }
    }
};

let collectibles = [];
let collectedCount = 0;

// ── Collisions ──────────────────────────────────────────────────
let obstacles = [];

// ── Tire Trails ─────────────────────────────────────────────────
let trails = [];
const TRAIL_INTERVAL = 0.08;
const TRAIL_LIFETIME = 12;
let trailTimer = 0;
const trailMat = new THREE.MeshBasicMaterial({ color: 0x3a2510, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
const trailGeo = new THREE.PlaneGeometry(0.5, 0.4);

// Logic variables (Blockly execution)
let rStack = [];
let currentCommandObj = null;
let currentCommand = null;
let commandProgress = 0;
let gripperState = 'OPEN'; // Track gripper state

function rPush(block) {
    if (block) rStack.push({ block: block, state: 0, totalDist: 0, waitTime: 0 });
}

// ════════════════════════════════════════════════════════════════
// SENSOR SIMULATION FUNCTIONS
// ════════════════════════════════════════════════════════════════

/** Check if there is an obstacle directly ahead (touch range) */
function sensorTouch() {
    if (!roverGroup) return false;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    const yaw = roverGroup.rotation.y;
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    return checkCollision(rx + fDX * 2.5, rz + fDZ * 2.5, yaw);
}

/** Check if there is an obstacle ahead (longer range) */
function checkSensorObstacle() {
    if (!roverGroup) return false;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    const yaw = roverGroup.rotation.y;
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    const hit1 = checkCollision(rx + fDX * 2.5, rz + fDZ * 2.5, yaw);
    const hit2 = checkCollision(rx + fDX * 4.0, rz + fDZ * 4.0, yaw);
    const hitBorder = (Math.abs(rx + fDX * 4.5) > 215 || Math.abs(rz + fDZ * 4.5) > 215);
    return hit1 || hit2 || hitBorder;
}

/** Ultrasonic distance: raycast forward, return 0-255 cm */
function sensorUltrasonic() {
    if (!roverGroup) return 255;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    const yaw = roverGroup.rotation.y;
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    // Sample at increasing distances
    for (let d = 2; d <= 50; d += 1.5) {
        const px = rx + fDX * d, pz = rz + fDZ * d;
        if (checkCollision(px, pz, yaw) || Math.abs(px) > 215 || Math.abs(pz) > 215) {
            return Math.min(255, Math.round(d * 5)); // Convert to ~cm
        }
    }
    return 255; // Nothing detected
}

/** Camera: detect nearest object type */
function sensorCamera() {
    if (!roverGroup) return false;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    // Check for collectibles
    for (const c of collectibles) {
        if (Math.hypot(rx - c.x, rz - c.z) < 15) return true;
    }
    // Check for target
    if (targetMesh && Math.hypot(rx - targetPosition.x, rz - targetPosition.z) < 20) return true;
    // Check for nearby obstacles (trees/rocks)
    for (const obs of obstacles) {
        if (Math.hypot(rx - obs.x, rz - obs.z) < 8) return true;
    }
    return false;
}

/** Camera: get nearest object type as string for display */
function sensorCameraObjectName() {
    if (!roverGroup) return 'Nichts';
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    let minDist = Infinity, name = 'Nichts';
    for (const c of collectibles) {
        const d = Math.hypot(rx - c.x, rz - c.z);
        if (d < 15 && d < minDist) { minDist = d; name = '🔋 Batterie'; }
    }
    if (targetMesh) {
        const d = Math.hypot(rx - targetPosition.x, rz - targetPosition.z);
        if (d < 20 && d < minDist) { minDist = d; name = '🎯 Ziel'; }
    }
    for (const obs of obstacles) {
        const d = Math.hypot(rx - obs.x, rz - obs.z);
        if (d < 8 && d < minDist) { minDist = d; name = obs.radius > 2 ? '🪨 Fels' : '🌲 Baum'; }
    }
    return name;
}

/** Light sensor: 0-100%, forests are darker */
function sensorLight() {
    if (!roverGroup) return 50;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    let baseBrightness = 80;
    // Count nearby obstacles (trees) – more = darker
    let nearbyTrees = 0;
    for (const obs of obstacles) {
        if (Math.hypot(rx - obs.x, rz - obs.z) < 12) nearbyTrees++;
    }
    baseBrightness -= Math.min(60, nearbyTrees * 6);
    // Open path is brighter
    if (Math.abs(rx) < 8) baseBrightness += 15;
    return Math.max(5, Math.min(100, Math.round(baseBrightness)));
}

/** Rotation sensor: current robot yaw in degrees 0-360 */
function sensorRotation() {
    if (!roverGroup) return 0;
    let deg = THREE.MathUtils.radToDeg(roverGroup.rotation.y) % 360;
    if (deg < 0) deg += 360;
    return Math.round(deg);
}

/** Tilt sensor: terrain slope in degrees under the robot */
function sensorTilt() {
    if (!roverGroup) return 0;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    const yaw = roverGroup.rotation.y;
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    const yFront = getTerrainYGlobal(rx + fDX * 2, rz + fDZ * 2);
    const yBack = getTerrainYGlobal(rx - fDX * 2, rz - fDZ * 2);
    const slope = Math.atan2(yFront - yBack, 4.0);
    return Math.round(THREE.MathUtils.radToDeg(slope));
}

// ════════════════════════════════════════════════════════════════
// RECURSIVE BLOCK EVALUATOR (for sensor/logic expressions)
// ════════════════════════════════════════════════════════════════

/**
 * Recursively evaluate a Blockly value block (sensors, comparisons, etc.)
 * Returns a number, boolean, or string depending on block type.
 */
function evaluateSensorBlock(block) {
    if (!block) return false;
    const sensorOutput = document.getElementById('sensor-output');

    switch (block.type) {
        case 'sensor_touch': {
            const val = sensorTouch();
            sensorOutput.innerText = val ? '👆 Berührt!' : '👆 Kein Kontakt.';
            return val;
        }
        case 'sensor_obstacle_ahead': {
            const val = checkSensorObstacle();
            sensorOutput.innerText = val ? '👁 Hindernis erkannt!' : '👁 Weg ist frei.';
            return val;
        }
        case 'sensor_ultrasonic': {
            const val = sensorUltrasonic();
            sensorOutput.innerText = '📏 Ultraschall: ' + val + ' cm';
            return val;
        }
        case 'sensor_camera': {
            const detected = sensorCamera();
            const objName = sensorCameraObjectName();
            sensorOutput.innerText = '📸 Kamera: ' + objName + (detected ? ' erkannt!' : '');
            return detected;
        }
        case 'sensor_light': {
            const val = sensorLight();
            const bar = '█'.repeat(Math.round(val / 10)) + '░'.repeat(10 - Math.round(val / 10));
            sensorOutput.innerText = '☀️ Licht: ' + val + '% ' + bar;
            return val;
        }
        case 'sensor_rotation': {
            const val = sensorRotation();
            sensorOutput.innerText = '🔄 Drehung: ' + val + '°';
            return val;
        }
        case 'sensor_tilt': {
            const val = sensorTilt();
            sensorOutput.innerText = '⛰️ Neigung: ' + val + '°';
            return val;
        }
        case 'logic_compare': {
            const leftBlock = block.getInputTargetBlock('LEFT');
            const rightBlock = block.getInputTargetBlock('RIGHT');
            const leftVal = evaluateSensorBlock(leftBlock);
            const rightVal = evaluateSensorBlock(rightBlock);
            const op = block.getFieldValue('OP');
            let result = false;
            switch (op) {
                case 'LT': result = leftVal < rightVal; break;
                case 'GT': result = leftVal > rightVal; break;
                case 'EQ': result = leftVal == rightVal; break;
                case 'LTE': result = leftVal <= rightVal; break;
                case 'GTE': result = leftVal >= rightVal; break;
            }
            sensorOutput.innerText = '⑂ ' + leftVal + ' ' + op + ' ' + rightVal + ' → ' + (result ? 'WAHR' : 'FALSCH');
            return result;
        }
        case 'logic_not': {
            const innerBlock = block.getInputTargetBlock('BOOL');
            const val = evaluateSensorBlock(innerBlock);
            return !val;
        }
        case 'number_value': {
            return parseFloat(block.getFieldValue('NUM')) || 0;
        }
        case 'sense_distance': {
            // Legacy block compatibility
            return sensorUltrasonic();
        }
        default:
            console.warn('Unknown sensor block type:', block.type);
            return false;
    }
}

// ════════════════════════════════════════════════════════════════
// AST INTERPRETER (rStep)
// ════════════════════════════════════════════════════════════════

function rStep() {
    if (rStack.length === 0) return null;
    let ctx = rStack[rStack.length - 1];
    let b = ctx.block;

    // ── Movement Blocks ─────────────────────────────────────────
    if (b.type === 'move_robot') {
        if (ctx.state === 0) {
            ctx.totalDist = parseInt(b.getFieldValue('DISTANCE'), 10) || 1;
            ctx.state = 1;
        }
        if (ctx.state <= ctx.totalDist) {
            ctx.state++;
            let action = b.getFieldValue('DIRECTION') === 'BACKWARD' ? 'moveBackward' : 'move';
            return { action: action, id: b.id };
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── Turn Block ──────────────────────────────────────────────
    else if (b.type === 'turn_robot') {
        if (ctx.state === 0) {
            ctx.totalDist = parseInt(b.getFieldValue('DISTANCE'), 10) || 1;
            ctx.state = 1;
        }
        if (ctx.state <= ctx.totalDist) {
            ctx.state++;
            let action = b.getFieldValue('DIRECTION') === 'LEFT' ? 'turnLeft' : 'turnRight';
            return { action: action, id: b.id };
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── Scan Block ──────────────────────────────────────────────
    else if (b.type === 'scan_object') {
        if (ctx.state === 0) {
            ctx.state = 1;
            // Perform a full scan and show results
            const dist = sensorUltrasonic();
            const light = sensorLight();
            const obj = sensorCameraObjectName();
            const tilt = sensorTilt();
            document.getElementById('sensor-output').innerText =
                '🔍 Scan: ' + obj + ' | 📏' + dist + 'cm | ☀️' + light + '% | ⛰️' + tilt + '°';
            return { action: 'scan', id: b.id };
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── Repeat N ────────────────────────────────────────────────
    else if (b.type === 'repeat_n') {
        if (ctx.state === 0) {
            ctx.totalDist = parseInt(b.getFieldValue('TIMES'), 10) || 1;
            ctx.state = 1;
        }
        if (ctx.state <= ctx.totalDist) {
            ctx.state++;
            rPush(b.getInputTargetBlock('DO'));
            return rStep();
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── While Sensor ────────────────────────────────────────────
    else if (b.type === 'while_sensor') {
        if (ctx.state === 0) {
            ctx.totalDist = 0; // iteration counter for safety
            ctx.state = 1;
        }
        if (ctx.totalDist >= 100) {
            // Safety limit reached
            document.getElementById('sensor-output').innerText = '⚠️ Schleife: Maximum von 100 Durchläufen erreicht!';
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
        const condBlock = b.getInputTargetBlock('CONDITION');
        const condResult = evaluateSensorBlock(condBlock);
        if (condResult) {
            ctx.totalDist++;
            rPush(b.getInputTargetBlock('DO'));
            return rStep();
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── If/Else ─────────────────────────────────────────────────
    else if (b.type === 'logic_if_else') {
        if (ctx.state === 0) {
            ctx.state = 1;
            const condBlock = b.getInputTargetBlock('IF_COND');
            const conditionResult = evaluateSensorBlock(condBlock);
            if (conditionResult) rPush(b.getInputTargetBlock('DO_IF'));
            else rPush(b.getInputTargetBlock('DO_ELSE'));
            return rStep();
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── Wait Seconds ────────────────────────────────────────────
    else if (b.type === 'wait_seconds') {
        if (ctx.state === 0) {
            ctx.totalDist = parseFloat(b.getFieldValue('SECONDS')) || 1;
            ctx.state = 1;
            document.getElementById('sensor-output').innerText = '⏱ Warte ' + ctx.totalDist + ' Sekunden...';
            return { action: 'wait', id: b.id, duration: ctx.totalDist };
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── Wait Until Sensor ───────────────────────────────────────
    else if (b.type === 'wait_until_sensor') {
        if (ctx.state === 0) {
            ctx.totalDist = 0; // timeout counter
            ctx.state = 1;
        }
        const condBlock = b.getInputTargetBlock('CONDITION');
        const condResult = evaluateSensorBlock(condBlock);
        if (condResult) {
            document.getElementById('sensor-output').innerText = '⏳ Bedingung erfüllt!';
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        } else {
            ctx.totalDist++;
            if (ctx.totalDist > 30) {
                document.getElementById('sensor-output').innerText = '⏳ Timeout! Bedingung nicht erfüllt nach 30s.';
                rStack.pop();
                rPush(b.getNextBlock());
                return rStep();
            }
            document.getElementById('sensor-output').innerText = '⏳ Warte auf Bedingung... (' + ctx.totalDist + '/30s)';
            return { action: 'waitUntil', id: b.id };
        }
    }

    // ── Gripper Action ──────────────────────────────────────────
    else if (b.type === 'gripper_action') {
        if (ctx.state === 0) {
            ctx.state = 1;
            const action = b.getFieldValue('ACTION');
            gripperState = action;
            document.getElementById('sensor-output').innerText =
                action === 'CLOSE' ? '✊ Greifer schließt...' : '✋ Greifer öffnet...';
            return { action: 'gripper', id: b.id, gripperAction: action };
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── Push Action ─────────────────────────────────────────────
    else if (b.type === 'push_action') {
        if (ctx.state === 0) {
            ctx.totalDist = parseInt(b.getFieldValue('DURATION'), 10) || 1;
            ctx.state = 1;
        }
        if (ctx.state <= ctx.totalDist) {
            ctx.state++;
            document.getElementById('sensor-output').innerText = '💪 Schiebe... (' + (ctx.state - 1) + '/' + ctx.totalDist + ')';
            return { action: 'push', id: b.id };
        } else {
            rStack.pop();
            rPush(b.getNextBlock());
            return rStep();
        }
    }

    // ── Unknown block → skip to next ────────────────────────────
    rStack.pop();
    rPush(b.getNextBlock());
    return rStep();
}

// ── Movement Constants (now dynamic) ───────────────────────────
let moveSpeed = 8;
const TURN_SPEED = 2.0;

// ── Camera ──────────────────────────────────────────────────────
const CAM_DISTANCE = 14;
const CAM_HEIGHT = 9;
const CAM_LERP = 0.04;

function init() {
    console.log("RoboQuest: Initializing Engine...");
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error("CRITICAL ERROR: 'canvas-container' not found!");
        return;
    }
    
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
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stop before going under ground
    controls.minDistance = 2;
    controls.maxDistance = 60;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enabled = false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbdd, 1.2);
    dirLight.position.set(30, 60, -30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    buildEnvironment();
    buildClouds();
    buildEcoBot();
    buildTargetRing();
    setupInputHandlers();

    if (window.ResizeObserver) {
        new ResizeObserver(onWindowResize).observe(container);
    } else {
        window.addEventListener('resize', onWindowResize, false);
        setTimeout(onWindowResize, 100);
    }

    document.getElementById('btn-run').addEventListener('click', () => {
        if(window.getBlocklyAST) {
            const rootBlock = window.getBlocklyAST();
            if(!rootBlock) {
                document.getElementById('sensor-output').innerText = 'Leeres Programm! Ziehe Blöcke in den Editor.';
                return;
            }
            document.getElementById('sensor-output').innerText = '▶ AST Programm geladen. Aktiviere Sensoren. Starte...';
            rStack = [];
            currentCommandObj = null;
            currentCommand = null;
            rPush(rootBlock);
            isRunning = true;
        }
    });

    document.getElementById('btn-stop').addEventListener('click', () => {
        document.getElementById('sensor-output').innerText = 'Eco-Bot pausiert.';
        isRunning = false;
        rStack = [];
        currentCommandObj = null;
        currentCommand = null;
        if (window.highlightBlock) window.highlightBlock(null);
    });

    // ── Category Sidebar Buttons ─────────────────────────────────
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const ide = document.getElementById('code-ide');
            const categoryName = btn.getAttribute('data-category');

            // Toggle active state on sidebar
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            
            // If IDE is hidden or a different category was clicked, open/show it
            if (ide.classList.contains('hidden')) {
                ide.classList.remove('hidden');
                btn.classList.add('active');
                if (typeof injectBlockly === 'function') {
                    setTimeout(() => {
                        window.injectBlockly(gameState.unlockedFeatures);
                        // Select the matching category in Blockly toolbox
                        setTimeout(() => window.selectBlocklyCategory(categoryName), 100);
                    }, 50);
                }
            } else {
                // IDE is already open — check if same button was clicked (toggle off)
                if (btn.classList.contains('_wasActive')) {
                    ide.classList.add('hidden');
                    btn.classList.remove('_wasActive');
                    return;
                }
                btn.classList.add('active');
                // Just switch category
                if (typeof window.selectBlocklyCategory === 'function') {
                    window.selectBlocklyCategory(categoryName);
                }
            }
            // Mark for toggle-off on second click
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('_wasActive'));
            btn.classList.add('_wasActive');
        });
    });

    // ResizeObserver for #code-ide is now handled inside blockly_setup.js

    document.getElementById('btn-next-quest').addEventListener('click', () => {
        document.getElementById('success-overlay').style.display = 'none';
        completeLevel();
    });

    document.getElementById('btn-reward-close').addEventListener('click', () => {
        document.getElementById('reward-popup').style.display = 'none';
        spawnNextTarget();
    });

    animate();
}

// ════════════════════════════════════════════════════════════════
// INPUT HANDLERS
// ════════════════════════════════════════════════════════════════
function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'w': case 'W': case 'ArrowUp':    inputState.forward = true; break;
            case 's': case 'S': case 'ArrowDown':  inputState.backward = true; break;
            case 'a': case 'A': case 'ArrowLeft':  inputState.left = true; break;
            case 'd': case 'D': case 'ArrowRight': inputState.right = true; break;
        }
    });
    window.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'w': case 'W': case 'ArrowUp':    inputState.forward = false; break;
            case 's': case 'S': case 'ArrowDown':  inputState.backward = false; break;
            case 'a': case 'A': case 'ArrowLeft':  inputState.left = false; break;
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
}

function checkCollision(x, z, yaw = null, isRotation = false) {
    const robotRadius = 1.3;
    const currentYaw = (yaw !== null) ? yaw : (roverGroup ? roverGroup.rotation.y : 0);

    for (const obs of obstacles) {
        if (Math.hypot(x - obs.x, z - obs.z) < robotRadius + obs.radius) return true;
    }
    
    if (gameState.currentLevel >= 2) {
        // Stop robot from driving into the lake
        if (!isRotation && Math.hypot(x - 45, z - 50) < 22) return true;
    }
    
    if (gameState.currentLevel >= 3) {
        if (!isRotation && z > 24 && z < 76) {
            const rDX = Math.cos(currentYaw), rDZ = -Math.sin(currentYaw);
            const points = [
                { x: x, z: z },
                { x: x + rDX * 1.6, z: z + rDZ * 1.6 },
                { x: x - rDX * 1.6, z: z - rDZ * 1.6 }
            ];

            for (const pt of points) {
                if (pt.z > 39 && pt.z < 61 && Math.abs(pt.x) > 4.8) return true;
                if (((pt.z >= 24 && pt.z <= 39) || (pt.z >= 61 && pt.z <= 76)) && Math.abs(pt.x) > 4.8) return true;
            }
        }
    }
    return false;
}

// ════════════════════════════════════════════════════════════════
// LEVEL & REWARDS
// ════════════════════════════════════════════════════════════════
function completeLevel() {
    const lvl = levels[gameState.currentLevel];
    if (lvl && lvl.reward) {
        showReward(lvl.reward);
        gameState.unlockedFeatures.push(lvl.reward.id);
        
        // Apply immediate effects
        if (lvl.reward.id === 'turbo') moveSpeed = 11.5;
        if (lvl.reward.id === 'loops') {
            document.getElementById('sensor-output').innerText = "Schleifen wurden dem Werkzeugkasten hinzugefügt!";
        }
        if (lvl.reward.id === 'gold') applyGoldSkin();
    } else {
        spawnNextTarget();
    }
    
    gameState.currentLevel++;
    if (gameState.currentLevel === 4) spawnBatteries(3);
    buildEnvironment(); // Rebuild with new biome
    updateHUD();
}

function spawnBatteries(count) {
    // Clear old ones
    collectibles.forEach(c => scene.remove(c.mesh));
    collectibles = [];
    collectedCount = 0;

    const batteryGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12);
    const batteryMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xaa8800 });
    const capGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.2, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    for (let i = 0; i < count; i++) {
        const group = new THREE.Group();
        const mesh = new THREE.Mesh(batteryGeo, batteryMat);
        group.add(mesh);
        
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.6;
        group.add(cap);
        
        const botCap = new THREE.Mesh(capGeo, capMat);
        botCap.position.y = -0.6;
        group.add(botCap);

        const rx = (Math.random() - 0.5) * 120;
        const rz = (Math.random() - 1.0) * 120 + 20; 
        const ry = getTerrainYGlobal(rx, rz) + 1.0;
        group.position.set(rx, ry, rz);
        group.castShadow = true;
        scene.add(group);
        collectibles.push({ mesh: group, x: rx, z: rz, id: 'battery' });
    }
}

function checkItemPickup() {
    if (!roverGroup) return;
    const rx = roverGroup.position.x;
    const rz = roverGroup.position.z;
    
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        if (Math.hypot(rx - c.x, rz - c.z) < 2.5) {
            scene.remove(c.mesh);
            collectibles.splice(i, 1);
            collectedCount++;
            score += 50;
            document.getElementById('score-display').innerText = score;
            document.getElementById('sensor-output').innerText = "🔋 Batterie gesammelt! (" + collectedCount + ")";
            
            const lvl = levels[gameState.currentLevel];
            if (lvl && lvl.type === "collect" && collectedCount >= lvl.targetCount) {
                targetReached = true;
                setTimeout(() => {
                    document.getElementById('success-overlay').style.display = 'flex';
                    document.getElementById('sensor-output').innerText = '🎉 Alle Batterien gesammelt!';
                }, 500);
            }
        }
    }
}

function showReward(reward) {
    document.getElementById('reward-icon').innerText = reward.icon;
    document.getElementById('reward-title').innerText = reward.title;
    document.getElementById('reward-desc').innerText = reward.desc;
    document.getElementById('reward-popup').style.display = 'block';
}

function updateHUD() {
    document.getElementById('level-badge').innerText = "Level " + gameState.currentLevel;
    const lData = levels[gameState.currentLevel];
    if (lData) {
        document.getElementById('quest-text').innerText = lData.text;
    } else {
        document.getElementById('quest-text').innerText = "🌳 Erkunde den Wald!";
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
    
    const circle = new THREE.Mesh(new THREE.RingGeometry(1, 3, 32), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.2, side: THREE.DoubleSide }));
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
    
    const rx = roverGroup.position.x;
    const rz = roverGroup.position.z;
    let tx, tz, attempts = 0;

    // Special Target for Level 6 (The Cave)
    if (gameState.currentLevel === 6) {
        tx = -80; tz = 40;
    } else {
        do {
            tx = (Math.random() - 0.5) * 80;
            tz = (Math.random() - 0.5) * 120 + 20;
            if (tz > 35 && tz < 65 && Math.abs(tx) > 5) tz = -20 - Math.random() * 30;
            attempts++;
        } while (Math.hypot(tx-rx, tz-rz) < 30 && attempts < 20);
    }

    targetPosition.set(tx, 0, tz);
    goalCheckDelay = 0;
    buildTargetRing();
}function applyGoldSkin() {
    if (!roverGroup) return;
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    roverGroup.traverse(node => {
        if (node.isMesh && node.material.color && node.material.color.getHex() === 0xf8fafc) {
            node.material = goldMat;
        }
    });
}

function tryMove(distance) {
    const oldX = roverGroup.position.x;
    const oldZ = roverGroup.position.z;
    roverGroup.translateZ(distance);
    
    // Check World Border specifically
    if (Math.abs(roverGroup.position.x) > 215 || Math.abs(roverGroup.position.z) > 215) {
        roverGroup.position.x = oldX; roverGroup.position.z = oldZ;
        const out = document.getElementById('sensor-output');
        if (out) out.innerText = "Warnung: Signal verloren! Wir erreichen das Ende des erforschten Waldes. Kehre um!";
        return false;
    }

    if (checkCollision(roverGroup.position.x, roverGroup.position.z, roverGroup.rotation.y)) {
        roverGroup.position.x = oldX; roverGroup.position.z = oldZ;
        return false;
    }
    return true;
}

function getTerrainVisualYGlobal(x, z) {
    const hills = Math.sin(x*0.15) * Math.cos(z*0.15) * 0.4;
    let base = Math.sin(x*0.05) * Math.cos(z*0.05) * 1.5 + Math.sin(x*0.01) * 2 + hills;
    
    if (gameState.currentLevel >= 3 && z > 40 && z < 60) {
        base -= Math.sin((z - 40) / 20 * Math.PI) * 10;
    }
    
    if (gameState.currentLevel >= 2) {
        const distToLake = Math.hypot(x - 45, z - 50);
        if (distToLake < 35) base -= Math.cos((distToLake / 35) * (Math.PI/2)) * 6.5;
    }
    
    return base;
}

function getTerrainYGlobal(x, z) {
    const visualY = getTerrainVisualYGlobal(x, z);
    if (gameState.currentLevel >= 3 && z > 38 && z < 62) {
        const distToCenter = Math.abs(x);
        const bridgeWeight = 1.0 - Math.min(1.0, Math.max(0.0, (distToCenter - 4.5) / 1.5));
        let bridgeFloor = 0.8;
        return bridgeFloor * bridgeWeight + visualY * (1.0 - bridgeWeight);
    }
    return visualY;
}

// ── Tire Trails ───────────────────────────────────────
function spawnTrailMark() {
    const yaw = roverGroup.rotation.y;
    const rx = roverGroup.position.x;
    const rz = roverGroup.position.z;
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);
    for (const side of [-1.4, 1.4]) {
        const mx = rx + rightX * side;
        const mz = rz + rightZ * side;
        const mark = new THREE.Mesh(trailGeo, trailMat.clone());
        mark.rotation.x = -Math.PI / 2;
        mark.rotation.z = -yaw;
        
        // Brown path is elevated by 0.1 at Math.abs(x) <= 6
        const pathElevation = Math.abs(mx) <= 6 ? 0.1 : 0.0;
        mark.position.set(mx, getTerrainYGlobal(mx, mz) + pathElevation + 0.08, mz);
        
        scene.add(mark);
        trails.push({ mesh: mark, age: 0 });
    }
}

function updateTrails(delta) {
    for (let i = trails.length - 1; i >= 0; i--) {
        trails[i].age += delta;
        const t = trails[i].age / TRAIL_LIFETIME;
        if (t >= 1) { scene.remove(trails[i].mesh); trails[i].mesh.material.dispose(); trails.splice(i, 1); }
        else trails[i].mesh.material.opacity = 0.45 * (1 - t);
    }
}

function checkGoal(delta) {
    if (targetReached || !targetMesh) return;
    
    // Level 4 is collection based, handled in checkItemPickup
    if (levels[gameState.currentLevel] && levels[gameState.currentLevel].type === "collect") {
        checkItemPickup();
        return;
    }

    if (goalCheckDelay < 2.0) { goalCheckDelay += delta; return; }
    if (Math.hypot(roverGroup.position.x - targetPosition.x, roverGroup.position.z - targetPosition.z) < 3.5) {
        targetReached = true;
        score += 100;
        document.getElementById('score-display').innerText = score;
        document.getElementById('success-overlay').style.display = 'flex';
        document.getElementById('sensor-output').innerText = '🎉 Ziel erreicht!';
    }
}

// ════════════════════════════════════════════════════════════════
// ENVIRONMENT
// ════════════════════════════════════════════════════════════════
function buildClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, flatShading: true, fog: false });
    for(let i=0; i<35; i++) {
        const cloudGroup = new THREE.Group();
        for(let j=0; j<Math.floor(Math.random() * 4) + 3; j++) {
            const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.random() * 4 + 2.5, 0), cloudMat);
            puff.scale.set(1, 0.6, 1);
            puff.position.set((Math.random()-0.5)*8, (Math.random()-0.5)*2, (Math.random()-0.5)*8);
            puff.castShadow = true; cloudGroup.add(puff);
        }
        cloudGroup.position.set((Math.random()-0.5)*250, Math.random()*15+25, (Math.random()-0.5)*250);
        scene.add(cloudGroup);
    }
}

let environmentGroup = null;

function buildEnvironment() {
    if (environmentGroup) {
        scene.remove(environmentGroup);
    }
    environmentGroup = new THREE.Group();
    obstacles = [];

    const groundGeo = new THREE.PlaneGeometry(450, 450, 100, 100);
    const pos = groundGeo.attributes.position;
    for(let i=0; i < pos.count; i++) {
        const localX = pos.getX(i), localY = pos.getY(i);
        const globalX = localX, globalZ = -localY;
        pos.setZ(i, getTerrainVisualYGlobal(globalX, globalZ));
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x4ade80, flatShading: true }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; 
    environmentGroup.add(ground);

    const pathWidth = 12;
    const pathGeo = new THREE.PlaneGeometry(pathWidth, 450, 32, 100);
    const pathPos = pathGeo.attributes.position;
    for(let i=0; i < pathPos.count; i++) {
        const localX = pathPos.getX(i), localY = pathPos.getY(i);
        const globalX = localX, globalZ = -localY;
        pathPos.setZ(i, getTerrainVisualYGlobal(globalX, globalZ) + 0.1); 
    }
    pathGeo.computeVertexNormals();
    const path = new THREE.Mesh(pathGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true }));
    path.rotation.x = -Math.PI / 2; path.receiveShadow = true; 
    environmentGroup.add(path);

    // Branching Paths (Muddy Paths)
    const branchGeo = new THREE.PlaneGeometry(8, 100, 16, 20);
    const b1 = new THREE.Mesh(branchGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true }));
    b1.rotation.x = -Math.PI / 2; b1.rotation.z = Math.PI / 4;
    b1.position.set(40, 0.1, -20);
    environmentGroup.add(b1);

    const b2 = new THREE.Mesh(branchGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true }));
    b2.rotation.x = -Math.PI / 2; b2.rotation.z = -Math.PI / 3;
    b2.position.set(-60, 0.1, 40);
    environmentGroup.add(b2);

    const b3 = new THREE.Mesh(branchGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true }));
    b3.rotation.x = -Math.PI / 2; b3.rotation.z = Math.PI / 2.5;
    b3.position.set(-20, 0.1, -40);
    environmentGroup.add(b3);

    const b4 = new THREE.Mesh(branchGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true }));
    b4.rotation.x = -Math.PI / 2; b4.rotation.z = -Math.PI / 4;
    b4.position.set(20, 0.1, 80);
    environmentGroup.add(b4);

    // Cave Structure (Rocks forming an entrance at Level 6 target)
    if (gameState.currentLevel >= 5) {
        const cavePos = { x: -80, z: 40 };
        for (let i = 0; i < 8; i++) {
            const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + Math.random()*2, 0), new THREE.MeshStandardMaterial({ color: 0x333333 }));
            const angle = (i / 8) * Math.PI - Math.PI/2;
            rock.position.set(cavePos.x + Math.cos(angle)*6, 2, cavePos.z + Math.sin(angle)*6);
            environmentGroup.add(rock);
            obstacles.push({ x: rock.position.x, z: rock.position.z, radius: 4 });
        }
    }

    if (gameState.currentLevel >= 3) {
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0x6d4c41, flatShading: true }));
        bridge.position.set(0, 0.5, 50); bridge.receiveShadow = true; bridge.castShadow = true; 
        environmentGroup.add(bridge);
    }

    if (gameState.currentLevel >= 2) {
        const lake = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, flatShading: true, transparent: true, opacity: 0.8 }));
        lake.scale.set(1, 1, 1.5); lake.position.set(45, -0.2, 50); lake.receiveShadow = true; 
        environmentGroup.add(lake);
    }

    const trkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, flatShading: true });
    const leaP = new THREE.MeshStandardMaterial({ color: 0x2e7d32, flatShading: true });
    const leaD = new THREE.MeshStandardMaterial({ color: 0x558b2f, flatShading: true });
    const leaB = new THREE.MeshStandardMaterial({ color: 0x1b5e20, flatShading: true });
    const rckM = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, flatShading: true });
    
    const numTrees = gameState.currentLevel === 1 ? 500 : (gameState.currentLevel === 2 ? 1000 : 2000);
    for(let i=0; i<numTrees; i++) {
        let rx = (Math.random()-0.5)*430, rz = (Math.random()-0.5)*430;
        if (Math.abs(rx) < 12) rx = rx >= 0 ? rx + 12 : rx - 12;
        if (Math.abs(rx) < 15 && Math.abs(rz) < 15) rz += 20;
        if (gameState.currentLevel >= 2 && Math.hypot(rx-45, rz-50) < 35) rx -= 40;
        let tY = getTerrainYGlobal(rx, rz);
        if (tY < -2 && Math.random() < 0.8) continue;

        const type = Math.random();
        if (type < 0.35) { // Evergreen
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2, 5), trkMat);
            trunk.position.y = 1; trunk.castShadow = true; tree.add(trunk);
            const l1 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4, 6), leaP); l1.position.y = 3; tree.add(l1);
            const l2 = new THREE.Mesh(new THREE.ConeGeometry(2, 3, 6), leaP); l2.position.y = 5; tree.add(l2);
            const s = Math.random()*0.5+0.7; tree.scale.set(s,s,s); tree.position.set(rx, tY, rz);
            environmentGroup.add(tree); obstacles.push({ x: rx, z: rz, radius: 1.5*s });
        } else if (type < 0.55) { // Round tree
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2, 5), trkMat);
            trunk.position.y = 1; tree.add(trunk);
            const l1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2), leaD); l1.position.y = 3; tree.add(l1);
            const s = Math.random()*0.5+0.7; tree.scale.set(s,s,s); tree.position.set(rx, tY, rz);
            environmentGroup.add(tree); obstacles.push({ x: rx, z: rz, radius: 1.5*s });
        } else if (type < 0.75) { // Rocks
            const rR = Math.random()*1.2+0.4;
            const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rR, 0), rckM);
            rock.position.set(rx, tY+0.4, rz); rock.castShadow = true; 
            environmentGroup.add(rock);
            obstacles.push({ x: rx, z: rz, radius: rR*0.8 });
        } else { // Bushes / Ferns
            const bush = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), leaB);
            bush.scale.set(1.5 + Math.random(), 0.6 + Math.random()*0.4, 1.2 + Math.random());
            bush.position.set(rx, tY + 0.3, rz);
            environmentGroup.add(bush);
        }
    }
    scene.add(environmentGroup);
}

function buildEcoBot() {
    roverGroup = new THREE.Group();
    scene.add(roverGroup);
    
    // Materials
    const mWhite = new THREE.MeshLambertMaterial({ color: 0xf8fafc }); 
    const mGreen = new THREE.MeshLambertMaterial({ color: 0x4ade80 }); 
    const mDark = new THREE.MeshLambertMaterial({ color: 0x1e293b }); 
    const mSilver = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const mCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const mOrange = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const mSolar = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });

    // 1. Chassis (Tri-segmented body for depth)
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 3.2), mWhite); 
    base.position.y = 1.0; 
    roverGroup.add(base);
    
    // Inner dark waist
    const waist = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 2.8), mDark);
    waist.position.y = 1.6;
    roverGroup.add(waist);

    // Upper Chest
    const chest = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 2.8), mWhite);
    chest.position.set(0, 2.3, 0.2); 
    roverGroup.add(chest);

    // Front Chest Vents
    const ventGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    for(let i=0; i<3; i++) {
        const vent = new THREE.Mesh(ventGeo, mDark);
        vent.position.set(0, 2.05 + i*0.2, 1.6);
        roverGroup.add(vent);
    }

    // Modern Strut Bumper (replaces giant cylinder)
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.8), mSilver);
    strutL.position.set(-0.8, 0.9, 1.9);
    roverGroup.add(strutL);
    
    const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.8), mSilver);
    strutR.position.set(0.8, 0.9, 1.9);
    roverGroup.add(strutR);
    
    const bumperBar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 0.3), mGreen);
    bumperBar.position.set(0, 0.9, 2.3);
    roverGroup.add(bumperBar);

    // Eco Solar Panel on back
    const solar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.8), mSolar);
    solar.position.set(0, 2.85, -0.2);
    roverGroup.add(solar);

    // 2. Head & Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), mSilver);
    neck.position.set(0, 3.0, 0.8);
    roverGroup.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 3.6, 0.8);
    
    const headBox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.4), mWhite);
    headGroup.add(headBox);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.1), mDark);
    visor.position.set(0, 0, 0.71);
    headGroup.add(visor);

    // Glowing eyes
    const eyeGeo = new THREE.PlaneGeometry(0.4, 0.4);
    const eyeL = new THREE.Mesh(eyeGeo, mCyan);
    eyeL.position.set(-0.4, 0, 0.77);
    headGroup.add(eyeL);
    
    const eyeR = new THREE.Mesh(eyeGeo, mCyan);
    eyeR.position.set(0.4, 0, 0.77);
    headGroup.add(eyeR);

    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6), mSilver);
    antennaStem.position.set(0.6, 0.9, -0.3);
    antennaStem.rotation.z = -0.2;
    headGroup.add(antennaStem);

    const antennaBulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), mOrange);
    antennaBulb.position.set(0.66, 1.25, -0.3);
    headGroup.add(antennaBulb);

    roverGroup.add(headGroup);

    // 3. Lidar Scanner
    lidar = new THREE.Group();
    const lidarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16), mDark);
    lidar.add(lidarBase);
    const lidarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16), mSilver);
    lidarTop.position.y = 0.3;
    lidar.add(lidarTop);
    const lidarEye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.3), mCyan);
    lidarEye.position.set(0, 0.3, 0.2);
    lidar.add(lidarEye); 
    
    lidar.position.set(-0.6, 3.0, -0.4);
    roverGroup.add(lidar);

    // 4. Double-Jointed Helper Arms (Prevents clipping and adds detail)
    const buildArm = (isRight) => {
        const armGroup = new THREE.Group();
        
        // Horizontal cylindrical shoulder joint embedded in chest
        const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16), mSilver);
        shoulder.rotation.z = Math.PI / 2;
        armGroup.add(shoulder);
        
        const bicep = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), mWhite);
        bicep.position.set(isRight ? 0.3 : -0.3, -0.3, 0.2);
        bicep.rotation.x = -Math.PI / 6;
        armGroup.add(bicep);
        
        const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), mSilver);
        elbow.position.set(isRight ? 0.3 : -0.3, -0.65, 0.4);
        armGroup.add(elbow);

        const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), mWhite);
        forearm.position.set(isRight ? 0.3 : -0.3, -0.9, 0.6);
        forearm.rotation.x = -Math.PI / 3;
        armGroup.add(forearm);
        
        const clawBase = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.25), mDark);
        clawBase.position.set(isRight ? 0.3 : -0.3, -1.1, 0.95);
        clawBase.rotation.x = -Math.PI / 3;
        armGroup.add(clawBase);

        const claw1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), mGreen);
        claw1.position.set(isRight ? 0.4 : -0.2, -1.2, 1.1);
        claw1.rotation.x = Math.PI / 2;
        armGroup.add(claw1);
        
        const claw2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), mGreen);
        claw2.position.set(isRight ? 0.2 : -0.4, -1.2, 1.1);
        claw2.rotation.x = Math.PI / 2;
        armGroup.add(claw2);

        return armGroup;
    };

    // Attach perfectly to the side of the chest (x = +/- 1.3)
    const armL = buildArm(false);
    armL.position.set(-1.3, 2.5, 0.8);
    roverGroup.add(armL);

    const armR = buildArm(true);
    armR.position.set(1.3, 2.5, 0.8);
    roverGroup.add(armR);

    // 5. Detailed Tracks
    trackLeft = buildDetailedTrack(); 
    trackLeft.position.set(-1.6, 0.6, 0); 
    roverGroup.add(trackLeft);
    
    trackRight = buildDetailedTrack(); 
    trackRight.position.set(1.6, 0.6, 0); 
    roverGroup.add(trackRight);

    function buildDetailedTrack() {
        const g = new THREE.Group();
        const r = 0.6, a = 1.6;
        
        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.7, r*2, a*2), mDark); 
        g.add(belt);
        const frontCurve = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.7, 24), mDark); 
        frontCurve.rotation.z = Math.PI/2; 
        frontCurve.position.z = a; 
        g.add(frontCurve);
        const backCurve = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.7, 24), mDark); 
        backCurve.rotation.z = Math.PI/2; 
        backCurve.position.z = -a; 
        g.add(backCurve);

        // --- TREADS ---
        const treadW = 0.75; 
        const treadH = 0.08;
        const treadD = 0.12;
        
        for (let z = -a; z <= a; z += 0.3) {
            const tt = new THREE.Mesh(new THREE.BoxGeometry(treadW, treadH, treadD), mDark);
            tt.position.set(0, r, z);
            g.add(tt);
            
            const tb = new THREE.Mesh(new THREE.BoxGeometry(treadW, treadH, treadD), mDark);
            tb.position.set(0, -r, z);
            g.add(tb);
        }
        for (let angle = Math.PI/2; angle >= -Math.PI/2; angle -= Math.PI/8) {
            if (Math.abs(angle) === Math.PI/2) continue; 
            const tz = a + Math.cos(angle) * r;
            const ty = Math.sin(angle) * r;
            const tc = new THREE.Mesh(new THREE.BoxGeometry(treadW, treadH, treadD), mDark);
            tc.position.set(0, ty, tz);
            tc.rotation.x = Math.PI/2 - angle; 
            g.add(tc);
        }
        for (let angle = Math.PI/2; angle <= 3*Math.PI/2; angle += Math.PI/8) {
            if (Math.abs(angle - Math.PI/2) < 0.01 || Math.abs(angle - 3*Math.PI/2) < 0.01) continue;
            const tz = -a + Math.cos(angle) * r;
            const ty = Math.sin(angle) * r;
            const tc = new THREE.Mesh(new THREE.BoxGeometry(treadW, treadH, treadD), mDark);
            tc.position.set(0, ty, tz);
            tc.rotation.x = Math.PI/2 - angle;
            g.add(tc);
        }

        // Inner wheels
        const hubGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.75, 16);
        const w1 = new THREE.Mesh(hubGeo, mSilver); w1.rotation.z = Math.PI/2; w1.position.z = a; g.add(w1);
        const w2 = new THREE.Mesh(hubGeo, mSilver); w2.rotation.z = Math.PI/2; w2.position.z = -a; g.add(w2);
        const w3 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.75, 16), mSilver); w3.rotation.z = Math.PI/2; w3.position.z = 0; w3.position.y = -0.3; g.add(w3);
        
        return g;
    }

    // Enable shadows for all parts
    roverGroup.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

function onWindowResize() {
    const c = document.getElementById('canvas-container');
    camera.aspect = c.clientWidth / c.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(c.clientWidth, c.clientHeight);
}

// ════════════════════════════════════════════════════════════════
// ANIMATE LOOP
// ════════════════════════════════════════════════════════════════
function animate() {
    try {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        let isMoving = false;

        if (lidar) lidar.rotation.y += 2 * delta;

        if (targetMesh && !targetReached) {
            const pulse = (Math.sin(Date.now() * 0.003) + 1) / 2;
            targetMesh.scale.setScalar(0.9 + pulse * 0.2);
            targetMesh.material.opacity = 0.5 + pulse * 0.4;
            targetMesh.position.y = getTerrainYGlobal(targetPosition.x, targetPosition.z) + 1.5 + pulse * 0.5;
            if (targetMesh.userData.beam) targetMesh.userData.beam.material.opacity = 0.15 + pulse * 0.2;
        }

        // 1. Process Movement & Rotation (Logic Phase)
        const anyInput = inputState.forward || inputState.backward || inputState.left || inputState.right;
        if (anyInput) {
            const rotDelta = TURN_SPEED * delta;
            if (inputState.left) {
                const nextYaw = roverGroup.rotation.y + rotDelta;
                if (!checkCollision(roverGroup.position.x, roverGroup.position.z, nextYaw, true)) roverGroup.rotation.y = nextYaw;
                else document.getElementById('sensor-output').innerText = '🚧 Kante erkannt!';
            }
            if (inputState.right) {
                const nextYaw = roverGroup.rotation.y - rotDelta;
                if (!checkCollision(roverGroup.position.x, roverGroup.position.z, nextYaw, true)) roverGroup.rotation.y = nextYaw;
                else document.getElementById('sensor-output').innerText = '🚧 Kante erkannt!';
            }
            if (inputState.forward) {
                const moved = tryMove(moveSpeed * delta);
                if (!moved) document.getElementById('sensor-output').innerText = '🚧 Hindernis / Kante erkannt!';
                isMoving = moved;
            }
            if (inputState.backward) isMoving = tryMove(-moveSpeed * delta * 0.6);
            if (inputState.left || inputState.right) isMoving = true;
        }

        if (isRunning) {
            if (!currentCommandObj && rStack.length > 0) {
                currentCommandObj = rStep(); 
                if (currentCommandObj) {
                    currentCommand = currentCommandObj.action;
                    commandProgress = 0;
                    if (window.highlightBlock && currentCommandObj.id) window.highlightBlock(currentCommandObj.id);
                    if (!document.getElementById('sensor-output').innerText.includes('👁')) {
                        document.getElementById('sensor-output').innerText = '⚙️ ' + currentCommand;
                    }
                }
            }
            
            if (!currentCommandObj && rStack.length === 0) {
                isRunning = false; 
                if (window.highlightBlock) window.highlightBlock(null);
                document.getElementById('sensor-output').innerText = '✅ Programm beendet!';
            }

            if (currentCommandObj) {
                // Precise timing: 1 block = 1 second exactly
                let animSpeed = 1.0 * delta;
                let cmdDuration = currentCommandObj.duration || 1.0; // Custom duration for wait blocks
                
                if (currentCommand === 'move') { tryMove(5.0 * delta); commandProgress += delta; isMoving = true; }
                else if (currentCommand === 'moveBackward') { tryMove(-5.0 * delta); commandProgress += delta; isMoving = true; }
                else if (currentCommand === 'turnLeft') { 
                    const nextYaw = roverGroup.rotation.y + (Math.PI / 2) * animSpeed;
                    if (!checkCollision(roverGroup.position.x, roverGroup.position.z, nextYaw, true)) roverGroup.rotation.y = nextYaw;
                    commandProgress += animSpeed; isMoving = true; 
                }
                else if (currentCommand === 'turnRight') { 
                    const nextYaw = roverGroup.rotation.y - (Math.PI / 2) * animSpeed;
                    if (!checkCollision(roverGroup.position.x, roverGroup.position.z, nextYaw, true)) roverGroup.rotation.y = nextYaw;
                    commandProgress += animSpeed; isMoving = true; 
                }
                else if (currentCommand === 'scan') { 
                    commandProgress += animSpeed; 
                    if (lidar) lidar.rotation.y += 12 * delta; 
                }
                else if (currentCommand === 'wait') {
                    // Wait for specified duration
                    commandProgress += delta / cmdDuration;
                }
                else if (currentCommand === 'waitUntil') {
                    // Wait 1 second then re-evaluate condition
                    commandProgress += delta;
                }
                else if (currentCommand === 'gripper') {
                    // Gripper animation: animate arm parts
                    commandProgress += animSpeed;
                    if (roverGroup) {
                        // Pulse the robot slightly to show gripper activity
                        const pulse = Math.sin(commandProgress * Math.PI * 4) * 0.03;
                        roverGroup.children.forEach(child => {
                            if (child.position && child.position.y > 2.5) {
                                child.position.x = child.userData._origX !== undefined ? child.userData._origX + pulse : child.position.x;
                                if (child.userData._origX === undefined) child.userData._origX = child.position.x;
                            }
                        });
                    }
                }
                else if (currentCommand === 'push') {
                    // Push = slow move forward with visual effect
                    tryMove(2.5 * delta); // Half speed
                    commandProgress += delta;
                    isMoving = true;
                }
                
                if (commandProgress >= 1.0) {
                    if (currentCommand && currentCommand.includes('turn')) roverGroup.rotation.y = Math.round(roverGroup.rotation.y / (Math.PI/2)) * (Math.PI/2);
                    // Reset gripper visual
                    if (currentCommand === 'gripper' && roverGroup) {
                        roverGroup.children.forEach(child => {
                            if (child.userData._origX !== undefined) {
                                child.position.x = child.userData._origX;
                                delete child.userData._origX;
                            }
                        });
                    }
                    currentCommandObj = null;
                    currentCommand = null;
                }
            }
        }

        // 2. Resolve Height & Tilt (Physics Phase)
        const rx = roverGroup.position.x, rz = roverGroup.position.z, yaw = roverGroup.rotation.y;
        const rDX = Math.cos(yaw), rDZ = -Math.sin(yaw), fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
        const yL = getTerrainYGlobal(rx - rDX*1.6, rz - rDZ*1.6), yR = getTerrainYGlobal(rx + rDX*1.6, rz + rDZ*1.6);
        const yF = getTerrainYGlobal(rx + fDX*2.2, rz + fDZ*2.2), yB = getTerrainYGlobal(rx - fDX*2.2, rz - fDZ*2.2);

        // Calculate true dynamic height
        const terrainY = (yL+yR+yF+yB)/4 + 0.18;
        
        // Allow the robot to tilt significantly (up to ~45 degrees or 0.8 radians)
        const pitch = Math.max(-0.8, Math.min(0.8, Math.atan2(yB - yF, 4.4)));
        const roll  = Math.max(-0.8, Math.min(0.8, Math.atan2(yR - yL, 3.2)));
        
        roverGroup.position.y = terrainY;
        roverGroup.rotation.set(pitch, yaw, roll, 'YXZ');

        // 3. Aux Logic (Feedback Phase)
        if (isMoving) { trailTimer += delta; if (trailTimer >= TRAIL_INTERVAL) { spawnTrailMark(); trailTimer = 0; } }
        updateTrails(delta);
        checkGoal(delta);

        // Camera Logic
        if (cameraChaseMode) {
            // Chase Camera
            const behindX = rx - Math.sin(yaw) * CAM_DISTANCE;
            const behindZ = rz - Math.cos(yaw) * CAM_DISTANCE;
            const behindY = terrainY + CAM_HEIGHT;
            camera.position.x += (behindX - camera.position.x) * CAM_LERP;
            camera.position.y += (behindY - camera.position.y) * CAM_LERP;
            camera.position.z += (behindZ - camera.position.z) * CAM_LERP;
            camera.lookAt(new THREE.Vector3(rx, terrainY + 3, rz));
            if (controls) controls.enabled = false;
        } else {
            // Free Orbit
            if (controls) {
                controls.target.set(rx, terrainY + 1.5, rz);
                controls.enabled = true;
                controls.update();
            }
        }

        renderer.render(scene, camera);
    } catch (err) { console.error("ANIMATE ERROR:", err); }
}

function setupDPad() {
    const map = { 'dpad-up': 'forward', 'dpad-down': 'backward', 'dpad-left': 'left', 'dpad-right': 'right' };
    Object.entries(map).forEach(([id, st]) => {
        const el = document.getElementById(id);
        if (!el) return;
        ['pointerdown', 'mousedown', 'touchstart'].forEach(evt => {
            el.addEventListener(evt, (e) => { e.preventDefault(); inputState[st] = true; });
        });
        ['pointerup', 'mouseup', 'touchend', 'pointerleave', 'mouseleave'].forEach(evt => {
            el.addEventListener(evt, (e) => { e.preventDefault(); inputState[st] = false; });
        });
    });

    // Reset Button
    document.getElementById('reset-btn').addEventListener('click', () => {
        roverGroup.position.set(0, 0.2, 0);
        roverGroup.rotation.set(0, 0, 0);
        document.getElementById('sensor-output').innerText = '🔄 Roboter zurückgesetzt!';
    });

    // Camera Toggle
    document.getElementById('cam-toggle-btn').addEventListener('click', (e) => {
        cameraChaseMode = !cameraChaseMode;
        e.target.innerText = cameraChaseMode ? '🎥 Ansicht: Follow' : '🎥 Ansicht: Orbit';
        document.getElementById('sensor-output').innerText = cameraChaseMode ? '🎥 Verfolgermodus AN' : '🎥 Freie Kamera AN';
    });
}

init();
setupDPad();
updateHUD();
