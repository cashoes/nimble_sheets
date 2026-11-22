// Content script for the NIMBLE Tracker tab
console.log("NIMBLE Bridge: Tracker listener active");

const extApi = typeof browser !== "undefined" ? browser : chrome;

window.addEventListener("NIMBLE_ROLL_EVENT", (event) => {
  const rollData = event.detail ? JSON.parse(JSON.stringify(event.detail)) : null;

  if (rollData && typeof extApi !== "undefined" && extApi.runtime && extApi.runtime.sendMessage) {
    extApi.runtime.sendMessage({
      type: "NIMBLE_ROLL",
      roll: rollData
    });
  }
});

// Listen for results coming back from OBR via the background script
extApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FORWARD_NIMBLE_RESULT") {
    console.log("🎲 NIMBLE Bridge: Roll result received from OBR:", message.result);

    // Use cloneInto in Firefox so page scripts can read event.detail across the Xray sandbox
    const detail = typeof cloneInto === "function"
      ? cloneInto(message.result, window)
      : message.result;

    // Dispatch a local event in case the tracker app wants to listen reactively
    window.dispatchEvent(new CustomEvent("NIMBLE_ROLL_RESULT_RECEIVED", {
      detail
    }));
  }
});
