import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "50mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/", async (req, res) => {
  try {
    const userMessage = req.body.messages?.at(-1)?.content || "";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userMessage }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    res.json({
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000);
