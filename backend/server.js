/*************************************************
 * Gearbox Backend Server
 *************************************************/

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const explainerRoutes = require("./routes/explainer");
const learnRoutes = require("./routes/learn"); // ✅ NEW
const chatRoutes = require("./routes/chat");
const productLookupRoutes = require("./routes/productLookup");

const app = express();

/* ------------------ Middleware ------------------ */

app.use(cors());
app.use(express.json());

/* ------------------ Routes ------------------ */

app.get("/", (req, res) => {
    res.send("Gearbox backend running.");
});

// Explainer Mode
app.use("/api", explainerRoutes);

// Learn Mode
app.use("/api/learn", learnRoutes); // ✅ NEW
app.use("/api/chat", chatRoutes);
app.use("/api/product-lookup", productLookupRoutes);

/* ------------------ Server ------------------ */

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Gearbox backend listening on http://localhost:${PORT}`);
});
