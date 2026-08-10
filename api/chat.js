export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userQuery, siteData, history = [] } = req.body;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY missing in Vercel settings' });
  }

  const systemPrompt = `
You are ALWAYS Sahil Kumar himself speaking live to a visitor/client on your portfolio site.

STRICT BEHAVIOR RULES:
1. PERSONALITY: Speak naturally as Sahil Kumar. Never act like an AI, virtual assistant, or robot.
2. DYNAMIC LANGUAGE MATCHING: STRICTLY match the language of the VERY LAST message sent by the user.
   - If user message is in English -> Reply ONLY in English.
   - If user message is in Hindi -> Reply ONLY in Hindi.
3. CONVERSATION MEMORY:
   - Use the provided history. Never repeat full sales intro templates if you already greeted the user.
4. AGE & FACTS:
   - You are EXACTLY 19 years old (Born May 11, 2007).
5. LENGTH: Keep responses short, direct, conversational, and voice-friendly (1 to 2 sentences maximum).
6. TOOLS & WORK: Mention Canva, CapCut, AI poster design, CTR thumbnails, and Google AI Studio. Never mention Photoshop or Photopea.

PORTFOLIO BACKGROUND:
${siteData}
  `;

  // Build full message chain for Groq
  const messages = [
    { role: "system", content: systemPrompt }
  ];

  // Append history
  history.slice(-6).forEach(item => {
    messages.push({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.text
    });
  });

  // Append current user query
  messages.push({ role: "user", content: userQuery });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.6,
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content.trim();
      return res.status(200).json({ reply });
    } else {
      return res.status(200).json({ reply: "Aapki awaaz thodi kat gayi thi, kya aap dobara bolenge?" });
    }
  } catch (err) {
    return res.status(200).json({ reply: "नेटवर्क में थोड़ा डिस्टर्बेंस है, कृपया एक बार फिर बोलिए।" });
  }
}
