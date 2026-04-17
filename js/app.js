/**
 * RoboQuest 3D - Core Engine (v5 Story Exploration)
 * Features: Fog of War, Collectibles, Secret Zones, Story Quests, Score Multipliers
 */
let scene, camera, renderer;
let roverGroup, trackLeft, trackRight, lidar;
let isRunning = false;
let clock = new THREE.Clock();
let controls;

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
    totalItemsCollected: 0,
    seedsPlanted: 0,
    blocksUsedLastRun: 0,
    blocksDetailed: { move: 0, turn: 0, loop: 0, logic: 0, action: 0 },
    batteryLevel: 100
};

const STORY_ACTS = {
    1: {
        title: "📖 Akt 1: Der kranke Wald",
        hasFog: false,
        objectives: [
            { id: "collect_trash", text: "Sammle 3 Müll-Objekte", target: 3, type: "trash", icon: "🗑" },
            { id: "find_hut", text: "Finde die alte Hütte", type: "zone", zoneId: "hut", icon: "🏚" }
        ],
        reward: { id: 'loops', title: "Schleifen-Modul!", desc: "Ab jetzt kannst du 'Wiederholen'-Blöcke nutzen.", icon: "🔁" },
        spawnItems: [
            { type: "trash", count: 5 },
            { type: "key", count: 1 }
        ]
    },
    2: {
        title: "📖 Akt 2: Die Schatz-Suche",
        hasFog: true,
        objectives: [
            { id: "collect_chips", text: "Sammle 2 Datenchips (mit Scan!)", target: 2, type: "datachip", icon: "💾" },
            { id: "find_lake", text: "Finde den versteckten See", type: "zone", zoneId: "lake", icon: "🌊" }
        ],
        reward: { id: 'logic', title: "Logik-Modul!", desc: "WENN/DANN Blöcke sind jetzt freigeschaltet.", icon: "⑂" },
        spawnItems: [
            { type: "datachip", count: 4 },
            { type: "key", count: 1 }
        ]
    },
    3: {
        title: "📖 Akt 3: Der Waldgeist",
        hasFog: false,
        objectives: [
            { id: "plant_seeds", text: "Pflanze 3 Samen an markierten Spots", target: 3, type: "seed_plant", icon: "🌱" },
            { id: "find_owl", text: "Finde den Eulenbaum", type: "zone", zoneId: "owl", icon: "🦉" }
        ],
        reward: { id: 'gold', title: "Waldmeister!", desc: "Du hast den Wald gerettet! Gold-Skin freigeschaltet.", icon: "🏆" },
        spawnItems: [
            { type: "seed", count: 5 }
        ]
    }
};

let minimapCanvas, minimapCtx;
const MINIMAP_SIZE = 150;
const WORLD_SIZE = 450;

// ════════════════════════════════════════════════════════════════
// SECRET ZONES
// ════════════════════════════════════════════════════════════════
const SECRET_ZONES = [
    {
        id: "hut", name: "Die alte Hütte", icon: "🏚",
        x: -70, z: -50, radius: 10,
        story: "Eine verlassene Forscher-Hütte! Hier hat einmal jemand den Wald erforscht. Auf dem Tisch liegt ein altes Tagebuch...",
        points: 200
    },
    {
        id: "lake", name: "Der versteckte See", icon: "🌊",
        x: 90, z: -30, radius: 12,
        story: "Ein kristallklarer See, versteckt hinter dichten Bäumen! Das Wasser glitzert im Sonnenlicht. Hier lebt der Waldgeist...",
        points: 250,
        requireKey: true
    },
    {
        id: "owl", name: "Der Eulenbaum", icon: "🦉",
        x: 20, z: 100, radius: 8,
        story: "Ein uralter riesiger Baum! In seiner Krone lebt eine weise Eule. Sie flüstert dir zu: 'Pflanze die Samen, und der Wald wird gesunden...'",
        points: 150,
        requireScan: true
    }
];

// ════════════════════════════════════════════════════════════════
// COLLECTIBLES SYSTEM
// ════════════════════════════════════════════════════════════════
let collectibles = [];
let plantSpots = [];
let collectedCount = 0;

const ITEM_DEFS = {
    trash: { color: 0x888888, emissive: 0x444444, emoji: "🗑", name: "Müll", points: 30 },
    seed:  { color: 0x66cc66, emissive: 0x338833, emoji: "🌱", name: "Samen", points: 25 },
    datachip: { color: 0x22ccdd, emissive: 0x1188aa, emoji: "💾", name: "Datenchip", points: 40 },
    key:   { color: 0xffd700, emissive: 0xcc9900, emoji: "🔑", name: "Schlüssel", points: 60 }
};

function spawnCollectibles(itemList) {
    collectibles.forEach(c => scene.remove(c.mesh));
    collectibles = [];
    collectedCount = 0;

    for (const item of itemList) {
        const def = ITEM_DEFS[item.type];
        for (let i = 0; i < item.count; i++) {
            const group = new THREE.Group();
            
            if (item.type === 'trash') {
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.8), new THREE.MeshStandardMaterial({ color: def.color, emissive: def.emissive }));
                group.add(body);
                const lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.9), new THREE.MeshStandardMaterial({ color: 0xcc4444, emissive: 0x882222 }));
                lid.position.y = 0.55;
                group.add(lid);
            } else if (item.type === 'seed') {
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x558833 }));
                group.add(stem);
                const ball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: def.color, emissive: def.emissive }));
                ball.position.y = 0.6;
                group.add(ball);
            } else if (item.type === 'datachip') {
                const chip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.7), new THREE.MeshStandardMaterial({ color: def.color, emissive: def.emissive }));
                group.add(chip);
                const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.08), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                cross1.position.y = 0.01;
                group.add(cross1);
                const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                cross2.position.y = 0.01;
                group.add(cross2);
            } else if (item.type === 'key') {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), new THREE.MeshStandardMaterial({ color: def.color, emissive: def.emissive, metalness: 0.9, roughness: 0.1 }));
                ring.position.y = 0.6;
                group.add(ring);
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.9, roughness: 0.1 }));
                shaft.position.y = 0.1;
                group.add(shaft);
            }

            // Place off main path
            let rx, rz, attempts = 0;
            do {
                rx = (Math.random() - 0.5) * 200;
                rz = (Math.random() - 0.5) * 200;
                attempts++;
            } while ((Math.abs(rx) < 15 || Math.abs(rz) < 10) && attempts < 30);

            const ry = getTerrainYGlobal(rx, rz) + 1.0;
            group.position.set(rx, ry, rz);
            group.castShadow = true;
            scene.add(group);
            collectibles.push({ mesh: group, x: rx, z: rz, type: item.type, def: def });
        }
    }
}

