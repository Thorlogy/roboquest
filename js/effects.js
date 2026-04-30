// ════════════════════════════════════════════════════════════════
// VISUAL EFFECTS: Particles, Trails, Action Flashes
// ════════════════════════════════════════════════════════════════
// ── Action Visual Effects ───────────────────────────────────────
let actionParticles = [];
let actionRings = [];

/**
 * Spawn particles for robot actions (dig, build, gripper, remove)
 * @param {'dig'|'build'|'remove'|'gripper_close'|'gripper_open'} type
 * @param {THREE.Vector3} position - world position to spawn at
 */
function spawnActionParticles(type, position) {
    const configs = {
        dig: { color: 0x8b5a2b, count: 18, speed: 4, size: 0.25, life: 1.2, gravity: 6, spread: 0.8 },
        build: { color: 0xfbbf24, count: 14, speed: 2.5, size: 0.2, life: 1.0, gravity: 1, spread: 1.2 },
        remove: { color: 0xef4444, count: 12, speed: 3, size: 0.2, life: 0.9, gravity: 4, spread: 1.0 },
        gripper_close: { color: 0x4ade80, count: 8, speed: 1.5, size: 0.15, life: 0.7, gravity: 0.5, spread: 0.5 },
        gripper_open: { color: 0x22d3ee, count: 6, speed: 1.0, size: 0.12, life: 0.6, gravity: 0.3, spread: 0.4 }
    };
    const cfg = configs[type] || configs.build;

    for (let i = 0; i < cfg.count; i++) {
        const geo = new THREE.BoxGeometry(cfg.size, cfg.size, cfg.size);
        const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 1.0 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.y += 0.5;
        const vx = (Math.random() - 0.5) * cfg.spread * cfg.speed;
        const vy = Math.random() * cfg.speed + cfg.speed * 0.5;
        const vz = (Math.random() - 0.5) * cfg.spread * cfg.speed;
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scene.add(mesh);
        actionParticles.push({ mesh, vx, vy, vz, age: 0, life: cfg.life, gravity: cfg.gravity });
    }
}

/**
 * Spawn expanding scan rings from robot position
 * @param {THREE.Vector3} position
 */
function spawnActionRings(position) {
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.RingGeometry(0.3, 0.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        ring.position.y += 2.0;
        ring.rotation.x = -Math.PI / 2;
        scene.add(ring);
        actionRings.push({ mesh: ring, age: -i * 0.2, life: 1.5, maxRadius: 12 });
    }
}

/**
 * Update particles and rings each frame
 */
function updateActionEffects(delta) {
    // Update particles
    for (let i = actionParticles.length - 1; i >= 0; i--) {
        const p = actionParticles[i];
        p.age += delta;
        const t = p.age / p.life;
        if (t >= 1) {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            actionParticles.splice(i, 1);
        } else {
            p.vy -= p.gravity * delta;
            p.mesh.position.x += p.vx * delta;
            p.mesh.position.y += p.vy * delta;
            p.mesh.position.z += p.vz * delta;
            p.mesh.rotation.x += delta * 3;
            p.mesh.rotation.z += delta * 2;
            p.mesh.material.opacity = 1.0 - t;
            const scale = 1.0 - t * 0.5;
            p.mesh.scale.setScalar(scale);
        }
    }

    // Update scan rings
    for (let i = actionRings.length - 1; i >= 0; i--) {
        const r = actionRings[i];
        r.age += delta;
        if (r.age < 0) continue; // Staggered start
        const t = r.age / r.life;
        if (t >= 1) {
            scene.remove(r.mesh);
            r.mesh.geometry.dispose();
            r.mesh.material.dispose();
            actionRings.splice(i, 1);
        } else {
            const scale = 1 + t * r.maxRadius;
            r.mesh.scale.setScalar(scale);
            r.mesh.material.opacity = 0.8 * (1 - t);
        }
    }
}

/**
 * Show a visual action flash in the viewport
 */
function showActionFlash(text) {
    if (window.audioEngine) {
        if (text.includes('❌')) window.audioEngine.playSadBoop();
        else window.audioEngine.playServoSound();
    }
    const el = document.createElement('div');
    el.className = 'item-pickup-flash action-flash';
    el.innerText = text;
    document.querySelector('.viewport').appendChild(el);
    setTimeout(() => el.remove(), 1400);
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
        if (t >= 1) {
            scene.remove(trails[i].mesh);
            // trailGeo is shared, DO NOT dispose it! trails[i].mesh.geometry.dispose(); 
            trails[i].mesh.material.dispose();
            trails.splice(i, 1);
        } else {
            trails[i].mesh.material.opacity = 0.45 * (1 - t);
        }
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
