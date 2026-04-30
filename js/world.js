// ════════════════════════════════════════════════════════════════
// WORLD BUILDING & ENVIRONMENT (extracted from engine.js)
// ════════════════════════════════════════════════════════════════
function buildClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, flatShading: true, fog: false });
    for(let i=0; i<70; i++) {
        const cg = new THREE.Group();
        for(let j=0; j<Math.floor(Math.random()*4)+3; j++) {
            const p = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.random()*4+2.5, 0), cloudMat);
            p.scale.set(1, 0.6, 1);
            p.position.set((Math.random()-0.5)*8, (Math.random()-0.5)*2, (Math.random()-0.5)*8);
            p.castShadow = true; cg.add(p);
        }
        cg.position.set((Math.random()-0.5)*800, Math.random()*15+25, (Math.random()-0.5)*800);
        scene.add(cg);
    }
}

let environmentGroup = null;

// ════════════════════════════════════════════════════════════════
// SOLARPUNK & ANIMALS
// ════════════════════════════════════════════════════════════════
function buildFox(x, z) {
    const foxGroup = new THREE.Group();
    const mOrange = new THREE.MeshLambertMaterial({ color: 0xea580c });
    const mWhite = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mBlack = new THREE.MeshLambertMaterial({ color: 0x171717 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.4), mOrange);
    body.position.y = 0.5;
    foxGroup.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mOrange);
    head.position.set(0.5, 0.7, 0);
    foxGroup.add(head);
    
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), mWhite);
    snout.position.set(0.7, 0.6, 0);
    foxGroup.add(snout);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mBlack);
    nose.position.set(0.85, 0.65, 0);
    foxGroup.add(nose);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.2), mOrange);
    tail.position.set(-0.6, 0.6, 0);
    tail.rotation.z = Math.PI / 4;
    foxGroup.add(tail);

    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), mBlack);
        leg.position.set(i < 2 ? 0.3 : -0.3, 0.2, i % 2 === 0 ? 0.2 : -0.2);
        foxGroup.add(leg);
    }

    foxGroup.position.set(x, getTerrainYGlobal(x, z), z);
    foxGroup.userData = { targetRot: Math.random() * Math.PI * 2, speed: 1.0, timer: Math.random() * 2 };
    scene.add(foxGroup);
    return foxGroup;
}

function buildWindTurbine(x, z) {
    const turbine = new THREE.Group();
    const mWhite = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const mGlow = new THREE.MeshLambertMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0 });

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.0, 15, 16), mWhite);
    tower.position.y = 7.5;
    turbine.add(tower);

    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 3), mWhite);
    nacelle.position.set(0, 15, 0);
    turbine.add(nacelle);

    const glowStripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 3.1), mGlow);
    glowStripe.position.set(0, 15, 0);
    turbine.add(glowStripe);

    const rotor = new THREE.Group();
    rotor.position.set(0, 15, 1.6);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), mWhite);
    rotor.add(hub);

    for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 0.1), mWhite);
        blade.position.y = 4;
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (i * Math.PI * 2) / 3;
        bladePivot.add(blade);
        rotor.add(bladePivot);
    }

    turbine.add(rotor);
    turbine.position.set(x, getTerrainYGlobal(x, z), z);
    turbine.userData = { isRepaired: false, rotor: rotor, glowMat: mGlow };
    scene.add(turbine);
    return turbine;
}

/**
 * Erstellt die 3D-Umgebung inklusive Boden, Pfaden, Bäumen, Felsen und dem Labyrinth.
 * Ruft getTerrainYGlobal auf, um Objekte physikalisch korrekt am Boden zu platzieren.
 */
