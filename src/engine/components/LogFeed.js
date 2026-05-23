/**
 * High-Visibility Unified Action Ticker
 * Displays OBR roll results and automated character events in a persistent scrolling marquee.
 * Each message is guaranteed to scroll across the screen at least twice before clearing.
 */
function LogFeed() {
    const s = charState;
    const rollData = lastRollResult;
    
    // We store items that are currently "in the train"
    const [activeItems, setActiveItems] = Solid.createSignal([]);
    const [lastProcessedLogId, setLastProcessedLogId] = Solid.createSignal(s().logs?.[0]?.id || 0);
    const [lastProcessedRollId, setLastProcessedRollId] = Solid.createSignal("");

    // Effect to catch incoming rolls and logs
    Solid.createEffect(() => {
        const d = rollData();
        const logs = s().logs || [];
        const lastId = lastProcessedLogId();
        
        // Find all logs newer than the last processed one
        const newLogs = [];
        for (const l of logs) {
            if (l.id > lastId) newLogs.push(l);
            else break;
        }
        
        const hasNewRoll = d && d.result && d.result.rollId !== lastProcessedRollId();
        const hasNewLog = newLogs.length > 0;

        if (hasNewRoll || hasNewLog) {
            let nextItems = [...activeItems()];
            
            if (hasNewRoll) {
                const notation = d.result.diceNotation || "";
                // Extract label from notation: "1d8+2 #Dagger (melee)" -> "Dagger"
                const labelMatch = notation.match(/#([^(\s]*)/);
                const label = labelMatch ? labelMatch[1].trim() : "Roll";
                const msg = `[${label.toUpperCase()}]: ${d.result.totalValue} (${d.result.rollSummary})`;
                
                nextItems.push({ id: d.result.rollId, msg, type: 'roll', passes: 0 });
                setLastProcessedRollId(d.result.rollId);
            }

            if (hasNewLog) {
                // Add new logs in order of creation (oldest to newest)
                newLogs.reverse().forEach(l => {
                    nextItems.push({ id: l.id, msg: l.msg, type: 'log', passes: 0 });
                });
                setLastProcessedLogId(logs[0].id);
            }

            setActiveItems(nextItems);
        }
    });

    const handleIteration = () => {
        const current = activeItems();
        if (current.length === 0) return;

        // Increment passes for all current items. 
        // Filter out items that have already completed 2 full loops.
        const updated = current.map(item => ({ ...item, passes: item.passes + 1 }))
                               .filter(item => item.passes < 2);
        
        setActiveItems(updated);
    };

    const dismiss = () => {
        setActiveItems([]);
        setLastRollResult(null);
    };

    const renderItems = () => {
        return activeItems().map((item, idx) => {
            const isRoll = item.type === 'roll';
            const color = isRoll ? 'var(--gold-light)' : '#fff';
            const style = isRoll ? 'letter-spacing: 0.5px;' : 'font-style: italic;';
            const sep = idx > 0 ? html`<span style="color: var(--gold-light); font-weight: 900; margin: 0 20px; opacity: 0.6;">::</span>` : '';
            return html`${sep}<span style=${`color: ${color}; ${style}`}>${item.msg}</span>`;
        });
    };

    return html`
        <style>
            @keyframes nimble-ticker-scroll {
                0% { transform: translateX(650px); }
                100% { transform: translateX(-100%); }
            }
            .action-ticker-container:hover .dismiss-icon { opacity: 1; }
        </style>
        <div onclick=${dismiss} 
             onAnimationIteration=${handleIteration}
             class="action-ticker-container"
             title="Click to dismiss"
             style=${() => `
            display: ${activeItems().length > 0 ? 'flex' : 'none'};
            align-items: center;
            width: 600px;
            height: 24px;
            overflow: hidden;
            font-size: 0.9em;
            font-family: 'Cinzel', serif;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(0,0,0,0.5);
            cursor: pointer;
            white-space: nowrap;
            position: relative;
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            padding: 0 10px;
        `}>
            <div style="animation: nimble-ticker-scroll 15s linear infinite; position: absolute; display: flex; align-items: center;">
                ${renderItems}
            </div>
            <div class="dismiss-icon" style="position: absolute; right: 12px; opacity: 0; transition: 0.3s; color: var(--gold-light); font-size: 1.4em; font-weight: bold; text-shadow: 0 0 5px #000;">×</div>
        </div>
    `;
}
