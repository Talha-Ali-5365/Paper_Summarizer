import { summarize_paper } from './app.js';
import { marked } from 'marked';
console.log("Content script loaded.");

// Store settings globally for the content script
let extensionSettings = { model: 'gemini', apiKey: '' };

// Configure marked options
marked.setOptions({
    breaks: true,
    gfm: true,
    mangle: false,  // Disable mangling to remove deprecation warning
    headerIds: false  // Disable header IDs to remove deprecation warning
});

// Function to create loading popup
function createLoadingPopup() {
    const loadingPopup = document.createElement('div');
    loadingPopup.id = 'loading-popup';
    loadingPopup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
    `;

    loadingPopup.innerHTML = `
        <div class="loading-spinner" style="
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            margin: 0 auto 20px;
            animation: spin 1s linear infinite;
        "></div>
        <p style="margin: 0; color: #666;">Generating Summary...</p>
    `;

    // Add the spin animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Markdown Styles */
        .markdown-body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            word-wrap: break-word;
        }
        .markdown-body h1 { font-size: 2em; margin: 0.67em 0; }
        .markdown-body h2 { font-size: 1.5em; margin: 0.75em 0; }
        .markdown-body h3 { font-size: 1.25em; margin: 0.83em 0; }
        .markdown-body h4 { font-size: 1em; margin: 1.12em 0; }
        .markdown-body h5 { font-size: 0.83em; margin: 1.5em 0; }
        .markdown-body h6 { font-size: 0.75em; margin: 1.67em 0; }
        .markdown-body ul, .markdown-body ol {
            padding-left: 2em;
            margin: 1em 0;
        }
        .markdown-body li { margin: 0.25em 0; }
        .markdown-body p { margin: 1em 0; }
        .markdown-body code {
            padding: 0.2em 0.4em;
            background-color: rgba(27,31,35,0.05);
            border-radius: 3px;
            font-family: "SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace;
            font-size: 85%;
        }
        .markdown-body pre {
            padding: 16px;
            overflow: auto;
            line-height: 1.45;
            background-color: #f6f8fa;
            border-radius: 3px;
        }
        .markdown-body blockquote {
            padding: 0 1em;
            color: #6a737d;
            border-left: 0.25em solid #dfe2e5;
            margin: 1em 0;
        }
    `;
    document.head.appendChild(style);

    return loadingPopup;
}

// Function to create summary popup
function createSummaryPopup(summary) {
    const summaryPopup = document.createElement('div');
    summaryPopup.id = 'summary-popup';
    summaryPopup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 600px;
        max-height: 80vh;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
    `;

    summaryPopup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #333; font-size: 18px;">Paper Summary</h2>
            <button id="close-summary" style="
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                padding: 5px;
                color: #666;
            ">×</button>
        </div>
        <div class="markdown-body" style="
            overflow-y: auto;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            margin-right: -5px;
        ">${marked(summary)}</div>
    `;

    // Add close button functionality
    summaryPopup.querySelector('#close-summary').addEventListener('click', () => {
        summaryPopup.remove();
    });

    // Make the popup draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const header = summaryPopup.querySelector('div');
    header.style.cursor = 'move';

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            summaryPopup.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    function dragEnd() {
        isDragging = false;
    }

    return summaryPopup;
}

