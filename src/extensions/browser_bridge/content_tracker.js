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
