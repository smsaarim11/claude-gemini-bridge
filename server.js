import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "100mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// helper to call Gemini
async function callGemini(parts) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

app.post("/", async (req, res) => {
  try {
    const message = req.body.messages?.at(-1)?.content || "";

    // -------- IMAGE MODE --------
    if (req.body.image) {
      const result = await callGemini([
        { text: message },
        {
          inline_data: {
            mime_type: "image/png",
            data: req.body.image
          }
        }
      ]);

      return res.json({ content: result });
    }

    // -------- WEB FETCH MODE --------
    if (message.includes("USE_GEMINI_WEB")) {
      const urlMatch = message.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) {
        return res.json({ content: "No URL detected." });
      }

      const page = await fetch(urlMatch[0]);
      const text = await page.text();

      const result = await callGemini([
        {
          text: `Summarize and extract important technical data from this webpage:\n\n${text}`
        }
      ]);

      return res.json({ content: result });
    }

    // -------- NORMAL TEXT MODE --------
    const result = await callGemini([{ text: message }]);
    return res.json({ content: result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000);
