import { summarize_paper } from './app.js';
import { marked } from 'marked';
console.log("Content script loaded.");

// Store settings globally for the content script
let extensionSettings = { 
    model: 'gemini', 
    apiKey: '', 
    autoThinking: true, 
    thinkingBudget: 16384, // Gemini 2.5 Flash default
    darkMode: false
};

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
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'};
        border: none;
        border-radius: 20px;
        padding: 40px;
        z-index: 10000;
        box-shadow: 0 25px 50px rgba(0,0,0,${extensionSettings.darkMode ? '0.4' : '0.2'}), 0 0 0 1px rgba(255,255,255,${extensionSettings.darkMode ? '0.1' : '0.5'});
        text-align: center;
        backdrop-filter: blur(10px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    loadingPopup.innerHTML = `
        <div style="
            width: 80px;
            height: 80px;
            border: 6px solid ${extensionSettings.darkMode ? '#4a5568' : '#f3f4f6'};
            border-top: 6px solid ${extensionSettings.darkMode ? '#63b3ed' : '#4facfe'};
            border-radius: 50%;
            margin: 0 auto 24px;
            animation: spin 1s linear infinite;
            position: relative;
        ">
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 24px;
            ">🧠</div>
        </div>
        <h3 style="
            margin: 0 0 8px 0; 
            color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
            font-size: 20px;
            font-weight: 600;
        ">Analyzing Paper</h3>
        <p style="
            margin: 0; 
            color: ${extensionSettings.darkMode ? '#a0aec0' : '#718096'};
            font-size: 14px;
            line-height: 1.5;
        ">Using AI to extract key insights and generate a comprehensive summary...</p>
        <div style="
            margin-top: 20px;
            padding: 12px 20px;
            background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : 'linear-gradient(135deg,rgb(139, 44, 44) 0%,rgb(134, 2, 2) 100%)'};
            border-radius: 8px;
            color: white;
            font-size: 12px;
            font-weight: 600;
        ">This may take 30-60 seconds</div>
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
            font-size: 15px;
            line-height: 1.7;
            word-wrap: break-word;
            color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
        }
        .markdown-body h1 { 
            font-size: 2.2em; 
            margin: 0.67em 0; 
            color: ${extensionSettings.darkMode ? '#f7fafc' : '#1a202c'};
            font-weight: 700;
            border-bottom: 3px solid ${extensionSettings.darkMode ? '#63b3ed' : '#4facfe'};
            padding-bottom: 0.3em;
        }
        .markdown-body h2 { 
            font-size: 1.8em; 
            margin: 0.75em 0; 
            color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
            font-weight: 600;
            border-bottom: 2px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'};
            padding-bottom: 0.3em;
        }
        .markdown-body h3 { 
            font-size: 1.4em; 
            margin: 0.83em 0; 
            color: ${extensionSettings.darkMode ? '#cbd5e0' : '#4a5568'};
            font-weight: 600;
        }
        .markdown-body h4 { 
            font-size: 1.1em; 
            margin: 1.12em 0; 
            color: ${extensionSettings.darkMode ? '#a0aec0' : '#718096'};
            font-weight: 600;
        }
        .markdown-body h5 { font-size: 0.9em; margin: 1.5em 0; font-weight: 600; }
        .markdown-body h6 { font-size: 0.8em; margin: 1.67em 0; font-weight: 600; }
        .markdown-body ul, .markdown-body ol {
            padding-left: 2em;
            margin: 1.2em 0;
        }
        .markdown-body li { 
            margin: 0.5em 0; 
            line-height: 1.6;
        }
        .markdown-body p { 
            margin: 1.2em 0; 
            line-height: 1.7;
        }
        .markdown-body code {
            padding: 0.3em 0.5em;
            background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'};
            border-radius: 6px;
            font-family: "SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace;
            font-size: 0.9em;
            border: 1px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'};
        }
        .markdown-body pre {
            padding: 20px;
            overflow: auto;
            line-height: 1.5;
            background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'};
            border-radius: 12px;
            border: 1px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'};
            margin: 1.5em 0;
        }
        .markdown-body blockquote {
            padding: 0 1.2em;
            color: ${extensionSettings.darkMode ? '#a0aec0' : '#718096'};
            border-left: 4px solid ${extensionSettings.darkMode ? '#63b3ed' : '#4facfe'};
            margin: 1.5em 0;
            background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #f7fafc 0%, #ffffff 100%)'};
            border-radius: 0 8px 8px 0;
            padding: 1em 1.2em;
        }
        .markdown-body strong {
            color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
            font-weight: 600;
        }
        .markdown-body em {
            color: ${extensionSettings.darkMode ? '#cbd5e0' : '#4a5568'};
            font-style: italic;
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
        width: 700px;
        max-height: 90vh;
        background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'};
        border: none;
        border-radius: 20px;
        padding: 0;
        z-index: 10000;
        box-shadow: 0 25px 50px rgba(0,0,0,${extensionSettings.darkMode ? '0.4' : '0.2'}), 0 0 0 1px rgba(255,255,255,${extensionSettings.darkMode ? '0.1' : '0.5'});
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(10px);
    `;

    summaryPopup.innerHTML = `
        <div style="
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 24px 24px 16px 24px;
            background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
            border-radius: 20px 20px 0 0;
            color: white;
            cursor: move;
        ">
            <h2 style="
                margin: 0; 
                color: white; 
                font-size: 20px; 
                font-weight: 600;
                display: flex;
                align-items: center;
            ">
                <span style="margin-right: 12px; font-size: 24px;">📋</span>
                Paper Summary
            </h2>
            <button id="close-summary" style="
                background: rgba(255,255,255,0.2);
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 8px;
                color: white;
                font-size: 18px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
        </div>
        <div class="markdown-body" style="
            overflow-y: auto;
            padding: 32px;
            background: ${extensionSettings.darkMode ? '#1a202c' : 'white'};
            border-radius: 0 0 20px 20px;
            margin: 0;
            flex: 1;
            line-height: 1.7;
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
        width: 450px;
        background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'};
        border: none;
        border-radius: 16px;
        padding: 0;
        z-index: 10000;
        box-shadow: 0 20px 40px rgba(0,0,0,${extensionSettings.darkMode ? '0.4' : '0.15'}), 0 0 0 1px rgba(255,255,255,${extensionSettings.darkMode ? '0.1' : '0.5'});
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(10px);
    `;

    settingsPopup.innerHTML = `
        <div style="
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 24px 24px 16px 24px;
            background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
            border-radius: 16px 16px 0 0;
            color: white;
            cursor: move;
        ">
            <h2 style="margin: 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                <span style="margin-right: 12px; font-size: 24px;">⚙️</span>
                LLM Settings
            </h2>
            <button id="back-button" style="
                background: rgba(255,255,255,0.2);
                border: none;
                cursor: pointer;
                padding: 8px 16px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                ← Back
            </button>
        </div>
        
        <div style="padding: 24px;">
            <div style="margin-bottom: 24px;">
                <label style="
                    display: block; 
                    margin-bottom: 8px; 
                    font-weight: 600; 
                    color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
                    font-size: 14px;
                ">Model Provider</label>
                <select id="model-select" style="
                    width: 100%; 
                    padding: 12px 16px; 
                    border: 2px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'}; 
                    border-radius: 12px;
                    font-size: 14px;
                    background: ${extensionSettings.darkMode ? '#2d3748' : 'white'};
                    color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
                    transition: all 0.2s ease;
                    appearance: none;
                    background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"${extensionSettings.darkMode ? '%23e2e8f0' : '%23666'}\" d=\"M2 0L0 2h4zm0 5L0 3h4z\"/></svg>');
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    background-size: 12px;
                " onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102,126,234,0.1)'" onblur="this.style.borderColor='${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'}'; this.style.boxShadow='none'">
                    <option value="gemini" ${extensionSettings.model === 'gemini' ? 'selected' : ''}>🧠 Gemini 2.5 Flash</option>
                    <option value="o4-mini" ${extensionSettings.model === 'o4-mini' ? 'selected' : ''}>🚀 o4-mini</option>
                    <option value="deepseek" ${extensionSettings.model === 'deepseek' ? 'selected' : ''}>🔍 Deepseek R1</option>
                </select>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="
                    display: block; 
                    margin-bottom: 8px; 
                    font-weight: 600; 
                    color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
                    font-size: 14px;
                ">API Key</label>
                <input type="password" id="api-key" value="${extensionSettings.apiKey || ''}" placeholder="Enter your API key..." style="
                    width: 100%; 
                    padding: 12px 16px; 
                    border: 2px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'}; 
                    border-radius: 12px;
                    font-size: 14px;
                    background: ${extensionSettings.darkMode ? '#2d3748' : 'white'};
                    color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
                    transition: all 0.2s ease;
                " onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102,126,234,0.1)'" onblur="this.style.borderColor='${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'}'; this.style.boxShadow='none'">
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="
                    display: block; 
                    margin-bottom: 12px; 
                    font-weight: 600; 
                    color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
                    font-size: 14px;
                ">🌙 Theme</label>
                
                <div style="
                    background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'};
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'};
                ">
                    <label style="
                        display: flex; 
                        align-items: center; 
                        cursor: pointer;
                        user-select: none;
                    ">
                        <input type="checkbox" id="dark-mode" ${extensionSettings.darkMode ? 'checked' : ''} style="
                            margin-right: 12px;
                            width: 18px;
                            height: 18px;
                            accent-color: #667eea;
                            cursor: pointer;
                        ">
                        <span style="font-weight: 500; color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};">Dark Mode</span>
                        <span style="margin-left: 8px; font-size: 18px;">${extensionSettings.darkMode ? '🌙' : '☀️'}</span>
                    </label>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="
                    display: block; 
                    margin-bottom: 12px; 
                    font-weight: 600; 
                    color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
                    font-size: 14px;
                ">🧠 Thinking Budget (Gemini only)</label>
                
                <div style="
                    background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'};
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                    border: 1px solid ${extensionSettings.darkMode ? '#63b3ed' : '#4facfe'};
                ">
                    <div style="
                        font-size: 12px;
                        color: ${extensionSettings.darkMode ? '#cbd5e0' : '#4a5568'};
                        line-height: 1.4;
                    ">
                        💡 <strong style="color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};">Auto (-1):</strong> Dynamic thinking adapts budget automatically<br>
                        📊 <strong style="color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};">Manual (0-24576):</strong> Fixed thinking budget for consistent behavior<br>
                        🚫 <strong style="color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};">Off (0):</strong> Disables thinking completely
                    </div>
                </div>
                
                <div style="
                    background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'};
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'};
                ">
                    <label style="
                        display: flex; 
                        align-items: center; 
                        margin-bottom: 16px;
                        cursor: pointer;
                        user-select: none;
                    ">
                        <input type="checkbox" id="auto-thinking" ${extensionSettings.autoThinking !== false ? 'checked' : ''} style="
                            margin-right: 12px;
                            width: 18px;
                            height: 18px;
                            accent-color: #667eea;
                            cursor: pointer;
                        ">
                        <span style="font-weight: 500; color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};">Auto (Dynamic thinking: -1)</span>
                        <span style="
                            margin-left: 8px;
                            background: #667eea;
                            color: white;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: 600;
                        ">RECOMMENDED</span>
                    </label>
                    
                    <div id="thinking-budget-controls" style="
                        transition: all 0.3s ease;
                        ${extensionSettings.autoThinking !== false ? 'opacity: 0.4; pointer-events: none;' : 'opacity: 1;'}
                    ">
                        <div style="margin-bottom: 12px;">
                            <input type="range" id="thinking-budget-slider" min="0" max="24576" value="${extensionSettings.thinkingBudget || 16384}" style="
                                width: 100%; 
                                height: 8px;
                                background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
                                border-radius: 4px;
                                outline: none;
                                -webkit-appearance: none;
                                appearance: none;
                            ">
                        </div>
                        
                        <div style="
                            display: flex; 
                            justify-content: space-between; 
                            font-size: 11px; 
                            color: ${extensionSettings.darkMode ? '#a0aec0' : '#718096'}; 
                            margin-bottom: 12px;
                            font-weight: 500;
                        ">
                            <span>0 (Off)</span>
                            <span id="current-budget-display" style="
                                background: #667eea;
                                color: white;
                                padding: 2px 8px;
                                border-radius: 8px;
                                font-weight: 600;
                            ">${extensionSettings.thinkingBudget || 16384}</span>
                            <span>24576 (Max)</span>
                        </div>
                        
                        <input type="number" id="thinking-budget-input" min="0" max="24576" value="${extensionSettings.thinkingBudget || 16384}" style="
                            width: 100%; 
                            padding: 8px 12px; 
                            border: 2px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'}; 
                            border-radius: 8px; 
                            font-size: 13px;
                            text-align: center;
                            font-weight: 600;
                            background: ${extensionSettings.darkMode ? '#2d3748' : 'white'};
                            color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
                            transition: all 0.2s ease;
                        " onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102,126,234,0.1)'" onblur="this.style.borderColor='${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'}'; this.style.boxShadow='none'">
                    </div>
                </div>
            </div>
            
            <button id="save-settings" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 14px 24px;
                border-radius: 12px;
                cursor: pointer;
                width: 100%;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.2s ease;
                box-shadow: 0 4px 15px rgba(102,126,234,0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102,126,234,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102,126,234,0.3)'">
                💾 Save Settings
            </button>
        </div>
    `;

    // Add event listeners
    settingsPopup.querySelector('#back-button').addEventListener('click', () => {
        settingsPopup.remove();
        showPaperSelectionPopup();
    });

    // Auto thinking checkbox handler
    const autoThinkingCheckbox = settingsPopup.querySelector('#auto-thinking');
    const thinkingBudgetControls = settingsPopup.querySelector('#thinking-budget-controls');
    
    autoThinkingCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            thinkingBudgetControls.style.opacity = '0.4';
            thinkingBudgetControls.style.pointerEvents = 'none';
        } else {
            thinkingBudgetControls.style.opacity = '1';
            thinkingBudgetControls.style.pointerEvents = 'auto';
        }
    });

    // Dark mode toggle handler
    const darkModeCheckbox = settingsPopup.querySelector('#dark-mode');
    darkModeCheckbox.addEventListener('change', (e) => {
        extensionSettings.darkMode = e.target.checked;
        // Recreate the popup with new theme
        settingsPopup.remove();
        const newSettingsPopup = createSettingsPopup();
        document.body.appendChild(newSettingsPopup);
    });

    // Sync slider and number input with live display
    const slider = settingsPopup.querySelector('#thinking-budget-slider');
    const numberInput = settingsPopup.querySelector('#thinking-budget-input');
    const budgetDisplay = settingsPopup.querySelector('#current-budget-display');
    
    slider.addEventListener('input', (e) => {
        numberInput.value = e.target.value;
        budgetDisplay.textContent = e.target.value;
    });
    
    numberInput.addEventListener('input', (e) => {
        slider.value = e.target.value;
        budgetDisplay.textContent = e.target.value;
    });

    // Make header draggable
    const header = settingsPopup.querySelector('div');
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName.toLowerCase() === 'button') return;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            settingsPopup.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    settingsPopup.querySelector('#save-settings').addEventListener('click', () => {
        const model = settingsPopup.querySelector('#model-select').value;
        const apiKey = settingsPopup.querySelector('#api-key').value;
        const autoThinking = settingsPopup.querySelector('#auto-thinking').checked;
        const thinkingBudget = parseInt(settingsPopup.querySelector('#thinking-budget-input').value);
        const darkMode = settingsPopup.querySelector('#dark-mode').checked;
        
        if (!apiKey) {
            // Create a better styled alert
            const alertDiv = document.createElement('div');
            alertDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(255,107,107,0.3);
                z-index: 10001;
                font-weight: 600;
                font-size: 16px;
            `;
            alertDiv.textContent = '⚠️ Please enter an API key';
            document.body.appendChild(alertDiv);
            setTimeout(() => alertDiv.remove(), 3000);
            return;
        }
        
        // Update global settings
        extensionSettings = { model, apiKey, autoThinking, thinkingBudget, darkMode };
        
        // Save to chrome.storage
        chrome.storage.sync.set({
            llmSettings: extensionSettings
        }, () => {
            // Show success message
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(72,187,120,0.3);
                z-index: 10001;
                font-weight: 600;
                font-size: 16px;
            `;
            successDiv.textContent = '✅ Settings saved successfully!';
            document.body.appendChild(successDiv);
            setTimeout(() => successDiv.remove(), 2000);
            
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
        width: 500px;
        max-height: 85vh;
        background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'};
        border: none;
        border-radius: 16px;
        padding: 0;
        z-index: 10000;
        box-shadow: 0 20px 40px rgba(0,0,0,${extensionSettings.darkMode ? '0.4' : '0.15'}), 0 0 0 1px rgba(255,255,255,${extensionSettings.darkMode ? '0.1' : '0.5'});
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(10px);
    `;

    let popupContentHTML = `
        <div class="popup-header" style="
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 24px 24px 16px 24px;
            background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : 'linear-gradient(135deg,rgb(172, 52, 52) 0%,rgb(165, 0, 0) 100%)'};
            border-radius: 16px 16px 0 0;
            color: white;
            cursor: move;
        ">
            <h1 style="
                margin: 0; 
                font-size: 20px; 
                font-weight: 600;
                display: flex;
                align-items: center;
            ">
                <span style="margin-right: 12px; font-size: 24px;">📄</span>
                Select a Paper to Process
            </h1>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button id="settings-button" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    color: white;
                    font-size: 18px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">⚙️</button>
                <button id="close-selection" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    color: white;
                    font-size: 18px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
            </div>
        </div>
        
        <div id="popup-content" style="
            overflow-y: auto; 
            max-height: calc(85vh - 140px); 
            padding: 16px 24px;
            flex: 1;
        ">
            <form id="paper-selection-form">
                <div id="papers-container">
    `;

    papers.forEach((paper, index) => {
        popupContentHTML += `
            <div style="
                margin-bottom: 16px; 
                padding: 20px; 
                border: 2px solid ${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'}; 
                border-radius: 12px; 
                cursor: pointer;
                transition: all 0.2s ease;
                background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'};
                position: relative;
                overflow: hidden;
            " 
            onclick="this.querySelector('input').click()"
            onmouseover="this.style.borderColor='${extensionSettings.darkMode ? '#63b3ed' : '#4facfe'}'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(${extensionSettings.darkMode ? '99,179,237' : '79,172,254'},0.15)'"
            onmouseout="this.style.borderColor='${extensionSettings.darkMode ? '#4a5568' : '#e2e8f0'}'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <input type="radio" name="paper" value="${paper.id}" id="paper-${paper.id}" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 20px;
                    height: 20px;
                    accent-color: ${extensionSettings.darkMode ? '#63b3ed' : '#4facfe'};
                    cursor: pointer;
                ">
                <div style="margin-right: 40px;">
                    <div style="
                        font-weight: 600;
                        color: ${extensionSettings.darkMode ? '#e2e8f0' : '#2d3748'};
                        font-size: 16px;
                        line-height: 1.4;
                        margin-bottom: 8px;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    ">${paper.title}</div>
                    <div style="
                        color: ${extensionSettings.darkMode ? '#a0aec0' : '#718096'};
                        font-size: 13px;
                        font-weight: 500;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                    ">
                        <span style="margin-right: 8px;">👥</span>
                        ${paper.authors}
                    </div>
                    <div style="
                        color: ${extensionSettings.darkMode ? '#cbd5e0' : '#4a5568'};
                        font-size: 12px;
                        line-height: 1.4;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        opacity: 0.8;
                    ">${paper.abstract}</div>
                </div>
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' : 'linear-gradient(135deg,rgb(121, 37, 37) 0%,rgb(117, 1, 1) 100%)'};
                    opacity: 0;
                    transition: opacity 0.2s ease;
                " class="paper-accent"></div>
            </div>
        `;
    });

    popupContentHTML += `
                </div>
            </form>
        </div>
        
        <div style="padding: 24px; padding-top: 16px;">
            <button type="button" id="process-paper-btn" style="
                background: ${extensionSettings.darkMode ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : 'linear-gradient(135deg,rgb(138, 42, 42) 0%,rgb(121, 0, 0) 100%)'};
                color: white;
                border: none;
                padding: 16px 24px;
                border-radius: 12px;
                cursor: pointer;
                width: 100%;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.2s ease;
                box-shadow: 0 4px 15px rgba(${extensionSettings.darkMode ? '74,85,104' : '79,172,254'},0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(${extensionSettings.darkMode ? '74,85,104' : '254,79,79'}, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(${extensionSettings.darkMode ? '74,85,104' : '254,79,79'}, 0.3)'">
                <span>🚀</span>
                Summarize Selected Paper
            </button>
        </div>
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
                extensionSettings = {
                    model: result.llmSettings.model || 'gemini',
                    apiKey: result.llmSettings.apiKey || '',
                    autoThinking: result.llmSettings.autoThinking !== false,
                    thinkingBudget: result.llmSettings.thinkingBudget || 16384,
                    darkMode: result.llmSettings.darkMode || false
                };
            }
            const settingsPopup = createSettingsPopup();
            document.body.appendChild(settingsPopup);
        });
    });

    // Handle paper processing
    popup.querySelector('#process-paper-btn').addEventListener('click', async () => {
        const selectedPaper = popup.querySelector('input[name="paper"]:checked');
        if (!selectedPaper) {
            alert('Please select a paper first!');
            return;
        }

        if (!extensionSettings.apiKey) {
            alert('Please configure your LLM settings first!');
            return;
        }

        const paper = papers[selectedPaper.value];
        popup.remove();

        const loadingPopup = createLoadingPopup();
        document.body.appendChild(loadingPopup);

        try {
            const summary = await summarize_paper(
                paper.pdfLink, 
                extensionSettings.model, 
                extensionSettings.apiKey,
                extensionSettings.autoThinking,
                extensionSettings.thinkingBudget
            );
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