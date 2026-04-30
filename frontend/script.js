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
    const singleStoreSelect = document.getElementById("single-store");
    const singleStoreOtherWrap = document.getElementById("single-store-other-wrap");

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
        const clearBtn = e.target.closest("#clear-followup-btn");
        const decisionActionBtn = e.target.closest("[data-decision-action]");
        const refineFocusBtn = e.target.closest("[data-refine-focus]");

        if (decisionActionBtn) {
            const action = decisionActionBtn.dataset.decisionAction;
            if (action === "compare-better-options") {
                const singleProductName = document.getElementById("single-product-name")?.value.trim() || "";
                const singleStore = document.getElementById("single-store")?.value || "";
                const otherStore = document.getElementById("single-store-other")?.value.trim() || "";
                const resolvedStore = singleStore === "Other" ? otherStore : singleStore;

                setMode("compare");
                setGoal("Compare two products");

                const compareAName = document.getElementById("compare-a-name");
                const compareAStore = document.getElementById("compare-a-store");
                if (compareAName && singleProductName) compareAName.value = singleProductName;
                if (compareAStore && resolvedStore) compareAStore.value = resolvedStore;

                const comparePanel = document.querySelector('[data-panel="compare"]');
                comparePanel?.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }

            if (action === "refine-needs") {
                renderDecisionInlinePanel("refine");
                return;
            }

            if (action === "learn-matters") {
                renderDecisionInlinePanel("learn");
                return;
            }
        }

        if (refineFocusBtn) {
            const focus = refineFocusBtn.dataset.refineFocus || "";
            applyRefinementFocus(focus);
            return;
        }

        if (clearBtn) {
            clearFollowupAnswer();
            return;
        }
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

    if (singleStoreSelect && singleStoreOtherWrap) {
        const syncOtherStoreInput = () => {
            singleStoreOtherWrap.classList.toggle("hidden", singleStoreSelect.value !== "Other");
        };
        singleStoreSelect.addEventListener("change", syncOtherStoreInput);
        syncOtherStoreInput();
    }
}

