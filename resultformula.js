// Software Local Version
// GitHub Update ID: v1.0.6 (SSC Full vs Half Mistake UI)

window.FORMULA_UPDATE_DATE = "2025-12-09 (SSC Smart Analysis)";

window.FORMULA_DESC = {
    'DSSSB': "DSSSB Formula (Latest):\n1 Word = 5 Keystrokes\nNet Words = Total Right Words - (Total Wrong Words * 2)\nNet Speed = Net Words / Time\nAccuracy = (Net Words * 100) / Total Right Words",
    'DP-HCM': "DP-HCM Formula:\n1 Word = 5 Keystrokes\nNet Speed = (Gross Words / Time) - Total Wrong Words\nAccuracy = (Total Right Words - Total Wrong Words) * 100 / Total Right Words",
    'AIIMS': "Typing Master/KVS Pattern (AIIMS):\n1 Word = 5 Keystrokes\nNet Words = Gross Words - (Total Wrong Words * 5)\nNet Speed = Net Words / Time\nAccuracy = (Total Right Words - Total Wrong Words) * 100 / Total Right Words",
    'STENO': "Steno Formula (Transcription Based):\n1 Word = Space Button (Actual Word Count)\nSpeed = (Gross Words (5ch) - Total Errors) / Time\nAccuracy = (Total File Words - Total Errors) * 100 / Total File Words",
    'RRB': "RRB NTPC Formula:\n1 Word = 5 Keystrokes\nAllowance = 5% of Total Typed Words\nPenalty = 10 Words per Mistake (above 5%)\nNet Speed = (Total Typed Words - Penalty) / Time",
    'SSC': "SSC DEST/CGL Formula:\nFull Mistake: Spelling, Omission, Substitution\nHalf Mistake: Capitalization, Punctuation, Spacing\nTotal Error = Full + (Half / 2)\nAllowance = 5%\nPenalty = 10x per Error"
};

// --- Helper Function to Analyze SSC Mistakes ---
function analyzeSSCErrors(tokens) {
    let full = 0;
    let half = 0;

    if (!tokens || tokens.length === 0) return { full: 0, half: 0 };

    tokens.forEach(t => {
        // 1. Missing Words = Full Mistake
        if (t.type === 'missing') {
            full++; 
        }
        // 2. Extra Words (Non-space) = Full Mistake
        else if (t.type === 'extra') {
            full++;
        }
        // 3. Space Errors = Half Mistake 
        else if (t.type === 'space-error') {
            half++;
        }
        // 4. Wrong Typed Words (Need analysis)
        else if (t.type === 'wrong') {
            const original = t.text;
            const typed = t.typed;

            // Check Capitalization Error (Letters same, case different) 
            if (original.toLowerCase() === typed.toLowerCase()) {
                half++;
            }
            // Check Punctuation Error (Only symbol difference) 
            // Removing alphanumeric to check if only punctuation remains/differs
            else if (original.replace(/[^a-zA-Z0-9]/g, '') === typed.replace(/[^a-zA-Z0-9]/g, '')) {
                half++;
            }
            // Otherwise -> Spelling Error -> Full Mistake [cite: 12]
            else {
                full++;
            }
        }
    });

    return { full, half };
}

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
    let sscStatsHTML = ""; // Variable to hold SSC specific UI

    // --- FORMULA LOGIC ---
    if (formula === 'STENO') {
        // Steno Logic
        let speedCalc = (d.grossWords5 - d.totalErrors) / d.timeMin;
        speed = (d.timeMin > 0) ? speedCalc : 0;
        if(d.refLengthWords > 0) accuracy = ((d.refLengthWords - d.totalErrors) * 100) / d.refLengthWords;
        label1 = "Transcription Speed (WPM)";
    } 
    else if (formula === 'SSC') {
        // --- SSC SPECIAL LOGIC START ---
        // 1. Analyze tokens specifically for SSC rules
        const sscErr = analyzeSSCErrors(d.tokens);
        
        // 2. Calculate Total SSC Mistakes = Full + (Half / 2) [cite: 1] (implied from PDF logic)
        const totalSSCMistakes = sscErr.full + (sscErr.half / 2);
        
        // 3. Gross Words (5 keystrokes base)
        const totalWordsTyped = d.grossWords5; 

        // 4. Allowance (5%)
        const errorAllowance = totalWordsTyped * 0.05;

        // 5. Net Mistakes for Penalty
        const penalizableMistakes = Math.max(0, totalSSCMistakes - errorAllowance);

        // 6. Penalty (10 words per mistake)
        const penaltyWords = penalizableMistakes * 10;

        // 7. Net Speed
        netWords = totalWordsTyped - penaltyWords;
        speed = (d.timeMin > 0) ? (netWords / d.timeMin) : 0;

        // 8. SSC Accuracy (Percentage of error-free work)
        // Using standard formula for accuracy display
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - totalSSCMistakes) * 100) / d.correctWords5 : 0;

        label1 = "SSC Evaluated Speed";

        // --- Create SSC Specific UI ---
        // This will be inserted into the result page
        sscStatsHTML = `
            <div style="grid-column: span 2; background: #e3f2fd; padding: 10px; border-radius: 5px; border: 1px solid #90caf9; margin-top: 5px;">
                <div style="font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 5px; color: #0d47a1;">
                    SSC Mistake Breakdown
                </div>
                <div style="display: flex; justify-content: space-around; font-size: 13px;">
                    <div>Full Mistakes: <span style="color: red; font-weight: bold;">${sscErr.full}</span></div>
                    <div>Half Mistakes: <span style="color: orange; font-weight: bold;">${sscErr.half}</span></div>
                    <div>Total (F + H/2): <span style="color: darkblue; font-weight: bold;">${totalSSCMistakes.toFixed(1)}</span></div>
                </div>
                <div style="font-size: 11px; text-align: center; margin-top: 4px; color: #555;">
                    (Allowance: ${errorAllowance.toFixed(1)} err | Penalty: ${penaltyWords.toFixed(1)} words)
                </div>
            </div>
        `;
        // --- SSC SPECIAL LOGIC END ---
    }
    else if (formula === 'RRB') {
        // RRB Logic
        const totalWordsTyped = d.grossWords5; 
        const errorAllowance = totalWordsTyped * 0.05;
        const penalizableMistakes = Math.max(0, d.totalErrors - errorAllowance);
        const penaltyWords = penalizableMistakes * 10;
        
        netWords = totalWordsTyped - penaltyWords;
        speed = (d.timeMin > 0) ? (netWords / d.timeMin) : 0;
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - d.totalErrors) * 100) / d.correctWords5 : 0;
        label1 = "RRB Evaluated Speed";
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

    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card"><div class="stat-label">${label1}</div><div class="stat-value">${speed.toFixed(2)}</div></div>
            <div class="stat-card"><div class="stat-label">Accuracy</div><div class="stat-value">${accuracy.toFixed(2)}%</div></div>
            ${sscStatsHTML} `;
    }
    window.viewState = { formula: formula, speed: speed.toFixed(2), accuracy: accuracy.toFixed(2) };
};
