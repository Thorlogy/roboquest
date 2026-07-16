const THREE = require('three');
const obj = new THREE.Object3D();
obj.position.set(0, 0, 0);
obj.rotation.y = Math.PI - 0.4636;
obj.translateZ(2.5);
console.log("translateZ +2.5:", obj.position.x.toFixed(2), obj.position.z.toFixed(2));

const fDX = Math.sin(obj.rotation.y) * 2.5;
const fDZ = Math.cos(obj.rotation.y) * 2.5;
console.log("fDX, fDZ formula:", fDX.toFixed(2), fDZ.toFixed(2));
