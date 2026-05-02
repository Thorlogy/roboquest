function setupDPad() {
    document.getElementById('reset-btn').addEventListener('click', () => {
        roverGroup.position.set(0, 0.2, 0); roverGroup.rotation.set(0, 0, 0);
        document.getElementById('sensor-output').innerText = '🔄 Roboter zurückgesetzt!';
    });
    document.getElementById('cam-toggle-btn').addEventListener('click', (e) => {
        cameraChaseMode = !cameraChaseMode;
        e.target.innerText = cameraChaseMode ? '🎥 Ansicht: Follow' : '🎥 Ansicht: Orbit';
    });
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

    // Overwrite Blockly help callback to open handbook
    if (window.Blockly) {
        Blockly.Workspace.prototype.helpUrlCallback = function(url) {
            if (url.startsWith('#')) {
                const hbModal = document.getElementById('handbook-modal');
                if (hbModal) {
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
}

