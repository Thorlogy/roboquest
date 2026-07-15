window.closeAllModals = function() {
    const modalIds = ['handbook-modal', 'settings-modal', 'missions-modal', 'worlds-preview-modal'];
    modalIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
};

function setupDPad() {
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (window.missionManager && window.missionManager.currentMission) {
            window.missionManager.loadMission(window.missionManager.currentMission.id);
            document.getElementById('sensor-output').innerText = '🔄 Mission zurückgesetzt!';
        } else {
            roverGroup.position.set(0, 0.2, 0); roverGroup.rotation.set(0, 0, 0);
            document.getElementById('sensor-output').innerText = '🔄 Roboter zurückgesetzt!';
        }
    });

    const camBtn = document.getElementById('cam-toggle-btn');
    if (camBtn) {
        // Initialize camera button state based on default value
        camBtn.innerText = cameraChaseMode ? '🎥' : '🌐';
        camBtn.classList.toggle('active', !cameraChaseMode);
        
        camBtn.addEventListener('click', () => {
            cameraChaseMode = !cameraChaseMode;
            camBtn.innerText = cameraChaseMode ? '🎥' : '🌐';
            camBtn.classList.toggle('active', !cameraChaseMode);
        });
    }

    const speedBtn = document.getElementById('speed-toggle-btn');
    if (speedBtn) {
        speedBtn.addEventListener('click', (e) => {
            if (programSpeed === 1.0) { programSpeed = 0.2; e.target.innerText = '🐢 Tempo: 0.2x'; }
            else if (programSpeed === 0.2) { programSpeed = 2.0; e.target.innerText = '🐇 Tempo: 2x'; }
            else { programSpeed = 1.0; e.target.innerText = '🏃 Tempo: 1x'; }
        });
    }

    // Handbook UI Logic
    const hbModal = document.getElementById('handbook-modal');
    if (hbModal) {
        // Tab Switching Logic
        const tabBtns = document.querySelectorAll('.hb-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.fontWeight = 'normal';
                    b.style.border = '1px solid rgba(16,185,129,0.5)';
                });
                btn.classList.add('active');
                btn.style.background = 'rgba(16,185,129,0.2)';
                btn.style.fontWeight = 'bold';
                btn.style.border = '1px solid #10b981';

                const targetId = btn.getAttribute('data-target');
                document.querySelectorAll('.hb-tab-content').forEach(tc => {
                    tc.style.display = 'none';
                    tc.classList.remove('active');
                });
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.style.display = targetId === 'hb-dictionary' ? 'flex' : 'block';
                    targetContent.classList.add('active');
                }
            });
        });

        const btnOpen = document.getElementById('handbook-btn');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                if (hbModal.style.display === 'flex') {
                    hbModal.style.display = 'none';
                } else {
                    if (window.closeAllModals) window.closeAllModals();
                    if (window.populateDictionary) window.populateDictionary();
                    hbModal.style.display = 'flex';
                }
            });
        }
        
        const navBtnHandbook = document.getElementById('nav-btn-handbook');
        if (navBtnHandbook) {
            navBtnHandbook.addEventListener('click', () => {
                if (window.closeAllModals) window.closeAllModals();
                if (window.populateDictionary) window.populateDictionary();
                hbModal.style.display = 'flex';
            });
        }
        
        const btnClose = document.getElementById('btn-close-handbook');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                hbModal.style.display = 'none';
            });
        }
        
        document.querySelectorAll('.hb-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.hb-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.hb-tab-content').forEach(c => c.style.display = 'none');
                
                e.target.classList.add('active');
                const targetId = e.target.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.style.display = 'block';
            });
        });

        const btnToMenu = document.getElementById('btn-to-menu');
        if (btnToMenu) {
            btnToMenu.addEventListener('click', () => {
                if (window.missionManager && window.missionManager.showHub) {
                    window.missionManager.showHub();
                } else {
                    const intro = document.getElementById('intro-overlay');
                    if (intro) intro.style.display = 'flex';
                }
                if (window.engineManager) window.engineManager.pause();
            });
        }
    }

    // Load persisted settings
    let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    let musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
    let dpadEnabled = localStorage.getItem('dpadEnabled') !== 'false';
    let minimapEnabled = localStorage.getItem('minimapEnabled') !== 'false';

    // Apply initial settings
    if (window.audioEngine) {
        window.audioEngine.setMuted(!soundEnabled);
        window.audioEngine.setAmbientMuted(!musicEnabled);
    }
    
    const applyDpadVisibility = () => {
        const dpad = document.getElementById('dpad');
        if (dpad) {
            if (dpadEnabled) {
                dpad.classList.remove('hidden-by-setting');
            } else {
                dpad.classList.add('hidden-by-setting');
            }
        }
    };
    
    const applyMinimapVisibility = () => {
        const minimap = document.getElementById('minimap-container');
        if (minimap) {
            if (minimapEnabled) {
                minimap.classList.remove('hidden-by-setting');
            } else {
                minimap.classList.add('hidden-by-setting');
            }
        }
    };

    applyDpadVisibility();
    applyMinimapVisibility();

    // Settings Modal UI Logic
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        const btnOpenSettings = document.getElementById('btn-settings');
        const introSettingsIcon = document.querySelector('.intro-settings-icon');
        const btnCloseSettings = document.getElementById('btn-close-settings');
        const toggleSoundBtn = document.getElementById('toggle-sound-btn');
        const toggleMusicBtn = document.getElementById('toggle-music-btn');
        const toggleDpadBtn = document.getElementById('toggle-dpad-btn');
        const toggleMinimapBtn = document.getElementById('toggle-minimap-btn');

        function updateSettingsUI() {
            if (toggleSoundBtn && window.audioEngine) {
                const isMuted = window.audioEngine.getMuted();
                if (isMuted) {
                    toggleSoundBtn.innerText = 'AUS';
                    toggleSoundBtn.style.background = '#94a3b8';
                } else {
                    toggleSoundBtn.innerText = 'AN';
                    toggleSoundBtn.style.background = '#10b981';
                }
            }

            if (toggleMusicBtn && window.audioEngine) {
                const isAmbientMuted = window.audioEngine.getAmbientMuted();
                if (isAmbientMuted) {
                    toggleMusicBtn.innerText = 'AUS';
                    toggleMusicBtn.style.background = '#94a3b8';
                } else {
                    toggleMusicBtn.innerText = 'AN';
                    toggleMusicBtn.style.background = '#10b981';
                }
            }

            if (toggleDpadBtn) {
                if (dpadEnabled) {
                    toggleDpadBtn.innerText = 'AN';
                    toggleDpadBtn.style.background = '#10b981';
                } else {
                    toggleDpadBtn.innerText = 'AUS';
                    toggleDpadBtn.style.background = '#94a3b8';
                }
            }

            if (toggleMinimapBtn) {
                if (minimapEnabled) {
                    toggleMinimapBtn.innerText = 'AN';
                    toggleMinimapBtn.style.background = '#10b981';
                } else {
                    toggleMinimapBtn.innerText = 'AUS';
                    toggleMinimapBtn.style.background = '#94a3b8';
                }
            }
        }

        const toggleSettings = () => {
            if (settingsModal.style.display === 'flex') {
                settingsModal.style.display = 'none';
            } else {
                if (window.closeAllModals) window.closeAllModals();
                updateSettingsUI();
                settingsModal.style.display = 'flex';
            }
        };

        if (btnOpenSettings) {
            btnOpenSettings.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSettings();
            });
        }
        const btnSettingsHub = document.getElementById('btn-settings-hub');
        if (btnSettingsHub) {
            btnSettingsHub.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSettings();
            });
        }

        if (btnCloseSettings) {
            btnCloseSettings.addEventListener('click', () => {
                settingsModal.style.display = 'none';
            });
        }

        if (toggleSoundBtn) {
            toggleSoundBtn.addEventListener('click', () => {
                if (window.audioEngine) {
                    const nextState = !window.audioEngine.getMuted();
                    window.audioEngine.setMuted(nextState);
                    localStorage.setItem('soundEnabled', (!nextState).toString());
                    updateSettingsUI();
                    if (!nextState && window.audioEngine.playHappyBeep) {
                        window.audioEngine.playHappyBeep();
                    }
                }
            });
        }

        if (toggleMusicBtn) {
            toggleMusicBtn.addEventListener('click', () => {
                if (window.audioEngine) {
                    const nextState = !window.audioEngine.getAmbientMuted();
                    window.audioEngine.setAmbientMuted(nextState);
                    localStorage.setItem('musicEnabled', (!nextState).toString());
                    updateSettingsUI();
                }
            });
        }

        if (toggleDpadBtn) {
            toggleDpadBtn.addEventListener('click', () => {
                dpadEnabled = !dpadEnabled;
                localStorage.setItem('dpadEnabled', dpadEnabled.toString());
                applyDpadVisibility();
                updateSettingsUI();
            });
        }

        if (toggleMinimapBtn) {
            toggleMinimapBtn.addEventListener('click', () => {
                minimapEnabled = !minimapEnabled;
                localStorage.setItem('minimapEnabled', minimapEnabled.toString());
                applyMinimapVisibility();
                updateSettingsUI();
            });
        }
    }

    // Overwrite Blockly help callback to open handbook
    if (window.Blockly) {
        Blockly.Workspace.prototype.helpUrlCallback = function(url) {
            if (url.startsWith('#')) {
                const hbModal = document.getElementById('handbook-modal');
                if (hbModal) {
                    if (window.closeAllModals) window.closeAllModals();
                    hbModal.style.display = 'flex';
                    // Switch to Blocks tab
                    const btnBlocks = document.querySelector('.hb-tab-btn[data-target="hb-blocks"]');
                    if (btnBlocks) btnBlocks.click();
                    
                    // Scroll to specific section
                    const targetId = url.substring(1);
                    setTimeout(() => {
                        const el = document.getElementById(targetId);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            } else {
                window.open(url, '_blank');
            }
        };
    }

    // Missions Modal Logic
    const btnOpenMissions = document.getElementById('btn-open-missions');
    const missionsModal = document.getElementById('missions-modal');
    const btnCloseMissions = document.getElementById('btn-close-missions');
    const hubModal = document.getElementById('mission-hub');

    if (btnOpenMissions) {
        btnOpenMissions.addEventListener('click', () => {
            if (window.closeAllModals) window.closeAllModals();
            if (missionsModal) {
                missionsModal.style.display = 'flex';
            }

            if (window.missionManager && window.missionManager.currentMission) {
                const mission = window.missionManager.currentMission;
                const modalAct = document.getElementById('missions-modal-act');
                const modalDesc = document.getElementById('missions-modal-desc');
                const modalObj = document.getElementById('missions-modal-objectives');

                if (modalAct) {
                    const worldNum = mission.id <= 5 ? 1 : 2;
                    modalAct.innerHTML = `🌍 Welt ${worldNum} &bull; Mission ${mission.id}`;
                }
                if (modalDesc) {
                    modalDesc.innerHTML = `<strong>${mission.title}</strong><br>${mission.description}`;
                }
                if (modalObj) {
                    let objectivesHTML = '';
                    
                    // Objective 1: Collect items
                    if (mission.requiredCollectibles > 0) {
                        const collected = window.missionManager._collectedItems || 0;
                        const done = collected >= mission.requiredCollectibles;
                        const icon = done ? '✅' : '⬜';
                        const label = mission.id >= 6 ? 'Plastikflaschen' : 'Schrotteile';
                        objectivesHTML += `
                            <div class="story-obj ${done ? 'done' : ''}" style="color: #064e3b; font-size: 0.95rem; margin-bottom: 5px;">
                                ${icon} Sammle ${mission.requiredCollectibles} ${label} (${collected} / ${mission.requiredCollectibles})
                            </div>
                        `;
                    }
                    
                    // Objective 2: Reach Goal
                    if (mission.goalPos) {
                        let done = false;
                        if (window.roverGroup) {
                            const dx = window.roverGroup.position.x - mission.goalPos.x;
                            const dz = window.roverGroup.position.z - mission.goalPos.z;
                            const dist = Math.hypot(dx, dz);
                            done = dist <= mission.goalRadius;
                        }
                        const icon = done ? '✅' : '⬜';
                        const label = mission.id === 8 ? 'Fahre bis zur blauen Recyclingtonne' : 'Erreiche das grüne Zielfeld';
                        objectivesHTML += `
                            <div class="story-obj ${done ? 'done' : ''}" style="color: #064e3b; font-size: 0.95rem; margin-bottom: 5px;">
                                ${icon} ${label}
                            </div>
                        `;
                    }
                    
                    modalObj.innerHTML = objectivesHTML;
                }
            } else {
                // Fallback to Story mode
                const actSrc = document.getElementById('story-act');
                const objSrc = document.getElementById('story-objectives');
                const modalAct = document.getElementById('missions-modal-act');
                const modalDesc = document.getElementById('missions-modal-desc'); 
                const modalObj = document.getElementById('missions-modal-objectives');
                
                if (modalAct) modalAct.innerText = "Aktuelle Story";
                if (actSrc && modalDesc) modalDesc.innerText = actSrc.innerText;
                if (objSrc && modalObj) modalObj.innerHTML = objSrc.innerHTML;
            }
        });
    }

    if (btnCloseMissions && missionsModal) {
        btnCloseMissions.addEventListener('click', () => {
            missionsModal.style.display = 'none';
        });
    }

    const btnGoToHub = document.getElementById('btn-go-to-hub');
    if (btnGoToHub) {
        btnGoToHub.addEventListener('click', () => {
            if (window.missionManager && window.missionManager.showHub) {
                window.missionManager.showHub();
            }
        });
    }

    // Hub Navigation Logic (Weltkugel & Joystick)
    const btnNavMissions = document.getElementById('nav-btn-missions');
    const btnNavWorld = document.getElementById('nav-btn-world');
    const worldsPreviewModal = document.getElementById('worlds-preview-modal');
    const btnCloseWorlds = document.getElementById('btn-close-worlds');

    window.updateWorldsPreviewModal = function() {
        if (!worldsPreviewModal) return;
        const content = worldsPreviewModal.querySelector('.modal-content');
        if (!content) return;
        
        const progress = window.missionManager ? window.missionManager.progress : { highestMission: 1 };
        const highest = progress.highestMission || 1;
        
        const w2Unlocked = highest >= 6;
        
        content.innerHTML = `
            <button class="close-btn" id="btn-close-worlds" style="position: absolute; top: 12px; right: 12px;" title="Fenster schließen">×</button>
            <h2 class="modal-title" style="text-align: center; margin-bottom: 20px;">🌍 Bekannte Welten</h2>
            
            <!-- Welt 1 -->
            <div class="world-preview-card active-world" id="world-card-1" style="background: rgba(74,222,128,0.1); border-left: 4px solid #4ade80; padding: 15px; margin-bottom: 15px; border-radius: 8px; cursor: pointer;">
                <h3 style="margin-top: 0; color: #4ade80;">Welt 1: Verlassene Werkstatt</h3>
                <p style="margin-bottom: 0; font-size: 14px; opacity: 0.9;">Die erste Lektion in der Natur. Lerne grundlegende Bewegungen, sammle verstreuten Schrott und hilf Professor Ada.</p>
            </div>
            
            <!-- Welt 2 -->
            <div class="world-preview-card ${w2Unlocked ? 'active-world' : 'locked-world'}" id="world-card-2" style="background: ${w2Unlocked ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'}; border-left: 4px solid ${w2Unlocked ? '#4ade80' : '#94a3b8'}; padding: 15px; margin-bottom: 15px; border-radius: 8px; opacity: ${w2Unlocked ? '1.0' : '0.6'}; cursor: ${w2Unlocked ? 'pointer' : 'default'};">
                <h3 style="margin-top: 0; color: ${w2Unlocked ? '#4ade80' : '#94a3b8'};">${w2Unlocked ? '' : '🔒 '}Welt 2: Verschmutzter Stadtpark</h3>
                <p style="margin-bottom: 0; font-size: 14px; opacity: 0.9;">Fokus auf Schleifen, Farbsensoren und Bedingungen. Sortiere den Müll, säubere die Wiesen und bringe den Stadtpark zum Erblühen.</p>
            </div>
            
            <!-- Welt 3 -->
            <div class="world-preview-card locked-world" id="world-card-3" style="background: rgba(255,255,255,0.05); border-left: 4px solid #94a3b8; padding: 15px; margin-bottom: 15px; border-radius: 8px; opacity: 0.6; cursor: default;">
                <h3 style="margin-top: 0; color: #94a3b8;">🔒 Welt 3: Küsten-Rettung (Demnächst)</h3>
                <p style="margin-bottom: 0; font-size: 14px; opacity: 0.7;">Bedingungen (If/Else), Variablen und Feuchtigkeitssensoren. Hilf dabei, die Küste zu säubern und Schildkröten zu retten.</p>
            </div>
            
            <p style="text-align: center; font-size: 12px; opacity: 0.7; margin-top: 20px;">Schließe mehr Missionen ab, um neue Welten freizuschalten!</p>
        `;
        
        // Re-bind close button
        const newCloseBtn = document.getElementById('btn-close-worlds');
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', () => {
                worldsPreviewModal.style.display = 'none';
            });
        }
        
        // Bind click on Welt 1
        const w1Card = document.getElementById('world-card-1');
        if (w1Card) {
            w1Card.addEventListener('click', () => {
                worldsPreviewModal.style.display = 'none';
                if (window.missionManager) {
                    window.missionManager.showHub();
                }
            });
        }
        
        // Bind click on Welt 2
        if (w2Unlocked) {
            const w2Card = document.getElementById('world-card-2');
            if (w2Card) {
                w2Card.addEventListener('click', () => {
                    worldsPreviewModal.style.display = 'none';
                    if (window.missionManager) {
                        window.missionManager.loadMission(6);
                    }
                });
            }
        }
    };

    if (btnNavMissions && worldsPreviewModal) {
        btnNavMissions.addEventListener('click', () => {
            if (window.closeAllModals) window.closeAllModals();
            if (window.updateWorldsPreviewModal) window.updateWorldsPreviewModal();
            worldsPreviewModal.style.display = 'flex';
        });
    }

    if (btnCloseWorlds && worldsPreviewModal) {
        btnCloseWorlds.addEventListener('click', () => {
            worldsPreviewModal.style.display = 'none';
        });
    }

    if (btnNavWorld) {
        btnNavWorld.addEventListener('click', () => {
            if (window.missionManager) {
                window.missionManager.startFreeExplore();
            }
            if (missionsModal) missionsModal.style.display = 'none';
            const handbookModal = document.getElementById('handbook-modal');
            if (handbookModal) handbookModal.style.display = 'none';
            if (worldsPreviewModal) worldsPreviewModal.style.display = 'none';
            const hub = document.getElementById('mission-hub');
            if (hub) hub.style.display = 'none';
            const uiOverlay = document.getElementById('ui-overlay');
            if (uiOverlay) uiOverlay.style.display = 'flex';
        });
    }

    // Global Swipe Gesture for "Back" (right to left)
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleSwipe() {
        // Delta < 0 means swipe from right to left
        // Delta > 0 means swipe from left to right
        // The user specifically asked for "von rechts nach links" (right to left)
        const SWIPE_THRESHOLD = -50; 
        
        if (touchEndX - touchStartX < SWIPE_THRESHOLD) {
            goBack();
        }
    }

    function goBack() {
        const modals = [
            document.getElementById('settings-modal'),
            document.getElementById('handbook-modal'),
            document.getElementById('missions-modal'),
            document.getElementById('worlds-preview-modal')
        ];

        // 1. Close any open modal
        for (const modal of modals) {
            if (modal && modal.style.display === 'flex') {
                modal.style.display = 'none';
                return; // Stop after closing one modal
            }
        }

        // 2. If no modal is open and we are in-game (Hub is hidden), go back to Hub
        const hubModal = document.getElementById('mission-hub');
        if (hubModal && hubModal.style.display === 'none') {
            if (window.missionManager && window.missionManager.showHub) {
                window.missionManager.showHub();
            } else {
                hubModal.style.display = 'flex';
            }
        }
    }

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

