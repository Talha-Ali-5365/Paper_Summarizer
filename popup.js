// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup initialized');
});

// Listen for paper processing messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'processPaper') {
        console.log('Processing paper:', message.paper);
        // Add your paper processing logic here
    }
});