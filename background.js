importScripts("config.js");


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkBias",
    title: "Check bias in selection",
    contexts: ["selection"]
  });
});

// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
//   if (info.menuItemId === "checkBias" && info.selectionText) {
//     const response = await performFactCheck(info.selectionText);
//     await chrome.storage.session.setItem("lastResult", response);
//   }
// });


function preprocessText(text, maxChars = 3500) {

  if (text.length <= maxChars) return text;

  const third = Math.floor(maxChars / 3);
  const beginning = text.slice(0, third);
  const middle = text.slice(
    Math.floor(text.length / 2) - third / 2,
    Math.floor(text.length / 2) + third / 2
  );
  const end = text.slice(-third);

  const fullText = `${beginning}\n\n[...]\n\n${middle}\n\n[...]\n\n${end}`
  console.log("helllo" + fullText + fullText.length)

  return fullText;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FACT_CHECK") {
    detectBias(message.text).then(sendResponse);
    return true;
  }
});

async function detectBias(text) {
    trimmed = preprocessText(text);
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            max_tokens: 10,
            temperature: 0.5,
            messages: [{
            role: "user",
            content: `Is there bias within this news source? Score 0-100 (0=completely biased, 100=completely unbiased). Source: "${trimmed}". Return ONLY an integer. `
            }]
        })
        });

        // add heres why section

        console.log("Response status:", response.status);

        const data = await response.json();

        console.log("Full response:", JSON.stringify(data));

        const raw = data.choices[0].message.content.trim();
        const score = parseInt(raw.match(/\d+/)?.[0] ?? "50", 10);

        console.log("score" + score);
        return { score: score };
    } catch (err) {
        return { score: "error" };
    }
}
