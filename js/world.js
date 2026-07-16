// ════════════════════════════════════════════════════════════════
// WORLD BUILDING & ENVIRONMENT (extracted from engine.js)
// ════════════════════════════════════════════════════════════════

/**
 * Erstellt eine zufällige, prozedurale Wolkendecke am Himmel der Szene.
 * Nutzt Icosahedron-Geometrien, um weiche Wolkenformen zu imitieren.
 */
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
let riverMesh;
let isWaterClean = false;
let vitalityScore = 0;
let timeOfDay = 0; // 0 to 1 (Day to Night)
let skyColor = new THREE.Color(0x87ceeb); // Day blue
let verticalPlantSpots = [];

/**
 * Aktualisiert das HUD-Element für den Vitalitäts-Score (Gesundheit der Spielwelt).
 */
window.updateVitalityHUD = function() {
    const el = document.getElementById('vitality-level');
    if (el) el.innerText = vitalityScore;
};

/**
 * Fügt der Spielwelt Vitalitätspunkte hinzu und löst visuelle Effekte aus.
 * Maximaler Score ist 100.
 * @param {number} amount - Anzahl der Punkte, die hinzugefügt werden sollen
 */
window.addVitality = function(amount) {
    vitalityScore = Math.min(100, vitalityScore + amount);
    window.updateVitalityHUD();
    window.spawnVitalitySparkles();
};

window.spawnVitalitySparkles = function() {
    if (!roverGroup) return;
    for (let i = 0; i < 15; i++) {
        const p = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true })
        );
        p.position.copy(roverGroup.position);
        p.position.y += 1;
        p.userData.vel = new THREE.Vector3((Math.random()-0.5)*0.2, 0.1 + Math.random()*0.2, (Math.random()-0.5)*0.2);
        p.userData.life = 1.0;
        scene.add(p);
        
        const animateSparkle = () => {
            p.position.add(p.userData.vel);
            p.userData.life -= 0.02;
            p.material.opacity = p.userData.life;
            if (p.userData.life > 0) requestAnimationFrame(animateSparkle);
            else { scene.remove(p); p.geometry.dispose(); p.material.dispose(); }
        };
        animateSparkle();
    }
}

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
    return turbine;
}

    function buildSkyscraper(x, z, seed) {
        const bldg = new THREE.Group();
        const h = 10 + (seed % 15);
        const w = 4 + (seed % 3);
        const d = 4 + ((seed*2) % 3);
        
        const mat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.1 }); // Clean white building
        const core = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        core.position.y = h/2;
        bldg.add(core);
        
        // Add green roofs (trees)
        const leaP = new THREE.MeshStandardMaterial({ color: 0x16a34a, flatShading: true });
        const roofTree = new THREE.Mesh(new THREE.DodecahedronGeometry(w * 0.4), leaP);
        roofTree.position.set(0, h, 0);
        bldg.add(roofTree);
    
        // Add some hanging plants on the side
        for(let wy = 3; wy < h-2; wy += 4) {
            const bush = new THREE.Mesh(new THREE.SphereGeometry(0.8, 5, 5), leaP);
            bush.position.set((seed%2===0)? w/2 : -w/2, wy, (seed%3===0)? d/2 : -d/2);
            bldg.add(bush);
        }
        
        bldg.position.set(x, getTerrainYGlobal(x, z), z);
        return bldg;
    }
    
    function buildDeliveryPod(x, z, seed) {
        const pod = new THREE.Group();
        
        const cMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.6 });
        
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(1, 2.5, 4, 8), cMat);
        body.rotation.z = Math.PI / 2;
        body.position.y = 1.0;
        pod.add(body);
        
        // Small glowing ring (hover engine)
        const ringGeo = new THREE.RingGeometry(0.8, 1.2, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.2;
        pod.add(ring);
        
        pod.position.set(x, getTerrainYGlobal(x, z), z);
        return pod;
    }

/**
 * Erstellt die 3D-Umgebung inklusive Boden, Pfaden, Bäumen, Felsen und dem Labyrinth.
 * Ruft getTerrainYGlobal auf, um Objekte physikalisch korrekt am Boden zu platzieren.
 */
