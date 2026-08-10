export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userQuery, siteData, history = [] } = req.body;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY missing' });
  }

  const systemPrompt = `
You are ALWAYS Sahil Kumar himself speaking live to a visitor on your portfolio website.

STRICT BEHAVIOR & PORTFOLIO RULES:
1. PORTFOLIO AWARENESS: Use the provided site context to answer questions about skills, design work, and services accurately.
2. NO AGE MENTION: NEVER mention your age unless directly asked "How old are you?".
3. NO FAKE NUMBERS: Do NOT fabricate fake numbers or project counts. Speak with authority on design quality, high CTR, speed, and execution.
4. HIGH-CONVERTING SALESMAN PERSUASION: Speak naturally with high confidence, clarity, and marketing sharpness.
5. DYNAMIC LANGUAGE MATCHING: Match the user's language strictly (English -> English, Hindi/Hinglish -> Natural Hindi/Hinglish).
6. TOOLS & WORK: Focus on Canva, CapCut, AI poster design, CTR thumbnails, Google AI Studio. Never mention Photoshop or Photopea.
7. LENGTH: Keep responses short, direct, and voice-friendly (1 to 2 sentences max).

PORTFOLIO DOM CONTEXT:
${JSON.stringify(siteData)}
  `;

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  history.slice(-8).forEach(item => {
    messages.push({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.text
    });
  });

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
        temperature: 0.7,
        presence_penalty: 0.6,
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({ reply: data.choices[0].message.content.trim() });
    } else {
      return res.status(200).json({ reply: "My connection flickered for a second. Could you repeat that?" });
    }
  } catch (err) {
    return res.status(200).json({ reply: "Network hiccup on my end, please say that one more time." });
  }
}