async function handleSingleExplainClick(goal) {
    const selectedStore = document.getElementById("single-store")?.value || "";
    const customOtherStore = document.getElementById("single-store-other")?.value.trim() || "";
    const resolvedStore = selectedStore === "Other" ? customOtherStore : selectedStore;
    const productLink = document.getElementById("single-product-link")?.value.trim() || "";
    const linkContext = buildLinkContext(productLink);

    const payload = {
        mode: "single",
        decisionGoal: goal,
        category: document.getElementById("single-category")?.value || "",
        buyerContext: document.getElementById("single-buyer-context")?.value.trim() || "",
        productName: document.getElementById("single-product-name")?.value.trim() || "",
        store: resolvedStore || "",
        specs: document.getElementById("single-product-specs")?.value.trim() || "",
        pageText: [productLink, linkContext].filter(Boolean).join("\n")
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

            ${renderDecisionPath(data)}

            <div class="explainer-result-grid">
                ${buildResultCard("Plain English summary", `<p>${escapeHtml(paragraphOrFallback(data.plainEnglishSummary, "No summary generated yet."))}</p>`) }
                ${buildResultCard("Who it’s for", listToHtml(listOrEmpty(data.bestFor), "No audience guidance generated yet."))}
                ${buildResultCard("Who should avoid it", listToHtml(listOrEmpty(data.notIdealFor), "No caution guidance generated yet."))}
                ${buildResultCard("What actually matters in the specs", listToHtml(listOrEmpty(data.specsThatMatter), "No specs guidance generated yet."))}
                ${buildResultCard("What it feels like to use", listToHtml(listOrEmpty(data.realWorldFeel), "No real-world feel guidance generated yet."))}
                ${buildResultCard("What you are paying for", listToHtml(listOrEmpty(data.whatYouArePayingFor), "No pricing-value guidance generated yet."))}
                ${buildResultCard("Recommendation", `<p>${escapeHtml(paragraphOrFallback(data.recommendation, "No recommendation generated yet."))}</p>`) }
            </div>

            ${renderDecisionChecklist(data)}
        </div>
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
    `;
}

function renderDecisionPath(data) {
    const finalDecision = inferDecisionLabel(data.quickVerdict, data.recommendation);
    const reasons = [
        paragraphOrFallback(data.plainEnglishSummary, ""),
        paragraphOrFallback(data.whatActuallyMatters, ""),
        ...listOrEmpty(data.redFlags)
    ].filter(Boolean).slice(0, 3);
    const checks = [
        ...listOrEmpty(data.missingInfo),
        ...listOrEmpty(data.questionsToAsk)
    ];

    return `
        <article class="result-card featured-card decision-path-card">
            <h4>Decision Path</h4>
            <div class="decision-path-block">
                <p class="decision-path-label">Final decision</p>
                <p><span class="decision-pill decision-${finalDecision.key}">${finalDecision.label}</span></p>
            </div>
            <div class="decision-path-block">
                <p class="decision-path-label">Why this decision</p>
                ${listToHtml(reasons, "Not enough evidence yet. Add product details and buyer context for a stronger recommendation.")}
            </div>
            <div class="decision-path-block">
                <p class="decision-path-label">What to check before buying</p>
                ${listToHtml(checks, "Ask for missing specs and return policy details before buying.")}
            </div>
            <div class="decision-path-block">
                <p class="decision-path-label">Next step (most important)</p>
                <div class="decision-actions">
                    <button class="decision-btn primary" type="button" data-decision-action="compare-better-options">Compare with better options</button>
                    <button class="decision-btn" type="button" data-decision-action="refine-needs">Refine my needs</button>
                    <button class="decision-btn" type="button" data-decision-action="learn-matters">Learn what matters</button>
                </div>
                <div class="decision-inline-panel hidden" id="decision-inline-panel"></div>
            </div>
        </article>
    `;
    panel.classList.remove("hidden");
}

async function applyRefinementFocus(focus) {
    const buyerContextEl = document.getElementById("single-buyer-context");
    if (!buyerContextEl) return;

    const notes = {
        comfort: "Priority: Comfort matters most.",
        budget: "Priority: Budget matters most.",
        performance: "Priority: Performance matters most."
    };
    const note = notes[focus];
    if (!note) return;

    if (!buyerContextEl.value.includes(note)) {
        buyerContextEl.value = [buyerContextEl.value.trim(), note].filter(Boolean).join("\n");
    }

    const panel = document.getElementById("decision-inline-panel");
    if (panel) {
        panel.innerHTML += `<p class="decision-inline-note">Refreshing guidance with your new priority: ${escapeHtml(note)}</p>`;
    }

    await handleSingleExplainClick("Is this right for me?");
}

function getCategoryLearningBullets(category) {
    if (category === "Bike") {
        return ["Fit and frame size", "Brake type", "Tire width", "Gearing range", "Intended terrain"];
    }
    return ["Fit for your use case", "Comfort over long sessions", "Durability and maintenance", "Core performance specs", "Total ownership cost"];
}

function inferDecisionLabel(quickVerdict, recommendation) {
    const joined = `${quickVerdict || ""} ${recommendation || ""}`.toLowerCase();
    if (/(not recommended|avoid|skip|poor fit|don'?t buy|bad fit)/.test(joined)) {
        return { key: "not-recommended", label: "Not recommended" };
    }
    if (/(good fit|strong fit|recommended|buy|worth it|great option)/.test(joined)) {
        return { key: "good-fit", label: "Good fit" };
    }
    return { key: "maybe", label: "Maybe" };
}

function renderDecisionInlinePanel(mode) {
    const panel = document.getElementById("decision-inline-panel");
    if (!panel) return;

    if (mode === "refine") {
        panel.innerHTML = `
            <p class="decision-inline-title">Refine my needs</p>
            <div class="decision-actions">
                <button class="decision-btn" type="button" data-refine-focus="comfort">Comfort matters most</button>
                <button class="decision-btn" type="button" data-refine-focus="budget">Budget matters most</button>
                <button class="decision-btn" type="button" data-refine-focus="performance">Performance matters most</button>
            </div>
            <p class="decision-inline-note">Pick one to tighten guidance. We will update buyer context and refresh the recommendation.</p>
        `;
        panel.classList.remove("hidden");
        return;
    }

    const category = document.getElementById("single-category")?.value || "";
    const bullets = getCategoryLearningBullets(category);
    panel.innerHTML = `
        <p class="decision-inline-title">What matters most for ${escapeHtml(category || "this category")}</p>
        <ul>${bullets.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    `;
    panel.classList.remove("hidden");
}

async function applyRefinementFocus(focus) {
    const buyerContextEl = document.getElementById("single-buyer-context");
    if (!buyerContextEl) return;

    const notes = {
        comfort: "Priority: Comfort matters most.",
        budget: "Priority: Budget matters most.",
        performance: "Priority: Performance matters most."
    };
    const note = notes[focus];
    if (!note) return;

    if (!buyerContextEl.value.includes(note)) {
        buyerContextEl.value = [buyerContextEl.value.trim(), note].filter(Boolean).join("\n");
    }

    const panel = document.getElementById("decision-inline-panel");
    if (panel) {
        panel.innerHTML += `<p class="decision-inline-note">Refreshing guidance with your new priority: ${escapeHtml(note)}</p>`;
    }

    await handleSingleExplainClick("Is this right for me?");
}

function getCategoryLearningBullets(category) {
    if (category === "Bike") {
        return ["Fit and frame size", "Brake type", "Tire width", "Gearing range", "Intended terrain"];
    }
    return ["Fit for your use case", "Comfort over long sessions", "Durability and maintenance", "Core performance specs", "Total ownership cost"];
}

function inferDecisionLabel(quickVerdict, recommendation) {
    const joined = `${quickVerdict || ""} ${recommendation || ""}`.toLowerCase();
    if (/(not recommended|avoid|skip|poor fit|don'?t buy|bad fit)/.test(joined)) {
        return { key: "not-recommended", label: "Not recommended" };
    }
    if (/(good fit|strong fit|recommended|buy|worth it|great option)/.test(joined)) {
        return { key: "good-fit", label: "Good fit" };
    }
    return { key: "maybe", label: "Maybe" };
}

function renderDecisionChecklist(data) {
    const confidenceRaw = paragraphOrFallback(data.confidenceLevel, "Low");
    const confidence = ["High", "Medium", "Low"].includes(confidenceRaw) ? confidenceRaw : "Low";
    const confidenceClass = `confidence-${confidence.toLowerCase()}`;

    return `
        <div class="result-card featured-card">
            <h4>Decision Checklist <span class="confidence-badge ${confidenceClass}">${confidence}</span></h4>
            <p><strong>Why confidence is this level:</strong> ${escapeHtml(paragraphOrFallback(data.confidenceReason, "Limited verified details were provided."))}</p>
            <p><strong>Best next step:</strong> ${escapeHtml(paragraphOrFallback(data.bestNextStep, "Ask for key specs before purchasing."))}</p>
            <p><strong>Missing information:</strong></p>
            ${listToHtml(listOrEmpty(data.missingInfo), "No missing info identified.")}
            <p><strong>Questions to ask before buying:</strong></p>
            ${listToHtml(listOrEmpty(data.questionsToAsk), "No suggested questions generated.")}
            <p><strong>Red flags:</strong></p>
            ${listToHtml(listOrEmpty(data.redFlags), "No red flags generated.")}
        </div>
    `;
}

function buildLinkContext(link) {
    if (!link) return "";
    try {
        const url = new URL(link);
        const host = url.hostname.replace(/^www\./, "");
        const hostLabel = host.split(".")[0]?.toUpperCase() || "";
        const pathKeywords = url.pathname
            .split("/")
            .filter(Boolean)
            .map(seg => seg.replace(/[-_]/g, " ").replace(/\.[a-z0-9]+$/i, ""))
            .filter(Boolean)
            .slice(-3)
            .join(", ");

        return `LINK CONTEXT: domain=${host}, inferredBrand=${hostLabel || "unknown"}, urlKeywords=${pathKeywords || "none"}`;
    } catch (_) {
        return `LINK CONTEXT: rawUrl=${link}`;
    }
}

function renderFollowupTip(label, context) {
    const panel = document.getElementById("followup-answer-panel");
    const title = document.getElementById("followup-question-title");
    const out = document.getElementById("followup-response");
    if (!out || !panel || !title) return;

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

    title.textContent = label || "Follow-up question";
    out.textContent = `${tips[label] || "Use this as a next-step buying question."}${suffix}`;
    panel.classList.remove("hidden");
}

function clearFollowupAnswer() {
    const panel = document.getElementById("followup-answer-panel");
    const out = document.getElementById("followup-response");
    const title = document.getElementById("followup-question-title");

    if (!panel || !out || !title) return;

    panel.classList.add("hidden");
    out.textContent = "";
    title.textContent = "Follow-up question";

    document.querySelectorAll(".followup-chips .chip.active").forEach(chip => {
        chip.classList.remove("active");
    });
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
let currentQuizIndex = 0;
let currentQuizScore = 0;
let currentQuizAnswered = false;
let flashcardMastery = {};

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
    const productName = document.getElementById("learn-product-name")?.value.trim() || "";
    const employeeContext = document.getElementById("employee-context")?.value.trim() || "";
    const specs = document.getElementById("product-specs")?.value.trim();
    const btn = document.getElementById("generate-learning-btn");
    const status = document.getElementById("learn-status");

    if (!specs) {
        if (status) status.innerHTML = `<p class="learn-inline-error">Please paste product specs or details before generating.</p>`;
        return;
    }

    const flashcardsContainer = document.getElementById("flashcards-container");
    const quizContainer = document.getElementById("quiz-container");

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Generating...";
    }
    if (status) status.innerHTML = `<p class="learn-inline-loading">Generating training module...</p>`;

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
            body: JSON.stringify({ store, department, specs, productName, employeeContext })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to generate learning module");
        }

        currentLearningData = data;
        currentFlashcardIndex = 0;
        currentFlashcardFlipped = false;
        currentQuizIndex = 0;
        currentQuizScore = 0;
        currentQuizAnswered = false;
        flashcardMastery = {};

        renderLearningModule(data);
        if (status) status.innerHTML = `<p class="learn-inline-success">Training module ready. Start with flashcards.</p>`;
        activateLearnTab("flashcards-tab");

    } catch (err) {
        console.error(err);

        if (flashcardsContainer) {
            flashcardsContainer.innerHTML = `<p class="learn-inline-error">Could not generate flashcards right now.</p>`;
        }

        if (quizContainer) {
            quizContainer.innerHTML = `<p class="learn-inline-error">Could not generate quiz right now.</p>`;
        }
        if (status) status.innerHTML = `<p class="learn-inline-error">Something went wrong while generating the module.</p>`;
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
    renderTrainingSummary(data);
    renderSingleFlashcardView(data);
    renderQuizView(data);
}

function renderTrainingSummary(data) {
    const container = document.getElementById("training-summary");
    if (!container) return;

    const overview = paragraphOrFallback(data.summary || data.productOverview, "Overview will appear after generation.");
    const talkingPoints = listOrEmpty(data.topTalkingPoints || data.talkingPoints);
    const objections = listOrEmpty(data.commonObjections || data.objections);
    const fit = listOrEmpty(data.bestFit || data.bestFor);
    const notFit = listOrEmpty(data.notBestFit || data.notIdealFor);

    container.innerHTML = `
        <section class="summary-grid">
            <article class="learn-summary-card"><h3>Product overview</h3><p>${escapeHtml(overview)}</p></article>
            <article class="learn-summary-card"><h3>Key talking points</h3>${listToHtml(talkingPoints, "No talking points generated yet.")}</article>
            <article class="learn-summary-card"><h3>Customer objections</h3>${listToHtml(objections, "No objections generated yet.")}</article>
            <article class="learn-summary-card"><h3>Best fit / Not best fit</h3><p><strong>Best fit:</strong></p>${listToHtml(fit, "No best-fit guidance generated yet.")}<p><strong>Not best fit:</strong></p>${listToHtml(notFit, "No mismatch guidance generated yet.")}</article>
        </section>
    `;
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

    const progressPercent = Math.round(((currentFlashcardIndex + 1) / flashcards.length) * 100);
    const masteredCount = Object.values(flashcardMastery).filter(v => v === "mastered").length;
    flashcardsContainer.innerHTML = `
        <div class="flashcard-progress">Card ${currentFlashcardIndex + 1} of ${flashcards.length}</div>
        <div class="flashcard-progress-meta">
            <span>Mastered: ${masteredCount}</span>
            <span>Progress: ${progressPercent}%</span>
        </div>
        <div class="flashcard-progress-bar"><span style="width:${progressPercent}%"></span></div>

        <div class="flashcard-viewer">
            <div class="flashcard-card ${currentFlashcardFlipped ? "flipped" : ""}" id="active-flashcard">
                <div class="flashcard-face flashcard-front">
                    <div>${escapeHtml(card.front || "No prompt generated.")}</div>
                    <div class="flashcard-hint">Click to flip</div>
                </div>
                <div class="flashcard-face flashcard-back">
                    <div>${escapeHtml(card.back || "No answer generated.")}</div>
                </div>
            </div>
        </div>

        <div class="flashcard-controls">
            <button id="flashcard-prev-btn" ${currentFlashcardIndex === 0 ? "disabled" : ""}>Previous</button>
            <button id="flashcard-flip-btn">Flip</button>
            <button id="flashcard-next-btn" ${currentFlashcardIndex === flashcards.length - 1 ? "disabled" : ""}>Next</button>
        </div>
        <div class="flashcard-learning-controls">
            <button id="mark-mastered-btn" class="${flashcardMastery[currentFlashcardIndex] === "mastered" ? "active" : ""}">Mastered</button>
            <button id="mark-learning-btn" class="${flashcardMastery[currentFlashcardIndex] === "learning" ? "active" : ""}">Still learning</button>
        </div>
    `;

    const activeFlashcard = document.getElementById("active-flashcard");
    const prevBtn = document.getElementById("flashcard-prev-btn");
    const flipBtn = document.getElementById("flashcard-flip-btn");
    const nextBtn = document.getElementById("flashcard-next-btn");
    const masteredBtn = document.getElementById("mark-mastered-btn");
    const learningBtn = document.getElementById("mark-learning-btn");

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
    if (masteredBtn) masteredBtn.addEventListener("click", () => {
        flashcardMastery[currentFlashcardIndex] = "mastered";
        renderSingleFlashcardView(currentLearningData);
    });
    if (learningBtn) learningBtn.addEventListener("click", () => {
        flashcardMastery[currentFlashcardIndex] = "learning";
        renderSingleFlashcardView(currentLearningData);
    });
}

function renderQuizView(data) {
    const quizContainer = document.getElementById("quiz-container");
    if (!quizContainer) return;
    const quiz = Array.isArray(data.quiz) ? data.quiz : [];
    if (!quiz.length) {
        quizContainer.innerHTML = `<p>No quiz questions were generated.</p>`;
        return;
    }

    if (currentQuizIndex >= quiz.length) {
        quizContainer.innerHTML = `
            <div class="quiz-score-card">
                <h3>Quiz Complete</h3>
                <p id="quiz-score">Score: ${currentQuizScore} / ${quiz.length}</p>
                <button id="quiz-restart-btn" class="decision-btn primary" type="button">Retake quiz</button>
            </div>
        `;
        document.getElementById("quiz-restart-btn")?.addEventListener("click", () => {
            currentQuizIndex = 0;
            currentQuizScore = 0;
            currentQuizAnswered = false;
            renderQuizView(currentLearningData);
        });
        return;
    }

    const q = quiz[currentQuizIndex] || {};
    const options = Array.isArray(q.options) ? q.options : [];
    quizContainer.innerHTML = `
        <div class="quiz-question ${currentQuizAnswered ? "answered" : ""}">
            <p class="quiz-progress">Question ${currentQuizIndex + 1} of ${quiz.length}</p>
            <p class="quiz-score-live">Score: ${currentQuizScore} / ${quiz.length}</p>
            <p><strong>${escapeHtml(q.question || "No question generated.")}</strong></p>
            <div class="quiz-options">
                ${options.map((opt, idx) => `<button class="quiz-option" type="button" data-quiz-option="${idx}" ${currentQuizAnswered ? "disabled" : ""}>${escapeHtml(opt)}</button>`).join("")}
            </div>
            <p class="quiz-feedback" id="quiz-feedback"></p>
            <button id="quiz-next-btn" class="decision-btn primary ${currentQuizAnswered ? "" : "hidden"}" type="button">Next question</button>
        </div>
    `;

    const feedback = document.getElementById("quiz-feedback");
    quizContainer.querySelectorAll("[data-quiz-option]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentQuizAnswered) return;
            currentQuizAnswered = true;
            const selected = Number(btn.dataset.quizOption);
            const correct = Number(q.correctIndex);
            const isCorrect = selected === correct;
            if (isCorrect) currentQuizScore += 1;
            btn.classList.add(isCorrect ? "correct" : "incorrect");
            const correctBtn = quizContainer.querySelector(`[data-quiz-option="${correct}"]`);
            correctBtn?.classList.add("correct");
            quizContainer.querySelectorAll("[data-quiz-option]").forEach(optionBtn => optionBtn.disabled = true);
            if (feedback) feedback.textContent = isCorrect
                ? "Correct. Nice explanation-ready answer."
                : `Not quite. Correct answer: ${options[correct] || "N/A"}.`;
            document.getElementById("quiz-next-btn")?.classList.remove("hidden");
        });
    });

    document.getElementById("quiz-next-btn")?.addEventListener("click", () => {
        currentQuizIndex += 1;
        currentQuizAnswered = false;
        renderQuizView(currentLearningData);
    });
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