window.populateDictionary = function() {
    const sidebar = document.getElementById('dict-sidebar');
    const content = document.getElementById('dict-content');
    if (!sidebar || !content) return;

    const dictData = [
        {
            id: 'move',
            title: 'Fahren & Drehen',
            icon: '⬆️',
            color: '#d97706',
            desc: 'Der Robo hat Ketten, fast wie ein cooler kleiner Bagger! Mit diesen Blöcken steuerst du seine Motoren. Du sagst ihm: "Fahr so viele Schritte" oder "Dreh dich". Er rechnet dann blitzschnell aus, wie lange die Motoren dafür drehen müssen, damit er exakt dort ankommt, wo du ihn hinhaben willst!',
            kidsUrl: 'https://thorlogy.github.io/kids_university_robotik/#k2',
            kidsText: '🎓 Nerds & Entdecker: Willst du wissen, wie genau Räder und Ketten funktionieren? Schau ins Kapitel "Bewegung"!'
        },
        {
            id: 'sensor_scan',
            title: 'Ultraschall-Scanner',
            icon: '📡',
            color: '#2e7d32',
            desc: 'Der Ultraschall-Scanner ist wie das Auge einer Fledermaus! Er schickt unsichtbare Töne los. Wenn diese Töne gegen eine Kiste prallen, kommen sie als Echo zurück. Je schneller das Echo zurück ist, desto näher ist das Hindernis. So weiß der Roboter genau: "Aha! Da ist was im Weg!"',
            kidsUrl: 'https://thorlogy.github.io/kids_university_robotik/#k3',
            kidsText: '🎓 Nerds & Entdecker: Fledermäuse und Ultraschall – Wie genau geht das? Schau ins Kapitel "Sensoren"!'
        },
        {
            id: 'sensor_touch',
            title: 'Tastsensor',
            icon: '👆',
            color: '#0284c7',
            desc: 'Stell dir vor, du gehst im Dunkeln und streckst die Arme aus. Wenn du gegen eine Wand stößt, merkst du das sofort und bleibst stehen. Genau das macht der Tastsensor! Mit dem "Warte bis"-Block sagst du dem Roboter: "Fahr einfach mutig los und mach erst den nächsten Schritt, wenn du anstößt!"',
            kidsUrl: 'https://thorlogy.github.io/kids_university_robotik/#k3',
            kidsText: '🎓 Nerds & Entdecker: Warum Fühlen manchmal schlauer als Sehen sein kann, erfährst du im Kapitel "Sensoren"!'
        },
        {
            id: 'logic',
            title: 'Kontroll-Blöcke',
            icon: '🧠',
            color: '#0284c7',
            desc: 'Ein Roboter macht immer nur exakt das, was du sagst. Er ist eigentlich total stur! Mit Kontroll-Blöcken wie "Warte bis" bringst du ihm das Denken bei. Plötzlich kann er Situationen abwarten und selbst entscheiden, wann es weitergeht!',
            kidsUrl: 'https://thorlogy.github.io/kids_university_robotik/#k5',
            kidsText: '🎓 Nerds & Entdecker: Wie bringt man Maschinen echte Entscheidungen bei? Klick ins Kapitel "Entscheidungen"!'
        }
    ];

    sidebar.innerHTML = '';
    
    const renderContent = (item) => {
        content.innerHTML = `
            <div style="background: rgba(255,255,255,0.8); border-radius: 12px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: left;">
                <h2 style="color: ${item.color}; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 2rem;">${item.icon}</span> ${item.title}
                </h2>
                <div style="font-size: 1.1rem; line-height: 1.6; color: #334155; margin-bottom: 25px;">
                    ${item.desc}
                </div>
                <div style="background: #f8fafc; border-left: 4px solid #09d8ff; padding: 15px; border-radius: 0 8px 8px 0; font-size: 0.95rem;">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #0f172a;">
                        ${item.kidsText}
                    </p>
                    <a href="${item.kidsUrl}" target="_blank" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 8px 16px; border-radius: 20px; font-weight: bold; transition: background 0.2s;">
                        🚀 Ab ins Cyber-Lab!
                    </a>
                </div>
            </div>
        `;
    };

    dictData.forEach((item, index) => {
        const btn = document.createElement('div');
        btn.id = 'dict-item-' + item.id;
        btn.innerHTML = `<strong>${item.icon}</strong> <span style="margin-left:8px;">${item.title}</span>`;
        btn.style.padding = '12px 15px';
        btn.style.marginBottom = '8px';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.color = '#334155';
        btn.style.transition = 'all 0.2s';
        btn.style.border = '1px solid transparent';
        
        btn.onmouseover = () => { if(btn.dataset.active !== 'true') btn.style.background = 'rgba(0,0,0,0.05)'; };
        btn.onmouseout = () => { if(btn.dataset.active !== 'true') btn.style.background = 'transparent'; };
        
        btn.onclick = () => {
            Array.from(sidebar.children).forEach(c => {
                c.dataset.active = 'false';
                c.style.background = 'transparent';
                c.style.border = '1px solid transparent';
                c.style.fontWeight = 'normal';
                c.style.color = '#334155';
            });
            btn.dataset.active = 'true';
            btn.style.background = `rgba(0,0,0,0.03)`;
            btn.style.border = `1px solid ${item.color}`;
            btn.style.color = item.color;
            btn.style.fontWeight = 'bold';
            renderContent(item);
        };
        sidebar.appendChild(btn);
        
        if (index === 0) btn.click();
    });
};

window.openHandbook = function(topic) {
    // Open Handbook Modal
    const hbModal = document.getElementById('handbook-modal');
    if (hbModal) hbModal.style.display = 'flex';
    
    // Switch to Dictionary tab
    const tabBtns = document.querySelectorAll('.hb-tab-btn');
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-target') === 'hb-dictionary') {
            btn.click();
        }
    });

    // Select the specific topic
    if (topic) {
        setTimeout(() => {
            const topicBtn = document.getElementById('dict-item-' + topic);
            if (topicBtn) {
                topicBtn.click();
                topicBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
};

// --- Live Sensor Dashboard ---
document.addEventListener('DOMContentLoaded', () => {
    const btnLiveSensors = document.getElementById('btn-live-sensors');
    const sensorDashboard = document.getElementById('sensor-dashboard');
    const btnCloseSensorDash = document.getElementById('btn-close-sensor-dash');

    if (btnLiveSensors && sensorDashboard && btnCloseSensorDash) {
        btnLiveSensors.addEventListener('click', (e) => {
            e.stopPropagation();
            sensorDashboard.classList.remove('hidden');
        });

        btnCloseSensorDash.addEventListener('click', () => {
            sensorDashboard.classList.add('hidden');
        });
    }
});

