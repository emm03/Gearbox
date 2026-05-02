const express = require("express");
const router = express.Router();
const openai = require("../services/openai");

router.post("/", async (req, res) => {
    try {
        const { mode = "explainer", contextStatus = "none", productName = "", productContext = "", messages = [] } = req.body || {};
        const trimmedMessages = Array.isArray(messages) ? messages.slice(-8) : [];
        const formattedMessages = trimmedMessages.map(m => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content || ""}`).join("\n");

        const prompt = `
You are Gearbox Coach, a concise retail product expert.
Mode: ${mode}
Context status: ${contextStatus}
Product name: ${productName || "Unknown"}
Context:
${productContext || "No product context available yet."}

Conversation:
${formattedMessages || "No prior messages."}

Rules:
- Be concise and practical for retail employees.
- Do not invent unsupported product claims.
- If context is missing, say what is missing and give a safe general answer.
- If context status is "draft", mention this is guidance from typed details and recommend generating a full module/explanation for higher confidence.
- Default response length: short to medium.
- Prefer organized structure for longer answers:
  - short opening sentence
  - 3 to 6 short bullets or short labeled sections
  - customer-facing wording
- Good section labels include:
  - Simple explanation
  - Customer pitch
  - Key difference
  - What to watch for
  - Best fit
  - Not best fit
  - Follow-up question
- Avoid dense walls of text unless user explicitly asks for detailed depth.
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
