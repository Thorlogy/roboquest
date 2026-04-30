// ════════════════════════════════════════════════════════════════
// QUEST & COLLECTIBLE SYSTEM (extracted from engine.js)
// ════════════════════════════════════════════════════════════════
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

/**
 * Versucht ein Sammel-Objekt in der Nähe des Roboters aufzunehmen.
 * Wenn erfolgreich, wird das Item 'getragen' (carriedItem) und visuell am Roboter befestigt.
 */
function tryGrabItem() {
    if (!roverGroup) return;
    if (storyState.carriedItem) {
        document.getElementById('sensor-output').innerText = "⚠️ Zuerst das aktuelle Teil abladen!";
        return;
    }
    const rx = roverGroup.position.x, rz = roverGroup.position.z;

    for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        if (Math.hypot(rx - c.x, rz - c.z) < 4.0) {
            // "Carry" the item
            storyState.carriedItem = { type: c.type, def: c.def };
            scene.remove(c.mesh);
            collectibles.splice(i, 1);
            
            // Visual on robot
            const itemPreview = c.mesh.clone();
            itemPreview.scale.set(0.4, 0.4, 0.4);
            itemPreview.position.set(0, 1.8, 0.5);
            roverGroup.add(itemPreview);
            roverGroup.userData.carriedMesh = itemPreview;

            // Track pick up for "Find" objectives
            storyState.itemsPickedUp[c.type] = (storyState.itemsPickedUp[c.type] || 0) + 1;

            document.getElementById('sensor-output').innerText = "📦 " + c.def.name + " aufgenommen. Bringe es zum Recycling-Hub!";
            showActionFlash("📦 Item geladen");
            
            // Update HUD
            const cargoHUD = document.getElementById('hud-cargo');
            const cargoStatus = document.getElementById('cargo-status');
            if (cargoHUD && cargoStatus) {
                cargoHUD.classList.remove('hidden');
                cargoStatus.innerText = c.def.name;
            }

            checkQuestProgress();
            return;
        }
    }
}

/**
 * Versucht das aktuell getragene Objekt an einer Recycling-Station abzuladen oder zu pflanzen.
 * Überprüft die Distanz zum Recycling-Hub und aktualisiert bei Erfolg den Score und Quest-Status.
 */
function tryDropItem() {
    if (!storyState.carriedItem) return;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    
    // Check plant spots (if carrying seeds)
    if (storyState.carriedItem.type === 'seed') {
        for (const spot of plantSpots) {
            if (!spot.planted && Math.hypot(rx - spot.x, rz - spot.z) < 2.5) {
                spot.planted = true;
                storyState.seedsPlanted = (storyState.seedsPlanted || 0) + 1;
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
                if (window.audioEngine) window.audioEngine.playHappyBeep();
                let mult = programDriven ? 2 : 1;
                score += 50 * mult;
                document.getElementById('score-display').innerText = score;
                document.getElementById('sensor-output').innerText = "🌱 Samen gepflanzt! (" + storyState.seedsPlanted + "/3)";
                
                // Remove from robot
                if (roverGroup.userData.carriedMesh) roverGroup.remove(roverGroup.userData.carriedMesh);
                storyState.carriedItem = null;
                const cargoHUD = document.getElementById('hud-cargo');
                if (cargoHUD) cargoHUD.classList.add('hidden');
                
                checkQuestProgress();
                return; // Done
            }
        }
    }

    // Check if in Base zone (Recycling Hub)
    const baseZone = SECRET_ZONES.find(z => z.id === 'base');
    if (baseZone && Math.hypot(rx - baseZone.x, rz - baseZone.z) < baseZone.radius) {
        const item = storyState.carriedItem;
        storyState.itemsCollected[item.type] = (storyState.itemsCollected[item.type] || 0) + 1;
        storyState.totalItemsCollected++;
        
        // Score
        let mult = programDriven ? 3 : 1; 
        const pts = item.def.points * mult;
        score += pts;
        document.getElementById('score-display').innerText = score;
        showMultiplier(mult);
        showPickupFlash(item.def.emoji + " Recycelt! +" + pts);
        
        // Remove from robot
        if (roverGroup.userData.carriedMesh) roverGroup.remove(roverGroup.userData.carriedMesh);
        storyState.carriedItem = null;
        
        // Update HUD
        const cargoHUD = document.getElementById('hud-cargo');
        if (cargoHUD) cargoHUD.classList.add('hidden');

        document.getElementById('sensor-output').innerText = "✅ " + item.def.name + " erfolgreich recycelt!";
        checkQuestProgress();
    } else {
        document.getElementById('sensor-output').innerText = "❌ Hier kannst du das nicht abladen!";
        showActionFlash("❌ Abladen misslungen");
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
// QUEST PROGRESS
// ════════════════════════════════════════════════════════════════
function checkQuestProgress() {
    const act = STORY_ACTS[storyState.currentAct];
    if (!act) return;

    let allDone = true;
    act.objectives.forEach((obj, idx) => {
        let done = false;
        if (obj.type === 'trash') done = (storyState.itemsPickedUp.trash || 0) >= obj.target;
        else if (obj.type === 'drop_off') done = (storyState.itemsCollected.trash || 0) >= obj.target;
        else if (obj.type === 'drop_off_chip') done = (storyState.itemsCollected.datachip || 0) >= obj.target;
        else if (obj.type === 'datachip') done = (storyState.itemsPickedUp.datachip || 0) >= obj.target;
        else if (obj.type === 'seed') done = (storyState.itemsPickedUp.seed || 0) >= obj.target;
        else if (obj.type === 'seed_plant') done = storyState.seedsPlanted >= obj.target;
        
        if (done && !obj.completed) {
            obj.completed = true;
            if (window.audioEngine) window.audioEngine.playHappyBeep();
            showPickupFlash("✅ " + obj.text);
        }

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
        updateSidebarVisibility(); // Refresh sidebar after reward
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
