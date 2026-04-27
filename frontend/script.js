/*************************************************
 * GLOBAL INIT
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {
    initExampleRotation();
    initScrollReveal();
    initValueCardGlow();
    initExampleCardGlow();
    initElasticHeadline();

    initExplainerMode();
    initLearnTabs();
    initLearnMode();
});

/*************************************************
 * HOME PAGE
 *************************************************/

function initElasticHeadline() {
    const title = document.querySelector(".hero-title");
    if (!title) return;

    const lines = title.querySelectorAll(".hero-line");

    let targetScale = 1;
    let currentScale = 1;

    document.addEventListener("mousemove", (e) => {
        const rect = title.getBoundingClientRect();

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 280;

        const intensity = Math.max(0, 1 - distance / maxDistance);
        targetScale = 1 + intensity * 0.08;
    });

    function animate() {
        currentScale += (targetScale - currentScale) * 0.08;

        lines.forEach((line, index) => {
            const weight = index === 1 ? 1.25 : 1;
            const scaleX = 1 + (currentScale - 1) * weight;
            line.style.transform = `scaleX(${scaleX})`;
        });

        requestAnimationFrame(animate);
    }

    animate();
}

function initExampleRotation() {
    const el = document.getElementById("exampleText");
    if (!el) return;

    const examples = [
        "This jacket feels warmer because the insulation traps air in smaller pockets.",
        "This bike shifts more smoothly because the derailleur geometry keeps tension consistent.",
        "These running shoes feel more stable because impact forces spread evenly.",
        "This tent stays quieter because tensioned panels reduce flutter."
    ];

    let i = 0;
    el.textContent = examples[i];
    el.classList.add("example-visible");

    setInterval(() => {
        el.classList.remove("example-visible");
        setTimeout(() => {
            i = (i + 1) % examples.length;
            el.textContent = examples[i];
            el.classList.add("example-visible");
        }, 300);
    }, 6000);
}

function initScrollReveal() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add("reveal-visible");
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
}

function initValueCardGlow() {
    document.querySelectorAll(".value-card").forEach(card => {
        card.addEventListener("mousemove", e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty("--x", `${e.clientX - r.left}px`);
            card.style.setProperty("--y", `${e.clientY - r.top}px`);
        });
    });
}

function initExampleCardGlow() {
    const card = document.querySelector(".example-card");
    if (!card) return;

    card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--x", `${e.clientX - r.left}px`);
        card.style.setProperty("--y", `${e.clientY - r.top}px`);
    });
}

/*************************************************
 * EXPLAINER MODE
 *************************************************/

const EXPLAINER_GOALS = [
    "Is this right for me?",
    "Is it worth the price?",
    "Explain the specs",
    "Compare two products",
    "What should I know before buying?",
];

const DEFAULT_FOLLOW_UPS = [
    "Explain this simpler",
    "Is this beginner friendly?",
    "What are the downsides?",
    "What should I ask an employee?",
    "Compare to a cheaper option"
];

function initExplainerMode() {
    const explainBtn = document.getElementById("explainer-submit");
    if (!explainBtn) return;

    const goalCards = document.querySelectorAll(".goal-card");
    const modeButtons = document.querySelectorAll(".mode-toggle");
    const modePanels = document.querySelectorAll(".explainer-form-panel");

    let currentMode = "single";
    let currentGoal = EXPLAINER_GOALS[0];
    let lastResultContext = null;

    const setMode = (mode) => {
        currentMode = mode;
        modeButtons.forEach((btn) => {
            const active = btn.dataset.mode === mode;
            btn.classList.toggle("active", active);
            btn.setAttribute("aria-selected", active ? "true" : "false");
        });

        modePanels.forEach((panel) => {
            panel.classList.toggle("hidden", panel.dataset.panel !== mode);
        });
    };

    const setGoal = (goal) => {
        currentGoal = goal;
        goalCards.forEach((card) => {
            const active = card.dataset.goal === goal;
            card.classList.toggle("active", active);
            card.setAttribute("aria-pressed", active ? "true" : "false");
        });

        if (goal === "Compare two products") {
            setMode("compare");
        }
    };

    goalCards.forEach((card) => {
        card.addEventListener("click", () => setGoal(card.dataset.goal));
    });

    modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            setMode(btn.dataset.mode);
            if (btn.dataset.mode === "single" && currentGoal === "Compare two products") {
                setGoal("Is this right for me?");
            }
            if (btn.dataset.mode === "compare" && currentGoal !== "Compare two products") {
                setGoal("Compare two products");
            }
        });
    });

    document.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;

        const wrap = chip.closest(".followup-chips");
        if (!wrap) return;

        wrap.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderFollowupTip(chip.textContent.trim(), lastResultContext);
    });

    explainBtn.addEventListener("click", async () => {
        if (currentMode === "compare") {
            lastResultContext = await handleCompareExplainClick(currentGoal);
            return;
        }

        lastResultContext = await handleSingleExplainClick(currentGoal);
    });

    setGoal(currentGoal);
    setMode(currentMode);
}

