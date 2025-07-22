const mongoose = require("mongoose");
const express = require("express");
const userRouter = require("./routes/userRouter");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

console.log("Starting integrated Express + Astro server...");
console.log(process.env.DB_CONNECT);

mongoose.set("strictQuery", true);

mongoose.connect(process.env.DB_CONNECT).then(() => {
  console.log("Connected to MongoDB");
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if Astro build exists
const astroServerPath = path.join(__dirname, "dist", "server", "entry.mjs");
const astroClientPath = path.join(__dirname, "dist", "client");

if (fs.existsSync(astroServerPath) && fs.existsSync(astroClientPath)) {
  console.log("✅ Astro build found, integrating with Express...");

  // Serve static assets from Astro build
  app.use(express.static(astroClientPath));

  // Mount API routes on /api prefix
  app.use("/api", userRouter);

  // Dynamic import for Astro SSR handler
  (async () => {
    try {
      const astroModule = await import("./dist/server/entry.mjs");
      const ssrHandler = astroModule.handler;

      // Catch-all handler: send back Astro's SSR response
      app.use(ssrHandler);

      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`🌐 http://localhost:${PORT}`);
        console.log("📦 Astro SSR integrated successfully");
      });
    } catch (error) {
      console.error("❌ Error loading Astro SSR handler:", error);
      startFallbackServer();
    }
  })();
} else {
  console.log("⚠️  Astro build not found, starting fallback mode...");
  console.log("Run 'npm run build' first to build the Astro app");
  startFallbackServer();
}

function startFallbackServer() {
  // Fallback: serve a simple message and API routes only
  app.use("/api", userRouter);

  app.get("*", (req, res) => {
    res.send(`
      <html>
        <head><title>CCA Portal - Build Required</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>🏗️ Build Required</h1>
          <p>Please run <code>npm run build</code> to build the Astro application.</p>
          <p>Then restart the server with <code>npm run dev</code></p>
          <hr>
          <p>API endpoints are available at:</p>
          <ul style="list-style: none;">
            <li>POST /api/register-member (with email verification)</li>
            <li>POST /api/register-president (with email verification)</li>
            <li>POST /api/register-treasurer (with email verification)</li>
            <li>POST /api/register-secretary (with email verification)</li>
            <li>POST /api/verify-email</li>
            <li>POST /api/request-password-reset</li>
            <li>POST /api/reset-password</li>
            <li>POST /api/login-member</li>
            <li>POST /api/login-president</li>
            <li>POST /api/login-treasurer</li>
            <li>POST /api/login-secretary</li>
            <li>GET /api/member-protected</li>
            <li>GET /api/president-protected</li>
            <li>GET /api/treasurer-protected</li>
            <li>GET /api/secretary-protected</li>
          </ul>
        </body>
      </html>
    `);
  });

  app.listen(PORT, () => {
    console.log(`🚀 Fallback server is running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("⚠️  Run 'npm run build' to enable Astro integration");
  });
}
