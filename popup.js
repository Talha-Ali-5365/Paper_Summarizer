// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    async function tryGetText(retryCount = 0) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) throw new Error('No active tab');

            // Inject content script if not already present
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            const response = await chrome.tabs.sendMessage(tab.id, { action: "getAllText" });
            const textElement = document.getElementById('selectedText');
            
            if (response && response.text) {
                textElement.textContent = response.text;
            } else {
                textElement.textContent = "No text found on this page.";
            }
        } catch (error) {
            if (retryCount < maxRetries) {
                setTimeout(() => tryGetText(retryCount + 1), retryDelay);
            } else {
                document.getElementById('selectedText').textContent = 
                    "Unable to access page content. Please refresh and try again.";
            }
        }
    }

    tryGetText();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.text)
    {
        document.getElementById('selectedText').textContent = message.text;
    }
});