function buildEnvironment() {
    if (environmentGroup) scene.remove(environmentGroup);
    environmentGroup = new THREE.Group();
    obstacles = [];

    // Seeded random for deterministic object placement so trees don't reshuffle
    let envSeed = 42;
    function seededRandom() {
        let t = (envSeed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    const groundGeo = new THREE.PlaneGeometry(900, 900, 150, 150);
    const pos = groundGeo.attributes.position;
    for(let i=0; i < pos.count; i++) {
        // Here we explicitly DO NOT use getTerrainYGlobal for vertex heights initially
        // because we want block built to be separate meshes, but we DO want dug holes to be in the mesh!
        let ty = getTerrainVisualYGlobal(pos.getX(i), -pos.getY(i));
        // Apply dig only to visual mesh
        for (const mod of worldModifications) {
            if (mod.type === 'dig') {
                const dist = Math.hypot(pos.getX(i) - mod.x, -pos.getY(i) - mod.z);
                if (dist < 3.0) ty -= Math.cos((dist / 3.0) * (Math.PI / 2)) * 1.5;
            }
        }
        pos.setZ(i, ty);
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x4ade80, flatShading: true }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    environmentGroup.add(ground);

    // Main path
    const pathGeo = new THREE.PlaneGeometry(12, 900, 32, 150);
    const pathPos = pathGeo.attributes.position;
    for(let i=0; i < pathPos.count; i++) {
        pathPos.setZ(i, getTerrainVisualYGlobal(pathPos.getX(i), -pathPos.getY(i)) + 0.1);
    }
    pathGeo.computeVertexNormals();
    const path = new THREE.Mesh(pathGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true }));
    path.rotation.x = -Math.PI / 2; path.receiveShadow = true;
    environmentGroup.add(path);

    // River Water Plane
    const waterGeo = new THREE.PlaneGeometry(800, 15);
    const waterMat = new THREE.MeshPhysicalMaterial({ 
        color: 0x0ea5e9, 
        transparent: true, 
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.1 
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -1.0, -35); // Base height of the river
    environmentGroup.add(water);

    // Branch paths
    const baseBranchGeo = new THREE.PlaneGeometry(8, 100, 16, 40);
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true });
    [[40, -20, Math.PI/4], [-60, 40, -Math.PI/3], [-20, -40, Math.PI/2.5], [20, 80, -Math.PI/4]].forEach(([bx, bz, rot]) => {
        const geom = baseBranchGeo.clone();
        geom.rotateZ(rot);
        const bpos = geom.attributes.position;
        for(let j=0; j<bpos.count; j++) {
            bpos.setZ(j, getTerrainYGlobal(bx + bpos.getX(j), bz - bpos.getY(j)));
        }
        geom.computeVertexNormals();
        const b = new THREE.Mesh(geom, branchMat);
        b.rotation.x = -Math.PI/2;
        b.position.set(bx, 0.1, bz);
        environmentGroup.add(b);
    });

    // Secret zone markers (subtle glow on ground)
    SECRET_ZONES.forEach(zone => {
        if (!storyState.zonesDiscovered.includes(zone.id)) {
            const zTy = getTerrainYGlobal(zone.x, zone.z);
            const hintGeo = new THREE.RingGeometry(zone.radius - 2, zone.radius, 32, 4);
            const hpos = hintGeo.attributes.position;
            for(let j=0; j<hpos.count; j++) {
                hpos.setZ(j, getTerrainYGlobal(zone.x + hpos.getX(j), zone.z - hpos.getY(j)) - zTy);
            }
            const hint = new THREE.Mesh(hintGeo, new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.15, side: THREE.DoubleSide }));
            hint.rotation.x = -Math.PI / 2;
            hint.position.set(zone.x, zTy + 0.2, zone.z);
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

    for(let i=0; i<1600; i++) {
        let rx = (seededRandom()-0.5)*880, rz = (seededRandom()-0.5)*880;
        if (Math.abs(rx) < 12) rx = rx >= 0 ? rx + 12 : rx - 12;
        if (Math.abs(rx) < 15 && Math.abs(rz) < 15) rz += 20;
        let tY = getTerrainYGlobal(rx, rz);
        if (tY < -2 && seededRandom() < 0.8) continue;

        const type = seededRandom();
        if (type < 0.35) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2, 5), trkMat);
            trunk.position.y = 1; trunk.castShadow = true; tree.add(trunk);
            tree.add(meshAt(new THREE.ConeGeometry(2.5, 4, 6), leaP, 0, 3, 0));
            tree.add(meshAt(new THREE.ConeGeometry(2, 3, 6), leaP, 0, 5, 0));
            const s = seededRandom()*0.5+0.7; tree.scale.set(s,s,s); tree.position.set(rx, tY, rz);
            environmentGroup.add(tree); obstacles.push({ x: rx, z: rz, radius: 1.5*s });
            // Shadow circle under tree
            const shadowR = 3.5 * s;
            const shadowGeo = new THREE.CircleGeometry(shadowR, 16);
            const spos = shadowGeo.attributes.position;
            for(let j=0; j<spos.count; j++) {
                spos.setZ(j, getTerrainYGlobal(rx + spos.getX(j), rz - spos.getY(j)) - tY);
            }
            const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x0a1628, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
            shadow.rotation.x = -Math.PI / 2;
            shadow.position.set(rx, tY + 0.06, rz);
            environmentGroup.add(shadow);
        } else if (type < 0.55) {
            const tree = new THREE.Group();
            tree.add(meshAt(new THREE.CylinderGeometry(0.4, 0.5, 2, 5), trkMat, 0, 1, 0));
            tree.add(meshAt(new THREE.DodecahedronGeometry(2), leaD, 0, 3, 0));
            const s = seededRandom()*0.5+0.7; tree.scale.set(s,s,s); tree.position.set(rx, tY, rz);
            environmentGroup.add(tree); obstacles.push({ x: rx, z: rz, radius: 1.5*s });
            // Shadow circle under round tree
            const shadowR2 = 3.0 * s;
            const shadowGeo2 = new THREE.CircleGeometry(shadowR2, 16);
            const spos2 = shadowGeo2.attributes.position;
            for(let j=0; j<spos2.count; j++) {
                spos2.setZ(j, getTerrainYGlobal(rx + spos2.getX(j), rz - spos2.getY(j)) - tY);
            }
            const shadow2 = new THREE.Mesh(shadowGeo2, new THREE.MeshBasicMaterial({ color: 0x0a1628, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
            shadow2.rotation.x = -Math.PI / 2;
            shadow2.position.set(rx, tY + 0.06, rz);
            environmentGroup.add(shadow2);
        } else if (type < 0.75) {
            const rR = seededRandom()*1.2+0.4;
            const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rR, 0), rckM);
            rock.position.set(rx, tY+0.4, rz); rock.castShadow = true;
            environmentGroup.add(rock); obstacles.push({ x: rx, z: rz, radius: rR*0.8 });
        } else {
            const bush = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), leaB);
            bush.scale.set(1.5+seededRandom(), 0.6+seededRandom()*0.4, 1.2+seededRandom());
            bush.position.set(rx, tY + 0.3, rz);
            environmentGroup.add(bush);
        }

        // --- NEW: EXTRA VEGETATION (Flowers & Mushrooms) ---
        if (seededRandom() < 0.3) {
            const fx = rx + (seededRandom()-0.5)*4, fz = rz + (seededRandom()-0.5)*4;
            const fy = getTerrainYGlobal(fx, fz);
            const flowerColors = [0xef4444, 0x3b82f6, 0xfacc15, 0xa78bfa];
            const flower = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.4, 0.2),
                new THREE.MeshLambertMaterial({ color: flowerColors[Math.floor(seededRandom()*flowerColors.length)] })
            );
            flower.position.set(fx, fy + 0.2, fz);
            environmentGroup.add(flower);
        }
        if (seededRandom() < 0.08) {
            const mx = rx + (seededRandom()-0.5)*3, mz = rz + (seededRandom()-0.5)*3;
            const my = getTerrainYGlobal(mx, mz);
            const mush = new THREE.Group();
            mush.add(meshAt(new THREE.CylinderGeometry(0.1, 0.1, 0.3), new THREE.MeshLambertMaterial({color: 0xeeeeee}), 0, 0.15, 0));
            mush.add(meshAt(new THREE.SphereGeometry(0.25, 8, 8, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshLambertMaterial({color: 0xff4444}), 0, 0.3, 0));
            mush.position.set(mx, my, mz);
            environmentGroup.add(mush);
        }
    }

    // --- NEW: ROBOTICS LABYRINTH (Rock Walls) ---
    // Specifically placing rocks around x=20..80, z=20..80 to create a maze
    const mazeRocks = [
        {x: 15, z: 20, r: 4}, {x: 15, z: 30, r: 4}, {x: 15, z: 40, r: 4}, {x: 15, z: 50, r: 4},
        {x: 25, z: 50, r: 4}, {x: 35, z: 50, r: 4}, {x: 45, z: 50, r: 4},
        {x: 45, z: 40, r: 4}, {x: 45, z: 30, r: 4}, {x: 45, z: 20, r: 4},
        {x: 55, z: 20, r: 4}, {x: 65, z: 20, r: 4}, {x: 75, z: 20, r: 4},
        {x: 75, z: 30, r: 4}, {x: 75, z: 40, r: 4}, {x: 75, z: 50, r: 4}, {x: 75, z: 60, r: 4}, {x: 75, z: 70, r: 4}
    ];
    mazeRocks.forEach(m => {
        const rck = new THREE.Mesh(new THREE.IcosahedronGeometry(m.r, 0), rckM);
        const ty = getTerrainYGlobal(m.x, m.z);
        rck.position.set(m.x, ty + m.r * 0.5, m.z);
        environmentGroup.add(rck);
        obstacles.push({ x: m.x, z: m.z, radius: m.r * 0.9 });
    });

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
            const ox = (seededRandom()-0.5)*zone.radius*1.5, oz = (seededRandom()-0.5)*zone.radius*1.5;
            f.position.set(zone.x + ox, getTerrainYGlobal(zone.x+ox, zone.z+oz) + 2 + seededRandom()*3, zone.z + oz);
            f.userData = { phase: seededRandom() * Math.PI*2, speed: 0.5 + seededRandom() };
            environmentGroup.add(f);
            fireflies.push(f);
        }
    });

    // --- RENDER BUILT BLOCKS ---
    for (const mod of worldModifications) {
        if (mod.type === 'build') {
            const block = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 1.2, 1.2), 
                new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
            );
            block.position.set(mod.x, mod.y + 0.1, mod.z);
            block.castShadow = true; 
            block.receiveShadow = true;
            environmentGroup.add(block);
            obstacles.push({ x: mod.x, z: mod.z, radius: 0.8 });
        }
    }

    // --- NEW: WANDERING CREATURES (Red Bugs) ---
    creatures = [];
    for (let i = 0; i < 8; i++) {
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xef4444 })
        );
        body.scale.set(1, 0.5, 1.5);
        
        const cx = (seededRandom() - 0.5) * 80 - 50;
        const cz = (seededRandom() - 0.5) * 80 - 50;
        body.position.set(cx, getTerrainYGlobal(cx, cz) + 0.3, cz);
        body.rotation.y = seededRandom() * Math.PI * 2;
        body.castShadow = true;
        
        environmentGroup.add(body);
        creatures.push({
            mesh: body,
            speed: 2.5 + seededRandom() * 1.5,
            turnTimer: 0
        });
    }

    // Solarpunk Base Upgrade
    const baseZone = SECRET_ZONES.find(z => z.id === 'base');
    if (baseZone) {
        const solarpunkMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, emissive: 0x0ea5e9, emissiveIntensity: 0.5 });
        const solarpunkRing = new THREE.Mesh(new THREE.TorusGeometry(5, 0.3, 16, 64), solarpunkMat);
        solarpunkRing.rotation.x = Math.PI / 2;
        solarpunkRing.position.set(baseZone.x, getTerrainYGlobal(baseZone.x, baseZone.z) + 0.1, baseZone.z);
        environmentGroup.add(solarpunkRing);
    }

    // Spawn Foxes
    foxes.forEach(f => scene.remove(f)); foxes = [];
    for (let i=0; i<6; i++) foxes.push(buildFox(seededRandom() * 200 - 100, seededRandom() * 200 - 100));
    
    // Spawn Wind Turbines
    turbines.forEach(t => scene.remove(t)); turbines = [];
    turbines.push(buildWindTurbine(60, 40));
    turbines.push(buildWindTurbine(-80, 70));
    turbines.push(buildWindTurbine(100, -80));

    scene.add(environmentGroup);
}

let fireflies = [];

function updateAtmosphere(delta, time) {
    fireflies.forEach(f => {
        f.position.y += Math.sin(time * f.userData.speed + f.userData.phase) * 0.01;
        f.material.opacity = 0.4 + Math.sin(time * 2 + f.userData.phase) * 0.4;
    });
}

// ════════════════════════════════════════════════════════════════
// CHARGING STATIONS
// ════════════════════════════════════════════════════════════════
let chargingStations = [];
const CHARGING_STATION_POSITIONS = [
    { x: 0, z: 0 },         // Start area
    { x: -140, z: 160 },    // Expanded map points
    { x: 160, z: -150 },    
    { x: -130, z: -200 }    
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
