// Software Local Version
// GitHub Update ID: v1.0 (Change this string on GitHub to track versions)

window.FORMULA_UPDATE_DATE = "Default Offline Version"; // This will be overwritten if online

window.FORMULA_DESC = {
    'DSSSB': "DSSSB Formula (Latest):\n1 Word = 5 Keystrokes\nNet Words = Total Right Words - (Total Wrong Words * 2)\nNet Speed = Net Words / Time\nAccuracy = (Net Words * 100) / Total Right Words",
    'DP-HCM': "DP-HCM Formula:\n1 Word = 5 Keystrokes\nNet Speed = (Gross Words / Time) - Total Wrong Words\nAccuracy = (Total Right Words - Total Wrong Words) * 100 / Total Right Words",
    'AIIMS': "Typing Master/KVS Pattern (AIIMS):\n1 Word = 5 Keystrokes\nNet Words = Gross Words - (Total Wrong Words * 5)\nNet Speed = Net Words / Time\nAccuracy = (Total Right Words - Total Wrong Words) * 100 / Total Right Words",
    'STENO': "Steno Formula:\n1 Word = Space Button (Actual Word Count)\nSpeed = (Gross Words (5ch) - Total Errors) / Time\nAccuracy = (Total File Words - Total Errors) * 100 / Total File Words"
};

window.recalculateStats = function(forcedFormula = null) {
    if (!window.calcData) return;
    const d = window.calcData;
    let formula = forcedFormula ? forcedFormula : document.getElementById('formula-select').value;
    
    // Description Update
    const descEl = document.getElementById('formula-desc-display');
    if(descEl && window.FORMULA_DESC[formula]) {
        descEl.innerText = window.FORMULA_DESC[formula];
    }

    let speed = 0, accuracy = 0, netWords = 0;

    // --- FORMULA LOGIC ---
    if (formula === 'STENO') {
        let speedCalc = (d.grossWords5 - d.totalErrors) / d.timeMin;
        speed = (d.timeMin > 0) ? speedCalc : 0;
        if(d.refLengthWords > 0) accuracy = ((d.refLengthWords - d.totalErrors) * 100) / d.refLengthWords;
    } 
    else if (formula === 'DSSSB') {
        netWords = d.correctWords5 - (d.totalErrors * 2);
        speed = (d.timeMin > 0) ? (netWords / d.timeMin) : 0;
        accuracy = (d.correctWords5 > 0) ? (netWords * 100) / d.correctWords5 : 0;
    }
    else if (formula === 'DP-HCM') {
        let grossSpeed = (d.timeMin > 0) ? (d.grossWords5 / d.timeMin) : 0;
        speed = grossSpeed - d.totalErrors;
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - d.totalErrors) * 100) / d.correctWords5 : 0;
    }
    else if (formula === 'AIIMS') {
        netWords = d.grossWords5 - (d.totalErrors * 5);
        speed = (d.timeMin > 0) ? (netWords / d.timeMin) : 0;
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - d.totalErrors) * 100) / d.correctWords5 : 0;
    }

    speed = Math.max(0, speed);
    accuracy = Math.max(0, accuracy);

    // Update UI
    const statsGrid = document.getElementById('dynamic-stats');
    let label1 = "Net Speed (WPM)";
    if (formula === 'STENO') label1 = "Transcription Speed (WPM)";

    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card"><div class="stat-label">${label1}</div><div class="stat-value">${speed.toFixed(2)}</div></div>
            <div class="stat-card"><div class="stat-label">Accuracy</div><div class="stat-value">${accuracy.toFixed(2)}%</div></div>
        `;
    }
    window.viewState = { formula: formula, speed: speed.toFixed(2), accuracy: accuracy.toFixed(2) };
};
