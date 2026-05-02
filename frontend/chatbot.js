(function initGearboxChatbot() {
    const API_BASE_URL = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
        ? "http://localhost:4000"
        : "https://gearbox-nhws.onrender.com";

    const pageMode = document.body.dataset.pageMode || "explainer";
    const state = { open: false, messages: [] };

    const shell = document.createElement("div");
    shell.className = "chatbot-shell";
    shell.innerHTML = `
        <button class="chatbot-fab" id="chatbot-fab" aria-label="Open Gearbox Coach">💬</button>
        <section class="chatbot-panel hidden" id="chatbot-panel">
            <div class="chatbot-header"><h4>Gearbox Coach</h4><button id="chatbot-close" type="button">✕</button></div>
            <div class="chatbot-starters" id="chatbot-starters"></div>
            <div class="chatbot-log" id="chatbot-log"></div>
            <form class="chatbot-input" id="chatbot-form">
                <input id="chatbot-text" type="text" placeholder="Ask a follow-up..." />
                <button type="submit">Send</button>
            </form>
        </section>
    `;
    document.body.appendChild(shell);

    const starters = [
        "Explain this product more simply",
        "Give me a customer friendly pitch",
        "What objections might a customer have?",
        "Quiz me on this product",
        "What should I compare this product against?",
        "Help me explain this to a beginner"
    ];
    const startersWrap = shell.querySelector("#chatbot-starters");
    startersWrap.innerHTML = starters.map(s => `<button type="button" class="starter-btn">${s}</button>`).join("");

    const panel = shell.querySelector("#chatbot-panel");
    const log = shell.querySelector("#chatbot-log");
    const input = shell.querySelector("#chatbot-text");
    const form = shell.querySelector("#chatbot-form");

    const renderLog = () => {
        log.innerHTML = state.messages.map(m => `<p class="chat-${m.role}">${m.content}</p>`).join("");
        log.scrollTop = log.scrollHeight;
    };
    const addMessage = (role, content) => { state.messages.push({ role, content }); renderLog(); };

    const getDraftContext = () => {
        if (pageMode === "learn") {
            const draft = {
                store: document.getElementById("store-select")?.value || "",
                department: document.getElementById("department-select")?.value || "",
                productName: document.getElementById("learn-product-name")?.value || "",
                productUrl: document.getElementById("learn-product-url")?.value || "",
                specs: document.getElementById("product-specs")?.value || "",
                employeeContext: document.getElementById("employee-context")?.value || "",
                moduleSize: document.getElementById("module-size")?.value || "free"
            };
            return Object.values(draft).some(Boolean) ? JSON.stringify(draft) : "";
        }
        const draft = {
            productName: document.getElementById("single-product-name")?.value || "",
            productLink: document.getElementById("single-product-link")?.value || "",
            specs: document.getElementById("single-product-specs")?.value || "",
            buyerContext: document.getElementById("single-buyer-context")?.value || "",
            category: document.getElementById("single-category")?.value || "",
            store: document.getElementById("single-store")?.value || ""
        };
        return Object.values(draft).some(Boolean) ? JSON.stringify(draft) : "";
    };

    const getContext = () => {
        const ctx = window.gearboxContext || {};
        if (pageMode === "learn") {
            if (ctx.latestLearn) return { status: "generated", context: JSON.stringify(ctx.latestLearn).slice(0, 4000) };
            const draft = getDraftContext();
            return draft ? { status: "draft", context: draft.slice(0, 4000) } : { status: "none", context: "" };
        }
        if (ctx.latestExplainer) return { status: "generated", context: JSON.stringify(ctx.latestExplainer).slice(0, 4000) };
        const draft = getDraftContext();
        return draft ? { status: "draft", context: draft.slice(0, 4000) } : { status: "none", context: "" };
    };

    async function sendChat(message) {
        addMessage("user", message);
        addMessage("assistant", "Thinking...");
        try {
            const { status, context } = getContext();
            if (status === "none") {
                state.messages.pop();
                addMessage("assistant", "Add a product name, URL, or specs first, then I can help you explain or study it.");
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: pageMode,
                    contextStatus: status,
                    productName: pageMode === "learn" ? document.getElementById("learn-product-name")?.value || "" : document.getElementById("single-product-name")?.value || "",
                    productContext: context,
                    messages: state.messages.slice(-8)
                })
            });
            const data = await res.json();
            state.messages.pop();
            addMessage("assistant", data.reply || "I couldn't answer that yet.");
        } catch (_) {
            state.messages.pop();
            addMessage("assistant", "Chat is temporarily unavailable. If Render is waking up, retry in a few seconds.");
        }
    }

    shell.querySelector("#chatbot-fab").addEventListener("click", () => panel.classList.toggle("hidden"));
    shell.querySelector("#chatbot-close").addEventListener("click", () => panel.classList.add("hidden"));
    startersWrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".starter-btn");
        if (btn) sendChat(btn.textContent.trim());
    });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        input.value = "";
        sendChat(value);
    });
})();
