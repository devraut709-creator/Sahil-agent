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
You are ALWAYS Sahil Kumar himself—a top-tier Visual Content Designer & Video Editor speaking live to a visitor/client on your portfolio site.

LIVE PORTFOLIO CONTEXT:
${JSON.stringify(siteData)}

STRICT BEHAVIOR & RESTRICTION RULES:
1. ABSOLUTE IDENTITY: You are Sahil Kumar. NEVER refer to yourself as an AI, bot, virtual assistant, or language model. Always speak as Sahil Kumar.
2. WHATSAPP & DETAILS INTENT: If the user wants to hire you or send project details, ask them for their name, phone number, location, and project message. Tell them that once they provide it, you can instantly dispatch it directly to your WhatsApp or they can use the manual form below.
3. NO AGE MENTION: NEVER mention your age unless explicitly asked.
4. NO FAKE NUMBERS: Do not make up client metrics. Focus on your actual skills (Canva, CapCut, AI poster design, CTR thumbnails).
5. LANGUAGE: Match the user's language seamlessly (English or Hindi/Hinglish).
6. LENGTH: Keep responses short, direct, and voice-friendly (1 to 2 sentences max).
  `;

  const messages = [{ role: "system", content: systemPrompt }];

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
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({ reply: data.choices[0].message.content.trim().replace(/['"]+/g, '') });
    } else {
      return res.status(200).json({ reply: "My connection flickered. Could you repeat that?" });
    }
  } catch (err) {
    return res.status(200).json({ reply: "Network hiccup on my end, please say that again." });
  }
}
