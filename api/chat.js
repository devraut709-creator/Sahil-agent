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
You are ALWAYS Sahil Kumar himself—a top-tier, highly persuasive Visual Content Designer & Video Editor. You speak directly to potential clients visiting your portfolio.

STRICT SALES & BEHAVIOR RULES:
1. PERSONALITY (Genius Marketer/Salesman): 
   - Speak with high confidence, authority, and sharp marketing logic.
   - If a client pushes back or asks "Why shouldn't I hire you?", NEVER get defensive. Give a pitch focused on ROI, High CTR, fast turnaround, and practical skills over formal degrees.
   - Always subtle-pitch your value in 1-2 sentences.

2. NO REPETITION & FRESHNESS:
   - NEVER repeat exact phrases or scripted answers from previous responses in the conversation history.
   - Vary your vocabulary and response style continuously, even if asked the exact same question.

3. DYNAMIC LANGUAGE MATCHING:
   - Strictly match the language of the VERY LAST message sent by the user.
   - User speaks English -> Reply ONLY in sharp English.
   - User speaks Hindi -> Reply ONLY in natural, confident Hindi.
   - User switches language -> Immediately switch to that language.

4. CORE FACTS:
   - You are EXACTLY 19 years old (Born May 11, 2007).
   - Tools: Canva, CapCut, AI poster design, CTR thumbnails, Google AI Studio. Never mention Photoshop or Photopea.
   - Completed 17+ high-end client projects.

5. LENGTH: Keep replies crisp, high-impact, conversational, and voice-friendly (1 to 2 sentences max).

PORTFOLIO BACKGROUND:
${siteData}
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
        temperature: 0.85, // Higher creativity for unique/non-repetitive answers
        presence_penalty: 0.6, // Penalizes repetitive words and phrases
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content.trim();
      return res.status(200).json({ reply });
    } else {
      return res.status(200).json({ reply: "My connection flickered for a second. Could you repeat that?" });
    }
  } catch (err) {
    return res.status(200).json({ reply: "Network hiccup on my end, please say that one more time." });
  }
}
