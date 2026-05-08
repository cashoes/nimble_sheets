/**
 * ROLL ENGINE MODULE
 */
function dispatchRoll(notation, label, options = {}) {
    if (!notation) return;
    let finalNotation = notation.replace(/[⚔️🛡️]/g, '').trim();

    // --- AUTOMATED CLASS MODIFIERS ---
    let autoMod = 0;
    const isAttack = /attack|⚔️/i.test(label) || options.type === 'attack';

    if (CLASS_CONFIG.name === 'Berserker') {
        if (isAttack && options.stat === 'str') {
            const furySum = (state.furyDice || []).reduce((a, b) => a + b.total, 0);
            if (furySum > 0) autoMod += furySum;
        }
    } else if (CLASS_CONFIG.name === 'Oathsworn') {
        if (isAttack) {
            const jdSum = (state.judgmentDice || []).reduce((a, b) => a + b.total, 0);
            if (jdSum > 0) {
                autoMod += jdSum;
                state.judgmentDice = null;
                saveState();
                render();
            } else if (state.level >= 18 && (options.stat === 'str' || options.stat === 'dex' || options.stat === 'wil')) {
                autoMod += 5;
            }
        }
    } else if (CLASS_CONFIG.name === 'Zephyr') {
        if (label === 'Swift Fists' && state.level >= 5) {
            autoMod += state.level;
        }
    }

    if (autoMod !== 0) finalNotation += (autoMod >= 0 ? '+' : '') + autoMod;
    // ---------------------------------

    const isCheckOrSave = /check|save|rest|hit die/i.test(label);

    let condAdv = 0;
    if (!options.isMinion) {
        state.activeConditions.forEach(cId => {
            const c = CONDITIONS_LIST.find(cl => cl.id === cId);
            if (c && c.modRolls) {
                if (c.modRolls.adv) {
                    if (c.modRolls.adv.includes('all') || (isAttack && c.modRolls.adv.includes('attack'))) condAdv++;
                }
                if (c.modRolls.dis) {
                    if (c.modRolls.dis.includes('all') || (isAttack && c.modRolls.dis.includes('attack'))) condAdv--;
                }
            }
        });
    }

    let totalAdv = state.advantage + condAdv + (options.inherentAdv || 0) + (options.forceAdv ? 1 : 0);
    
    const dieMatch = finalNotation.match(/^(\d+)?d(\d+)(.*)$/i);
    if (dieMatch) {
        let count = parseInt(dieMatch[1] || "1"); let faces = dieMatch[2]; let rest = dieMatch[3];
        let diePart = (totalAdv > 0) ? `${count + totalAdv}d${faces}kh${count}` : (totalAdv < 0) ? `${count + Math.abs(totalAdv)}d${faces}kl${count}` : `${count}d${faces}`;
        if (!isCheckOrSave) diePart += '!';
        finalNotation = diePart + rest;
    }

    const tableMatch = finalNotation.match(/^t(\d+)(.*)$/i);
    if (tableMatch) {
        let faces = tableMatch[1]; let rest = tableMatch[2];
        let tablePart = (totalAdv > 0) ? `2t${faces}kh1` : (totalAdv < 0) ? `2t${faces}kl1` : `t${faces}`;
        finalNotation = tablePart + rest;
    }
    window.dispatchEvent(new CustomEvent("NIMBLE_ROLL_EVENT", { detail: { notation: finalNotation, label: label, playerName: state.charName || "Adventurer", rollTarget: 'everyone', timestamp: Date.now() } }));
}

function applyCantripScaling(notation, name, school, level) {
    const levelMod = Math.floor(level / 5);
    if (levelMod === 0) return notation;

    if (name === "Entice") {
        const steps = ["d4", "d6", "d8", "d10", "d12"];
        const step = Math.min(4, levelMod);
        return notation.replace(/d4/i, steps[step]);
    }

    let bonus = 0;
    if (school === "Fire") bonus = 5 * levelMod;
    else if (school === "Ice") bonus = 3 * levelMod;
    else if (school === "Lightning") {
        if (name === "Zap") bonus = 6 * levelMod;
        else if (name === "Overload") bonus = 4 * levelMod;
        else bonus = 4 * levelMod;
    }
    else if (school === "Wind" || name === "Vicious Mockery") bonus = 2 * levelMod;
    else if (school === "Radiant") bonus = 2 * levelMod;
    else if (name === "Withering Touch") bonus = 6 * levelMod;

    if (bonus === 0) return notation;
    return notation + "+" + bonus;
}

