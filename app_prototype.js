import { ChatGroq } from "@langchain/groq";


/* refernce: 
- https://www.npmjs.com/package/@langchain/groq
- https://js.langchain.com/docs/integrations/chat/groq/
- https://v03.api.js.langchain.com/classes/_langchain_groq.ChatGroq.html
*/

const model = new ChatGroq({
  model: "deepseek-r1-distill-llama-70b",
  apiKey: "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",
});

// Summarize the input text using the specified summary type
const summarizeText = async (inputText, summaryType = "concise") => {
  try {
    const prompt = generatePrompt(inputText, summaryType);

    const response = await model.invoke(prompt);

    console.log("\nSummary:", response.content);
  } catch (error) {
    console.error("Error during summarization:", error);
  }
};

// Generate a prompt based on the input text and summary type
const generatePrompt = (inputText, summaryType) => {
  let prompt = `Summarize the following text:\n\n${inputText}\n\nSummary Type: ${summaryType}`;

  if (summaryType === "detailed") {
    prompt = `Provide a detailed summary of the following text:\n\n${inputText}`;
  } else if (summaryType === "concise") {
    prompt = `Provide a concise summary of the following text:\n\n${inputText}, reducing it to the most important points while maintaining clarity and coherence, MAX 50 WORDS.`;
  }

  return prompt;
};

const inputText = `Cats, scientifically known as Felis catus, have been captivating humans for thousands of years. These small, carnivorous mammals are beloved for their graceful movements, playful behaviors, and often quirky personalities. Domesticated around 9,000 years ago, cats originally served as skilled hunters, protecting grain supplies from rodents in ancient civilizations. Today, they are one of the most popular pets worldwide, cherished for their companionship and independent nature.

Cats are highly adaptable creatures, capable of thriving in diverse environments ranging from bustling urban settings to serene rural areas. Their physical characteristics, such as their lithe bodies, retractable claws, and acute senses, make them exceptional predators and fascinating animals to observe.

One of the most endearing qualities of cats is their playful behavior. From chasing laser pointers to batting at dangling strings, their curiosity and energy are infectious. Kittens, in particular, are bundles of joy, constantly exploring their surroundings and engaging in playful antics. This playful nature isn’t just entertaining; it’s a critical part of their development, helping them hone their hunting instincts and agility. Even adult cats retain a playful streak, often surprising their owners with spontaneous bursts of energy, commonly referred to as “zoomies.”

Another reason cats are so loved is their affectionate yet independent personalities. Unlike dogs, who are often eager to please, cats maintain a level of independence that many find intriguing. They may not always seek constant attention, but when a cat curls up on your lap or rubs against your leg, it feels incredibly special. These small gestures of affection are their way of showing trust and love. Additionally, their soothing purrs have been shown to have therapeutic effects on humans, reducing stress and anxiety while fostering a sense of calm.

Cats are also incredibly intelligent. They can learn tricks, navigate complex environments, and even communicate their needs through a combination of vocalizations, body language, and behaviors. Each cat has a unique personality; some are shy and reserved, while others are social butterflies, eager to interact with everyone they meet. This diversity in temperament makes every cat an individual, deepening the bond between them and their owners.

Physically, cats are marvels of nature. Their flexible spines and powerful hind legs allow them to leap great distances and land gracefully, thanks to their excellent balance and righting reflex. Their sharp claws and keen eyesight make them efficient hunters, even in low-light conditions. Additionally, their grooming habits keep them clean and free of parasites, which is one reason they are considered low-maintenance pets. However, this independence doesn’t mean they don’t require care; regular veterinary check-ups, a balanced diet, and mental stimulation are essential to their well-being.

Cats have also become cultural icons, inspiring art, literature, and even internet memes. From ancient Egyptian worship of feline deities to the global fame of internet stars like Grumpy Cat, their influence on human culture is undeniable. Whether they’re curled up in a sunbeam, perched on a windowsill, or causing mischief in the house, cats bring joy, comfort, and fascination to millions of people around the world. Their unique blend of charm, intelligence, and independence ensures that they will continue to be cherished companions for generations to come.`;

summarizeText(inputText, "concise");
