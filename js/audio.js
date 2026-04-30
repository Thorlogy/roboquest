/**
 * RoboQuest Audio Engine
 * Uses the Web Audio API to synthesize robot sounds without loading external files.
 */

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Ensure audio is initialized on user interaction
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });

function playTone(freq, type, duration, vol, slideToFreq = null) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideToFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideToFreq, audioCtx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// 1. Move Sound (low rumbling, continuous)
function playMoveSound() {
    initAudio();
    playTone(60, 'sawtooth', 0.5, 0.1);
    setTimeout(() => playTone(65, 'sawtooth', 0.5, 0.1), 100);
}

// 2. Servo Sound (gripper / turning)
function playServoSound() {
    initAudio();
    playTone(400, 'square', 0.3, 0.05, 600);
}

// 3. Happy Beep (success, plant seed)
function playHappyBeep() {
    initAudio();
    playTone(800, 'sine', 0.15, 0.2);
    setTimeout(() => playTone(1200, 'sine', 0.25, 0.2), 150);
}

// 4. Sad Boop (error, collision)
function playSadBoop() {
    initAudio();
    playTone(300, 'triangle', 0.5, 0.3, 100);
}

// 5. Scan Ping (LiDAR)
function playScanSound() {
    initAudio();
    playTone(1500, 'sine', 0.1, 0.1, 2000);
    setTimeout(() => playTone(1500, 'sine', 0.1, 0.1, 2000), 200);
}

// 6. Zone Discovery
function playDiscoverySound() {
    initAudio();
    playTone(440, 'sine', 0.2, 0.2);
    setTimeout(() => playTone(554, 'sine', 0.2, 0.2), 200);
    setTimeout(() => playTone(659, 'sine', 0.4, 0.2), 400);
}

window.audioEngine = {
    playMoveSound,
    playServoSound,
    playHappyBeep,
    playSadBoop,
    playScanSound,
    playDiscoverySound
};