/**
 * ISTATS ENGINE
 */
function iStats(txt, level, statsMap, context = {}) {
    if (!txt) return "";
    const kv = Math.max(...CLASS_CONFIG.keyStats.map(s => statsMap[s]));

    // Helper: Replace stat names with values in raw notation strings
    const resolveNotation = (not) => {
        return not.replace(/\bKEY\b/gi, kv)
                  .replace(/\bLVL\b/gi, level)
                  .replace(/\bSTR\b/gi, statsMap.str)
                  .replace(/\bDEX\b/gi, statsMap.dex)
                  .replace(/\bINT\b/gi, statsMap.int)
                  .replace(/\bWIL\b/gi, statsMap.wil);
    };

    // Skip Pattern: Ignores existing highlighted spans or any HTML tags
    const skipPattern = /(<span[^>]*class="[^"]*(dice-hl|stat-hl|formula-label)[^"]*"[^>]*>.*?<\/span>)|<[^>]*>/gi;

    // Pass 1: Handle mathematical multipliers (e.g., 3x LVL)
    let processed = txt.replace(new RegExp(skipPattern.source + '|(\\b(\\d+)\\s*[xX×]\\s*(STR|DEX|INT|WIL|KEY|LVL)\\b)', 'gi'), (m, p1, p2, p3, p4, p5) => {
        if (p1 || !p3) return m;
        const s = p5.toUpperCase();
        let val = (s==='STR'?statsMap.str:s==='DEX'?statsMap.dex:s==='INT'?statsMap.int:s==='WIL'?statsMap.wil:s==='LVL'?level:kv);
        return `<span class="stat-hl">${parseInt(p4) * val}</span><span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p3})</span>`;
    });

    // Pass 2: Handle Dice/Table rolls (e.g., 1d6+KEY)
    processed = processed.replace(new RegExp(skipPattern.source + '|(\\b((\\d+|STR|DEX|INT|WIL|KEY|LVL)\\s*d\\d+|t\\d+)([\\s\\+-]+(STR|DEX|INT|WIL|KEY|LVL|\\d+))*\\b)', 'gi'), (m, p1, p2, p3) => {
        if (p1 || !p3) return m;
        let notation = resolveNotation(p3).replace(/\s+/g, '');
        if (context.type === 'cantrip') notation = applyCantripScaling(notation, context.name, context.school, level);
        
        const label = (context.name || 'Roll').replace(/'/g, "\\'");
        const display = resolveNotation(p3);
        const hasStat = /STR|DEX|INT|WIL|KEY|LVL/i.test(p3);
        const formula = hasStat ? `<span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${p3})</span>` : "";
        return `<span class="dice-hl roll-link" onclick="dispatchRoll('${notation}', '${label}', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${display}</span>${formula}`;
    });

    // Pass 3: Handle remaining isolated placeholders (outside of dice strings)
    const wrapStat = (val, label) => {
        const escapedLabel = (context.name || 'Roll').replace(/'/g, "\\'");
        return `<span class="stat-hl roll-link" onclick="dispatchRoll('1d20+${val}', '${escapedLabel} Check', ${JSON.stringify(context).replace(/"/g, '&quot;')})">${val}</span><span class="formula-label" style="font-size:0.8em; opacity:0.7; font-family:'Cinzel',serif;"> (${label})</span>`;
    };

    return processed.replace(new RegExp(skipPattern.source + '|(\\b(STR|DEX|INT|WIL|KEY|LVL)\\b)', 'gi'), (m, p1, p2, p3, p4) => {
        if (p1 || !p3) return m;
        const k = p4.toUpperCase();
        if (k === 'LVL') return `<span class="stat-hl">${level}</span>`;
        if (k === 'STR') return wrapStat(statsMap.str, 'STR');
        if (k === 'DEX') return wrapStat(statsMap.dex, 'DEX');
        if (k === 'INT') return wrapStat(statsMap.int, 'INT');
        if (k === 'WIL') return wrapStat(statsMap.wil, 'WIL');
        if (k === 'KEY') return wrapStat(kv, 'KEY');
        return m;
    });
}
