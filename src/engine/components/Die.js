/**
 * SVG Die Component
 */
function Die(props) {
    const faces = () => parseInt(props.faces);
    const color = () => props.color || 'var(--class-accent)';
    const isFilled = () => props.isFilled;

    const getSvgInner = () => {
        const f = faces();
        const c = color();
        const filled = isFilled();
        const fill = filled ? c : 'transparent';

        let shape = '';
        let glow = '';

        if (f === 4) {
            shape = `<polygon points="24,45 3,6 45,6" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,45 3,6 45,6" fill="url(#grad_${f})" />`;
        } else if (f === 8) {
            shape = `<polygon points="24,3 3,24 24,45 45,24" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,3 3,24 24,45 45,24" fill="url(#grad_${f})" />`;
        } else if (f === 10) {
            shape = `<polygon points="24,3 42,18 24,45 6,18" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,3 42,18 24,45 6,18" fill="url(#grad_${f})" />`;
        } else if (f === 12) {
            shape = `<polygon points="24,3 43.5,15 36,42 12,42 4.5,15" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,3 43.5,15 36,42 12,42 4.5,15" fill="url(#grad_${f})" />`;
        } else if (f === 20) {
            shape = `<polygon points="24,3 45,15 45,33 24,45 3,33 3,15" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<polygon points="24,3 45,15 45,33 24,45 3,33 3,15" fill="url(#grad_${f})" />`;
        } else {
            shape = `<rect x="6" y="6" width="36" height="36" rx="3" fill="${fill}" stroke="${c}" stroke-width="2" />`;
            if (filled) glow = `<rect x="6" y="6" width="36" height="36" rx="3" fill="url(#grad_${f})" />`;
        }

        return `
            <defs>
                <linearGradient id="grad_${f}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:rgba(255,255,255,0.2);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(0,0,0,0.2);stop-opacity:1" />
                </linearGradient>
            </defs>
            ${shape}
            ${glow}
        `;
    };

    return html`
        <svg viewBox="0 0 48 48" style="width: 48px; height: 48px; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));" innerHTML=${getSvgInner}></svg>
    `;
}
