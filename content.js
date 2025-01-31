console.log("Content script loaded.");

// Check if we're on an arXiv search results page
if (window.location.hostname === 'arxiv.org' && document.querySelector('.list-title')) {
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
        cursor: move;
    `;

    let popupContentHTML = `
        <div class="popup-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #f5f5f5; padding: 10px; border-radius: 8px 8px 0 0; cursor: move;">
            <h1 style="margin: 0; font-size: 16px;">Select a Paper to Process</h1>
            <button id="toggle-popup" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 0 5px; color: #666;">−</button>
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
        <button type="button" id="process-paper-btn" style="background: #4285f4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; position: sticky; bottom: 0; width: 100%; transition: background-color 0.2s;">
            Summarize Selected Paper
        </button>
    `;

    popup.innerHTML = popupContentHTML;
    document.body.appendChild(popup);

    // Make popup draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    popup.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.id === 'toggle-popup') return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === popup || e.target.closest('.popup-header')) {
            isDragging = true;
        }
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

    // Make popup collapsible
    const toggleBtn = document.getElementById('toggle-popup');
    // Update the variable name in the collapsible section
    const popupContentElement = document.getElementById('popup-content');
    let isCollapsed = false;

    toggleBtn.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        popupContentElement.style.display = isCollapsed ? 'none' : 'block';
        toggleBtn.textContent = isCollapsed ? '+' : '−';
        popup.style.maxHeight = isCollapsed ? 'auto' : '80vh';
    });

    // Handle paper selection
    document.getElementById('process-paper-btn').addEventListener('click', async () => {
        const selectedPaper = document.querySelector('input[name="paper"]:checked');
        if (selectedPaper) {
            const paperData = papers[parseInt(selectedPaper.value)];
            
            // Send message to get PDF content
            chrome.runtime.sendMessage({
                action: 'processPaper',
                paper: paperData
            });

            // Navigate to the PDF
            window.open(paperData.pdfLink, '_blank');
        }
    });
}