function spawnPlantSpots() {
    plantSpots.forEach(s => scene.remove(s.mesh));
    plantSpots = [];
    for (let i = 0; i < 5; i++) {
        const rx = (Math.random() - 0.5) * 160;
        const rz = (Math.random() - 0.5) * 160;
        const ry = getTerrainYGlobal(rx, rz) + 0.1;
        const circle = new THREE.Mesh(
            new THREE.RingGeometry(0.8, 1.2, 16),
            new THREE.MeshBasicMaterial({ color: 0x66cc66, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        circle.rotation.x = -Math.PI / 2;
        circle.position.set(rx, ry, rz);
        scene.add(circle);
        plantSpots.push({ mesh: circle, x: rx, z: rz, planted: false });
    }
}

function tryGrabItem() {
    if (!roverGroup) return;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;

    for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        if (Math.hypot(rx - c.x, rz - c.z) < 3.0) {
            scene.remove(c.mesh);
            collectibles.splice(i, 1);
            collectedCount++;
            storyState.itemsCollected[c.type] = (storyState.itemsCollected[c.type] || 0) + 1;
            storyState.totalItemsCollected++;

            // Calculate multiplier
            let mult = 1;
            if (programDriven) mult = 2;
            const pts = c.def.points * mult;
            score += pts;
            document.getElementById('score-display').innerText = score;
            showMultiplier(mult);
            showPickupFlash(c.def.emoji + " +" + pts);
            document.getElementById('sensor-output').innerText = c.def.emoji + " " + c.def.name + " gesammelt! (×" + mult + ")";
            checkQuestProgress();
        }
    }

    // Check plant spots (if carrying seeds)
    if (storyState.currentAct === 3 && storyState.itemsCollected.seed > 0) {
        for (const spot of plantSpots) {
            if (!spot.planted && Math.hypot(rx - spot.x, rz - spot.z) < 2.5) {
                spot.planted = true;
                storyState.itemsCollected.seed--;
                storyState.seedsPlanted++;
                spot.mesh.material.color.setHex(0x33aa33);
                spot.mesh.material.opacity = 1.0;
                // Spawn a little tree
                const tree = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6), new THREE.MeshStandardMaterial({ color: 0x6d4c41 }));
                trunk.position.y = 0.75;
                tree.add(trunk);
                const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2, 6), new THREE.MeshStandardMaterial({ color: 0x2e7d32 }));
                leaves.position.y = 2.2;
                tree.add(leaves);
                tree.position.set(spot.x, getTerrainYGlobal(spot.x, spot.z), spot.z);
                scene.add(tree);
                showPickupFlash("🌱 Gepflanzt!");
                let mult = programDriven ? 2 : 1;
                score += 50 * mult;
                document.getElementById('score-display').innerText = score;
                document.getElementById('sensor-output').innerText = "🌱 Samen gepflanzt! (" + storyState.seedsPlanted + "/3)";
                checkQuestProgress();
                break;
            }
        }
    }
}

function showPickupFlash(text) {
    const el = document.createElement('div');
    el.className = 'item-pickup-flash';
    el.innerText = text;
    document.querySelector('.viewport').appendChild(el);
    setTimeout(() => el.remove(), 1100);
}

function showMultiplier(mult) {
    const badge = document.getElementById('multiplier-badge');
    if (mult > 1) {
        badge.innerText = "×" + mult + " 💥";
        badge.classList.remove('hidden');
        setTimeout(() => badge.classList.add('hidden'), 2500);
    }
}

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
    if (!roverGroup) return;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;

    for (const zone of SECRET_ZONES) {
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

    // Show discovery popup
    document.getElementById('zone-icon').innerText = zone.icon;
    document.getElementById('zone-title').innerText = zone.name + " entdeckt!";
    document.getElementById('zone-story').innerText = zone.story;
    document.getElementById('zone-reward').innerText = "+" + pts + " Punkte" + (mult > 1 ? " • ×" + mult + " Multiplikator!" : "");
    document.getElementById('zone-discovery').style.display = 'block';

    checkQuestProgress();
}

// ════════════════════════════════════════════════════════════════
// QUEST PROGRESS
// ════════════════════════════════════════════════════════════════
function checkQuestProgress() {
    const act = STORY_ACTS[storyState.currentAct];
    if (!act) return;

    let allDone = true;
    act.objectives.forEach((obj, idx) => {
        let done = false;
        if (obj.type === 'trash') done = storyState.itemsCollected.trash >= obj.target;
        else if (obj.type === 'datachip') done = storyState.itemsCollected.datachip >= obj.target;
        else if (obj.type === 'seed_plant') done = storyState.seedsPlanted >= obj.target;
        else if (obj.type === 'zone') done = storyState.zonesDiscovered.includes(obj.zoneId);

        const el = document.getElementById('obj-' + idx);
        if (el) {
            if (done) { el.innerText = "✅ " + obj.text; el.classList.add('done'); }
            else { el.innerText = "⬜ " + obj.text; el.classList.remove('done'); }
        }
        if (!done) allDone = false;
    });

    if (allDone) {
        setTimeout(() => showSuccessOverlay(), 500);
    }
}

function showSuccessOverlay() {
    const act = STORY_ACTS[storyState.currentAct];
    if (!act) return;

    // Calculate stars (Efficiency)
    let stars = "⭐⭐⭐";
    let msg = "Perfekte Programmierung! 🚀";
    if (storyState.blocksUsedLastRun > 12) { stars = "⭐"; msg = "Versuche, weniger Blöcke zu nutzen."; }
    else if (storyState.blocksUsedLastRun > 6) { stars = "⭐⭐"; msg = "Gute Arbeit! Da geht noch was."; }

    document.getElementById('code-result-blocks').innerText = "Blöcke genutzt: " + storyState.blocksUsedLastRun;
    document.getElementById('code-result-stars').innerText = stars;
    document.getElementById('code-result-msg').innerText = msg;
    
    document.getElementById('success-points').innerText = "+" + (100 + (stars.length * 50)) + " Punkte";
    document.getElementById('success-overlay').style.display = 'flex';
}

