const Math = global.Math;

const obstacles = [
    { x: 0, z: -15, w: 5.0, d: 2.0, h: 2.5, color: 0x333333 }
];

function checkCollision(x, z, yaw, isRotation) {
    const robotRadius = 1.3;
    for (const obs of obstacles) {
        if (obs.w !== undefined && obs.d !== undefined) {
            const minX = obs.x - obs.w / 2;
            const maxX = obs.x + obs.w / 2;
            const minZ = obs.z - obs.d / 2;
            const maxZ = obs.z + obs.d / 2;
            const closestX = Math.max(minX, Math.min(x, maxX));
            const closestZ = Math.max(minZ, Math.min(z, maxZ));
            const distX = x - closestX;
            const distZ = z - closestZ;
            if (Math.hypot(distX, distZ) < robotRadius) return true;
        }
    }
    return false;
}

function sensorTouch(rx, rz, yaw) {
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    return checkCollision(rx + fDX * 2.5, rz + fDZ * 2.5, yaw);
}

console.log("Stuck at height map (z = -13.5):", sensorTouch(0, -13.5, Math.PI));
console.log("Stuck at collision box (z = -12.7):", sensorTouch(0, -12.7, Math.PI));
console.log("Far away (z = -10):", sensorTouch(0, -10, Math.PI));
