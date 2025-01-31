import fs from "fs";
import * as pdfjsLib from "pdfjs-dist";
import { ChatGroq } from "@langchain/groq";

// Initialize ChatGroq model
const model = new ChatGroq({
  model: "deepseek-r1-distill-llama-70b",
  apiKey: "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",
});

// Function to extract text using pdfjs-dist (with batch processing)
const extractTextFromPDF = async (filePath) => {
  const pdfData = new Uint8Array(fs.readFileSync(filePath));
  const pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise;

  let extractedText = "";
  const batchSize = 5; 
  for (let i = 0; i < pdfDocument.numPages; i += batchSize) {
    const pagePromises = [];
    for (let j = i; j < Math.min(i + batchSize, pdfDocument.numPages); j++) {
      pagePromises.push(pdfDocument.getPage(j + 1));
    }

    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      const textContent = await page.getTextContent();
      textContent.items.forEach((item) => {
        extractedText += item.str + " ";
      });
    }
  }

  return extractedText.trim();
};

// Summarization function with chunked input
const summarizeResearchPaper = async (inputText) => {
  try {
    const response = await model.invoke(`You are an advanced AI specializing in academic research. Summarize the following research paper\n\n${inputText}`);
    return response.content;
  } catch (error) {
    console.error("Error during summarization:", error);
  }
};

// Main process
const processPDF = async (filePath) => {
  try {
    console.log("Extracting text from PDF...");
    const extractedText = await extractTextFromPDF(filePath);

    console.log("Text extracted from PDF:\n", extractedText);
    console.log("Summarizing the research paper...");
    const fullSummary = await summarizeResearchPaper(extractedText);

    console.log("\nFinal Summary:\n", fullSummary);
  } catch (error) {
    console.error("Error processing PDF:", error);
  }
};

const researchPaperPath = "/Users/aaqibnazir/Documents/work/deep-seek-r1/test.pdf";
processPDF(researchPaperPath);