function completeAct() {
    const act = STORY_ACTS[storyState.currentAct];
    if (!act) return;
    storyState.completedActs.push(storyState.currentAct);
    if (act.reward) {
        storyState.unlockedFeatures.push(act.reward.id);
        updateRoverUpgrades();
        showReward(act.reward);
    }
}

function advanceToNextAct() {
    storyState.currentAct++;
    const act = STORY_ACTS[storyState.currentAct];
    if (act) {
        if (act.spawnItems) spawnCollectibles(act.spawnItems);
        if (storyState.currentAct === 3) spawnPlantSpots();
        setFogForAct(act);
        spawnNextTarget();
    } else {
        document.getElementById('sensor-output').innerText = "🏆 Du hast ALLE Akte abgeschlossen! Der Wald ist gerettet!";
        setFogForAct(null);
    }
    updateStoryUI();
    buildEnvironment();
}

function updateStoryUI() {
    const act = STORY_ACTS[storyState.currentAct];
    if (!act) {
        document.getElementById('story-act').innerText = "🏆 Abenteuer abgeschlossen!";
        document.getElementById('story-objectives').innerHTML = '<div class="story-obj done">✅ Alle Quests erledigt!</div>';
        document.getElementById('level-badge').innerText = "Meister";
        document.getElementById('quest-text').innerText = "🌳 Erkunde weiter den Wald!";
        return;
    }
    document.getElementById('story-act').innerText = act.title;
    document.getElementById('level-badge').innerText = "Akt " + storyState.currentAct;
    document.getElementById('quest-text').innerText = act.objectives[0].icon + " " + act.objectives[0].text;
    const objContainer = document.getElementById('story-objectives');
    objContainer.innerHTML = '';
    act.objectives.forEach((obj, idx) => {
        const div = document.createElement('div');
        div.className = 'story-obj';
        div.id = 'obj-' + idx;
        div.innerText = "⬜ " + obj.text;
        objContainer.appendChild(div);
    });
}

// ════════════════════════════════════════════════════════════════
// SENSOR SIMULATION FUNCTIONS
// ════════════════════════════════════════════════════════════════
function sensorTouch() {
    if (!roverGroup) return false;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    const yaw = roverGroup.rotation.y;
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    return checkCollision(rx + fDX * 2.5, rz + fDZ * 2.5, yaw);
}

function checkSensorObstacle() {
    if (!roverGroup) return false;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    const yaw = roverGroup.rotation.y;
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    return checkCollision(rx + fDX * 2.5, rz + fDZ * 2.5, yaw) ||
           checkCollision(rx + fDX * 4.0, rz + fDZ * 4.0, yaw) ||
           (Math.abs(rx + fDX * 4.5) > 215 || Math.abs(rz + fDZ * 4.5) > 215);
}

function sensorUltrasonic() {
    if (!roverGroup) return 255;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    const yaw = roverGroup.rotation.y;
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    for (let d = 1; d <= 100; d += 1.0) {
        const px = rx + fDX * d, pz = rz + fDZ * d;
        if (checkCollision(px, pz, yaw) || Math.abs(px) > 215 || Math.abs(pz) > 215) {
            return Math.min(255, Math.round(d * 10)); // 1 Unit = 10cm
        }
    }
    return 255;
}

function sensorCamera() {
    if (!roverGroup) return false;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    for (const c of collectibles) { if (Math.hypot(rx - c.x, rz - c.z) < 15) return true; }
    if (targetMesh && Math.hypot(rx - targetPosition.x, rz - targetPosition.z) < 20) return true;
    for (const obs of obstacles) { if (Math.hypot(rx - obs.x, rz - obs.z) < 8) return true; }
    return false;
}

function sensorCameraObjectName() {
    if (!roverGroup) return 'Nichts';
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    let minDist = Infinity, name = 'Nichts';
    for (const c of collectibles) {
        const d = Math.hypot(rx - c.x, rz - c.z);
        if (d < 15 && d < minDist) { minDist = d; name = c.def.emoji + ' ' + c.def.name; }
    }
    if (targetMesh) {
        const d = Math.hypot(rx - targetPosition.x, rz - targetPosition.z);
        if (d < 20 && d < minDist) { minDist = d; name = '🎯 Ziel'; }
    }
    for (const obs of obstacles) {
        const d = Math.hypot(rx - obs.x, rz - obs.z);
        if (d < 8 && d < minDist) { minDist = d; name = obs.radius > 2 ? '🪨 Fels' : '🌲 Baum'; }
    }
    for (const zone of SECRET_ZONES) {
        const d = Math.hypot(rx - zone.x, rz - zone.z);
        if (d < 20 && d < minDist) { minDist = d; name = zone.icon + ' ' + zone.name; }
    }
    return name;
}

function sensorLight() {
    if (!roverGroup) return 50;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    let baseBrightness = 80;
    let nearbyTrees = 0;
    for (const obs of obstacles) { if (Math.hypot(rx - obs.x, rz - obs.z) < 12) nearbyTrees++; }
    baseBrightness -= Math.min(60, nearbyTrees * 6);
    if (Math.abs(rx) < 8) baseBrightness += 15;
    return Math.max(5, Math.min(100, Math.round(baseBrightness)));
}

function sensorRotation() {
    if (!roverGroup) return 0;
    let deg = THREE.MathUtils.radToDeg(roverGroup.rotation.y) % 360;
    if (deg < 0) deg += 360;
    return Math.round(deg);
}

function sensorTilt() {
    if (!roverGroup) return 0;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    const yaw = roverGroup.rotation.y;
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    const yFront = getTerrainYGlobal(rx + fDX * 2, rz + fDZ * 2);
    const yBack = getTerrainYGlobal(rx - fDX * 2, rz - fDZ * 2);
    return Math.round(THREE.MathUtils.radToDeg(Math.atan2(yFront - yBack, 4.0)));
}

