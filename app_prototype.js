import fs from "fs";
import * as PDFJS from "pdfjs-dist/legacy/build/pdf.mjs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

/*
   Reference: 
   - https://openrouter.ai/docs/api-reference/chat
   - https://openrouter.ai/docs/api-reference/chat/completions
    - https://www.npmjs.com/package/pdfjs-dist
    - https://www.npmjs.com/package/axios
    - https://nodejs.org/api/path.html
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Set the PDF.js worker path
const pdfWorkerPath = path.resolve(
  __dirname,
  "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
);

// Check if the PDF.js worker exists
if (fs.existsSync(pdfWorkerPath)) {
  PDFJS.GlobalWorkerOptions.workerSrc = pdfWorkerPath;
} 
// If the worker is not found, use the fake worker
else {
  console.warn("PDF.js worker not found at expected path, using fake worker");
  PDFJS.GlobalWorkerOptions.workerSrc = false; 
}

// Function to extract text from a PDF file
const extractTextFromPDF = async (filePath) => {
  try {
    const pdfData = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = PDFJS.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const pdfDocument = await loadingTask.promise;

    if (pdfDocument.numPages === 0) {
      throw new Error("PDF appears to be empty");
    }

    let extractedText = "";

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      extractedText += textContent.items.map((item) => item.str).join(" ");
    }

    return extractedText.trim();
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

// Function to stream the response from the AI model
const streamResponse = async (inputText) => {
  try {
    // Send PDF text to AI
    // Get streaming response back
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: inputText },
        ],
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`, 
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    // Process the streaming response in real-time
    process.stdout.write("\nGenerating analysis...\n\n");

    return new Promise((resolve, reject) => {
      let fullResponse = "";

      response.data.on("data", (chunk) => {
        try {
          const lines = chunk
            .toString()
            .split("\n")
            .filter((line) => line.trim() !== "");
          for (const line of lines) {
            if (line.includes("[DONE]")) continue;
            const parsed = JSON.parse(line.replace("data: ", ""));
            if (parsed.choices[0].delta.content) {
              const content = parsed.choices[0].delta.content;
              process.stdout.write(content);
              fullResponse += content;
            }
          }
        } catch (e) {
        }
      });

      response.data.on("end", () => resolve(fullResponse));
      response.data.on("error", reject);
    });
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
};

// Main function to analyze a research paper
const analyzePaper = async (filePath) => {
  try {
    console.log("Reading and extracting text from PDF...");
    const extractedText = await extractTextFromPDF(filePath);

    console.log("Starting analysis...");
    await streamResponse(
      `Analyze this research paper and provide a detailed summary:\n\n${extractedText}`
    );

    console.log("\n\nAnalysis complete!\n");
  } catch (error) {
    console.error("\nError:", error.message);
    process.exit(1);
  }
};

const filePath = "/Users/aaqibnazir/Documents/work/deep-seek-r1/test.pdf";
analyzePaper(filePath);