function buildEnvironment() {
    if (environmentGroup) scene.remove(environmentGroup);
    environmentGroup = new THREE.Group();
    obstacles = [];
    window.windTurbineBlades = [];
    window.birds = [];

    // Seeded random for deterministic object placement so trees don't reshuffle
    let envSeed = 42;
    function seededRandom() {
        let t = (envSeed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    let currentWorld = 1;
    let isCyberLab = false;
    if (window.missionManager && window.missionManager.currentMission) {
        const mid = window.missionManager.currentMission.id;
        if (mid >= 100) isCyberLab = true;
        else if (mid >= 16) currentWorld = 4; // Smart City
        else if (mid >= 11) currentWorld = 3; // Windpark
        else if (mid >= 6) currentWorld = 2;  // Stadtpark
        else currentWorld = 1;                // Schrottplatz
    } else if (window.missionManager && window.missionManager.progress && window.missionManager.progress.currentWorld) {
        currentWorld = window.missionManager.progress.currentWorld;
    }

    let groundColor = 0x4ade80;
    let pathColor = 0x8b5a2b;
    let emissiveColor = 0x000000;
    let emissiveInt = 0;

    if (isCyberLab) {
        groundColor = 0x0a1428;
        pathColor = 0x09d8ff;
        emissiveColor = 0x09d8ff;
        emissiveInt = 0.5;
    } else if (currentWorld === 4) {
        groundColor = 0x22c55e; // Satte Natur in der Stadt
        pathColor = 0xe2e8f0;   // Helle, saubere Wege
        emissiveColor = 0x000000;
        emissiveInt = 0;
    } else if (currentWorld === 3) {
        groundColor = 0x22c55e;
        pathColor = 0x78716c;
    } else if (currentWorld === 2) {
        groundColor = 0x4ade80;
        pathColor = 0xd6d3d1;
    } else {
        groundColor = 0x854d0e;
        pathColor = 0x713f12;
    }

    const groundGeo = new THREE.PlaneGeometry(900, 900, 150, 150);
    const pos = groundGeo.attributes.position;
    for(let i=0; i < pos.count; i++) {
        let ty = getTerrainVisualYGlobal(pos.getX(i), -pos.getY(i));
        for (const mod of worldModifications) {
            if (mod.type === 'dig') {
                const dist = Math.hypot(pos.getX(i) - mod.x, -pos.getY(i) - mod.z);
                if (dist < 3.0) ty -= Math.cos((dist / 3.0) * (Math.PI / 2)) * 1.5;
            }
        }
        pos.setZ(i, ty);
    }
    groundGeo.computeVertexNormals();
    
    let groundMat;
    if (isCyberLab) {
        groundMat = new THREE.MeshStandardMaterial({ color: groundColor, flatShading: true, wireframe: true, transparent: true, opacity: 0.3 });
    } else {
        groundMat = new THREE.MeshStandardMaterial({ color: groundColor, flatShading: true });
    }
    
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = !isCyberLab;
    environmentGroup.add(ground);

    // Main path
    const pathGeo = new THREE.PlaneGeometry(12, 900, 32, 150);
    const pathPos = pathGeo.attributes.position;
    for(let i=0; i < pathPos.count; i++) {
        pathPos.setZ(i, getTerrainVisualYGlobal(pathPos.getX(i), -pathPos.getY(i)) + 0.1);
    }
    pathGeo.computeVertexNormals();
    
    const path = new THREE.Mesh(pathGeo, new THREE.MeshStandardMaterial({ 
        color: pathColor, 
        flatShading: true,
        emissive: emissiveColor,
        emissiveIntensity: emissiveInt
    }));
    path.rotation.x = -Math.PI / 2; path.receiveShadow = !isCyberLab && currentWorld !== 4;
    environmentGroup.add(path);

    // River Water Plane (Dirty by default)
    const waterGeo = new THREE.PlaneGeometry(1200, 20, 100, 1);
    waterMat = new THREE.MeshPhysicalMaterial({ 
        color: 0x5d4037, // Muddy brown
        transparent: true, 
        opacity: 0.85,
        roughness: 0.2,
        metalness: 0.1 
    });
    riverMesh = new THREE.Mesh(waterGeo, waterMat);
    riverMesh.rotation.x = -Math.PI / 2;
    riverMesh.position.set(0, -0.8, -35);
    environmentGroup.add(riverMesh);

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
        if (currentWorld === 3) {
            // Windpark / Solarpark 3D Assets
            if (type < 0.08) {
                // Große Windräder
                const turbine = new THREE.Group();
                
                // Turm
                const towerGeo = new THREE.CylinderGeometry(0.5, 1.5, 20, 8);
                const towerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
                const tower = new THREE.Mesh(towerGeo, towerMat);
                tower.position.y = 10;
                tower.castShadow = true;
                turbine.add(tower);
                
                // Gondel (Nacelle)
                const nacelleGeo = new THREE.BoxGeometry(2, 2.5, 5);
                const nacelle = new THREE.Mesh(nacelleGeo, towerMat);
                nacelle.position.set(0, 20, -1);
                nacelle.castShadow = true;
                turbine.add(nacelle);

                // Rotor & Nabe
                const rotor = new THREE.Group();
                rotor.position.set(0, 20, 1.6);
                
                const hub = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), towerMat);
                rotor.add(hub);

                // 3 Rotorblätter
                const bladeGeo = new THREE.BoxGeometry(0.5, 16, 0.2);
                bladeGeo.translate(0, 8, 0); // Offset pivot zur Nabe
                const bladeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, flatShading: true });
                
                for(let b=0; b<3; b++) {
                    const blade = new THREE.Mesh(bladeGeo, bladeMat);
                    blade.rotation.z = (b * Math.PI * 2) / 3;
                    rotor.add(blade);
                }
                
                // Leichte Rotation der Turbine zum Wind
                turbine.rotation.y = seededRandom() * Math.PI;
                turbine.add(rotor);
                window.windTurbineBlades.push(rotor);

                const s = seededRandom()*0.5 + 0.8; 
                turbine.scale.set(s,s,s); 
                turbine.position.set(rx, tY, rz);
                
                environmentGroup.add(turbine); 
                obstacles.push({ x: rx, z: rz, radius: 2.0*s });
            } else if (type < 0.25) {
                // Solarpanele (Arrays)
                const panelGroup = new THREE.Group();
                const standGeo = new THREE.CylinderGeometry(0.1, 0.1, 1);
                const standMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
                const panelGeo = new THREE.BoxGeometry(4, 2.5, 0.1);
                const panelMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.1, metalness: 0.8 });
                
                for(let p=0; p<3; p++) {
                    const stand = new THREE.Mesh(standGeo, standMat);
                    stand.position.set(p*4.5 - 4.5, 0.5, 0);
                    panelGroup.add(stand);
                    
                    const panel = new THREE.Mesh(panelGeo, panelMat);
                    panel.position.set(p*4.5 - 4.5, 1.2, 0);
                    panel.rotation.x = -Math.PI / 6; // Angestellt zur Sonne
                    panelGroup.add(panel);
                }
                
                panelGroup.position.set(rx, tY, rz);
                panelGroup.rotation.y = (seededRandom() - 0.5) * 0.5; 
                environmentGroup.add(panelGroup);
                obstacles.push({ x: rx, z: rz, radius: 7 });
            } else if (type < 0.75) {
                // Bergige Felsen
                const rR = seededRandom()*2.5+0.8;
                const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rR, 0), rckM);
                rock.position.set(rx, tY+rR*0.4, rz); rock.castShadow = true;
                environmentGroup.add(rock); obstacles.push({ x: rx, z: rz, radius: rR*0.8 });
            } else {
                // Kleine Büsche für die Wiesen
                const bush = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), leaB);
                bush.scale.set(1.5+seededRandom(), 0.6+seededRandom()*0.4, 1.2+seededRandom());
                bush.position.set(rx, tY + 0.3, rz);
                environmentGroup.add(bush);
            }
            
            // Randomly spawn some birds in the sky
            if (type < 0.1 && window.birds.length < 15) {
                const birdGeo = new THREE.ConeGeometry(0.2, 0.8, 3);
                birdGeo.rotateX(Math.PI / 2);
                const birdMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                const bird = new THREE.Mesh(birdGeo, birdMat);
                bird.position.set(rx, tY + 15 + seededRandom() * 10, rz);
                bird.rotation.y = seededRandom() * Math.PI * 2;
                bird.userData = { 
                    speedX: Math.cos(bird.rotation.y) * (0.05 + seededRandom() * 0.05),
                    speedZ: -Math.sin(bird.rotation.y) * (0.05 + seededRandom() * 0.05),
                    phase: seededRandom() * Math.PI * 2
                };
                environmentGroup.add(bird);
                window.birds.push(bird);
            }
        } else if (currentWorld === 4) {
            // Smart City logic (Solarpunk)
            if (type < 0.2) {
                const bldg = buildSkyscraper(rx, rz, type * 1000);
                bldg.rotation.y = seededRandom() * Math.PI / 2;
                environmentGroup.add(bldg);
                obstacles.push({ x: rx, z: rz, radius: 4 });
            } else if (type < 0.3) {
                // Occasional delivery pod on paths
                const c = buildDeliveryPod(rx, rz, type * 1000);
                c.rotation.y = (seededRandom() - 0.5) * Math.PI;
                environmentGroup.add(c);
                obstacles.push({ x: rx, z: rz, radius: 2.5 });
            } else if (type < 0.4) {
                // Info Terminals / Smart Trees
                const lamp = new THREE.Group();
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), new THREE.MeshStandardMaterial({color: 0xf8fafc}));
                pole.position.y = 2;
                lamp.add(pole);
                const light = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.5), new THREE.MeshLambertMaterial({color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.8}));
                light.position.set(0.4, 4, 0);
                lamp.add(light);
                lamp.position.set(rx, tY, rz);
                lamp.rotation.y = seededRandom() * Math.PI * 2;
                environmentGroup.add(lamp);
                obstacles.push({ x: rx, z: rz, radius: 0.5 });
            }
        } else {
            // ORIGINAL LOGIC für Welt 1, 2
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
        
        // Add potential vertical planting spot
        verticalPlantSpots.push({ x: m.x, y: ty + m.r*0.5, z: m.z, rotY: Math.random()*Math.PI, planted: false });
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
            verticalPlantSpots.push({ x: px, y: post.position.y, z: pz, rotY: angle, planted: false });
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

    // Spawn Foxes (kommen erst in späteren Welten laut User-Feedback)
    foxes.forEach(f => scene.remove(f)); foxes = [];
    // for (let i=0; i<6; i++) foxes.push(buildFox(seededRandom() * 200 - 100, seededRandom() * 200 - 100));
    
    // Spawn Wind Turbines (Nur für spätere Welten, oder global)
    turbines = [];
    const t1 = buildWindTurbine(60, 40); environmentGroup.add(t1); turbines.push(t1);
    const t2 = buildWindTurbine(-80, 70); environmentGroup.add(t2); turbines.push(t2);
    const t3 = buildWindTurbine(100, -80); environmentGroup.add(t3); turbines.push(t3);

    scene.add(environmentGroup);
}