// Function to create settings popup
function createSettingsPopup() {
    const settingsPopup = document.createElement('div');
    settingsPopup.id = 'settings-popup';
    settingsPopup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;

    settingsPopup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 16px;">LLM Settings</h2>
            <button id="back-button" style="background: none; border: none; cursor: pointer; padding: 5px 10px;">← Back</button>
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Model:</label>
            <select id="model-select" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                <option value="gemini" ${extensionSettings.model === 'gemini' ? 'selected' : ''}>Gemini</option>
                <option value="deepseek" ${extensionSettings.model === 'deepseek' ? 'selected' : ''}>Deepseek R1</option>
                <option value="o3-mini" ${extensionSettings.model === 'o3-mini' ? 'selected' : ''}>O3-Mini</option>
            </select>
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">API Key:</label>
            <input type="password" id="api-key" value="${extensionSettings.apiKey || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        <button id="save-settings" style="
            background: #4285f4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
        ">Save Settings</button>
    `;

    // Add event listeners
    settingsPopup.querySelector('#back-button').addEventListener('click', () => {
        settingsPopup.remove();
        showPaperSelectionPopup();
    });

    settingsPopup.querySelector('#save-settings').addEventListener('click', () => {
        const model = settingsPopup.querySelector('#model-select').value;
        const apiKey = settingsPopup.querySelector('#api-key').value;
        
        if (!apiKey) {
            alert('Please enter an API key');
            return;
        }
        
        // Update global settings
        extensionSettings = { model, apiKey };
        
        // Save to chrome.storage
        chrome.storage.sync.set({
            llmSettings: extensionSettings
        }, () => {
            settingsPopup.remove();
            showPaperSelectionPopup();
        });
    });

    return settingsPopup;
}

// Function to show paper selection popup
function showPaperSelectionPopup() {
    const papers = [];
    document.querySelectorAll('.arxiv-result').forEach((result, index) => {
        const title = result.querySelector('.title').textContent;
        const authors = result.querySelector('.authors').textContent;
        const abstract = result.querySelector('.abstract-short').textContent;
        const link = result.querySelector('a[href*="abs"]').href;
        const pdfLink = result.querySelector('a[href*="/pdf/"]').href;
        
        papers.push({
            id: index,
            title,
            authors,
            abstract,
            link,
            pdfLink
        });
    });

    // Create and show the paper selection popup
    const popup = document.createElement('div');
    popup.id = 'paper-selection-popup';
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 15px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
    `;

    let popupContentHTML = `
        <div class="popup-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #f5f5f5; padding: 10px; border-radius: 8px 8px 0 0; cursor: move;">
            <h1 style="margin: 0; font-size: 16px;">Select a Paper to Process</h1>
            <div>
                <button id="settings-button" style="background: none; border: none; cursor: pointer; padding: 5px 10px; margin-right: 5px;">⚙️</button>
                <button id="close-selection" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 0 5px; color: #666;">×</button>
            </div>
        </div>
        <div id="popup-content" style="overflow-y: auto; max-height: calc(80vh - 120px); margin-bottom: 10px;">
            <form id="paper-selection-form">
                <div id="papers-container">
    `;

    papers.forEach(paper => {
        popupContentHTML += `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 4px; cursor: pointer;" onclick="this.querySelector('input').click()">
                <input type="radio" name="paper" value="${paper.id}" id="paper-${paper.id}">
                <label for="paper-${paper.id}">
                    <strong>${paper.title}</strong><br>
                    <small>${paper.authors}</small>
                </label>
            </div>
        `;
    });

    popupContentHTML += `
                </div>
            </form>
        </div>
        <button type="button" id="process-paper-btn" style="
            background: #4285f4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            position: sticky;
            bottom: 0;
            width: 100%;
            transition: background-color 0.2s;
        ">
            Summarize Selected Paper
        </button>
    `;

    popup.innerHTML = popupContentHTML;
    document.body.appendChild(popup);

    // Make the selection popup draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const header = popup.querySelector('.popup-header');
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.tagName.toLowerCase() === 'button') return;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            popup.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    function dragEnd() {
        isDragging = false;
    }

    // Add close button functionality
    popup.querySelector('#close-selection').addEventListener('click', () => {
        popup.remove();
    });

    // Add settings button functionality
    popup.querySelector('#settings-button').addEventListener('click', () => {
        popup.remove();
        chrome.storage.sync.get(['llmSettings'], (result) => {
            if (result.llmSettings) {
                extensionSettings = result.llmSettings;
            }
            const settingsPopup = createSettingsPopup();
            document.body.appendChild(settingsPopup);
        });
    });

    // Handle paper processing
    popup.querySelector('#process-paper-btn').addEventListener('click', async () => {
        const selectedPaper = popup.querySelector('input[name="paper"]:checked');
        if (!selectedPaper) {
            alert('Please select a paper first');
            return;
        }

        if (!extensionSettings.apiKey) {
            alert('Please configure your LLM settings first');
            return;
        }

        const paper = papers[selectedPaper.value];
        popup.remove();

        const loadingPopup = createLoadingPopup();
        document.body.appendChild(loadingPopup);

        try {
            const summary = await summarize_paper(paper.pdfLink, extensionSettings.model, extensionSettings.apiKey);
            loadingPopup.remove();
            
            const summaryPopup = createSummaryPopup(summary);
            document.body.appendChild(summaryPopup);
        } catch (error) {
            loadingPopup.remove();
            alert('Error generating summary: ' + error.message);
        }
    });
}

// Check if we're on an arXiv search results page
if (window.location.hostname === 'arxiv.org' && document.querySelector('.list-title')) {
    showPaperSelectionPopup();
}