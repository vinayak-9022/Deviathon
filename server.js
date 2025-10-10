
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const GEMINI_API_KEY = "AIzaSyD8tAQnuxjsjd5AL2yEQMRVsH4GUuDXRvA"; 

app.post("/api/research", async (req, res) => {
  const { query } = req.body;

  if (!query) return res.status(400).json({ error: "Query is required." });

  try {
    const response = await fetch(
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

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data, null, 2));

    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No result found. Check API response structure.";

    res.json({ result: aiText });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Something went wrong with the AI API." });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