async function handleSingleExplainClick(goal) {
    const payload = {
        mode: "single",
        decisionGoal: goal,
        category: document.getElementById("single-category")?.value || "",
        buyerContext: document.getElementById("single-buyer-context")?.value.trim() || "",
        productName: document.getElementById("single-product-name")?.value.trim() || "",
        store: document.getElementById("single-store")?.value || "",
        specs: document.getElementById("single-product-specs")?.value.trim() || "",
        pageText: document.getElementById("single-product-link")?.value.trim() || ""
    };

    if (!payload.productName) {
        alert("Please enter a product name.");
        return null;
    }

    setExplainerLoadingState(`Building buying guidance for ${payload.productName}...`);

    try {
        const data = await requestExplainer(payload);
        renderSingleExplainerResult(dataToPlainObject(data));
        return { mode: "single", goal, productName: payload.productName, data };
    } catch (err) {
        console.error(err);
        setExplainerErrorState("Something went wrong while building buying guidance.");
        return null;
    }
}

async function handleCompareExplainClick(goal) {
    const compareProducts = [
        {
            label: "A",
            name: document.getElementById("compare-a-name")?.value.trim() || "",
            store: document.getElementById("compare-a-store")?.value.trim() || "",
            pageText: document.getElementById("compare-a-link")?.value.trim() || "",
            specs: document.getElementById("compare-a-specs")?.value.trim() || "",
        },
        {
            label: "B",
            name: document.getElementById("compare-b-name")?.value.trim() || "",
            store: document.getElementById("compare-b-store")?.value.trim() || "",
            pageText: document.getElementById("compare-b-link")?.value.trim() || "",
            specs: document.getElementById("compare-b-specs")?.value.trim() || "",
        }
    ];

    if (!compareProducts[0].name || !compareProducts[1].name) {
        alert("Please enter both Product A and Product B names.");
        return null;
    }

    setExplainerLoadingState(`Comparing ${compareProducts[0].name} vs ${compareProducts[1].name}...`);

    try {
        const data = await requestExplainer({
            mode: "compare",
            decisionGoal: goal,
            category: "",
            buyerContext: "",
            productName: "",
            store: "",
            specs: "",
            pageText: "",
            compareProducts
        });

        renderCompareExplainerResult(dataToPlainObject(data), compareProducts);
        return { mode: "compare", goal, compareProducts, data };
    } catch (err) {
        console.error(err);
        setExplainerErrorState("Something went wrong while comparing products.");
        return null;
    }
}

async function requestExplainer(payload) {
    const response = await fetch("http://localhost:4000/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Failed to explain product");
    }

    return data;
}

