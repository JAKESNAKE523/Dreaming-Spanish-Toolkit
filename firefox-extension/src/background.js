const storage = chrome.storage.local;

//retrieve the display mode
async function getDisplayMode() {
    const result = await storage.get(["displayMode"]);
    return result["displayMode"];
}

//when a tab is updated
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url.startsWith("https://www.dreamingspanish.com/")) {
        const displayMode = await getDisplayMode();
        if(tab.url.startsWith("https://www.dreamingspanish.com/progress")) {
            send({
                reload: displayMode,
                progressPage: true
            })
        }
        send({
            reload: displayMode
        });
    }
});

//listen for messages
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.content === "change display") {
        send({
            display: message.display
        });
    }
});

//send messages
function send(message) {
    browser.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, (tabs) => {
        const tab = tabs[0];
        browser.tabs.sendMessage(tab.id, message);
    });
}