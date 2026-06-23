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
        const btnOpen = document.getElementById('handbook-btn');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                if (hbModal.style.display === 'flex') {
                    hbModal.style.display = 'none';
                } else {
                    if (window.closeAllModals) window.closeAllModals();
                    hbModal.style.display = 'flex';
                }
            });
        }
        
        const navBtnHandbook = document.getElementById('nav-btn-handbook');
        if (navBtnHandbook) {
            navBtnHandbook.addEventListener('click', () => {
                if (window.closeAllModals) window.closeAllModals();
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
            // Immer das Missions-Modal öffnen (wie vom Nutzer gewünscht: "bei der zielscheibe kommt man immer zu den missionen")
            if (missionsModal) {
                missionsModal.style.display = 'flex';
            }

            // Ansonsten öffne das Missions-Modal und fülle Daten ab
            const actSrc = document.getElementById('story-act');
            const objSrc = document.getElementById('story-objectives');
            const modAct = document.getElementById('missions-modal-desc'); 
            const modObj = document.getElementById('missions-modal-objectives');
            
            if (actSrc && modAct) modAct.innerText = actSrc.innerText;
            if (objSrc && modObj) modObj.innerHTML = objSrc.innerHTML;
            
            if (missionsModal) missionsModal.style.display = 'flex';
        });
    }

    if (btnCloseMissions && missionsModal) {
        btnCloseMissions.addEventListener('click', () => {
            missionsModal.style.display = 'none';
        });
    }

    // Hub Navigation Logic (Weltkugel & Joystick)
    const btnNavMissions = document.getElementById('nav-btn-missions');
    const btnNavWorld = document.getElementById('nav-btn-world');
    const worldsPreviewModal = document.getElementById('worlds-preview-modal');
    const btnCloseWorlds = document.getElementById('btn-close-worlds');

    if (btnNavMissions && worldsPreviewModal) {
        btnNavMissions.addEventListener('click', () => {
            if (window.closeAllModals) window.closeAllModals();
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
