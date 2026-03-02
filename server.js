import fetch from "node-fetch";
import { MCPServer } from "@anthropic-ai/mcp-server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const server = new MCPServer({
  name: "gemini-bridge",
  version: "1.0.0"
});

server.tool(
  "use_gemini",
  {
    description: "Send text to Gemini for large processing or web fetching",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" }
      },
      required: ["prompt"]
    }
  },
  async ({ prompt }) => {
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

    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response"
    };
  }
);

server.start();
