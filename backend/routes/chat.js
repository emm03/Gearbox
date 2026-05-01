const express = require("express");
const router = express.Router();
const openai = require("../services/openai");

router.post("/", async (req, res) => {
    try {
        const { mode = "explainer", productName = "", productContext = "", messages = [] } = req.body || {};
        const trimmedMessages = Array.isArray(messages) ? messages.slice(-8) : [];
        const formattedMessages = trimmedMessages.map(m => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content || ""}`).join("\n");

        const prompt = `
You are Gearbox Coach, a concise retail product expert.
Mode: ${mode}
Product name: ${productName || "Unknown"}
Context:
${productContext || "No product context available yet."}

Conversation:
${formattedMessages || "No prior messages."}

Rules:
- Be concise and practical for retail employees.
- Do not invent unsupported product claims.
- If context is missing, say what is missing and give a safe general answer.
- Return plain text only.
`;

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: prompt
        });
        const text = response.output_text?.trim();
        if (!text) return res.status(500).json({ error: "No chat response generated." });
        res.json({ reply: text });
    } catch (err) {
        console.error("Chat route error:", err);
        res.status(500).json({ error: "Failed to generate chat reply." });
    }
});

module.exports = router;
