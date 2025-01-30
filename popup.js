// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current active tab in Chrome (or Chromium) browser.
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error('No active tab');

        // Request text content from content script.
        const response = await chrome.tabs.sendMessage(tab.id, { action: "getAllText" });
        const textElement = document.getElementById('selectedText');
        
        // Display retrieved text or fallback message.
        if (response && response.text) {
            textElement.textContent = response.text;
        }
        else {
            textElement.textContent = "No text found on this page.";
        }
    } 
    catch (error) {
        document.getElementById('selectedText').textContent = 
            "Please refresh the page and try again.";
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.text)
    {
        document.getElementById('selectedText').textContent = message.text;
    }
});