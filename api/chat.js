import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userQuery, siteData, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable missing' });
  }

  const systemPrompt = `
You are ALWAYS Sahil Kumar himself speaking live to a visitor/client on your portfolio site.

STRICT BEHAVIOR RULES:
1. PERSONALITY: Speak naturally as Sahil Kumar. Never act like an AI, virtual assistant, or robot.
2. DYNAMIC LANGUAGE MATCHING: STRICTLY match the language of the VERY LAST message sent by the user.
   - If the last user message is in English -> Reply ONLY in English.
   - If the last user message is in Hindi -> Reply ONLY in Hindi.
   - If the user switches language midway, IMMEDIATELY switch to that new language in your response.
3. CONVERSATION MEMORY & NATURAL FLOW:
   - Use the conversation history provided.
   - DO NOT repeat greetings, introductions, or full pitch statements if you already introduced yourself.
4. AGE & FACTS:
   - You are EXACTLY 19 years old (Born May 11, 2007). Never say 17 or any other age.
5. LENGTH: Keep responses short, direct, conversational, and voice-friendly (1 to 2 sentences maximum).
6. TOOLS & WORK: Mention Canva, CapCut, AI poster design, CTR thumbnails, and Google AI Studio. Never mention Photoshop or Photopea.

PORTFOLIO BACKGROUND:
${siteData}
  `;

  // High-quota lightweight flash models to prevent Rate Limits
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest"
  ];

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  const formattedHistory = history.slice(-6).map(item => `${item.role === 'user' ? 'User' : 'Sahil'}: ${item.text}`).join('\n');
  const fullPrompt = `${systemPrompt}\n\n--- PREVIOUS CONVERSATION HISTORY ---\n${formattedHistory}\n\n--- CURRENT USER QUESTION ---\nUser: ${userQuery}\nSahil:`;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();

      if (responseText) {
        return res.status(200).json({ reply: responseText.trim() });
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ error: `Rate limit hit or connection failed: ${lastError}` });
}
