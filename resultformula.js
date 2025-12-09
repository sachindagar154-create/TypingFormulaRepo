// Software Local Version
// GitHub Update ID: v1.1.0 (5 Reserved Slots Added)

window.FORMULA_UPDATE_DATE = "2025-12-09 (Future Slots Ready)";

// --- FUTURE CONFIGURATION (इसे GitHub से बदलें) ---
// जब भी नया फॉर्मूला आए, बस यहाँ नाम बदलें और नीचे लॉजिक लिखें
const F1_NAME = "Future Exam 1 (Not Active)";
const F2_NAME = "Future Exam 2 (Not Active)";
const F3_NAME = "Future Exam 3 (Not Active)";
const F4_NAME = "Future Exam 4 (Not Active)";
const F5_NAME = "Future Exam 5 (Not Active)";
// ---------------------------------------------------

window.FORMULA_DESC = {
    'DSSSB': "DSSSB Formula (Latest):\n1 Word = 5 Keystrokes\nNet Words = Total Right Words - (Total Wrong Words * 2)\nNet Speed = Net Words / Time\nAccuracy = (Net Words * 100) / Total Right Words",
    'DP-HCM': "DP-HCM Formula:\n1 Word = 5 Keystrokes\nNet Speed = (Gross Words / Time) - Total Wrong Words\nAccuracy = (Total Right Words - Total Wrong Words) * 100 / Total Right Words",
    'AIIMS': "Typing Master/KVS Pattern (AIIMS):\n1 Word = 5 Keystrokes\nNet Words = Gross Words - (Total Wrong Words * 5)\nNet Speed = Net Words / Time\nAccuracy = (Total Right Words - Total Wrong Words) * 100 / Total Right Words",
    'STENO': "Steno Formula (Transcription Based):\n1 Word = Space Button (Actual Word Count)\nSpeed = (Gross Words (5ch) - Total Errors) / Time\nAccuracy = (Total File Words - Total Errors) * 100 / Total File Words",
    'RRB': "RRB NTPC Formula:\n1 Word = 5 Keystrokes\nAllowance = 5% of Total Typed Words\nPenalty = 10 Words per Mistake (above 5%)\nNet Speed = (Total Typed Words - Penalty) / Time",
    'SSC': "SSC Formula (Simple Net Speed):\nFull Mistake: Spelling, Omission, Substitution\nHalf Mistake: Capitalization, Punctuation, Spacing\nTotal Error = Full + (Half / 2)\nNet Speed = (Gross Words - Total Error) / Time",
    
    // Future Descriptions
    'F1': F1_NAME + ":\nCurrently using Default Logic (Gross Speed). Update script to activate.",
    'F2': F2_NAME + ":\nCurrently using Default Logic (Gross Speed). Update script to activate.",
    'F3': F3_NAME + ":\nCurrently using Default Logic (Gross Speed). Update script to activate.",
    'F4': F4_NAME + ":\nCurrently using Default Logic (Gross Speed). Update script to activate.",
    'F5': F5_NAME + ":\nCurrently using Default Logic (Gross Speed). Update script to activate."
};

// --- SSC Helper ---
function analyzeSSCErrors(tokens) {
    let full = 0; let half = 0;
    if (!tokens || tokens.length === 0) return { full: 0, half: 0 };
    tokens.forEach(t => {
        if (t.type === 'missing' || t.type === 'extra') { full++; }
        else if (t.type === 'space-error') { half++; }
        else if (t.type === 'wrong') {
            const original = t.text; const typed = t.typed;
            if (original.toLowerCase() === typed.toLowerCase()) { half++; }
            else if (original.replace(/[^a-zA-Z0-9]/g, '') === typed.replace(/[^a-zA-Z0-9]/g, '')) { half++; }
            else { full++; }
        }
    });
    return { full, half };
}

// --- DYNAMIC NAME UPDATER (The Magic Function) ---
function updateDropdownNames() {
    // This runs automatically to rename HTML options based on JS variables
    const map = { 'opt-f1': F1_NAME, 'opt-f2': F2_NAME, 'opt-f3': F3_NAME, 'opt-f4': F4_NAME, 'opt-f5': F5_NAME };
    for (const [id, name] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) el.innerText = name;
    }
}

window.recalculateStats = function(forcedFormula = null) {
    // First, ensure names are updated
    updateDropdownNames();

    if (!window.calcData) return;
    const d = window.calcData;
    let formula = forcedFormula ? forcedFormula : document.getElementById('formula-select').value;
    
    const descEl = document.getElementById('formula-desc-display');
    if(descEl && window.FORMULA_DESC[formula]) {
        descEl.innerText = window.FORMULA_DESC[formula];
    }

    let speed = 0, accuracy = 0, netWords = 0;
    let label1 = "Net Speed (WPM)";
    let sscStatsHTML = ""; 

    // --- FORMULA LOGIC ---
    if (formula === 'STENO') {
        let speedCalc = (d.grossWords5 - d.totalErrors) / d.timeMin;
        speed = (d.timeMin > 0) ? speedCalc : 0;
        if(d.refLengthWords > 0) accuracy = ((d.refLengthWords - d.totalErrors) * 100) / d.refLengthWords;
        label1 = "Transcription Speed (WPM)";
    } 
    else if (formula === 'SSC') {
        const sscErr = analyzeSSCErrors(d.tokens);
        const totalSSCMistakes = sscErr.full + (sscErr.half / 2);
        const totalWordsTyped = d.grossWords5; 
        netWords = totalWordsTyped - totalSSCMistakes;
        speed = (d.timeMin > 0) ? (netWords / d.timeMin) : 0;
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - totalSSCMistakes) * 100) / d.correctWords5 : 0;
        label1 = "SSC Net Speed (WPM)";
        sscStatsHTML = `<div style="grid-column: span 2; background: #e3f2fd; padding: 10px; border-radius: 5px; border: 1px solid #90caf9; margin-top: 5px; text-align:center; font-size:12px;">SSC Analysis: Full=${sscErr.full} | Half=${sscErr.half} | Total=${totalSSCMistakes}</div>`;
    }
    else if (formula === 'RRB') {
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
    // --- FUTURE FORMULAS (F1 to F5) ---
    else if (['F1', 'F2', 'F3', 'F4', 'F5'].includes(formula)) {
        // [FUTURE UPDATE]: Change logic here when needed on GitHub
        // Current Default: Simple Gross Speed (No Penalty)
        let grossSpeed = (d.timeMin > 0) ? (d.grossWords5 / d.timeMin) : 0;
        speed = grossSpeed; 
        accuracy = (d.correctWords5 > 0) ? ((d.correctWords5 - d.totalErrors) * 100) / d.correctWords5 : 0;
        label1 = "Gross Speed (Placeholder)";
    }

    speed = Math.max(0, speed);
    accuracy = Math.max(0, accuracy);

    const statsGrid = document.getElementById('dynamic-stats');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card"><div class="stat-label">${label1}</div><div class="stat-value">${speed.toFixed(2)}</div></div>
            <div class="stat-card"><div class="stat-label">Accuracy</div><div class="stat-value">${accuracy.toFixed(2)}%</div></div>
            ${sscStatsHTML}
        `;
    }
    window.viewState = { formula: formula, speed: speed.toFixed(2), accuracy: accuracy.toFixed(2) };
};

// Initial call to set names
setTimeout(updateDropdownNames, 500);