function setExplainerLoadingState(message) {
    const resultsSection = document.getElementById("explainer-results");
    if (!resultsSection) return;

    resultsSection.innerHTML = `
        <div class="explainer-result-shell">
            <div class="result-heading">
                <h3>Preparing your decision dashboard</h3>
                <span class="result-mode-pill">Loading</span>
            </div>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function setExplainerErrorState(message) {
    const resultsSection = document.getElementById("explainer-results");
    if (!resultsSection) return;

    resultsSection.innerHTML = `
        <div class="explainer-result-shell">
            <div class="result-heading">
                <h3>Couldn’t generate guidance</h3>
                <span class="result-mode-pill">Error</span>
            </div>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function renderSingleExplainerResult(data) {
    const resultsSection = document.getElementById("explainer-results");
    if (!resultsSection) return;

    resultsSection.innerHTML = `
        <div class="explainer-result-shell">
            <div class="result-heading">
                <h3>${escapeHtml(data.title || "Buying guidance")}</h3>
                <span class="result-mode-pill">Single product</span>
            </div>

            <div class="result-card featured-card">
                <h4>Quick verdict</h4>
                <p>${escapeHtml(paragraphOrFallback(data.quickVerdict, "No verdict generated yet."))}</p>
            </div>

            <div class="explainer-result-grid">
                ${buildResultCard("Plain English summary", `<p>${escapeHtml(paragraphOrFallback(data.plainEnglishSummary, "No summary generated yet."))}</p>`) }
                ${buildResultCard("Who it’s for", listToHtml(listOrEmpty(data.bestFor), "No audience guidance generated yet."))}
                ${buildResultCard("Who should avoid it", listToHtml(listOrEmpty(data.notIdealFor), "No caution guidance generated yet."))}
                ${buildResultCard("What actually matters in the specs", listToHtml(listOrEmpty(data.specsThatMatter), "No specs guidance generated yet."))}
                ${buildResultCard("What it feels like to use", listToHtml(listOrEmpty(data.realWorldFeel), "No real-world feel guidance generated yet."))}
                ${buildResultCard("What you are paying for", listToHtml(listOrEmpty(data.whatYouArePayingFor), "No pricing-value guidance generated yet."))}
                ${buildResultCard("Recommendation", `<p>${escapeHtml(paragraphOrFallback(data.recommendation, "No recommendation generated yet."))}</p>`) }
            </div>
        </div>
        ${renderFollowupShell(data.followUpSuggestions)}
    `;
}

function renderCompareExplainerResult(data, fallbackProducts = []) {
    const resultsSection = document.getElementById("explainer-results");
    if (!resultsSection) return;

    const productAName = data.productA?.name || fallbackProducts[0]?.name || "Product A";
    const productBName = data.productB?.name || fallbackProducts[1]?.name || "Product B";

    resultsSection.innerHTML = `
        <div class="explainer-result-shell compare-shell">
            <div class="result-heading">
                <h3>${escapeHtml(data.title || "Product comparison")}</h3>
                <span class="result-mode-pill">Compare mode</span>
            </div>

            <div class="result-card featured-card">
                <h4>Quick verdict</h4>
                <p>${escapeHtml(paragraphOrFallback(data.quickVerdict, "No quick verdict generated yet."))}</p>
            </div>

            <div class="explainer-result-grid">
                ${buildResultCard(`Pick ${escapeHtml(productAName)} if...`, listToHtml(listOrEmpty(data.productA?.chooseIf), "No guidance generated yet."))}
                ${buildResultCard(`Pick ${escapeHtml(productBName)} if...`, listToHtml(listOrEmpty(data.productB?.chooseIf), "No guidance generated yet."))}
                ${buildResultCard(`${escapeHtml(productAName)} tradeoffs`, listToHtml(listOrEmpty(data.productA?.tradeoffs), "No tradeoffs generated yet."))}
                ${buildResultCard(`${escapeHtml(productBName)} tradeoffs`, listToHtml(listOrEmpty(data.productB?.tradeoffs), "No tradeoffs generated yet."))}
                ${buildResultCard("Biggest differences", listToHtml(listOrEmpty(data.biggestDifferences), "No differences generated yet."))}
                ${buildResultCard("What you gain or give up", listToHtml(listOrEmpty(data.whatYouGainOrGiveUp), "No gain/give-up guidance generated yet."))}
                ${buildResultCard("Final recommendation", `<p>${escapeHtml(paragraphOrFallback(data.finalRecommendation, "No final recommendation generated yet."))}</p>`) }
            </div>
        </div>
        ${renderFollowupShell(data.followUpSuggestions)}
    `;
}

function renderFollowupShell(dynamicSuggestions = []) {
    const chipSet = [...dynamicSuggestions, ...DEFAULT_FOLLOW_UPS]
        .filter(Boolean)
        .filter((value, idx, arr) => arr.indexOf(value) === idx)
        .slice(0, 5);

    const chips = chipSet.length ? chipSet : DEFAULT_FOLLOW_UPS;

    return `
        <div class="followup-wrap">
            <p class="followup-title">Follow-up suggestions</p>
            <div class="followup-chips">
                ${chips.map(chip => `<button class="chip" type="button">${escapeHtml(chip)}</button>`).join("")}
            </div>
            <p class="followup-response" id="followup-response"></p>
        </div>
    `;
}

function renderFollowupTip(label, context) {
    const out = document.getElementById("followup-response");
    if (!out) return;

    const tips = {
        "Explain this simpler": "Reduce this to one sentence: who it helps, why it helps, and the main tradeoff.",
        "Is this beginner friendly?": "Ask whether setup, daily use, and maintenance are still easy for a first-time buyer.",
        "What are the downsides?": "Focus on comfort tradeoffs, durability limits, maintenance load, and return-rate concerns.",
        "What should I ask an employee?": "Ask: what type of customer usually returns this, and what expectation mismatch causes it?",
        "Compare to a cheaper option": "Compare against one lower-priced alternative on comfort, durability, and long-term value."
    };

    let suffix = "";
    if (context?.mode === "single" && context.productName) {
        suffix = ` For ${context.productName}, ask for one real in-store scenario where this is clearly better.`;
    }
    if (context?.mode === "compare" && context.compareProducts?.length === 2) {
        suffix = ` For ${context.compareProducts[0].name} vs ${context.compareProducts[1].name}, ask which one is easier to live with over 12 months.`;
    }

    out.textContent = `${tips[label] || "Use this as a next-step buying question."}${suffix}`;
}

function buildResultCard(title, bodyHtml) {
    return `
        <article class="result-card">
            <h4>${title}</h4>
            ${bodyHtml}
        </article>
    `;
}

function listOrEmpty(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

function listToHtml(items, fallback) {
    if (!items.length) return `<p>${escapeHtml(fallback)}</p>`;
    return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function paragraphOrFallback(text, fallback) {
    return text && String(text).trim() ? String(text).trim() : fallback;
}

function escapeHtml(str = "") {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function dataToPlainObject(data) {
    return data && typeof data === "object" ? data : {};
}

/*************************************************
 * LEARN MODE TABS
 *************************************************/

function initLearnTabs() {
    const tabs = document.querySelectorAll(".learn-tab");
    const panels = document.querySelectorAll(".learn-tab-content");

    if (!tabs.length || !panels.length) return;

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(target)?.classList.add("active");
        });
    });
}

