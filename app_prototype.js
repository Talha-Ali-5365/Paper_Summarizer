import axios from "axios";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

/*
   Reference: 
   - https://openrouter.ai/docs/api-reference/chat
   - https://openrouter.ai/docs/api-reference/chat/completions
    - https://www.npmjs.com/package/pdfjs-dist
    - https://www.npmjs.com/package/axios
    - https://nodejs.org/api/path.html
    - https://js.langchain.com/docs/integrations/document_loaders/web_loaders/pdf/ <3 Much love
*/

const API_KEY =
  "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";

const SYSTEM_PROMPT = `You are an expert academic research analyst. Your task is to provide a comprehensive analysis of research papers in a clear, structured format:

1. Title and Authors Overview
2. Key Research Objectives
3. Methodology
4. Main Findings
5. Significant Contributions
6. Practical Applications
7. Limitations and Future Work

Present the information in a way that both academics and general readers can understand.`;

// Function to get the analysis response from the AI model using axios
const get_response = async (inputText) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: inputText },
        ],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("API Response:", response.data);

    // Checking for the response format
    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else if (response.data.error) {
      throw new Error(`API Error: ${response.data.error.message}`);
    } else {
      throw new Error("No choices returned from API.");
    }
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
};

// Function to load PDF from a URL
async function loadPDF(url) {
  try {

    // Fetch the PDF file from the provided URL
    const response = await fetch(url);
    const data = await response.blob(); 
    const loader = new WebPDFLoader(data); 
    const docs = await loader.load(); 

    console.log({ docs }); 
    return docs;
  } catch (error) {
    console.error("Error loading PDF:", error);
    throw error;
  }
}

// Function to analyze the research paper using Langchain's PDFLoader
const summarize_paper = async (pdfUrl) => {
  try {
    console.log("Loading and extracting text from PDF...");

    // Loading the PDF from the provided URL
    const docs = await loadPDF(pdfUrl);

    // Combining the extracted text from all pages
    const extractedText = docs.map((doc) => doc.pageContent).join("\n");

    console.log("Text extracted from PDF:\n", extractedText);

    // Getting the analysis response from the AI model
    console.log("Summarizing...");
    const analysis = await get_response(
      `Analyze this research paper and provide a detailed summary:\n\n${extractedText}`
    );

    console.log("\nComplete!\n", analysis);
  } catch (error) {
    console.error("\nError:", error.message);
    process.exit(1);
  }
};

const pdfUrl = "https://arxiv.org/pdf/2501.18539";
summarize_paper(pdfUrl);
