import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "100mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

// MCP-style JSON-RPC endpoint
app.post("/", async (req, res) => {
  const { id, method, params } = req.body;

  if (method === "initialize") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        capabilities: {
          tools: {}
        }
      }
    });
  }

  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "use_gemini",
            description: "Send prompt to Gemini for large processing",
            input_schema: {
              type: "object",
              properties: {
                prompt: { type: "string" }
              },
              required: ["prompt"]
            }
          }
        ]
      }
    });
  }

  if (method === "tools/call") {
    if (params.name === "use_gemini") {
      const output = await callGemini(params.arguments.prompt);

      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: output
            }
          ]
        }
      });
    }
  }

  res.status(400).json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" }
  });
});

app.listen(process.env.PORT || 3000);
