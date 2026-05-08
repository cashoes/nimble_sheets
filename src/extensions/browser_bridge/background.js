// Background script to route messages from the Tracker tab to OBR tabs
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NIMBLE_ROLL") {
    // Find all Owlbear Rodeo tabs and forward the message
    chrome.tabs.query({ url: "*://*.owlbear.rodeo/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: "FORWARD_NIMBLE_ROLL",
          roll: message.roll
        }, () => {
            if (chrome.runtime.lastError) {
                // Silently ignore errors from tabs where content script isn't loaded/ready
            }
        });
      });
    });
  }
});
