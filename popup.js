document.querySelector("button").addEventListener("click", async () => {
    const button = document.querySelector("button");

    button.disabled = true;
    button.textContent = "Searching...";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["libs/Readability.js"]
    });

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["libs/extract.js"]
    });
    
    const [{ result: content }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__extractedContent,
    });

    // console.log("hello " + content);
    // readbility works perfectly!

    
    const response = await chrome.runtime.sendMessage({
        type: "FACT_CHECK",
        text: content
    });

    showResult(response.score);
    // button.disabled = false;
    // button.textContent = "Check Bias";
});