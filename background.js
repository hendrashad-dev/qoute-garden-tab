chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "plant-quote",
        title: "Plant this Quote",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "plant-quote" && info.selectionText) {
        const text = info.selectionText.trim();


        chrome.storage.local.set({ draftQuote: text }, () => {
            chrome.action.openPopup();
        });
    }
});
