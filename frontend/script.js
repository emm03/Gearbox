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

function initExplainerMode() {
    const explainBtn = document.getElementById("explainer-submit");
    if (!explainBtn) return;

    explainBtn.addEventListener("click", handleExplainClick);
}

async function handleExplainClick() {
    const productName = document.getElementById("product-name")?.value.trim();
    const store = document.getElementById("product-store")?.value.trim();
    const specs = document.getElementById("product-specs")?.value.trim();

    if (!productName) {
        alert("Please enter a product name.");
        return;
    }

    const resultsSection = document.querySelector(".explainer-results-section");
    if (resultsSection) {
        resultsSection.innerHTML = `<p>Analyzing product...</p>`;
    }

    try {
        const response = await fetch("http://localhost:4000/api/explain", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ productName, store, specs })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to explain product");
        }

        renderExplainerResult(data);

    } catch (err) {
        console.error(err);
        if (resultsSection) {
            resultsSection.innerHTML = `<p>Something went wrong.</p>`;
        }
    }
}

function renderExplainerResult(data) {
    const resultsSection = document.querySelector(".explainer-results-section");
    if (!resultsSection) return;

    resultsSection.innerHTML = `
        <div class="explainer-card">
            <h2>${data.title || "Product explanation"}</h2>

            <p class="explainer-summary">
                ${data.overview || ""}
            </p>

            ${Array.isArray(data.goodFor) && data.goodFor.length ? `
                <h3>What this product is good for</h3>
                <ul>
                    ${data.goodFor.map(item => `<li>${item}</li>`).join("")}
                </ul>
            ` : ""}

            ${Array.isArray(data.feelsLike) && data.feelsLike.length ? `
                <h3>What it feels like to use</h3>
                <ul>
                    ${data.feelsLike.map(item => `<li>${item}</li>`).join("")}
                </ul>
            ` : ""}

            ${Array.isArray(data.specsMeaning) && data.specsMeaning.length ? `
                <h3>What the specs actually mean</h3>
                <ul>
                    ${data.specsMeaning.map(item => `<li>${item}</li>`).join("")}
                </ul>
            ` : ""}

            ${Array.isArray(data.thingsToKnow) && data.thingsToKnow.length ? `
                <h3>Things to know before choosing it</h3>
                <ul>
                    ${data.thingsToKnow.map(item => `<li>${item}</li>`).join("")}
                </ul>
            ` : ""}

            ${data.whoFor ? `
                <h3>Who this is for</h3>
                <p>${data.whoFor}</p>
            ` : ""}

            ${data.nextStep ? `
                <div class="explainer-followup">
                    <em>${data.nextStep}</em>
                </div>
            ` : ""}
        </div>
    `;
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