let fireflies = [];

function updateAtmosphere(delta, time) {
    // Day/Night Cycle (Für Welt 1 deaktiviert - immer Tag)
    timeOfDay = 0; // Später für Welt 2: (Math.sin(time * 0.05) + 1) / 2;
    
    // Lerp Sky Color (Day: Blue, Night: Dark Purple/Blue)
    const mission = window.missionManager && window.missionManager.currentMission;
    const isW2 = mission && mission.id >= 6;
    const isFog = mission && mission.fogEnabled;

    const daySky = isFog ? new THREE.Color(0x020617) : (isW2 ? new THREE.Color(0xbae6fd) : new THREE.Color(0x87ceeb));
    const nightSky = isFog ? new THREE.Color(0x020617) : new THREE.Color(0x0a0a2e);
    skyColor.copy(daySky).lerp(nightSky, timeOfDay);
    scene.background = skyColor;
    if (scene.fog) scene.fog.color.copy(skyColor);
    
    // Lerp Lighting
    if (window.ambientLight) window.ambientLight.intensity = 0.4 + (1 - timeOfDay) * 0.6;
    if (window.sunLight) window.sunLight.intensity = (1 - timeOfDay) * 1.0;

    fireflies.forEach(f => {
        f.position.y += Math.sin(time * f.userData.speed + f.userData.phase) * 0.01;
        f.material.opacity = 0.4 + Math.sin(time * 2 + f.userData.phase) * 0.4;
    });

    if (window.birds && window.birds.length > 0) {
        window.birds.forEach(b => {
            b.position.x += b.userData.speedX;
            b.position.z += b.userData.speedZ;
            b.position.y += Math.sin(time * 5 + b.userData.phase) * 0.02; // Flapping effect
            if (b.position.x > 50) b.position.x = -50;
            if (b.position.x < -50) b.position.x = 50;
            if (b.position.z > 50) b.position.z = -50;
            if (b.position.z < -50) b.position.z = 50;
        });
    }

    if (window.windTurbineBlades) {
        window.windTurbineBlades.forEach(rotor => {
            rotor.rotation.z += delta * 2.0; 
        });
    }

    // River flow effect
    if (riverMesh) {
        riverMesh.geometry.attributes.position.array.forEach((_, i) => {
            if (i % 3 === 2) { // Z height in PlaneGeo (which is vertical because of rotation)
                const x = riverMesh.geometry.attributes.position.array[i-2];
                riverMesh.geometry.attributes.position.array[i] += Math.sin(time * 2 + x * 0.1) * 0.005;
            }
        });
        riverMesh.geometry.attributes.position.needsUpdate = true;
    }
}

