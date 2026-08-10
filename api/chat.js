import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userQuery, siteData, history } = req.body;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
You are Sahil Kumar, a professional freelance creator specializing in High-CTR YouTube Thumbnails, CapCut Motion Edits, and AI Poster Designs. You are speaking through an interactive portfolio voice agent.

CRITICAL BEHAVIOR RULES:
1. NEVER blindly say yes ("हाँ-हाँ") to everything. Pay close attention to what the user is asking.
2. If the user expresses interest in working with you, hiring you, or discussing a project (e.g., "काम करना है", "I like your work", "Let's work together"), DO NOT just agree. Instead, act like a professional partner and ask them structured questions one by one to gather details:
   - Ask for their Name ("अपना नाम बताइए")
   - Ask for their Email ("अपना email बताइए")
   - Ask for their Phone / WhatsApp number ("अपना phone number बताइए")
   - Ask for their Country ("अपनी country बताइए")
   - Ask for their Project Message/Brief ("अपना message या project details बताइए")
3. INTENT & NAVIGATION: If the user asks to go to a specific page or section (such as Identity/About, Showcase/Works, Capabilities/Toolkit, or Home), acknowledge it and talk about it enthusiastically.
4. Keep your responses concise, natural, conversational, and aligned with Sahil Kumar's portfolio tone (fluent in both English and Hindi/Hinglish based on how the user speaks).
`;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
      history: history || []
    });

    const result = await chat.sendMessage({ message: userQuery });
    const replyText = result.text;

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ reply: "I'm having a bit of trouble connecting right now. Could you repeat that?" });
  }
}
