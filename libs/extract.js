(function() {
    const documentClone = document.cloneNode(true);
    const article = new Readability(documentClone).parse();
    // can't return a value from a file injection, so store it
    window.__extractedContent = article
        ? `${article.title}\n\n${article.textContent}`
        : document.body.innerText;
})()