// ════════════════════════════════════════════════════════════════
// RECURSIVE BLOCK EVALUATOR
// ════════════════════════════════════════════════════════════════
function evaluateSensorBlock(block) {
    if (!block) return false;
    const sensorOutput = document.getElementById('sensor-output');
    const type = block.type;
    
    // Debug helper
    console.log("Evaluating block:", type);

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
    }

    if (b.type === 'move_robot') {
        if (ctx.state === 0) { ctx.totalDist = parseInt(b.getFieldValue('DISTANCE'), 10) || 1; ctx.state = 1; }
        if (ctx.state <= ctx.totalDist) { ctx.state++; return { action: b.getFieldValue('DIRECTION') === 'BACKWARD' ? 'moveBackward' : 'move', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'start_motor') {
        if (ctx.state === 0) {
            ctx.state = 1;
            const dir = b.getFieldValue('DIRECTION');
            // Reset motor state and set only the new direction
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
    // ... (rest of rStep remains same logic)
    else if (b.type === 'turn_robot') {
        if (ctx.state === 0) { ctx.totalDist = parseInt(b.getFieldValue('DISTANCE'), 10) || 1; ctx.state = 1; }
        if (ctx.state <= ctx.totalDist) { ctx.state++; return { action: b.getFieldValue('DIRECTION') === 'LEFT' ? 'turnLeft' : 'turnRight', id: b.id }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'scan_object') {
        if (ctx.state === 0) {
            ctx.state = 1;
            document.getElementById('sensor-output').innerText = '🔍 Scan: ' + sensorCameraObjectName() + ' | 📏' + sensorUltrasonic() + 'cm | ☀️' + sensorLight() + '%';
            revealFog(roverGroup.position.x, roverGroup.position.z, 35);
            // Check if near owl zone and scanning (fulfills requireScan)
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
    else if (b.type === 'wait_seconds') {
        if (ctx.state === 0) { ctx.totalDist = parseFloat(b.getFieldValue('SECONDS')) || 1; ctx.state = 1; document.getElementById('sensor-output').innerText = '⏱ Warte ' + ctx.totalDist + 's...'; return { action: 'wait', id: b.id, duration: ctx.totalDist }; }
        else { rStack.pop(); rPush(b.getNextBlock()); return rStep(); }
    }
    else if (b.type === 'wait_until_sensor') {
        if (ctx.state === 0) { ctx.totalDist = 0; ctx.state = 1; }
        // Evaluation now happens in animate loop for real-time response!
        // Return block reference for the engine to check every frame.
        return { action: 'waitUntil', id: b.id, conditionBlock: b.getInputTargetBlock('CONDITION') };
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
        if (Math.hypot(x - obs.x, z - obs.z) < robotRadius + obs.radius) return true;
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
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    let tx, tz, attempts = 0;
    do {
        tx = (Math.random() - 0.5) * 80;
        tz = (Math.random() - 0.5) * 120 + 20;
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
    roverGroup.translateZ(distance);
    if (Math.abs(roverGroup.position.x) > 215 || Math.abs(roverGroup.position.z) > 215) {
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

function getTerrainVisualYGlobal(x, z) {
    const hills = Math.sin(x*0.15) * Math.cos(z*0.15) * 0.4;
    return Math.sin(x*0.05) * Math.cos(z*0.05) * 1.5 + Math.sin(x*0.01) * 2 + hills;
}

function getTerrainYGlobal(x, z) {
    return getTerrainVisualYGlobal(x, z);
}

// ── Tire Trails ───────────────────────────────────────
function spawnTrailMark() {
    const yaw = roverGroup.rotation.y, rx = roverGroup.position.x, rz = roverGroup.position.z;
    const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
    for (const side of [-1.4, 1.4]) {
        const mx = rx + rightX * side, mz = rz + rightZ * side;
        const mark = new THREE.Mesh(trailGeo, trailMat.clone());
        mark.rotation.x = -Math.PI / 2; mark.rotation.z = -yaw;
        mark.position.set(mx, getTerrainYGlobal(mx, mz) + 0.08, mz);
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
    // checkItemPickup removed (manual grabbing only)
    checkSecretZones();
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
        const cg = new THREE.Group();
        for(let j=0; j<Math.floor(Math.random()*4)+3; j++) {
            const p = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.random()*4+2.5, 0), cloudMat);
            p.scale.set(1, 0.6, 1);
            p.position.set((Math.random()-0.5)*8, (Math.random()-0.5)*2, (Math.random()-0.5)*8);
            p.castShadow = true; cg.add(p);
        }
        cg.position.set((Math.random()-0.5)*250, Math.random()*15+25, (Math.random()-0.5)*250);
        scene.add(cg);
    }
}

let environmentGroup = null;

function buildEnvironment() {
    if (environmentGroup) scene.remove(environmentGroup);
    environmentGroup = new THREE.Group();
    obstacles = [];

    const groundGeo = new THREE.PlaneGeometry(450, 450, 100, 100);
    const pos = groundGeo.attributes.position;
    for(let i=0; i < pos.count; i++) {
        pos.setZ(i, getTerrainVisualYGlobal(pos.getX(i), -pos.getY(i)));
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x4ade80, flatShading: true }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    environmentGroup.add(ground);

    // Main path
    const pathGeo = new THREE.PlaneGeometry(12, 450, 32, 100);
    const pathPos = pathGeo.attributes.position;
    for(let i=0; i < pathPos.count; i++) {
        pathPos.setZ(i, getTerrainVisualYGlobal(pathPos.getX(i), -pathPos.getY(i)) + 0.1);
    }
    pathGeo.computeVertexNormals();
    const path = new THREE.Mesh(pathGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true }));
    path.rotation.x = -Math.PI / 2; path.receiveShadow = true;
    environmentGroup.add(path);

    // Branch paths
    const branchGeo = new THREE.PlaneGeometry(8, 100, 16, 20);
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true });
    [[40, -20, Math.PI/4], [-60, 40, -Math.PI/3], [-20, -40, Math.PI/2.5], [20, 80, -Math.PI/4]].forEach(([bx, bz, rot]) => {
        const b = new THREE.Mesh(branchGeo, branchMat);
        b.rotation.x = -Math.PI/2; b.rotation.z = rot;
        b.position.set(bx, 0.1, bz);
        environmentGroup.add(b);
    });

    // Secret zone markers (subtle glow on ground)
    SECRET_ZONES.forEach(zone => {
        if (!storyState.zonesDiscovered.includes(zone.id)) {
            // Subtle hint ring
            const hint = new THREE.Mesh(
                new THREE.RingGeometry(zone.radius - 2, zone.radius, 32),
                new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
            );
            hint.rotation.x = -Math.PI / 2;
            hint.position.set(zone.x, getTerrainYGlobal(zone.x, zone.z) + 0.2, zone.z);
            environmentGroup.add(hint);
        } else {
            // Discovered zone: glowing marker
            const marker = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 3, 8),
                new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.6 })
            );
            marker.position.set(zone.x, getTerrainYGlobal(zone.x, zone.z) + 1.5, zone.z);
            environmentGroup.add(marker);
        }
    });

    // Trees, rocks, bushes
    const trkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, flatShading: true });
    const leaP = new THREE.MeshStandardMaterial({ color: 0x2e7d32, flatShading: true });
    const leaD = new THREE.MeshStandardMaterial({ color: 0x558b2f, flatShading: true });
    const leaB = new THREE.MeshStandardMaterial({ color: 0x1b5e20, flatShading: true });
    const rckM = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, flatShading: true });

    for(let i=0; i<800; i++) {
        let rx = (Math.random()-0.5)*430, rz = (Math.random()-0.5)*430;
        if (Math.abs(rx) < 12) rx = rx >= 0 ? rx + 12 : rx - 12;
        if (Math.abs(rx) < 15 && Math.abs(rz) < 15) rz += 20;
        let tY = getTerrainYGlobal(rx, rz);
        if (tY < -2 && Math.random() < 0.8) continue;

        const type = Math.random();
        if (type < 0.35) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2, 5), trkMat);
            trunk.position.y = 1; trunk.castShadow = true; tree.add(trunk);
            tree.add(meshAt(new THREE.ConeGeometry(2.5, 4, 6), leaP, 0, 3, 0));
            tree.add(meshAt(new THREE.ConeGeometry(2, 3, 6), leaP, 0, 5, 0));
            const s = Math.random()*0.5+0.7; tree.scale.set(s,s,s); tree.position.set(rx, tY, rz);
            environmentGroup.add(tree); obstacles.push({ x: rx, z: rz, radius: 1.5*s });
            // Shadow circle under tree
            const shadowR = 3.5 * s;
            const shadow = new THREE.Mesh(
                new THREE.CircleGeometry(shadowR, 16),
                new THREE.MeshBasicMaterial({ color: 0x0a1628, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
            );
            shadow.rotation.x = -Math.PI / 2;
            shadow.position.set(rx, tY + 0.06, rz);
            environmentGroup.add(shadow);
        } else if (type < 0.55) {
            const tree = new THREE.Group();
            tree.add(meshAt(new THREE.CylinderGeometry(0.4, 0.5, 2, 5), trkMat, 0, 1, 0));
            tree.add(meshAt(new THREE.DodecahedronGeometry(2), leaD, 0, 3, 0));
            const s = Math.random()*0.5+0.7; tree.scale.set(s,s,s); tree.position.set(rx, tY, rz);
            environmentGroup.add(tree); obstacles.push({ x: rx, z: rz, radius: 1.5*s });
            // Shadow circle under round tree
            const shadowR2 = 3.0 * s;
            const shadow2 = new THREE.Mesh(
                new THREE.CircleGeometry(shadowR2, 16),
                new THREE.MeshBasicMaterial({ color: 0x0a1628, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
            );
            shadow2.rotation.x = -Math.PI / 2;
            shadow2.position.set(rx, tY + 0.06, rz);
            environmentGroup.add(shadow2);
        } else if (type < 0.75) {
            const rR = Math.random()*1.2+0.4;
            const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rR, 0), rckM);
            rock.position.set(rx, tY+0.4, rz); rock.castShadow = true;
            environmentGroup.add(rock); obstacles.push({ x: rx, z: rz, radius: rR*0.8 });
        } else {
            const bush = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), leaB);
            bush.scale.set(1.5+Math.random(), 0.6+Math.random()*0.4, 1.2+Math.random());
            bush.position.set(rx, tY + 0.3, rz);
            environmentGroup.add(bush);
        }

        // --- NEW: EXTRA VEGETATION (Flowers & Mushrooms) ---
        if (Math.random() < 0.3) {
            const fx = rx + (Math.random()-0.5)*4, fz = rz + (Math.random()-0.5)*4;
            const fy = getTerrainYGlobal(fx, fz);
            const flowerColors = [0xef4444, 0x3b82f6, 0xfacc15, 0xa78bfa];
            const flower = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.4, 0.2),
                new THREE.MeshLambertMaterial({ color: flowerColors[Math.floor(Math.random()*flowerColors.length)] })
            );
            flower.position.set(fx, fy + 0.2, fz);
            environmentGroup.add(flower);
        }
        if (Math.random() < 0.08) {
            const mx = rx + (Math.random()-0.5)*3, mz = rz + (Math.random()-0.5)*3;
            const my = getTerrainYGlobal(mx, mz);
            const mush = new THREE.Group();
            mush.add(meshAt(new THREE.CylinderGeometry(0.1, 0.1, 0.3), new THREE.MeshLambertMaterial({color: 0xeeeeee}), 0, 0.15, 0));
            mush.add(meshAt(new THREE.SphereGeometry(0.25, 8, 8, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshLambertMaterial({color: 0xff4444}), 0, 0.3, 0));
            mush.position.set(mx, my, mz);
            environmentGroup.add(mush);
        }
    }

    // --- NEW: POI PROPS (Fence around Hut) ---
    const hut = { x: -80, z: -90 };
    for (let i=0; i<8; i++) {
        const angle = (i/8) * Math.PI*2;
        const px = hut.x + Math.cos(angle)*12, pz = hut.z + Math.sin(angle)*12;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), trkMat);
        post.position.set(px, getTerrainYGlobal(px, pz) + 0.6, pz);
        environmentGroup.add(post);
        if (i%2 === 0) {
            const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.1), trkMat);
            sign.position.set(px, post.position.y + 0.4, pz + 0.2);
            sign.rotation.y = angle; environmentGroup.add(sign);
        }
    }

    // --- NEW: ATMOSPHERE (Fireflies in Secret Zones) ---
    SECRET_ZONES.forEach(zone => {
        for (let j=0; j<5; j++) {
            const f = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 })
            );
            const ox = (Math.random()-0.5)*zone.radius*1.5, oz = (Math.random()-0.5)*zone.radius*1.5;
            f.position.set(zone.x + ox, getTerrainYGlobal(zone.x+ox, zone.z+oz) + 2 + Math.random()*3, zone.z + oz);
            f.userData = { phase: Math.random() * Math.PI*2, speed: 0.5 + Math.random() };
            environmentGroup.add(f);
            fireflies.push(f);
        }
    });

    scene.add(environmentGroup);
}

