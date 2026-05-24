/**
 * Skill Row Component
 */
function SkillRow(props) {
    const s = charState;
    const d = charDerived;
    const skill = props.skill;
    const sid = skill.id;
    const sname = skill.name;
    const sstat = skill.stat;

    const curPts = () => s().skills[sid] || 0;
    const totalModVal = () => (d().statsMap[sstat] || 0) + curPts() + (d().passMods[sid] || 0);
    const modLabel = () => {
        const v = totalModVal();
        return (v >= 0 ? '+' : '') + v;
    };
    const notation = () => {
        const v = totalModVal();
        return `1d20${v >= 0 ? '+' : ''}${v}`;
    };
    const click = () => dispatchRoll(notation(), `${sname} Skill Check`);
    const change = (e) => {
        updateSkill(sid, e.target.value);
        e.target.value = curPts();
    };

    return html`
        <div class="skill-row">
            <div class="skill-name">${sname} <span class="skill-stat">${sstat.toUpperCase()}</span></div>
            <div class="skill-pts">
                <input type="number" value=${() => curPts()} onchange=${change} />
            </div>
            <div class="skill-total roll-link" onclick=${click}>
                ${() => modLabel()}
            </div>
        </div>
    `;
}

/**
 * Skills Section Component
 */
function Skills() {
    const s = charState;

    const unspentVal = () => {
        const lvl = s().level;
        const sks = s().skills;
        const tot = 4 + (lvl - 1);
        const spent = SKILL_LIST.reduce((sum, sk) => sum + (sks[sk.id] || 0), 0);
        return tot - spent;
    };
    const color = () => unspentVal() < 0 ? 'var(--save-dis)' : 'var(--class-accent)';
    const nodes = SKILL_LIST.map(sk => html`<${SkillRow} skill=${sk} />`);

    return html`
        <div class="skill-header">
            <span>SKILLS</span>
            <span style=${() => `color: ${color()}; font-family: 'Cinzel', serif; font-size: 0.85em; font-weight: bold;`}>
                UNSPENT: ${unspentVal}
            </span>
        </div>
        <div class="skills-grid">
            ${nodes}
        </div>
    `;
}
