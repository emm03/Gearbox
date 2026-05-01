/*************************************************
 * Learn Mode Route
 *************************************************/

const express = require("express");
const router = express.Router();
const { fetch } = require("undici");

const openai = require("../services/openai");
const PLAN_TARGETS = {
    free: { flashcards: 10, practice: 10, quiz: 10 },
    pro: { flashcards: 30, practice: 30, quiz: 30 },
    team: { flashcards: 100, practice: 100, quiz: 100 }
};

function shuffledOptions(options = [], correctIndex = 0) {
    const normalized = options.map((text, idx) => ({ text, correct: idx === Number(correctIndex) }));
    for (let i = normalized.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [normalized[i], normalized[j]] = [normalized[j], normalized[i]];
    }
    return {
        options: normalized.map(item => item.text),
        correctIndex: Math.max(0, normalized.findIndex(item => item.correct))
    };
}

function normalizeQuestion(q = {}) {
    const options = Array.isArray(q.options) ? q.options.filter(Boolean).slice(0, 4) : [];
    while (options.length < 4) options.push("Not enough context to determine");
    const shuffled = shuffledOptions(options, q.correctIndex ?? 0);
    return {
        question: q.question || "Which statement best matches the product information?",
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: q.explanation || "Based on the provided product details."
    };
}

function buildFallbackQuestions(flashcards = [], count = 10) {
    return flashcards.slice(0, count).map((card, idx) => normalizeQuestion({
        question: card.front || `Which statement best describes this product? (${idx + 1})`,
        options: [
            card.back || "No specific answer available",
            "What does this feature help with?",
            "Who is this product best suited for?",
            "Needs more specs to verify"
        ],
        correctIndex: 0,
        explanation: "Derived directly from the generated flashcard answer."
    }));
}

/**
 * POST /api/learn
 */
router.post("/", async (req, res) => {
    try {
        const { store = "", department = "", specs = "", productName = "", employeeContext = "", productUrl = "" } = req.body;
        const selectedPlan = String(req.body?.plan || "free").toLowerCase();
        const targets = PLAN_TARGETS[selectedPlan] || PLAN_TARGETS.free;

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
- Target counts for this request:
  - flashcards: ${targets.flashcards}
  - practice: ${targets.practice}
  - quiz: ${targets.quiz}
- If product context is rich, generate as close to target counts as possible.
- If context is limited, return fewer high-confidence items. Do not hallucinate specific facts.
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

        parsed.flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards.filter(Boolean).slice(0, targets.flashcards) : [];
        parsed.practice = Array.isArray(parsed.practice) ? parsed.practice.filter(Boolean) : [];
        parsed.quiz = Array.isArray(parsed.quiz) ? parsed.quiz.filter(Boolean) : [];

        if (parsed.flashcards.length < targets.flashcards && parsed.flashcards.length > 0) {
            while (parsed.flashcards.length < targets.flashcards) {
                const source = parsed.flashcards[parsed.flashcards.length % Math.max(parsed.flashcards.length, 1)] || {};
                parsed.flashcards.push({
                    front: source.front || "Product fact review",
                    back: source.back || "Review product details for this item."
                });
                if (parsed.flashcards.length > targets.flashcards) break;
            }
        }

        if (parsed.practice.length < targets.practice) {
            parsed.practice = [...parsed.practice, ...buildFallbackQuestions(parsed.flashcards, targets.practice)].slice(0, targets.practice);
        }
        if (parsed.quiz.length < targets.quiz) {
            parsed.quiz = [...parsed.quiz, ...buildFallbackQuestions(parsed.flashcards, targets.quiz)].slice(0, targets.quiz);
        }

        parsed.practice = parsed.practice.slice(0, targets.practice).map(normalizeQuestion);
        parsed.quiz = parsed.quiz.slice(0, targets.quiz).map(normalizeQuestion);

        res.json(parsed);

    } catch (err) {
        console.error("Learn route error:", err);
        res.status(500).json({
            error: "Failed to generate learning module."
        });
    }
});

module.exports = router;
