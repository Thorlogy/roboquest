// ════════════════════════════════════════════════════════════════
// ECO-BOT MODEL (extracted from engine.js)
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// ECO-BOT
// ════════════════════════════════════════════════════════════════
function buildEcoBot() {
    roverGroup = new THREE.Group();
    scene.add(roverGroup);
    const mRustyYellow = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const mRustyOrange = new THREE.MeshLambertMaterial({ color: 0xeab308 });
    const mDark = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const mSilver = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const mCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
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

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 3.2), mRustyYellow); base.position.y = 1.0; roverGroup.add(base);
    const waist = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 2.8), mDark); waist.position.y = 1.6; roverGroup.add(waist);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 2.8), mRustyOrange); chest.position.set(0, 2.5, 0.2); roverGroup.add(chest);

    const ventGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    for(let i=0; i<3; i++) { const v = new THREE.Mesh(ventGeo, mDark); v.position.set(0, 2.2+i*0.2, 1.6); roverGroup.add(v); }

    roverGroup.add(meshAt(new THREE.BoxGeometry(0.2, 0.2, 0.8), mSilver, -0.8, 0.9, 1.9));
    roverGroup.add(meshAt(new THREE.BoxGeometry(0.2, 0.2, 0.8), mSilver, 0.8, 0.9, 1.9));
    roverGroup.add(meshAt(new THREE.BoxGeometry(2.0, 0.1, 1.8), mSolar, 0, 3.21, -0.2));

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.8, 16), mSilver); neck.position.set(0, 3.4, 0.8); roverGroup.add(neck);
    
    // Wall-E style binocular head
    const headGroup = new THREE.Group(); headGroup.position.set(0, 4.0, 0.8);
    // Left eye binocular
    const eyeBoxL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.2), mSilver);
    eyeBoxL.position.set(-0.5, 0, 0); headGroup.add(eyeBoxL);
    const lensL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), mDark);
    lensL.rotation.x = Math.PI / 2; lensL.position.set(-0.5, 0, 0.61); headGroup.add(lensL);
    const pupilL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.11, 16), mCyan);
    pupilL.rotation.x = Math.PI / 2; pupilL.position.set(-0.5, 0, 0.61); headGroup.add(pupilL);
    
    // Right eye binocular
    const eyeBoxR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.2), mSilver);
    eyeBoxR.position.set(0.5, 0, 0); headGroup.add(eyeBoxR);
    const lensR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), mDark);
    lensR.rotation.x = Math.PI / 2; lensR.position.set(0.5, 0, 0.61); headGroup.add(lensR);
    const pupilR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.11, 16), mCyan);
    pupilR.rotation.x = Math.PI / 2; pupilR.position.set(0.5, 0, 0.61); headGroup.add(pupilR);
    
    // Connecting bar between eyes
    const eyeBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.4), mRustyYellow);
    eyeBar.position.set(0, -0.2, 0); headGroup.add(eyeBar);

    roverGroup.add(headGroup);

    lidar = new THREE.Group();
    lidar.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16), mDark));
    const lidarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16), mSilver); lidarTop.position.y = 0.3; lidar.add(lidarTop);
    const lidarEye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.3), mCyan); lidarEye.position.set(0, 0.3, 0.2); lidar.add(lidarEye);
    lidar.position.set(-0.6, 3.2, -0.4); roverGroup.add(lidar);

    // Arms
    const buildArm = (isRight) => {
        const ag = new THREE.Group();
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16), mSilver); sh.rotation.z = Math.PI/2; ag.add(sh);
        const bi = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), mRustyYellow); bi.position.set(isRight?0.3:-0.3, -0.3, 0.2); bi.rotation.x = -Math.PI/6; ag.add(bi);
        ag.add(meshAt(new THREE.SphereGeometry(0.15, 16, 16), mSilver, isRight?0.3:-0.3, -0.65, 0.4));
        const fa = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), mRustyYellow); fa.position.set(isRight?0.3:-0.3, -0.9, 0.6); fa.rotation.x = -Math.PI/3; ag.add(fa);
        const cb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.25), mDark); cb.position.set(isRight?0.3:-0.3, -1.1, 0.95); cb.rotation.x = -Math.PI/3; ag.add(cb);
        const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), mRustyOrange); c1.position.set(isRight?0.4:-0.2, -1.2, 1.1); c1.rotation.x = Math.PI/2; ag.add(c1);
        const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), mRustyOrange); c2.position.set(isRight?0.2:-0.4, -1.2, 1.1); c2.rotation.x = Math.PI/2; ag.add(c2);
        return ag;
    };
    const armL = buildArm(false); armL.position.set(-1.3, 2.7, 0.8); roverGroup.add(armL);
    const armR = buildArm(true); armR.position.set(1.3, 2.7, 0.8); roverGroup.add(armR);
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

    // Forward projection arrow (spatial awareness helper)
    const arrowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const actxCanvas = document.createElement('canvas');
    actxCanvas.width = 128; actxCanvas.height = 128;
    const actx = actxCanvas.getContext('2d');
    actx.fillStyle = 'rgba(34, 211, 238, 0.6)'; // cyan glow
    actx.beginPath(); 
    actx.moveTo(64, 110); actx.lineTo(16, 20); actx.lineTo(64, 40); actx.lineTo(112, 20);
    actx.closePath(); actx.fill();
    const arrowTex = new THREE.CanvasTexture(actxCanvas);
    const mArrow = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, depthWrite: false });
    const arrowMesh = new THREE.Mesh(arrowGeo, mArrow);
    arrowMesh.rotation.x = -Math.PI / 2;
    arrowMesh.position.set(0, -0.6, 3.2); // Just above wheels, in front of rover
    roverGroup.add(arrowMesh);
}

function updateRoverUpgrades() {
    if (!roverGroup) return;
    const up = roverGroup.getObjectByName("upgrades");
    if (!up) return;
    
    if (storyState.unlockedFeatures.includes('loops')) up.getObjectByName("loop_mod").visible = true;
    if (storyState.unlockedFeatures.includes('logic')) up.getObjectByName("logic_mod").visible = true;
    if (storyState.unlockedFeatures.includes('gold')) applyGoldSkin();
}
