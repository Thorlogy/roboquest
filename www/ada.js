// js/ada.js – Professorin Ada Dialog-System (GDD Kap. 2 + 10)
// Ada ist die Mentorin: gibt Missionen, erklärt, stellt Verständnisfragen.
// Max 1-2 Sätze pro Moment (GDD Prinzip 4).

class Ada {
    constructor() {
        this.bubble = document.getElementById('ada-bubble');
        this.bubbleText = document.getElementById('ada-text');
        this.bubbleAvatar = document.getElementById('ada-avatar');
        this.dismissTimer = null;
        this.isVisible = false;
    }

    // ═══════════════════════════════════════════════
    // SPRECHBLASE (GDD: max 1-2 Sätze, dann weg)
    // ═══════════════════════════════════════════════
    say(text, duration = 5000) {
        if (!this.bubble || !this.bubbleText) return;

        // Vorherige Timer löschen
        clearTimeout(this.dismissTimer);

        this.bubbleText.textContent = text;
        this.bubble.style.display = 'flex';
        this.bubble.classList.remove('ada-exit');
        this.bubble.classList.add('ada-enter');
        this.isVisible = true;

        // Tipp zum Wegtippen
        this.bubble.onclick = () => this.dismiss();

        // Auto-Dismiss
        this.dismissTimer = setTimeout(() => this.dismiss(), duration);
    }

    dismiss() {
        if (!this.bubble || !this.isVisible) return;
        clearTimeout(this.dismissTimer);

        this.bubble.classList.remove('ada-enter');
        this.bubble.classList.add('ada-exit');
        this.isVisible = false;

        setTimeout(() => {
            if (this.bubble) this.bubble.style.display = 'none';
        }, 300);
    }

    // ═══════════════════════════════════════════════
    // VERSTÄNDNISFRAGE (GDD 4.4: Retrieval Practice)
    // ═══════════════════════════════════════════════
    askComprehension(question, options, correctIndex, onComplete) {
        // Frage-Overlay erstellen
        const overlay = document.getElementById('ada-question-overlay');
        if (!overlay) {
            // Dynamisch erstellen falls nicht im HTML
            this._createQuestionOverlay();
        }
        
        const questionOverlay = document.getElementById('ada-question-overlay');
        const questionText = document.getElementById('ada-question-text');
        const optionsContainer = document.getElementById('ada-question-options');

        if (!questionOverlay || !questionText || !optionsContainer) return;

        questionText.textContent = '🤔 ' + question;
        optionsContainer.innerHTML = '';

        options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'ada-option-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => {
                // Feedback anzeigen
                if (i === correctIndex) {
                    btn.classList.add('correct');
                    btn.textContent = '✅ ' + opt;
                    setTimeout(() => {
                        questionOverlay.style.display = 'none';
                        this.say('Genau richtig! 🌟', 2500);
                        if (onComplete) setTimeout(onComplete, 2800);
                    }, 1200);
                } else {
                    btn.classList.add('wrong');
                    btn.textContent = '❌ ' + opt;
                    // Richtigen Antwort markieren
                    const allBtns = optionsContainer.querySelectorAll('.ada-option-btn');
                    setTimeout(() => {
                        allBtns[correctIndex].classList.add('correct');
                        allBtns[correctIndex].textContent = '✅ ' + options[correctIndex];
                    }, 600);
                    setTimeout(() => {
                        questionOverlay.style.display = 'none';
                        this.say('Fast! Beim nächsten Mal klappt es. 💪', 2500);
                        if (onComplete) setTimeout(onComplete, 2800);
                    }, 2000);
                }
            });
            optionsContainer.appendChild(btn);
        });

        questionOverlay.style.display = 'flex';
    }

    _createQuestionOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'ada-question-overlay';
        overlay.className = 'ada-question-overlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div class="ada-question-card glass-panel">
                <div class="ada-question-avatar">👩‍🔬</div>
                <div class="ada-question-text" id="ada-question-text"></div>
                <div class="ada-question-options" id="ada-question-options"></div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    // ═══════════════════════════════════════════════
    // FEATURE TUTORIAL (Neue Blöcke)
    // ═══════════════════════════════════════════════
    introduceFeature(title, text, onComplete) {
        let toast = document.getElementById('ada-feature-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'ada-feature-toast';
            toast.className = 'ada-feature-toast';
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <div class="toast-avatar">👩‍🔬</div>
            <div class="toast-content">
                <h4>🎉 ${title}</h4>
                <p>${text}</p>
            </div>
        `;

        // Animation classes (defined in style.css)
        toast.classList.remove('hide');
        toast.classList.add('show');

        // Nach 5 Sekunden ausblenden
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            if (onComplete) onComplete();
        }, 5000);
    }

    // ═══════════════════════════════════════════════
    // GESTUFTE HILFE (GDD 10.1)
    // ═══════════════════════════════════════════════
    offerHelp(helpLevel, missionId) {
        const hints = {
            0: 'Soll ich dir einen Tipp geben? 💡',
            1: this._getLevel1Hint(missionId),
            2: this._getLevel2Hint(missionId),
            3: this._getLevel3Hint(missionId)
        };

        this.say(hints[helpLevel] || hints[0], 6000);
    }

    _getLevel1Hint(missionId) {
        const hints = {
            1: 'Wie viele Schritte muss ROBO zum grünen Feld machen?',
            2: 'In welche Richtung steht das Hindernis? Wohin muss ROBO ausweichen?',
            3: 'Steh ROBO direkt beim Schrottteil, bevor du Greifen benutzt?',
            4: 'Was zeigt der Scan-Sensor, wenn ein Hindernis vor ROBO ist?',
            5: 'Welche Schritte brauchst du zuerst: Sammeln oder zum Ziel fahren?'
        };
        return hints[missionId] || 'Schau dir die Aufgabe noch einmal genau an.';
    }

    _getLevel2Hint(missionId) {
        const hints = {
            1: 'Du brauchst den ⬆️ Vor-Befehl. Tippe ihn mehrmals an!',
            2: 'Fahre erst vor, dann dreh ab mit ⟲ oder ⟳, dann weiter vor.',
            3: 'Fahr zu jedem Teil, nutze 🖐️ Greifen, dann weiter zum nächsten.',
            4: 'Nutze 📡 Scan, dann sieh was der Sensor sagt. Fahre vorsichtig.',
            5: 'Kombiniere alles: Vor → Drehen → Greifen → weiter zum Ziel.'
        };
        return hints[missionId] || 'Probiere verschiedene Befehle aus der Palette.';
    }

    _getLevel3Hint(missionId) {
        const hints = {
            1: 'Tippe 3× auf ⬆️ Vor, dann drücke ▶ Start.',
            2: 'Tippe: Vor, Vor, Rechts, Vor, Vor. Dann Start.',
            3: 'Fahr zum ersten Teil: Vor, Vor, Vor, Greifen. Dann dreh zum nächsten.',
            4: 'Versuche: Scan, Vor, Vor, Rechts, Vor, Vor.',
            5: 'Baue Schritt für Schritt: erst sammeln, dann zum grünen Feld.'
        };
        return hints[missionId] || 'Probiere eine andere Reihenfolge der Befehle.';
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.ada = new Ada();
});
