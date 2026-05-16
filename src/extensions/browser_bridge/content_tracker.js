// Content script for the NIMBLE Tracker tab
console.log("NIMBLE Bridge: Tracker listener active");

window.addEventListener("NIMBLE_ROLL_EVENT", (event) => {
  const rollData = event.detail;
  
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      type: "NIMBLE_ROLL",
      roll: rollData
    });
  }
});

// Listen for results coming back from OBR via the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FORWARD_NIMBLE_RESULT") {
    console.log("🎲 NIMBLE Bridge: Roll result received from OBR:", message.result);
    
    // Dispatch a local event in case the tracker app wants to listen reactively
    window.dispatchEvent(new CustomEvent("NIMBLE_ROLL_RESULT_RECEIVED", {
      detail: message.result
    }));
  }
});
