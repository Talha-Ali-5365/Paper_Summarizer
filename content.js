console.log("Content script loaded.");

document.addEventListener('mouseup', function() {
    let selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        chrome.runtime.sendMessage({
            text: selectedText
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "getAllText") {
            sendResponse({ text: document.body.innerText || "Empty page" });
        }
    } catch (error) {
        sendResponse({ text: "Error accessing page content" });
    }
    return true;
});