let fireflies = [];
let dustParticles = [];

function updateAtmosphere(delta, time) {
    fireflies.forEach(f => {
        f.position.y += Math.sin(time * f.userData.speed + f.userData.phase) * 0.01;
        f.material.opacity = 0.4 + Math.sin(time * 2 + f.userData.phase) * 0.4;
    });
    
    // Update dust
    for (let i = dustParticles.length - 1; i >= 0; i--) {
        const p = dustParticles[i];
        p.life -= delta;
        p.position.y += delta * 0.5;
        p.scale.multiplyScalar(1.02);
        p.material.opacity = p.life / 1.5;
        if (p.life <= 0) {
            scene.remove(p);
            dustParticles.splice(i, 1);
        }
    }
}

function spawnDust(x, z) {
    const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.5 })
    );
    p.position.set(x + (Math.random()-0.5), getTerrainYGlobal(x, z) + 0.1, z + (Math.random()-0.5));
    p.life = 1.0 + Math.random()*0.5;
    scene.add(p);
    dustParticles.push(p);
}

// ════════════════════════════════════════════════════════════════
// CHARGING STATIONS
// ════════════════════════════════════════════════════════════════
let chargingStations = [];
const CHARGING_STATION_POSITIONS = [
    { x: 0, z: 0 },       // Start area
    { x: -50, z: 60 },    // Near forest
    { x: 60, z: -50 },    // Near lake path
    { x: -30, z: -80 }    // Near hut
];
const CHARGE_STATION_RADIUS = 6;
const CHARGE_STATION_RATE = 20.0; // per second

