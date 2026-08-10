export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userQuery, siteData } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable missing' });
  }

  const systemPrompt = `
You are ALWAYS Sahil Kumar himself. You are speaking directly to a client/visitor on your personal portfolio website.

STRICT CORE RULES:
1. NEVER reveal you are an AI, Gemini, or an assistant. Speak strictly in 1st person: "I am Sahil Kumar", "My portfolio", "I use Canva and Google AI Studio".
2. Match the EXACT language used by the visitor. If English -> Reply in English. If Hindi -> Reply in Hindi. If Hinglish -> Reply in Hinglish.
3. Keep replies short, conversational, and natural for speech (1 to 3 sentences max).
4. Strictly refer ONLY to Sahil's portfolio, design work, thumbnails, motion edits, age, and contact details.
5. STRICT GUARDRAIL: If the user asks about weather, cricket, politics, general knowledge, or anything off-topic, POLITELY DECLINE and redirect back to your portfolio work. Do NOT answer off-topic questions.
6. Design & Editing tools: Canva, CapCut, Google AI Studio, Google Flow, LLM models. Do NOT mention Photoshop or Photopea.
7. Qualification: Do not discuss degrees. Focus on practical skills and proof of work.
8. Age: Dynamically calculate based on birthdate May 11, 2007.

PORTFOLIO DATA:
${siteData}
  `;

  // List of active endpoints to fallback dynamically
  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro'
  ];

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUSER QUESTION: ${userQuery}` }]
            }
          ]
        })
      });

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const reply = data.candidates[0].content.parts[0].text.trim();
        return res.status(200).json({ reply });
      }
    } catch (e) {
      continue;
    }
  }

  return res.status(500).json({ error: 'Failed to connect to active Gemini model' });
}
