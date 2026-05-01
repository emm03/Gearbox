/*************************************************
 * Learn Mode Route
 *************************************************/

const express = require("express");
const router = express.Router();
const { fetch } = require("undici");

const openai = require("../services/openai");

/**
 * POST /api/learn
 */
router.post("/", async (req, res) => {
    try {
        const { store = "", department = "", specs = "", productName = "", employeeContext = "", productUrl = "" } = req.body;

        if (!specs?.trim() && !productUrl?.trim() && !productName?.trim()) {
            return res.status(400).json({
                error: "Provide specs, product URL, or product name."
            });
        }

        let urlContext = "";
        if (productUrl?.trim()) {
            let timeout;
            try {
                const controller = new AbortController();
                timeout = setTimeout(() => controller.abort(), 7000);
                const response = await fetch(productUrl.trim(), {
                    method: "GET",
                    signal: controller.signal
                });
                clearTimeout(timeout);
                const html = await response.text();
                const condensed = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
                    .replace(/<style[\s\S]*?<\/style>/gi, " ")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .slice(0, 4000);
                urlContext = condensed ? `URL CONTENT SNIPPET: ${condensed}` : "";
            } catch (_) {
                urlContext = "URL provided but content could not be fetched quickly. Use product name/specs context.";
            } finally {
                if (timeout) clearTimeout(timeout);
            }
        }

        const prompt = `
You are Gearbox, an AI that trains retail employees to understand products and explain them confidently.

STORE: ${store}
DEPARTMENT: ${department}
PRODUCT NAME: ${productName || "Not provided"}
EMPLOYEE CONTEXT: ${employeeContext || "Not provided"}
PRODUCT URL: ${productUrl || "Not provided"}
${urlContext}

PRODUCT SPECS:
${specs || "Not provided"}

GOAL:
Help a retail employee actually understand this product so they can explain it naturally.

OUTPUT FORMAT:
Return VALID JSON ONLY:

{
  "summary": "2–3 sentence explanation of what the product is and why it matters",
  "flashcards": [
    { "front": "Question", "back": "Answer" }
  ],
  "practice": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why the answer is correct"
    }
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
- If product context is sufficient, you MUST generate exactly 10 flashcards, exactly 10 practice questions, and exactly 10 quiz questions.
- Do not stop at 3-4 items when the URL/specs include enough features to produce a full set.
- If context is limited, return fewer but accurate items. Do not hallucinate specific facts.
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
