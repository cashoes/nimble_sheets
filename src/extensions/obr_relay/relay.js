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
    OBR.broadcast.onMessage("nimble-bridge/roll-result", (delivery) => {
        const result = delivery.data;
        console.log("NIMBLE Bridge: Roll result received from Dice+:", result);
        
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