window.cleanWater = function() {
    if (isWaterClean || !riverMesh) return;
    isWaterClean = true;
    
    // Sound effect
    if (window.audioEngine) window.audioEngine.playWaterCleanSound();
    
    // Smooth transition to Solarpunk Blue
    const targetColor = new THREE.Color(0x0ea5e9);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 0.02;
        riverMesh.material.color.lerp(targetColor, progress);
        riverMesh.material.opacity = 0.85 - progress * 0.2;
        
        if (progress >= 1) {
            clearInterval(interval);
            riverMesh.material.color.set(targetColor);
            riverMesh.material.opacity = 0.65;
            showActionFlash('💧 Das Wasser ist wieder rein! 🎉');
            showActionFlash("💧 Wasser gereinigt!");
            if (window.addVitality) window.addVitality(30); // 30% for the river
        }
    }, 50);
}

// ════════════════════════════════════════════════════════════════
// CHARGING STATIONS
// ════════════════════════════════════════════════════════════════
let chargingStations = [];
const CHARGING_STATION_POSITIONS = [
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

window.plantVertical = function() {
    if (!roverGroup) return;
    const rx = roverGroup.position.x, rz = roverGroup.position.z;
    
    for (const spot of verticalPlantSpots) {
        if (!spot.planted && Math.hypot(rx - spot.x, rz - spot.z) < 6.0) {
            spot.planted = true;
            
            // Spawn vines/plants on the wall
            const vineGroup = new THREE.Group();
            for (let i = 0; i < 5; i++) {
                const vine = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.1, 2 + Math.random()*2, 6),
                    new THREE.MeshStandardMaterial({ color: 0x166534 })
                );
                vine.position.set((Math.random()-0.5)*1, 1 + Math.random()*2, (Math.random()-0.5)*0.2);
                vine.rotation.z = (Math.random()-0.5) * 0.5;
                vineGroup.add(vine);
                
                // Add some leaves
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x4ade80 }));
                leaf.position.copy(vine.position);
                leaf.position.y += 1;
                vineGroup.add(leaf);
            }
            vineGroup.position.set(spot.x, spot.y, spot.z);
            vineGroup.rotation.y = spot.rotY;
            scene.add(vineGroup);
            
            showActionFlash("🌿 Wand begrünt!");
            if (window.audioEngine) window.audioEngine.playHappyBeep();
            window.addVitality(10);
            return true;
        }
    }
    showActionFlash("⚠️ Keine Wand in der Nähe!");
    return false;
}