function spawnChargingStations() {
    chargingStations.forEach(s => { if (s.group) scene.remove(s.group); });
    chargingStations = [];

    const padMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, emissive: 0x0ea5e9, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.2 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, emissive: 0x3b82f6, emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.2 });

    for (const pos of CHARGING_STATION_POSITIONS) {
        const group = new THREE.Group();
        const ty = getTerrainYGlobal(pos.x, pos.z);

        // Ground pad (glowing ring)
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.15, 24), padMat);
        pad.position.y = 0.08;
        group.add(pad);

        // Inner glow ring
        const innerRing = new THREE.Mesh(
            new THREE.RingGeometry(1.5, 2.3, 24),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.y = 0.2;
        group.add(innerRing);

        // Solar panel pillar
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 3, 8), pillarMat);
        pillar.position.set(0, 1.5, 0);
        group.add(pillar);

        // Solar panel (tilted)
        const panel = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.8), panelMat);
        panel.position.set(0, 3.1, 0);
        panel.rotation.x = -0.4;
        group.add(panel);

        // Panel grid lines
        for (let g = -0.6; g <= 0.6; g += 0.3) {
            const gridLine = new THREE.Mesh(
                new THREE.BoxGeometry(2.4, 0.1, 0.02),
                new THREE.MeshBasicMaterial({ color: 0x60a5fa })
            );
            gridLine.position.set(0, 3.12, g);
            gridLine.rotation.x = -0.4;
            group.add(gridLine);
        }

        // Lightning bolt icon (small)
        const bolt = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.6, 4),
            new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
        );
        bolt.position.set(0, 0.6, 0);
        bolt.userData = { phase: Math.random() * Math.PI * 2 };
        group.add(bolt);

        // Radius indicator (subtle circle on ground)
        const radiusCircle = new THREE.Mesh(
            new THREE.RingGeometry(CHARGE_STATION_RADIUS - 0.3, CHARGE_STATION_RADIUS, 32),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
        );
        radiusCircle.rotation.x = -Math.PI / 2;
        radiusCircle.position.y = 0.05;
        group.add(radiusCircle);

        group.position.set(pos.x, ty, pos.z);
        scene.add(group);
        chargingStations.push({ group: group, x: pos.x, z: pos.z, bolt: bolt, innerRing: innerRing });
    }
}

function isNearChargingStation(rx, rz) {
    for (const station of chargingStations) {
        if (Math.hypot(rx - station.x, rz - station.z) < CHARGE_STATION_RADIUS) return true;
    }
    return false;
}

function updateChargingStations(time) {
    for (const station of chargingStations) {
        if (station.bolt) {
            station.bolt.position.y = 0.6 + Math.sin(time * 2 + station.bolt.userData.phase) * 0.15;
            station.bolt.rotation.y += 0.02;
        }
        if (station.innerRing) {
            station.innerRing.material.opacity = 0.3 + Math.sin(time * 3) * 0.2;
        }
    }
}

