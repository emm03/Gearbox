/*************************************************
 * Explainer Mode Route
 *************************************************/

const express = require("express");
const router = express.Router();

const openai = require("../services/openai");
const buildExplainerPrompt = require("../prompts/explainerPrompt");

/*************************************************
 * Helper: extract the first JSON object from a string
 *************************************************/
function extractFirstJsonObject(text) {
    if (!text) return null;

    let s = text.trim();

    // Strip ```json fences if present
    if (s.startsWith("```")) {
        s = s.replace(/^```[a-zA-Z]*\s*/i, "");
        s = s.replace(/```$/i, "").trim();
    }

    // Find the first { ... } block (simple brace scan)
    const start = s.indexOf("{");
    if (start === -1) return null;

    let depth = 0;
    for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (ch === "{") depth++;
        if (ch === "}") depth--;
        if (depth === 0) {
            return s.slice(start, i + 1);
        }
    }

    return null;
}

/**
 * POST /api/explain
 */
router.post("/explain", async (req, res) => {
    try {
        const {
            productName,
            store = "",
            specs = "",
            pageText = ""
        } = req.body;

        if (!productName || !productName.trim()) {
            return res.status(400).json({ error: "Product name is required." });
        }

        const prompt = buildExplainerPrompt({
            productName,
            store,
            specs,
            pageText
        });

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: prompt
        });

        const raw = response.output_text?.trim();

        if (!raw) {
            return res.status(500).json({ error: "No explanation generated." });
        }

        // Try direct parse first
        try {
            return res.json(JSON.parse(raw));
        } catch (_) {
            // Fall back to extracting JSON from extra text
            const jsonChunk = extractFirstJsonObject(raw);

            if (!jsonChunk) {
                console.error("❌ No JSON object found in output:\n", raw);
                return res.status(500).json({
                    error: "Failed to parse explainer output.",
                });
            }

            try {
                return res.json(JSON.parse(jsonChunk));
            } catch (err) {
                console.error("❌ JSON parse failed even after extraction.\nRAW:\n", raw);
                console.error("❌ EXTRACTED:\n", jsonChunk);
                return res.status(500).json({
                    error: "Failed to parse explainer output.",
                });
            }
        }

    } catch (err) {
        console.error("❌ Explainer route error:", err);
        res.status(500).json({ error: "Failed to generate explanation." });
    }
});

module.exports = router;
