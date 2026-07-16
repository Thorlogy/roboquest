const Math = global.Math;

const obstacles = [
    { x: 2.5, z: -5, w: 2.0, d: 2.0, h: 2.5, color: 0x22c55e }
];

function checkCollision(x, z) {
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
    return checkCollision(rx + fDX * 0.5, rz + fDZ * 0.5);
}

const yaw = Math.PI - 0.4636;
for (let t=0; t<=10; t+=0.1) {
    const fDX = Math.sin(yaw), fDZ = Math.cos(yaw);
    const rx = 0 + fDX * t;
    const rz = 0 + fDZ * t;
    const collides = checkCollision(rx, rz);
    const touches = sensorTouch(rx, rz, yaw);
    if (collides || touches) {
        console.log(`t=${t.toFixed(1)} rx=${rx.toFixed(2)} rz=${rz.toFixed(2)} collides=${collides} touches=${touches}`);
    }
}
