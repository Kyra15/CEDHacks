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


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FACT_CHECK") {
    detectBias(message.text).then(sendResponse);
    return true;
  }
});

async function detectBias(text) {
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
        temperature: 0,
        messages: [{
          role: "user",
          content: `Is there bias within this news source? Give it a 'score' out of 100: 0 for completely biased opinion writing, and 100 for completely unbiased, true facts. Return only an integer from 0-100. Source: "${text}"`
        }]
      })
    });

    console.log("Response status:", response.status);

    const data = await response.json();

    console.log("Full response:", JSON.stringify(data));

    const score = data.choices[0].message.content.trim().toLowerCase();

    console.log("score" + score);
    return { score: score };
  } catch (err) {
    return { score: "error" };
  }
}