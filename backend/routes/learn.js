/*************************************************
 * Learn Mode Route
 *************************************************/

const express = require("express");
const router = express.Router();

const openai = require("../services/openai");

/**
 * POST /api/learn
 */
router.post("/", async (req, res) => {
    try {
        const { store = "", department = "", specs = "" } = req.body;

        if (!specs || !specs.trim()) {
            return res.status(400).json({
                error: "Product specs are required."
            });
        }

        const prompt = `
You are Gearbox, an AI that trains retail employees to understand products and explain them confidently.

STORE: ${store}
DEPARTMENT: ${department}

PRODUCT SPECS:
${specs}

GOAL:
Help a retail employee actually understand this product so they can explain it naturally.

OUTPUT FORMAT:
Return VALID JSON ONLY:

{
  "summary": "2–3 sentence explanation of what the product is and why it matters",
  "flashcards": [
    { "front": "Question", "back": "Answer" }
  ],
  "quiz": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why the answer is correct"
    }
  ]
}

RULES:
- No markdown
- No extra text
- JSON only
`;

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: prompt
        });

        let outputText = response.output_text?.trim();

        if (!outputText) {
            return res.status(500).json({
                error: "No learning module generated."
            });
        }

        let parsed;
        try {
            parsed = JSON.parse(outputText);
        } catch (err) {
            console.error("Learn JSON parse error:", outputText);
            return res.status(500).json({
                error: "Failed to parse learning module."
            });
        }

        res.json(parsed);

    } catch (err) {
        console.error("Learn route error:", err);
        res.status(500).json({
            error: "Failed to generate learning module."
        });
    }
});

module.exports = router;