function activateLearnTab(tabId) {
    document.querySelectorAll(".learn-tab").forEach(t => {
        t.classList.toggle("active", t.dataset.tab === tabId);
    });

    document.querySelectorAll(".learn-tab-content").forEach(p => {
        p.classList.toggle("active", p.id === tabId);
    });
}

/*************************************************
 * LEARN MODE STATE
 *************************************************/

let currentLearningData = null;
let currentFlashcardIndex = 0;
let currentFlashcardFlipped = false;

/*************************************************
 * LEARN MODE
 *************************************************/

function initLearnMode() {
    const btn = document.getElementById("generate-learning-btn");
    if (!btn) return;

    btn.addEventListener("click", handleGenerateLearning);
}

async function handleGenerateLearning() {
    const store = document.getElementById("store-select")?.value || "";
    const department = document.getElementById("department-select")?.value || "";
    const specs = document.getElementById("product-specs")?.value.trim();
    const btn = document.getElementById("generate-learning-btn");

    if (!specs) {
        alert("Paste specs first.");
        return;
    }

    const flashcardsContainer = document.getElementById("flashcards-container");
    const quizContainer = document.getElementById("quiz-container");

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Generating...";
    }

    if (flashcardsContainer) {
        flashcardsContainer.innerHTML = `<p>Generating flashcards...</p>`;
    }

    if (quizContainer) {
        quizContainer.innerHTML = `<p>Generating quiz...</p>`;
    }

    try {
        const res = await fetch("http://localhost:4000/api/learn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store, department, specs })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to generate learning module");
        }

        currentLearningData = data;
        currentFlashcardIndex = 0;
        currentFlashcardFlipped = false;

        renderLearningModule(data);
        activateLearnTab("flashcards-tab");

    } catch (err) {
        console.error(err);

        if (flashcardsContainer) {
            flashcardsContainer.innerHTML = `<p>Something went wrong.</p>`;
        }

        if (quizContainer) {
            quizContainer.innerHTML = `<p>Something went wrong.</p>`;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Generate Learning Module";
        }
    }
}

/*************************************************
 * LEARN MODE RENDER
 *************************************************/

function renderLearningModule(data) {
    renderSingleFlashcardView(data);
    renderQuizView(data);
}

