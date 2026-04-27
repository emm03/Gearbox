/*************************************************
 * Explainer Mode Route
 *************************************************/

const express = require("express");
const router = express.Router();

const openai = require("../services/openai");
const buildExplainerPrompt = require("../prompts/explainerPrompt");

function extractFirstJsonObject(text) {
    if (!text) return null;

    let s = text.trim();

    if (s.startsWith("```")) {
        s = s.replace(/^```[a-zA-Z]*\s*/i, "");
        s = s.replace(/```$/i, "").trim();
    }

    const start = s.indexOf("{");
    if (start === -1) return null;

    let depth = 0;
    for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (ch === "{") depth++;
        if (ch === "}") depth--;
        if (depth === 0) return s.slice(start, i + 1);
    }

    return null;
}

router.post("/explain", async (req, res) => {
    try {
        const {
            mode = "single",
            decisionGoal = "Is this right for me?",
            category = "",
            buyerContext = "",
            productName = "",
            store = "",
            specs = "",
            pageText = "",
            compareProducts = []
        } = req.body;

        const normalizedMode = mode === "compare" ? "compare" : "single";

        if (normalizedMode === "single" && !String(productName).trim()) {
            return res.status(400).json({ error: "Product name is required." });
        }

        if (normalizedMode === "compare") {
            const validCompare = Array.isArray(compareProducts)
                && compareProducts.length >= 2
                && compareProducts.every(p => p && typeof p.name === "string" && p.name.trim());

            if (!validCompare) {
                return res.status(400).json({
                    error: "Compare mode requires two products with names."
                });
            }
        }

        const prompt = buildExplainerPrompt({
            mode: normalizedMode,
            decisionGoal,
            category,
            buyerContext,
            productName,
            store,
            specs,
            pageText,
            compareProducts
        });

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: prompt
        });

        const raw = response.output_text?.trim();
        if (!raw) {
            return res.status(500).json({ error: "No explanation generated." });
        }

        try {
            return res.json(JSON.parse(raw));
        } catch (_) {
            const jsonChunk = extractFirstJsonObject(raw);

            if (!jsonChunk) {
                console.error("❌ No JSON object found in output:\n", raw);
                return res.status(500).json({ error: "Failed to parse explainer output." });
            }

            try {
                return res.json(JSON.parse(jsonChunk));
            } catch (err) {
                console.error("❌ JSON parse failed even after extraction.\nRAW:\n", raw);
                console.error("❌ EXTRACTED:\n", jsonChunk);
                return res.status(500).json({ error: "Failed to parse explainer output." });
            }
        }

    } catch (err) {
        console.error("❌ Explainer route error:", err);
        res.status(500).json({ error: "Failed to generate explanation." });
    }
});

module.exports = router;
