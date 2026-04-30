// ════════════════════════════════════════════════════════════════
// SENSOR SIMULATION (extracted from engine.js)
// ════════════════════════════════════════════════════════════════
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
    for (let d = 1; d <= 100; d += 2.0) { // step=2 for performance (still accurate to ~20cm)
        const px = rx + fDX * d, pz = rz + fDZ * d;
        if (checkCollision(px, pz, yaw) || Math.abs(px) > 440 || Math.abs(pz) > 440) {
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
