async function sendQueryToSahilBackend(userText) {
      if (!isAgentActive) return;
      isAgentProcessing = true;
      const statusText = document.getElementById('voiceStatusText');
      if (statusText) statusText.innerText = 'Thinking...';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userQuery: userText, 
            siteData: extractPortfolioContext(), 
            history: sahilHistory 
          })
        });

        const data = await response.json();
        if (data.reply && isAgentActive) {
          sahilHistory.push({ role: 'user', text: userText });
          sahilHistory.push({ role: 'model', text: data.reply });
          
          // ROBUST SHORT & LONG KEYWORD INTENT & ACTION PARSER
          const q = userText.toLowerCase();

          // 1. Capabilities / Skills / Tools Intents
          const isCapIntent = q.includes('capabilities') || q.includes('capability') || q.includes('toolkit') || q.includes('skills') || q.includes('tools') || q.includes('cap') || q.includes('केपेबिलिटीज') || q.includes('स्किल');
          
          // 2. Identity / About Intents
          const isIdIntent = q.includes('identity') || q.includes('about') || q.includes('profile') || q.includes('intro') || q.includes('who are you') || q.includes('परिचय') || q.includes('बारे');
          
          // 3. Showcase / Works / Poster / Video Intents
          const isShowcaseIntent = q.includes('showcase') || q.includes('poster') || q.includes('thumbnail') || q.includes('video') || q.includes('works') || q.includes('work') || q.includes('portfolio') || q.includes('डिजाइन') || q.includes('पोस्टर') || q.includes('काम') || q.includes('थंबनेल');
          
          // 4. Connect / Project Discussion / WhatsApp / Details Intents (यह वो मुख्य हिस्सा है जो मिसिंग था)
          const isConnectIntent = q.includes('connect') || q.includes('contact') || q.includes('message') || q.includes('whatsapp') || q.includes('details') || q.includes('detail') || q.includes('project') || q.includes('hire') || q.includes('like your work') || q.includes('बिल्कुल') || q.includes('कंटेक्ट') || q.includes('मैसेज') || q.includes('डिटेल') || q.includes('प्रोजेक्ट') || q.includes('बात') || q.includes('पसंद');

          // 5. Home / Top Intents
          const isHomeIntent = q.includes('home') || q.includes('main') || q.includes('top') || q.includes('होमपेज') || q.includes('शुरुआत');

          // Executing Smooth Automatic Actions based on matched intent
          if (isCapIntent) {
            document.getElementById('capabilities').scrollIntoView({ behavior: 'smooth' });
          } else if (isIdIntent) {
            document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
          } else if (isShowcaseIntent) {
            document.getElementById('showcase').scrollIntoView({ behavior: 'smooth' });
          } else if (isConnectIntent) {
            document.getElementById('connect').scrollIntoView({ behavior: 'smooth' });
            // यदि क्लाइंट प्रोजेक्ट या डिटेल्स की बात कर रहा है, तो मैसेज बॉक्स में उसका इंटेंट भी हाईलाइट कर सकते हैं
            const msgBox = document.getElementById('user_message');
            if (msgBox) {
              msgBox.value = `Hi Sahil, we were just talking via your voice agent. Here are my project details: ${userText}`;
            }
          } else if (isHomeIntent) {
            document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
          }

          speakSahilReply(data.reply);
        }
      } catch (err) {
        isAgentProcessing = false;
        if (isAgentActive) startSahilListeningState();
      }
    }
