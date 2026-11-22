import OBR from "https://esm.sh/@owlbear-rodeo/sdk";

const RELAY_ID = "com.nimble.dice-plus-bridge";
const statusEl = document.getElementById('status');
let dicePlusReady = false;

OBR.onReady(async () => {
    const name = await OBR.player.getName();
    const id = await OBR.player.getId();
    const role = await OBR.player.getRole();
    
    statusEl.textContent = `Connected as ${role}`;
    statusEl.className = "status active";
    console.log(`NIMBLE Bridge: Connected as ${role} (${name}).`);

    // 1. Listen for Dice+ Readiness
    OBR.broadcast.onMessage("dice-plus/isReady", (event) => {
        const data = event.data;
        if (data.ready) {
            dicePlusReady = true;
            statusEl.textContent = `Dice+ Ready (${role})`;
            statusEl.className = "status active";
            console.log("NIMBLE Bridge: Dice+ confirmed ready.");
        }
    });

    // 2. Poke Dice+ to wake it up
    const pokeDicePlus = () => {
        OBR.broadcast.sendMessage("dice-plus/isReady", { 
            requestId: `init_${Date.now()}`, 
            timestamp: Date.now() 
        }, { destination: "ALL" });
    };
    
    pokeDicePlus();
    const pokeInterval = setInterval(() => {
        if (dicePlusReady) clearInterval(pokeInterval);
        else pokeDicePlus();
    }, 2000);

    // 3. Listen for Roll Results from Dice+
    let lastToastRollId = null;
    OBR.broadcast.onMessage("nimble-bridge/roll-result", (delivery) => {
        const result = delivery.data;
        console.log("NIMBLE Bridge: Roll result received from Dice+:", result);

        // Show native OBR toast notification on Primary Die Miss or Crit
        const res = result?.result;
        const notation = res?.diceNotation || "";
        const rollId = result?.rollId || res?.rollId;
        if (res && !notation.includes("#Crit Explosion") && (!rollId || rollId !== lastToastRollId)) {
            const primaryGroup = (res.groups || []).find(g => g.diceModel === "primary");
            if (primaryGroup) {
                const faces = parseInt((primaryGroup.diceType || "").replace(/\D/g, ""), 10) || 20;
                const isExploding = notation.includes("!!");
                const keptDice = (Array.isArray(primaryGroup.dice) ? primaryGroup.dice : [])
                    .filter(d => d && d.dropped !== true && d.kept !== false);
                const primaryVal = (!isExploding && keptDice.length > 0 && typeof keptDice[0].value === "number")
                    ? keptDice[0].value
                    : primaryGroup.total;

                const player = result.playerName || name;
                const labelMatch = notation.match(/#(.+)$/);
                const rollLabel = labelMatch ? labelMatch[1].trim() : "";
                const suffix = rollLabel ? ` — ${rollLabel}` : "";

                if (primaryVal === 1 && !notation.includes("min2")) {
                    lastToastRollId = rollId;
                    OBR.notification.show(`❌ MISS! ${player}${suffix}`, "ERROR");
                } else if (primaryVal >= faces) {
                    lastToastRollId = rollId;
                    OBR.notification.show(`💥 CRIT! ${player}${suffix}`, "SUCCESS");
                }
            }
        }
        
        // Forward the result back to the parent OBR tab content script
        window.parent.postMessage({
            type: "NIMBLE_ROLL_RESULT",
            result: result
        }, "*");
    });

    let lastRollTime = 0;

    window.addEventListener("message", (event) => {
        const data = event.data;
        if (data?.type === "NIMBLE_ROLL_REQUEST") {
            const roll = data.roll;
            
            // Simple robust deduplication
            const now = Date.now();
            if (now - lastRollTime < 500) return;
            lastRollTime = now;

            // If Dice+ isn't ready, poke it again right before the roll
            if (!dicePlusReady) pokeDicePlus();

            const rollRequest = {
                rollId: crypto.randomUUID(),
                playerId: id,
                playerName: roll.playerName || name,
                rollTarget: 'everyone',
                diceNotation: roll.notation,
                showResults: true,
                timestamp: Date.now(),
                source: "nimble-bridge"
            };

            // Force broadcast to ALL explicitly. This covers both local and remote.
            OBR.broadcast.sendMessage("dice-plus/roll-request", rollRequest, { destination: "ALL" });
        }
    });
});
