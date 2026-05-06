const express = require("express");
const { fetch } = require("undici");

const router = express.Router();

function textBetween(str, re) {
    const m = str.match(re);
    return m && m[1] ? m[1].trim() : "";
}

router.post("/", async (req, res) => {
    const { productName = "", productUrl = "", store = "", department = "" } = req.body || {};
    const warnings = [];
    const result = {
        productName: productName || "unknown",
        brand: "unknown",
        category: department || "unknown",
        description: "unknown",
        specs: [],
        likelyUseCases: [],
        sourceUrl: productUrl || "",
        confidence: "low",
        warnings
    };

    if (!productUrl && !productName) {
        warnings.push("Provide product name or URL for lookup.");
        return res.json(result);
    }

    if (!productUrl) {
        warnings.push("No product URL provided. Add URL or paste specs for higher accuracy.");
        result.description = `Draft lookup for ${productName}. Exact technical specs were not verified from a source page.`;
        result.likelyUseCases = ["General customer explanation", "Basic fit guidance"];
        return res.json(result);
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        const response = await fetch(productUrl, { method: "GET", signal: controller.signal });
        clearTimeout(timeout);
        const html = await response.text();

        const title = textBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
        const metaDescription = textBetween(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
            || textBetween(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
        const jsonLdRaw = textBetween(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);

        result.productName = productName || title || "unknown";
        result.description = metaDescription || "Description not clearly available from page metadata.";
        result.confidence = metaDescription || title ? "medium" : "low";

        if (jsonLdRaw) {
            try {
                const jsonLd = JSON.parse(jsonLdRaw);
                const item = Array.isArray(jsonLd) ? jsonLd[0] : jsonLd;
                result.brand = item?.brand?.name || item?.brand || result.brand;
                result.category = item?.category || result.category;
                const offers = item?.offers;
                if (item?.sku) result.specs.push(`SKU: ${item.sku}`);
                if (offers?.price) result.specs.push(`Price: ${offers.price}`);
            } catch (_) {
                warnings.push("Structured data could not be parsed.");
            }
        }

        const visibleText = html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        if (visibleText) {
            result.specs.push(`Page snippet: ${visibleText.slice(0, 240)}`);
        }

        result.likelyUseCases = [
            `Store coaching for ${store || "retail"} staff`,
            "Customer-friendly product overview",
            "Comparison prep for buyer questions"
        ];
        if (!metaDescription) warnings.push("Metadata was limited; paste specs for better accuracy.");
    } catch (_) {
        warnings.push("Product page could not be fetched quickly. Paste specs manually for best results.");
        result.description = "Lookup failed or blocked by website. You can still continue with product name and pasted specs.";
        result.confidence = "low";
    }

    res.json(result);
});

module.exports = router;