function renderSingleFlashcardView(data) {
    const flashcardsContainer = document.getElementById("flashcards-container");
    if (!flashcardsContainer) return;

    const flashcards = data.flashcards || [];

    if (!flashcards.length) {
        flashcardsContainer.innerHTML = `
            <h3>Summary</h3>
            <p>${data.summary || ""}</p>
            <p>No flashcards were generated.</p>
        `;
        return;
    }

    const card = flashcards[currentFlashcardIndex];

    flashcardsContainer.innerHTML = `
        <h3>Summary</h3>
        <p>${data.summary || ""}</p>

        <h3>Flashcards</h3>

        <div class="flashcard-progress">
            ${currentFlashcardIndex + 1} / ${flashcards.length}
        </div>

        <div class="flashcard-viewer">
            <div class="flashcard-card ${currentFlashcardFlipped ? "flipped" : ""}" id="active-flashcard">
                <div class="flashcard-face flashcard-front">
                    <div>${card.front}</div>
                    <div class="flashcard-hint">Click to flip</div>
                </div>
                <div class="flashcard-face flashcard-back">
                    <div>${card.back}</div>
                </div>
            </div>
        </div>

        <div class="flashcard-controls">
            <button id="flashcard-prev-btn" ${currentFlashcardIndex === 0 ? "disabled" : ""}>Previous</button>
            <button id="flashcard-flip-btn">Flip</button>
            <button id="flashcard-next-btn" ${currentFlashcardIndex === flashcards.length - 1 ? "disabled" : ""}>Next</button>
        </div>
    `;

    const activeFlashcard = document.getElementById("active-flashcard");
    const prevBtn = document.getElementById("flashcard-prev-btn");
    const flipBtn = document.getElementById("flashcard-flip-btn");
    const nextBtn = document.getElementById("flashcard-next-btn");

    if (activeFlashcard) {
        activeFlashcard.addEventListener("click", () => {
            currentFlashcardFlipped = !currentFlashcardFlipped;
            renderSingleFlashcardView(currentLearningData);
        });
    }

    if (flipBtn) {
        flipBtn.addEventListener("click", () => {
            currentFlashcardFlipped = !currentFlashcardFlipped;
            renderSingleFlashcardView(currentLearningData);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentFlashcardIndex > 0) {
                currentFlashcardIndex -= 1;
                currentFlashcardFlipped = false;
                renderSingleFlashcardView(currentLearningData);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (currentFlashcardIndex < flashcards.length - 1) {
                currentFlashcardIndex += 1;
                currentFlashcardFlipped = false;
                renderSingleFlashcardView(currentLearningData);
            } else {
                renderFlashcardCompleteState();
            }
        });
    }
}

function renderQuizView(data) {
    const quizContainer = document.getElementById("quiz-container");
    if (!quizContainer) return;

    quizContainer.innerHTML = `
        <h3>Quiz</h3>
        ${(data.quiz || []).map((q, i) => `
            <div class="quiz-question">
                <p><strong>${i + 1}. ${q.question}</strong></p>
                ${(q.options || []).map(o => `<div>${o}</div>`).join("")}
                <p><em>Correct: ${(q.options || [])[q.correctIndex] || ""}</em></p>
                <p>${q.explanation || ""}</p>
            </div>
        `).join("")}
    `;
}

function renderFlashcardCompleteState() {
    const container = document.getElementById("flashcards-container");
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding: 40px 20px;">
            <h2 style="margin-bottom: 10px;">🎉 Completed</h2>
            <p style="color:#555; margin-bottom: 20px;">
                You’ve gone through all flashcards.
            </p>

            <div style="display:flex; gap:12px; justify-content:center;">
                <button id="restart-btn" class="btn-primary">
                    Restart
                </button>
                <button id="shuffle-btn" class="btn-secondary">
                    Shuffle
                </button>
            </div>
        </div>
    `;

    document.getElementById("restart-btn")?.addEventListener("click", () => {
        currentFlashcardIndex = 0;
        currentFlashcardFlipped = false;
        renderSingleFlashcardView(currentLearningData);
    });

    document.getElementById("shuffle-btn")?.addEventListener("click", () => {
        currentLearningData.flashcards.sort(() => Math.random() - 0.5);
        currentFlashcardIndex = 0;
        currentFlashcardFlipped = false;
        renderSingleFlashcardView(currentLearningData);
    });
}
    const goal = document.getElementById("decision-goal")?.value || "Help me choose between options";