// ════════════════════════════════════════════════════════════════
// ECO-BOT
// ════════════════════════════════════════════════════════════════
function buildEcoBot() {
    roverGroup = new THREE.Group();
    scene.add(roverGroup);
    const mWhite = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const mGreen = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const mDark = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const mSilver = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const mCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const mOrange = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const mSolar = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });

    // Track Materials
    const trackCanvas = document.createElement('canvas');
    trackCanvas.width = 64; trackCanvas.height = 128;
    const trackCtx = trackCanvas.getContext('2d');
    trackCtx.fillStyle = '#1e293b';
    trackCtx.fillRect(0,0,64,128);
    trackCtx.fillStyle = '#0f172a';
    for(let i=0; i<128; i+=16) trackCtx.fillRect(0,i,64,8);
    const trackTex = new THREE.CanvasTexture(trackCanvas);
    trackTex.wrapS = THREE.RepeatWrapping; trackTex.wrapT = THREE.RepeatWrapping;
    trackTex.repeat.set(1, 4);
    const mTrackL = new THREE.MeshLambertMaterial({ map: trackTex.clone() });
    const mTrackR = new THREE.MeshLambertMaterial({ map: trackTex.clone() });
    roverGroup.userData.trackMatL = mTrackL;
    roverGroup.userData.trackMatR = mTrackR;
    roverGroup.userData.wheels = [];

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 3.2), mWhite); base.position.y = 1.0; roverGroup.add(base);
    const waist = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 2.8), mDark); waist.position.y = 1.6; roverGroup.add(waist);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 2.8), mWhite); chest.position.set(0, 2.3, 0.2); roverGroup.add(chest);

    const ventGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    for(let i=0; i<3; i++) { const v = new THREE.Mesh(ventGeo, mDark); v.position.set(0, 2.05+i*0.2, 1.6); roverGroup.add(v); }

    roverGroup.add(meshAt(new THREE.BoxGeometry(0.2, 0.2, 0.8), mSilver, -0.8, 0.9, 1.9));
    roverGroup.add(meshAt(new THREE.BoxGeometry(0.2, 0.2, 0.8), mSilver, 0.8, 0.9, 1.9));
    roverGroup.add(meshAt(new THREE.BoxGeometry(2.8, 0.4, 0.3), mGreen, 0, 0.9, 2.3));
    roverGroup.add(meshAt(new THREE.BoxGeometry(2.0, 0.1, 1.8), mSolar, 0, 2.85, -0.2));

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), mSilver); neck.position.set(0, 3.0, 0.8); roverGroup.add(neck);
    const headGroup = new THREE.Group(); headGroup.position.set(0, 3.6, 0.8);
    headGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.4), mWhite));
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.1), mDark); visor.position.z = 0.71; headGroup.add(visor);
    const eyeGeo = new THREE.PlaneGeometry(0.4, 0.4);
    const eyeL = new THREE.Mesh(eyeGeo, mCyan); eyeL.position.set(-0.4, 0, 0.77); headGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, mCyan); eyeR.position.set(0.4, 0, 0.77); headGroup.add(eyeR);
    const antS = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6), mSilver); antS.position.set(0.6, 0.9, -0.3); antS.rotation.z = -0.2; headGroup.add(antS);
    const antB = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), mOrange); antB.position.set(0.66, 1.25, -0.3); headGroup.add(antB);
    roverGroup.add(headGroup);

    lidar = new THREE.Group();
    lidar.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16), mDark));
    const lidarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16), mSilver); lidarTop.position.y = 0.3; lidar.add(lidarTop);
    const lidarEye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.3), mCyan); lidarEye.position.set(0, 0.3, 0.2); lidar.add(lidarEye);
    lidar.position.set(-0.6, 3.0, -0.4); roverGroup.add(lidar);

    // Arms
    const buildArm = (isRight) => {
        const ag = new THREE.Group();
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16), mSilver); sh.rotation.z = Math.PI/2; ag.add(sh);
        const bi = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), mWhite); bi.position.set(isRight?0.3:-0.3, -0.3, 0.2); bi.rotation.x = -Math.PI/6; ag.add(bi);
        ag.add(meshAt(new THREE.SphereGeometry(0.15, 16, 16), mSilver, isRight?0.3:-0.3, -0.65, 0.4));
        const fa = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), mWhite); fa.position.set(isRight?0.3:-0.3, -0.9, 0.6); fa.rotation.x = -Math.PI/3; ag.add(fa);
        const cb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.25), mDark); cb.position.set(isRight?0.3:-0.3, -1.1, 0.95); cb.rotation.x = -Math.PI/3; ag.add(cb);
        const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), mGreen); c1.position.set(isRight?0.4:-0.2, -1.2, 1.1); c1.rotation.x = Math.PI/2; ag.add(c1);
        const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), mGreen); c2.position.set(isRight?0.2:-0.4, -1.2, 1.1); c2.rotation.x = Math.PI/2; ag.add(c2);
        return ag;
    };
    const armL = buildArm(false); armL.position.set(-1.3, 2.5, 0.8); roverGroup.add(armL);
    const armR = buildArm(true); armR.position.set(1.3, 2.5, 0.8); roverGroup.add(armR);
    roverGroup.userData.armL = armL;
    roverGroup.userData.armR = armR;

    // Tracks
    function buildTrack(isLeft) {
        const g = new THREE.Group(); const r = 0.6, a = 1.6;
        const mat = isLeft ? roverGroup.userData.trackMatL : roverGroup.userData.trackMatR;
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, r*2, a*2), mat));
        const fc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.7, 24), mat); fc.rotation.z = Math.PI/2; fc.position.z = a; g.add(fc);
        const bc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.7, 24), mat); bc.rotation.z = Math.PI/2; bc.position.z = -a; g.add(bc);
        const hg = new THREE.CylinderGeometry(0.35, 0.35, 0.75, 16);
        const w1 = new THREE.Mesh(hg, mSilver); w1.rotation.z = Math.PI/2; w1.position.z = a; 
        const w2 = new THREE.Mesh(hg, mSilver); w2.rotation.z = Math.PI/2; w2.position.z = -a; 
        const spokeGeo = new THREE.BoxGeometry(0.1, 0.75, 0.75);
        w1.add(new THREE.Mesh(spokeGeo, mDark));
        w2.add(new THREE.Mesh(spokeGeo, mDark));
        g.add(w1); g.add(w2);
        roverGroup.userData.wheels.push({ wheel: w1, side: isLeft ? 'L' : 'R' });
        roverGroup.userData.wheels.push({ wheel: w2, side: isLeft ? 'L' : 'R' });
        return g;
    }
    trackLeft = buildTrack(true); trackLeft.position.set(-1.6, 0.6, 0); roverGroup.add(trackLeft);
    trackRight = buildTrack(false); trackRight.position.set(1.6, 0.6, 0); roverGroup.add(trackRight);

    // Upgrade Slots (hidden by default)
    const upgradeGroup = new THREE.Group(); upgradeGroup.name = "upgrades";
    
    // Loop Upgrade: Cooling Vents / Horns
    const loopMod = new THREE.Group(); loopMod.name = "loop_mod";
    loopMod.add(meshAt(new THREE.BoxGeometry(0.1, 0.6, 0.4), mDark, 1.35, 2.5, 0.2));
    loopMod.add(meshAt(new THREE.BoxGeometry(0.1, 0.6, 0.4), mDark, -1.35, 2.5, 0.2));
    loopMod.visible = false; upgradeGroup.add(loopMod);

    // Logic Upgrade: CPU Core
    const logicMod = new THREE.Group(); logicMod.name = "logic_mod";
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.2), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.8 }));
    core.position.set(0, 2.3, 1.65); logicMod.add(core);
    logicMod.visible = false; upgradeGroup.add(logicMod);

    roverGroup.add(upgradeGroup);
    roverGroup.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
}

