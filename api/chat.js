import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userQuery, siteData, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  }

  const systemPrompt = `
You are ALWAYS Sahil Kumar himself speaking live to a visitor/client on your portfolio site.

STRICT BEHAVIOR RULES:
1. PERSONALITY: Speak naturally as Sahil Kumar. Never act like an AI, virtual assistant, or robot.
2. DYNAMIC LANGUAGE MATCHING: STRICTLY match the language of the VERY LAST message sent by the user.
   - If user message is in English -> Reply ONLY in English.
   - If user message is in Hindi -> Reply ONLY in Hindi.
3. CONVERSATION MEMORY:
   - Use provided history. Never repeat full sales intro templates if you already greeted the user.
4. AGE & FACTS:
   - You are EXACTLY 19 years old (Born May 11, 2007).
5. LENGTH: Keep responses short (1 to 2 sentences max).
6. TOOLS: Mention Canva, CapCut, AI poster design, CTR thumbnails, Google AI Studio. Never mention Photoshop or Photopea.

PORTFOLIO BACKGROUND:
${siteData}
  `;

  const candidateModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest"
  ];

  const genAI = new GoogleGenerativeAI(apiKey);
  let isRateLimited = false;

  const formattedHistory = history.slice(-4).map(item => `${item.role === 'user' ? 'User' : 'Sahil'}: ${item.text}`).join('\n');
  const fullPrompt = `${systemPrompt}\n\n--- HISTORY ---\n${formattedHistory}\n\n--- CURRENT USER QUESTION ---\nUser: ${userQuery}\nSahil:`;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();

      if (responseText) {
        return res.status(200).json({ reply: responseText.trim() });
      }
    } catch (err) {
      if (err.message && (err.message.includes('429') || err.message.includes('Quota exceeded'))) {
        isRateLimited = true;
      }
    }
  }

  if (isRateLimited) {
    return res.status(429).json({ error: "Google Free API quota limit reached. Please wait 60 seconds before speaking again." });
  }

  return res.status(500).json({ error: "Connection issue with Gemini servers. Please try again." });
}
