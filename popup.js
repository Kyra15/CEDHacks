document.addEventListener("DOMContentLoaded", async () => {

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

    drawGauge(response.score);
});



function drawGauge(score) {
    const canvas = document.getElementById('gaugeCanvas');
    const ctx = canvas.getContext('2d');
    const W = 500, H = 260;
    const cx = W / 2, cy = H - 10;
    const R_OUT = 220, R_IN = 155;
    const startA = Math.PI, endA = 2 * Math.PI;

    ctx.clearRect(0, 0, W, H);

    ctx.beginPath();
    ctx.arc(cx, cy, R_OUT, startA, endA);
    ctx.arc(cx, cy, R_IN, endA, startA, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();

    const pct = Math.min(100, Math.max(0, score)) / 100;
    const segments = [
        { from: 0,    to: 0.33, from_c: '#E24B4A', to_c: '#F07B3A' },
        { from: 0.33, to: 0.67, from_c: '#F0A030', to_c: '#EFD020' },
        { from: 0.67, to: 1.0,  from_c: '#AACC44', to_c: '#639922' },
    ];

    segments.forEach(seg => {
        if (pct <= seg.from) return;
        const fillTo = Math.min(pct, seg.to);
        const a1 = startA + seg.from * Math.PI;
        const a2 = startA + fillTo * Math.PI;
        const steps = 40;
        for (let i = 0; i < steps; i++) {
            const t1 = a1 + (a2 - a1) * (i / steps);
            const t2 = a1 + (a2 - a1) * ((i + 1) / steps);
            const t = (i + 0.5) / steps;
            const r1 = parseInt(seg.from_c.slice(1,3),16), r2 = parseInt(seg.to_c.slice(1,3),16);
            const g1 = parseInt(seg.from_c.slice(3,5),16), g2 = parseInt(seg.to_c.slice(3,5),16);
            const b1 = parseInt(seg.from_c.slice(5,7),16), b2 = parseInt(seg.to_c.slice(5,7),16);
            ctx.beginPath();
            ctx.moveTo(cx + R_IN * Math.cos(t1), cy + R_IN * Math.sin(t1));
            ctx.arc(cx, cy, R_OUT, t1, t2);
            ctx.arc(cx, cy, R_IN, t2, t1, true);
            ctx.closePath();
            ctx.fillStyle = `rgb(${Math.round(r1+t*(r2-r1))},${Math.round(g1+t*(g2-g1))},${Math.round(b1+t*(b2-b1))})`;
            ctx.fill();
        }
    });

    const needleA = startA + pct * Math.PI;
    const nr = (R_IN + R_OUT) / 2;
    const nx = cx + nr * Math.cos(needleA);
    const ny = cy + nr * Math.sin(needleA);

    // marker
    ctx.beginPath();
    ctx.moveTo(cx + R_IN * Math.cos(needleA), cy + R_IN * Math.sin(needleA));
    ctx.lineTo(cx + R_OUT * Math.cos(needleA), cy + R_OUT * Math.sin(needleA));
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // score text
    ctx.font = '500 64px DM Sans';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score, cx, cy - 30);
}
