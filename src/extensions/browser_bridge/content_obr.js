// Content script for the Owlbear Rodeo tab
console.log("NIMBLE Bridge: OBR relay listener active");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FORWARD_NIMBLE_ROLL") {
    // 1. Send to the main window
    window.postMessage({
      type: "NIMBLE_ROLL_REQUEST",
      roll: message.roll
    }, "*");
    
    // 2. Send to immediate child iframes (this is where the Relay lives)
    // We do NOT do this recursively to prevent storms.
    for (let i = 0; i < window.frames.length; i++) {
        try {
            window.frames[i].postMessage({
                type: "NIMBLE_ROLL_REQUEST",
                roll: message.roll
            }, "*");
        } catch (e) {
            // cross-origin expected
        }
    }
  }
});

// Listen for results coming back FROM the relay iframe
window.addEventListener("message", (event) => {
    if (event.data?.type === "NIMBLE_ROLL_RESULT") {
        console.log("NIMBLE Bridge: Forwarding roll result to background script");
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                type: "NIMBLE_ROLL_RESULT",
                result: event.data.result
            });
        }
    }
});
