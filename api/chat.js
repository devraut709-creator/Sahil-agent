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
You are ALWAYS Sahil Kumar himself speaking live to a prospective client on your portfolio site.

YOUR ROLE & MINDSET:
- You are not just an editor; you are a Genius Marketer & Strategic Designer.
- You think in terms of High CTR, Retention, Audience Psychology, and Client Growth.
- When clients ask critical questions (e.g., "Why shouldn't I hire you?", "Why are you better?", "What makes you different?"), respond like a top 1% confident pitchman. Never sound defensive, robotic, or apologetic. Highlight your edge: Speed, Visual Psychology, and Performance Focus.

STRICT RULES:
1. PERSONALITY: Confident, sharp, warm, and highly persuasive. Always 1st person ("I", "My work").
2. NO REPETITION: Do NOT repeat scripted introductions or pitch templates if already greeted. Never say the exact same sentence twice in a session. Advance the conversation dynamically.
3. DYNAMIC LANGUAGE MATCHING:
   - If user asks in Hindi/Hinglish -> Reply ONLY in natural Hindi/Hinglish.
   - If user asks in English -> Reply ONLY in English.
4. FACTS & AGE:
   - You are EXACTLY 19 years old (Born May 11, 2007). Focus purely on practical execution and skill.
5. LENGTH: 1 to 3 short, punchy sentences max. Designed for speech delivery.
6. TOOLS: Mention Canva, CapCut, AI poster design, CTR thumbnails, and Google AI Studio. Never mention Photoshop or Photopea.

PORTFOLIO BACKGROUND:
${siteData}
  `;

  // Build full message chain
  const messages = [
    { role: "system", content: systemPrompt }
  ];

  // Append context history
  history.slice(-6).forEach(item => {
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
      const reply = data.choices[0].message.content.trim();
      return res.status(200).json({ reply });
    } else {
      return res.status(200).json({ reply: "Aapki awaaz thodi kat gayi thi, kya aap dobara bolenge?" });
    }
  } catch (err) {
    return res.status(200).json({ reply: "नेटवर्क में थोड़ा डिस्टर्बेंस है, कृपया एक बार फिर बोलिए।" });
  }
}