function updateRoverUpgrades() {
    if (!roverGroup) return;
    const up = roverGroup.getObjectByName("upgrades");
    if (!up) return;
    
    if (storyState.unlockedFeatures.includes('loops')) up.getObjectByName("loop_mod").visible = true;
    if (storyState.unlockedFeatures.includes('logic')) up.getObjectByName("logic_mod").visible = true;
    if (storyState.unlockedFeatures.includes('gold')) applyGoldSkin();
}

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xfffbdd, 1.2);
    dirLight.position.set(30, 60, -30); dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

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

    document.getElementById('btn-run').addEventListener('click', () => {
        if(window.getBlocklyAST) {
            const rootBlock = window.getBlocklyAST();
            if(!rootBlock) { document.getElementById('sensor-output').innerText = 'Leeres Programm!'; return; }
            // Count blocks for efficiency bonus
            let blockCount = 0;
            let b = rootBlock;
            while (b) { blockCount++; b = b.getNextBlock(); }
            storyState.blocksUsedLastRun = blockCount;
            programDriven = true;
            document.getElementById('sensor-output').innerText = '▶ Programm gestartet (' + blockCount + ' Blöcke)';
            rStack = []; currentCommandObj = null; currentCommand = null;
            rPush(rootBlock);
            isRunning = true;
        }
    });

    document.getElementById('btn-stop').addEventListener('click', () => {
        document.getElementById('sensor-output').innerText = 'Eco-Bot pausiert.';
        isRunning = false; programDriven = false;
        rStack = []; currentCommandObj = null; currentCommand = null;
        programMotorState = { forward: false, backward: false, left: false, right: false };
        if (window.highlightBlock) window.highlightBlock(null);
    });

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
        spawnNextTarget();
    });

    document.getElementById('btn-reward-close').addEventListener('click', () => {
        document.getElementById('reward-popup').style.display = 'none';
        advanceToNextAct();
    });

    document.getElementById('btn-zone-close').addEventListener('click', () => {
        document.getElementById('zone-discovery').style.display = 'none';
    });

    updateHUD();
    animate();
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

function updateLiveSensors() {
    if (!roverGroup || isRunning) return; // Don't override program output
    const dist = sensorUltrasonic();
    const light = sensorLight();
    const rot = sensorRotation();
    const tilt = sensorTilt();
    const nearest = sensorCameraObjectName();
    const touch = sensorTouch();
    const out = document.getElementById('sensor-output');
    const lines = [
        '📏 Distanz: ' + dist + 'cm' + (dist < 30 ? ' ⚠️' : ''),
        '☀️ Licht: ' + light + '%  🔄 ' + rot + '°  ⛰️ ' + tilt + '°',
        '📸 ' + nearest + (touch ? '  👆 Kontakt!' : '')
    ];
    out.innerText = lines.join('\n');
}

function animate() {
    try {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        let isMoving = false;

        if (lidar) lidar.rotation.y += 2 * delta;

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
        let nearStation = isNearChargingStation(roverGroup.position.x, roverGroup.position.z);
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
            storyState.batteryLevel += 6.0 * delta;
            if (eIcon) eIcon.innerText = '☀️';
        } else {
            storyState.batteryLevel += 0.5 * delta;
            if (eIcon) eIcon.innerText = '☁️';
        }

        const canMove = storyState.batteryLevel > 0;

        // Manual & Continuous Program input
        const anyInput = inputState.forward || inputState.backward || inputState.left || inputState.right;
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
            } else if (!currentCommandObj && rStack.length > 0) {
                currentCommandObj = rStep();
                if (currentCommandObj) {
                    currentCommand = currentCommandObj.action;
                    commandProgress = 0;
                    if (window.highlightBlock && currentCommandObj.id) window.highlightBlock(currentCommandObj.id);
                }
            }
            if (!currentCommandObj && rStack.length === 0) {
                isRunning = false;
                programMotorState = { forward: false, backward: false, left: false, right: false }; // Auto-stop at end
                if (window.highlightBlock) window.highlightBlock(null);
                document.getElementById('sensor-output').innerText = '✅ Programm beendet!';
            }
            if (currentCommandObj) {
                let animSpeed = 1.0 * delta;
                let cmdDuration = currentCommandObj.duration || 1.0;
                if (currentCommand === 'move') { tryMove(5.0 * delta); commandProgress += delta; isMoving = true; }
                else if (currentCommand === 'moveBackward') { tryMove(-5.0 * delta); commandProgress += delta; isMoving = true; }
                else if (currentCommand === 'turnLeft') { const ny = roverGroup.rotation.y + (Math.PI/2)*animSpeed; if(!checkCollision(roverGroup.position.x, roverGroup.position.z, ny, true)) roverGroup.rotation.y = ny; commandProgress += animSpeed; isMoving = true; }
                else if (currentCommand === 'turnRight') { const ny = roverGroup.rotation.y - (Math.PI/2)*animSpeed; if(!checkCollision(roverGroup.position.x, roverGroup.position.z, ny, true)) roverGroup.rotation.y = ny; commandProgress += animSpeed; isMoving = true; }
                else if (currentCommand === 'scan') { commandProgress += animSpeed; if (lidar) lidar.rotation.y += 12 * delta; }
                else if (currentCommand === 'wait') { commandProgress += delta / cmdDuration; }
                else if (currentCommand === 'waitUntil') { 
                    // REAL-TIME CHECK: Evaluated every frame instead of once per tick
                    if (evaluateSensorBlock(currentCommandObj.conditionBlock)) {
                        commandProgress = 1.0; // Finish immediately!
                    }
                }
                else if (currentCommand === 'gripper') { commandProgress += animSpeed; }
                else if (currentCommand === 'push') { tryMove(2.5 * delta); commandProgress += delta; isMoving = true; }
                else if (currentCommand === 'startMotor' || currentCommand === 'stopMotor') { commandProgress = 1.0; } // Immediate blocks

                if (commandProgress >= 1.0) {
                    if (currentCommand === 'gripper' && gripperState === 'CLOSE') tryGrabItem();
                    if (currentCommand && currentCommand.includes('turn')) roverGroup.rotation.y = Math.round(roverGroup.rotation.y / (Math.PI/2)) * (Math.PI/2);
                    currentCommandObj = null; currentCommand = null;
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
        drawMiniMap();
        updateAtmosphere(delta, clock.elapsedTime);
        updateChargingStations(clock.elapsedTime);
        
        // Dust while moving
        if (isMoving && Math.random() < 0.2) {
            const rx = roverGroup.position.x, rz = roverGroup.position.z;
            spawnDust(rx, rz);
        }

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

        checkGoal(delta);

        // Camera
        if (cameraChaseMode) {
            const behindX = rx - Math.sin(yaw) * CAM_DISTANCE;
            const behindZ = rz - Math.cos(yaw) * CAM_DISTANCE;
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

function setupDPad() {
    document.getElementById('reset-btn').addEventListener('click', () => {
        roverGroup.position.set(0, 0.2, 0); roverGroup.rotation.set(0, 0, 0);
        document.getElementById('sensor-output').innerText = '🔄 Roboter zurückgesetzt!';
    });
    document.getElementById('cam-toggle-btn').addEventListener('click', (e) => {
        cameraChaseMode = !cameraChaseMode;
        e.target.innerText = cameraChaseMode ? '🎥 Ansicht: Follow' : '🎥 Ansicht: Orbit';
    });
}

init();
setupDPad();
