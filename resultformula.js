// Software Local Version
// GitHub Update ID: v1.0.5 (SSC Formula Added based on PDF Guidelines)

window.FORMULA_UPDATE_DATE = "2025-12-09 (SSC & RRB Updated)";

// --- User-Confirmed Common Rules for Calculation Components ---
// 1. Right Word (Total Right Words) = Total Correct Keystrokes / 5 (d.correctWords5)
// 2. Wrong Word (Total Errors) = Space-Based Errors (Missing + Extra + Wrong Type Words) (d.totalErrors)
// -------------------------------------------------------------------

window.FORMULA_DESC = {
    'DSSSB': "DSSSB Formula (Latest):\n1 Word = 5 Keystrokes\nNet Words = Total Right Words - (Total Wrong Words * 2)\nNet Speed = Net Words / Time\nAccuracy = (Net Words * 100) / Total Right Words",
    'DP-HCM': "DP-HCM Formula:\n1 Word = 5 Keystrokes\nNet Speed = (Gross Words / Time) - Total Wrong Words\nAccuracy = (Total Right Words - Total Wrong Words) * 100 / Total Right Words",
    'AIIMS': "Typing Master/KVS Pattern (AIIMS):\n1 Word = 5 Keystrokes\nNet Words = Gross Words - (Total Wrong Words * 5)\nNet Speed = Net Words / Time\nAccuracy = (Total Right Words - Total Wrong Words) * 100 / Total Right Words",
    'STENO': "Steno Formula (Transcription Based):\n1 Word = Space Button (Actual Word Count)\nSpeed = (Gross Words (5ch) - Total Errors) / Time\nAccuracy = (Total File Words - Total Errors) * 100 / Total File Words",
    'RRB': "RRB NTPC Formula:\n1 Word = 5 Keystrokes\nAllowance = 5% of Total Typed Words\nPenalty = 10 Words per Mistake (above 5%)\nNet Speed = (Total Typed Words - Penalty) / Time",
    'SSC': "SSC Formula (DEST/CGL/CHSL):\nAs per Guidelines (Full + Half/2 Mistakes)\n1 Word = 5 Keystrokes\nAllowance = 5% of Total Typed Words\nNet Mistakes = Total Mistakes - Allowance\nPenalty = Net Mistakes * 10\nNet Speed = (Total Typed Words - Penalty) / Time"
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
    let label1 = "Net Speed (WPM)";

    // --- FORMULA LOGIC ---
    if (formula === 'STENO') {
        // Steno Logic
        let speedCalc = (d.grossWords5 - d.totalErrors) / d.timeMin;
        speed = (d.timeMin > 0) ? speedCalc : 0;
        if(d.refLengthWords > 0) accuracy = ((d.refLengthWords - d.totalErrors) * 100) / d.refLengthWords;
        label1 = "Transcription Speed (WPM)";
    } 
    else if (formula === 'DSSSB') {
        // DSSSB Logic: Net Words = Right - (Errors * 2)
        netWords = d.correctWords5 - (d.totalErrors * 2);
        speed = (d.timeMin > 0) ? (netWords / d.timeMin) : 0;
        accuracy = (d.correctWords5 > 0) ? (netWords * 100) / d.correctWords5 : 0;
    }
    else if (formula === 'DP-HCM') {
        // DP-HCM Logic: Speed = Gross Speed - Errors
        let grossSpeed = (d.timeMin > 0) ? (d.grossWords5 / d.timeMin) : 0;
        speed = grossSpeed - d.totalErrors;
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - d.totalErrors) * 100) / d.correctWords5 : 0;
    }
    else if (formula === 'AIIMS') {
        // AIIMS Logic: Net Words = Gross - (Errors * 5)
        netWords = d.grossWords5 - (d.totalErrors * 5);
        speed = (d.timeMin > 0) ? (netWords / d.timeMin) : 0;
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - d.totalErrors) * 100) / d.correctWords5 : 0;
    }
    else if (formula === 'RRB' || formula === 'SSC') {
        // SSC & RRB Logic: 
        // Based on Image 1, Image 2 and SSC PDF Guidelines.
        // Logic: 5% Allowance on Total Words Typed (Gross), then 10x penalty.
        
        // 1. Calculate Total Typed Words (Gross Strokes / 5)
        const totalWordsTyped = d.grossWords5; 
        
        // 2. Calculate the 5% Allowance
        const errorAllowance = totalWordsTyped * 0.05;
        
        // 3. Calculate Net Mistakes (Total Errors - Allowance)
        // Note for SSC: Ideally Total Errors = Full Mistakes + (Half Mistakes / 2).
        // Since current software engine provides d.totalErrors, we use that as the count.
        const netMistakes = Math.max(0, d.totalErrors - errorAllowance);
        
        // 4. Calculate Penalty in Words (Net Mistakes * 10)
        const totalPenaltyWords = netMistakes * 10;
        
        // 5. Calculate Net Words for Speed
        netWords = totalWordsTyped - totalPenaltyWords;
        
        // 6. Calculate Speed (WPM)
        speed = (d.timeMin > 0) ? (netWords / d.timeMin) : 0;
        
        // 7. Calculate Accuracy 
        // Standard accuracy: (Right Words - Errors) / Right Words * 100
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - d.totalErrors) * 100) / d.correctWords5 : 0;
        
        // Adjust label for clarity
        if (formula === 'SSC') label1 = "SSC Evaluated Speed (WPM)";
        if (formula === 'RRB') label1 = "RRB Evaluated Speed (WPM)";
    }

    speed = Math.max(0, speed);
    accuracy = Math.max(0, accuracy);

    // Update UI
    const statsGrid = document.getElementById('dynamic-stats');

    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card"><div class="stat-label">${label1}</div><div class="stat-value">${speed.toFixed(2)}</div></div>
            <div class="stat-card"><div class="stat-label">Accuracy</div><div class="stat-value">${accuracy.toFixed(2)}%</div></div>
        `;
    }
    window.viewState = { formula: formula, speed: speed.toFixed(2), accuracy: accuracy.toFixed(2) };
};
