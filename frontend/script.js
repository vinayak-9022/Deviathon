// Set username
document.getElementById("username").innerText = "Vinayak";

// Welcome speech
function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
}

let spoken = false;
function welcome() {
    if (!spoken) {
        speakText("Welcome to Blitza, your one-stop solution for any business query.");
        spoken = true;
    }
}
window.addEventListener("click", welcome);
window.addEventListener("keydown", welcome);

// FIX 1: Correctly reference the existing chat container element
// IMPORTANT: Ensure your HTML div has id="chat-container"
const chatContainer = document.querySelector(".chat-container"); 


// Parse Gemini response
function parseGeminiOutput(text) {
    const sections = { summary: "", insights: [], business: "" };
    const summary = text.match(/\*\*Summary:\*\*\s*(.*?)(?=\*\*Key Insights:|$)/is);
    const insights = text.match(/\*\*Key Insights:\*\*\s*(.*?)(?=\*\*Business Relevance:|$)/is);
    const business = text.match(/\*\*Business Relevance:\*\*\s*(.*)/is);

    sections.summary = summary ? summary[1].trim() : text;
    sections.business = business ? business[1].trim() : "";
    if (insights) {
        sections.insights = insights[1]
            .split(/\n|(?=\d+\.)|(?=\*)/)
            .map(i => i.replace(/^\d+\.|\*/g, "").trim())
            .filter(Boolean);
    }

    return sections;
}

// Add message to chat
function addMessage(text, isUser = false, query = "", sections = {}) {
    const msg = document.createElement("div");
    msg.className = "message " + (isUser ? "user-message" : "ai-message");
    msg.innerHTML = text;

    // Add PDF button under AI message only
    if (!isUser && query && sections.summary) {
        const pdfBtn = document.createElement("button");
        pdfBtn.className = "pdf-btn";
        pdfBtn.innerHTML = "📄 Download PDF";
        pdfBtn.addEventListener("click", () => downloadPDF(query, sections));
        msg.appendChild(pdfBtn);
    }

    chatContainer.appendChild(msg);
    
    // FIX: Use scrollIntoView on the new message element itself.
    // 'block: end' ensures the bottom of the element is aligned with the bottom of the view.
    msg.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Typing animation
function addTyping() {
    const typing = document.createElement("div");
    typing.className = "message ai-message";
    typing.innerHTML = `<span class="typing"></span><span class="typing"></span><span class="typing"></span>`;
    chatContainer.appendChild(typing);
    
    // FIX: Use scrollIntoView on the typing indicator.
    typing.scrollIntoView({ behavior: 'smooth', block: 'end' });

    return typing;
}

// Handle AI query
async function generateInsights() {
    const queryInput = document.getElementById("query");
    const query = queryInput.value.trim();
    if (!query) {
        // This will now correctly scroll the "Please enter a topic" message into view
        addMessage("Please enter a topic.", false); 
        return;
    }

    addMessage(query, true);
    queryInput.value = "";

    const typing = addTyping();

    try {
        const res = await fetch("http://localhost:5000/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        const data = await res.json();
        const text = data.result || "";
        const sections = parseGeminiOutput(text);

        typing.remove();

        // Combine sections for chat output
        let output = "";
        if (sections.summary) output += `<b>Summary:</b> ${sections.summary}<br>`;
        if (sections.insights.length)
            output += `<b>Key Insights:</b><ul>${sections.insights
                .map(i => `<li>${i}</li>`)
                .join("")}</ul>`;
        if (sections.business) output += `<b>Business Relevance:</b> ${sections.business}`;

        addMessage(output, false, query, sections);

    } catch (error) {
        typing.remove();
        addMessage("⚠️ Error fetching AI response.", false);
        console.error(error);
    }
}

// PDF generator
function downloadPDF(query, sections) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const maxWidth = 180;
    let y = 20;
    const lineHeight = 8;

    function addText(text){
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
            if(y > 270){ doc.addPage(); y = 20; }
            doc.text(line, 10, y); y += lineHeight;
        });
    }

    doc.setFontSize(16);
    doc.text(`Summary for: ${query}`, 10, y); y += 10;

    doc.setFontSize(14);
    doc.text("Summary:", 10, y); y += lineHeight;
    addText(sections.summary);

    doc.text("Key Insights:", 10, y); y += lineHeight;
    sections.insights.forEach(i => addText("- " + i));

    doc.text("Business Relevance:", 10, y); y += lineHeight;
    addText(sections.business);

    doc.save(`${query}-summary.pdf`);
}

// Events
document.getElementById("search-btn").addEventListener("click", generateInsights);
document.getElementById("query").addEventListener("keydown", e => {
    if (e.key === "Enter") generateInsights();
});