window.solarTrack = function() {
    if (!roverGroup) return;
    const targetAngle = Math.PI; 
    
    const interval = setInterval(() => {
        let diff = targetAngle - roverGroup.rotation.y;
        while(diff < -Math.PI) diff += Math.PI*2;
        while(diff > Math.PI) diff -= Math.PI*2;
        
        if (Math.abs(diff) < 0.1) {
            clearInterval(interval);
            showActionFlash("☀️ Solar-Tracker aktiv!");
            if (window.audioEngine) window.audioEngine.playHappyBeep();
            window.isSolarTracking = true; 
        } else {
            roverGroup.rotation.y += Math.sign(diff) * 0.1;
        }
    }, 50);
}

// ════════════════════════════════════════════════════════════════
// MISSION WORLD GENERATOR (GDD Kap. 4.5)
// ════════════════════════════════════════════════════════════════
window.missionWorld = {
    setup: function(mission) {
        // Clear normal environment group
        if (environmentGroup) scene.remove(environmentGroup);
        environmentGroup = new THREE.Group();
        obstacles = [];
        
        // Clear collectibles from quests.js
        if (typeof collectibles !== 'undefined') {
            collectibles.forEach(c => {
                if (c.mesh) scene.remove(c.mesh);
            });
            collectibles = [];
        }
        if (typeof plantSpots !== 'undefined') {
            plantSpots.forEach(s => {
                if (s.mesh) scene.remove(s.mesh);
            });
            plantSpots = [];
        }
        
        // Remove carried item on robot if any
        if (typeof storyState !== 'undefined') {
            storyState.carriedItem = null;
            if (roverGroup && roverGroup.userData.carriedMesh) {
                roverGroup.remove(roverGroup.userData.carriedMesh);
                roverGroup.userData.carriedMesh = null;
            }
        }
        
        // Hide standard HUD elements
        const cargoHUD = document.getElementById('hud-cargo');
        if (cargoHUD) cargoHUD.classList.add('hidden');

        // Reset robot position & rotation
        if (roverGroup) {
            roverGroup.position.set(mission.startPos.x, 0.1, mission.startPos.z);
            roverGroup.rotation.set(0, mission.startPos.rot, 0);
        }

        // Reset camera & controls
        const camDist = typeof CAM_DISTANCE !== 'undefined' ? CAM_DISTANCE : 14;
        const camHeight = typeof CAM_HEIGHT !== 'undefined' ? CAM_HEIGHT : 9;
        const rot = mission.startPos.rot;
        const camX = mission.startPos.x - Math.sin(rot) * camDist;
        const camZ = mission.startPos.z - Math.cos(rot) * camDist;
        camera.position.set(camX, camHeight, camZ);
        if (typeof controls !== 'undefined' && controls) {
            controls.target.set(mission.startPos.x, 0.1 + 1.5, mission.startPos.z);
            controls.update();
        }

        // Create ground plane for mission (flat surface matching grid/goal)
        const isWorld2 = mission.id >= 6 && mission.id <= 10;
        const isWorld3 = mission.id >= 11 && mission.id <= 15;
        const isWorld4 = mission.id >= 16 && mission.id <= 20;
        const isCyberLab = mission.id >= 100;
        
        let groundGeo;
        if (isWorld3 || isWorld4) {
            groundGeo = new THREE.PlaneGeometry(900, 900, 150, 150);
            const pos = groundGeo.attributes.position;
            for(let i=0; i < pos.count; i++) {
                let ty = window.getTerrainVisualYGlobal ? window.getTerrainVisualYGlobal(pos.getX(i), -pos.getY(i)) : 0;
                if (window.worldModifications) {
                    for (const mod of window.worldModifications) {
                        if (mod.type === 'dig') {
                            const dist = Math.hypot(pos.getX(i) - mod.x, -pos.getY(i) - mod.z);
                            if (dist < 3.0) ty -= Math.cos((dist / 3.0) * (Math.PI / 2)) * 1.5;
                        }
                    }
                }
                pos.setZ(i, ty);
            }
            groundGeo.computeVertexNormals();
        } else {
            groundGeo = new THREE.PlaneGeometry(100, 100);
        }

        let groundMat;
        
        if (isCyberLab) {
            groundMat = new THREE.MeshStandardMaterial({ 
                color: 0x0a1428, 
                flatShading: true, 
                wireframe: true, 
                transparent: true, 
                opacity: 0.3 
            });
        } else {
            let col = 0x1e293b; // Default (World 1)
            if (isWorld2) col = 0x14532d; // Dark Forest Green
            if (isWorld3) col = 0x22c55e; // Green
            if (isWorld4) col = 0x4ade80; // Bright Green (Solarpunk)
            
            groundMat = new THREE.MeshStandardMaterial({ 
                color: col,
                roughness: 0.8,
                metalness: 0.2,
                flatShading: (isWorld3 || isWorld4) // Make hills look low-poly like the open world
            });
        }
        
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = !isCyberLab;
        environmentGroup.add(ground);

        // Add river for World 3 and 4
        if (isWorld3 || isWorld4) {
            const waterGeo = new THREE.PlaneGeometry(1200, 20, 100, 1);
            const waterMat = new THREE.MeshPhysicalMaterial({ 
                color: 0x0284c7, // Cleaner water for later worlds
                transparent: true, 
                opacity: 0.85,
                roughness: 0.2,
                metalness: 0.1 
            });
            const riverM = new THREE.Mesh(waterGeo, waterMat);
            riverM.rotation.x = -Math.PI / 2;
            riverM.position.set(0, -0.8, -35);
            environmentGroup.add(riverM);
        }

        // Add a grid helper ONLY for earlier worlds
        if (!isWorld3 && !isWorld4) {
            let gridColor1 = 0x475569, gridColor2 = 0x334155;
            if (isWorld2) { gridColor1 = 0x16a34a; gridColor2 = 0x14532d; }
            if (isCyberLab) { gridColor1 = 0x09d8ff; gridColor2 = 0x0a1428; }
            
            const gridHelper = new THREE.GridHelper(100, 50, gridColor1, gridColor2);
            gridHelper.position.y = 0.02;
            environmentGroup.add(gridHelper);
        }

        // Spawn decorative trees and bushes for World 2
        if (isWorld2) {
            // Materials for park elements
            const trkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
            const leaMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, flatShading: true });
            const bshMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8, flatShading: true });

            // Seeded random for deterministic tree placement in World 2 missions
            let w2Seed = mission.id * 10;
            function w2Random() {
                let t = (w2Seed += 0x6d2b79f5);
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            }

            // Create simple helper to position shapes
            const meshAt = function(geo, mat, x, y, z) {
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x, y, z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                return mesh;
            };

            for (let i = 0; i < 30; i++) {
                // Place trees around the borders (outside the central area where the robot moves)
                let tx, tz;
                if (w2Random() < 0.5) {
                    tx = (w2Random() < 0.5 ? -1 : 1) * (w2Random() * 25 + 15); // 15 to 40
                    tz = (w2Random() - 0.5) * 80;
                } else {
                    tx = (w2Random() - 0.5) * 80;
                    tz = (w2Random() < 0.5 ? -1 : 1) * (w2Random() * 25 + 15); // 15 to 40
                }

                // Check overlap with target and robot startPos
                let tooClose = false;
                if (mission.goalPos && Math.hypot(tx - mission.goalPos.x, tz - mission.goalPos.z) < 6) tooClose = true;
                if (Math.hypot(tx - mission.startPos.x, tz - mission.startPos.z) < 6) tooClose = true;
                if (mission.collectibles) {
                    mission.collectibles.forEach(col => {
                        if (Math.hypot(tx - col.x, tz - col.z) < 4) tooClose = true;
                    });
                }
                if (tooClose) continue;

                const tree = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 5), trkMat);
                trunk.position.y = 0.75;
                trunk.castShadow = true;
                tree.add(trunk);

                if (w2Random() < 0.5) {
                    // Pine Tree
                    tree.add(meshAt(new THREE.ConeGeometry(1.2, 2.0, 6), leaMat, 0, 2.0, 0));
                    tree.add(meshAt(new THREE.ConeGeometry(0.9, 1.5, 6), leaMat, 0, 3.0, 0));
                } else {
                    // Round Tree / Bush
                    tree.add(meshAt(new THREE.DodecahedronGeometry(1.0), bshMat, 0, 2.0, 0));
                }

                const s = w2Random() * 0.4 + 0.8;
                tree.scale.set(s, s, s);
                tree.position.set(tx, 0, tz);
                environmentGroup.add(tree);

                // Add to obstacles list for collisions
                obstacles.push({ x: tx, z: tz, radius: 1.0 * s });
            }
        }
        
        // Spawn Wind Turbines in World 3 missions
        if (isWorld3) {
            window.windTurbineBlades = [];
            
            // Placed strategically outside the direct path
            const positions = [
                {x: -25, z: 20}, {x: 25, z: 15}, {x: -15, z: -35}, {x: 30, z: -25}
            ];
            
            // Add goal turbine if available
            if (mission.goalPos) {
                positions.push({ x: mission.goalPos.x, z: mission.goalPos.z - 3 });
            }

            positions.forEach(pos => {
                const t = buildWindTurbine(pos.x, pos.z);
                t.position.y = 0.05; // Sit directly on grid
                t.rotation.y = Math.random() * Math.PI;
                if (t.userData.rotor) window.windTurbineBlades.push(t.userData.rotor);
                environmentGroup.add(t);
                obstacles.push({ x: pos.x, z: pos.z, radius: 2.0 });
            });
            
            // Also spawn a few birds!
            window.birds = [];
            for (let i = 0; i < 8; i++) {
                const birdGeo = new THREE.ConeGeometry(0.2, 0.8, 3);
                birdGeo.rotateX(Math.PI / 2);
                const birdMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
                const bird = new THREE.Mesh(birdGeo, birdMat);
                bird.position.set((Math.random() - 0.5) * 60, 15 + Math.random() * 10, (Math.random() - 0.5) * 60);
                bird.rotation.y = Math.random() * Math.PI * 2;
                bird.userData = { 
                    speedX: Math.cos(bird.rotation.y) * (0.05 + Math.random() * 0.05),
                    speedZ: -Math.sin(bird.rotation.y) * (0.05 + Math.random() * 0.05),
                    phase: Math.random() * Math.PI * 2
                };
                environmentGroup.add(bird);
                window.birds.push(bird);
            }
        }

        // Spawn Goal Pos if defined
        if (mission.goalPos) {
            const r = mission.goalRadius || 2;
            const goalGeo = new THREE.CylinderGeometry(r, r, 0.1, 32);
            const goalMat = new THREE.MeshBasicMaterial({ 
                color: 0x10b981, // Emerald green
                transparent: true,
                opacity: 0.4
            });
            const goalMesh = new THREE.Mesh(goalGeo, goalMat);
            goalMesh.position.set(mission.goalPos.x, 0.05, mission.goalPos.z);
            environmentGroup.add(goalMesh);

            // Glowing ring/aura for target
            const ringGeo = new THREE.RingGeometry(r - 0.2, r, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.rotation.x = -Math.PI/2;
            ringMesh.position.set(mission.goalPos.x, 0.08, mission.goalPos.z);
            environmentGroup.add(ringMesh);
        }

        // Spawn obstacles
        if (mission.obstacles) {
            mission.obstacles.forEach((obs, index) => {
                let obsMesh;
                if (obs.type === 'car' || obs.type === 'pod') {
                    obsMesh = buildDeliveryPod(obs.x, obs.z, index * 10);
                } else if (obs.type === 'tree') {
                    obsMesh = new THREE.Group();
                    const log = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.5, 0.5, obs.w || 4),
                        new THREE.MeshStandardMaterial({ color: 0x5c4033 })
                    );
                    log.rotation.z = Math.PI / 2;
                    log.position.y = 0.5;
                    obsMesh.add(log);
                    obsMesh.position.set(obs.x, 0, obs.z);
                } else {
                    const obsGeo = new THREE.BoxGeometry(obs.w || 2, obs.h || 2, obs.d || 2);
                    const obsMat = new THREE.MeshStandardMaterial({ 
                        color: obs.color || 0xd97706, // Amber/Orange-brown
                        roughness: 0.6,
                        metalness: 0.1
                    });
                    obsMesh = new THREE.Mesh(obsGeo, obsMat);
                    const obsY = (obs.h || 2) / 2;
                    obsMesh.position.set(obs.x, obsY, obs.z);
                }
                obsMesh.castShadow = true;
                obsMesh.receiveShadow = true;
                environmentGroup.add(obsMesh);

                // Add to obstacles list for collision detection
                const rad = Math.max(obs.w || 2, obs.d || 2) * 0.5;
                obstacles.push({ x: obs.x, z: obs.z, w: obs.w, d: obs.d, radius: rad });
            });
        }

        // Spawn collectibles
        if (mission.collectibles) {
            mission.collectibles.forEach(col => {
                const group = new THREE.Group();
                const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.5, 8);
                const baseMat = new THREE.MeshStandardMaterial({ 
                    color: 0x94a3b8, // Slate metal
                    metalness: 0.9,
                    roughness: 0.2
                });
                const base = new THREE.Mesh(baseGeo, baseMat);
                base.position.y = 0.25;
                group.add(base);

                // Floating/spinning icon sprite
                const canvas = document.createElement('canvas');
                canvas.width = 64; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(col.icon || '⚙️', 32, 32);
                const tex = new THREE.CanvasTexture(canvas);
                const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
                const sprite = new THREE.Sprite(spriteMat);
                sprite.position.set(0, 1.2, 0);
                sprite.scale.set(1.5, 1.5, 1);
                group.add(sprite);

                group.position.set(col.x, 0.05, col.z);
                scene.add(group);
                
                const def = { color: 0x94a3b8, emissive: 0x475569, name: "Schrottteil", emoji: col.icon || '⚙️' };
                collectibles.push({ mesh: group, x: col.x, z: col.z, type: col.type, color: col.color, def: def });
            });
        }

        // Spawn color zones on the ground
        if (mission.colorZones) {
            mission.colorZones.forEach(zone => {
                const geo = new THREE.RingGeometry(zone.radius ? zone.radius - 0.2 : 1.8, zone.radius || 2.0, 32);
                const colorHex = zone.color === 'blue' ? 0x2563eb : (zone.color === 'red' ? 0xdc2626 : 0x16a34a);
                const mat = new THREE.MeshBasicMaterial({ 
                    color: colorHex, 
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.6
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.rotation.x = Math.PI / 2; // Flat on the ground
                mesh.position.set(zone.x, 0.02, zone.z);
                scene.add(mesh);
            });
        }

        // Apply Fog/Darkness (Mission 4)
        if (typeof scene !== 'undefined' && scene.fog) {
            const isWorld2 = mission.id >= 6;
            if (mission.fogEnabled) {
                scene.fog.color.setHex(0x020617); // Dark blue/black
                if (scene.fog.isFogExp2) {
                    scene.fog.density = 0.08;
                } else {
                    scene.fog.near = 1;
                    scene.fog.far = 15;
                }
                if (typeof renderer !== 'undefined') renderer.setClearColor(0x020617, 1);
            } else {
                const fogColor = isWorld2 ? 0xbae6fd : 0xe2e8f0; // sky-blue for World 2, light slate/gray for World 1
                scene.fog.color.setHex(fogColor);
                if (scene.fog.isFogExp2) {
                    scene.fog.density = isWorld2 ? 0.008 : 0.012; // Thinner fog for a wide view in World 2
                } else {
                    scene.fog.near = isWorld2 ? 30 : 20;
                    scene.fog.far = isWorld2 ? 120 : 100;
                }
                if (typeof renderer !== 'undefined') renderer.setClearColor(fogColor, 1);
            }
        }

        scene.add(environmentGroup);
    }
};
