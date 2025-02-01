import axios from "axios";
import * as pdfjsLib from 'pdfjs-dist';

/*
   Reference: 
   - https://openrouter.ai/docs/api-reference/chat
   - https://openrouter.ai/docs/api-reference/chat/completions
    - https://www.npmjs.com/package/pdfjs-dist
    - https://www.npmjs.com/package/axios
    - https://nodejs.org/api/path.html
    - https://js.langchain.com/docs/integrations/document_loaders/web_loaders/pdf/ <3 Much love
*/

// Set worker path for PDF.js
const workerSrc = chrome.runtime.getURL('pdf.worker.min.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const GEMINI_API_KEY = "Your_Gemini_API_Key_Here";

const SYSTEM_PROMPT = `You are an expert academic research analyst. Your task is to provide a comprehensive analysis of research papers in a clear, structured format:

1. Title and Authors Overview
2. Key Research Objectives
3. Methodology
4. Main Findings
5. Significant Contributions
6. Practical Applications
7. Limitations and Future Work

Present the information in a way that both academics and general readers can understand.`;

// Simple rate limiting implementation
const rateLimiter = {
    lastCallTime: 0,
    minInterval: 10000, // 10 seconds between requests
    queue: [],
    isProcessing: false,

    async add(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.process();
        });
    },

    async process() {
        if (this.isProcessing || this.queue.length === 0) return;
        
        this.isProcessing = true;
        const now = Date.now();
        const timeToWait = Math.max(0, this.lastCallTime + this.minInterval - now);

        if (timeToWait > 0) {
            await new Promise(resolve => setTimeout(resolve, timeToWait));
        }

        const { fn, resolve, reject } = this.queue.shift();
        this.lastCallTime = Date.now();

        try {
            const result = await fn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.isProcessing = false;
            this.process();
        }
    }
};

// Function to get the analysis response from Gemini
const get_response = async (inputText) => {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-1219:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: SYSTEM_PROMPT + "\n\n" + inputText
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("API Response:", response.data);

        if (response.data.candidates && response.data.candidates.length > 0) {
            return response.data.candidates[0].content.parts[0].text;
        } else if (response.data.error) {
            throw new Error(response.data.error.message);
        } else {
            throw new Error("No response generated from API.");
        }
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
};

// Function to load PDF from a URL using PDF.js
async function loadPDF(url) {
    try {
        console.log("Loading PDF from URL:", url);
        console.log("Worker src:", workerSrc);
        
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText;
    } catch (error) {
        console.error("Error loading PDF:", error);
        throw error;
    }
}

// Function to analyze the research paper
export async function summarize_paper(pdfUrl) {
    try {
        console.log("Loading and extracting text from PDF...");

        // Loading the PDF from the provided URL
        const extractedText = await loadPDF(pdfUrl);
        console.log("Text extracted from PDF:\n", extractedText);

        // Split text into chunks if it's too long
        const maxChunkSize = 30000; // Gemini has a larger context window
        const chunks = [];
        for (let i = 0; i < extractedText.length; i += maxChunkSize) {
            chunks.push(extractedText.slice(i, i + maxChunkSize));
        }

        // Process each chunk and combine results
        console.log("Summarizing...");
        let combinedAnalysis = '';
        for (let i = 0; i < chunks.length; i++) {
            const chunkPrompt = i === 0 ? 
                `Analyze this research paper and provide a detailed summary:\n\n${chunks[i]}` :
                `Continue analyzing the paper with this additional section:\n\n${chunks[i]}`;
            
            const analysis = await rateLimiter.add(() => get_response(chunkPrompt));
            combinedAnalysis += (i === 0 ? analysis : '\n\n' + analysis);
        }

        console.log("\nComplete!\n", combinedAnalysis);
        return combinedAnalysis;
    } catch (error) {
        console.error("\nError:", error);
        throw error;
    }
}