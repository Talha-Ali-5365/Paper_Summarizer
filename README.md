# Paper Summarizer Chrome Extension

A powerful Chrome extension that automatically summarizes academic papers from arXiv using Google's Gemini AI. Get structured, easy-to-understand summaries of complex research papers with just one click.

## Features

- 📄 **PDF Text Extraction**: Automatically extracts text from arXiv papers
- 🤖 **AI-Powered Summaries**: Uses Google's Gemini AI for high-quality, structured summaries
- 📝 **Markdown Formatting**: Clean, well-formatted summaries with proper headings and sections
- 🎯 **Structured Output**: Organized summaries covering:
  - Title and Authors Overview
  - Key Research Objectives
  - Methodology
  - Main Findings
  - Significant Contributions
  - Practical Applications
  - Limitations and Future Work
- 🖱️ **User-Friendly Interface**: 
  - Draggable popups
  - Loading animations
  - Clean, modern design
  - Easy paper selection

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Google Chrome browser

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd PaperSummarizer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder from your project directory

### API Key Setup

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Replace the API key in `src/app.js`:
   ```javascript
   const GEMINI_API_KEY = "your-api-key-here";
   ```

## Usage

1. Visit any paper on arXiv.org
2. The extension icon will appear in your Chrome toolbar
3. Click on a paper in the search results
4. Click "Summarize Selected Paper"
5. Wait for the summary to be generated
6. View the formatted summary in a draggable popup

## Development

### Project Structure
```
PaperSummarizer/
├── src/                    # Source code
│   ├── app.js             # Core functionality & API integration
│   ├── content.js         # UI/UX & content script
│   ├── popup.js           # Extension popup
│   └── background.js      # Background script
├── public/                # Static files
│   ├── manifest.json      # Extension configuration
│   ├── popup.html        # Popup interface
│   └── styles.css        # Global styles
├── package.json          # Dependencies & scripts
└── webpack.config.js     # Build configuration
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   This will watch for changes and rebuild automatically.

2. **Making Changes**
   - Edit files in the `src` directory
   - The extension will rebuild automatically
   - Refresh the extension in Chrome to see changes

3. **Building for Production**
   ```bash
   npm run build
   ```

### Debugging

- Check the Chrome console for errors
- Extension logs will appear in the console
- API response data is logged for debugging
- Check network requests for API calls

## Technical Details

### Core Components

1. **PDF Processing (app.js)**
   - Uses PDF.js for text extraction
   - Handles large documents by chunking
   - Manages API communication

2. **UI/UX (content.js)**
   - Creates and manages popups
   - Handles user interactions
   - Implements loading states
   - Formats summaries using markdown

3. **Extension Configuration (manifest.json)**
   - Permissions
   - Content scripts
   - Resource access

### Dependencies

- `pdf.js`: PDF text extraction
- `axios`: API requests
- `marked`: Markdown rendering
- `webpack`: Building and bundling

## Troubleshooting

### Common Issues

1. **Extension Not Loading**
   - Verify the `dist` folder exists
   - Check manifest.json for errors
   - Ensure Developer mode is enabled

2. **PDF Not Processing**
   - Check console for PDF.js errors
   - Verify file permissions
   - Ensure PDF URL is accessible

3. **API Errors**
   - Verify API key is correct
   - Check rate limits
   - Monitor network requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Submit a pull request
- Contact the maintainers

---

Built with ❤️ for researchers and students
