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
    `;

    let popupContent = `
        <h1 style="margin-top: 0;">Select a Paper to Process</h1>
        <div style="overflow-y: auto; max-height: calc(80vh - 120px); margin-bottom: 10px;">
            <form id="paper-selection-form">
                <div id="papers-container">
    `;

    papers.forEach(paper => {
        popupContent += `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                <input type="radio" name="paper" value="${paper.id}" id="paper-${paper.id}">
                <label for="paper-${paper.id}">
                    <strong>${paper.title}</strong><br>
                    <small>${paper.authors}</small>
                </label>
            </div>
        `;
    });

    popupContent += `
                </div>
            </form>
        </div>
        <button type="button" id="process-paper-btn" style="background: #4285f4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; position: sticky; bottom: 0; width: 100%;">
            Summarize Selected Paper
        </button>
    `;

    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

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