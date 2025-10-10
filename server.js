import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Replace with your actual keys
const GEMINI_API_KEY = "AIzaSyD8tAQnuxjsjd5AL2yEQMRVsH4GUuDXRvA";
const SERPER_API_KEY = "1826cca60b8f97b52dccb495a6788d888b431359"; 

app.post("/api/research", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required." });

  try {
    // 1️⃣ Gemini AI Request
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI Research Assistant for business professionals. Summarize and provide insights for this query: ${query}.
Include:
- Summary
- Key Insights (3 points)
- Business Relevance`
                }
              ]
            }
          ]
        }),
      }
    );

    const geminiData = await geminiResp.json();
    const aiText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "No result from Gemini";

    // 2️⃣ Serper API Request
    const serperResp = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": "1826cca60b8f97b52dccb495a6788d888b431359",
      },
      body: JSON.stringify({ q: query }),
    });

    const serperData = await serperResp.json();
    const webResults = serperData?.organic || [];

    // ✅ Send combined response
    res.json({ result: aiText, webResults });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong with the AI APIs." });
  }
});

// ✅ Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
