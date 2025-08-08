const mongoose = require("mongoose");
const express = require("express");
const userRouter = require("./routes/userRouter");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

console.log("Starting integrated Express + Astro server...");

// Environment variable validation
const requiredEnvVars = ["APP_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:");
  missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
  console.error(
    "Please check your .env file or create one from .env.example",
  );
  process.exit(1);
}

// Optional environment variables with warnings
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn(
    " EMAIL_USER and EMAIL_PASS not set - email features will not work",
  );
}

// MongoDB connection with fallback
const DB_URI =
  process.env.DB_CONNECT
console.log("Attempting to connect to MongoDB...");

mongoose.set("strictQuery", true);

mongoose
  .connect(DB_URI)
  .then(() => {
    console.log(" Connected to MongoDB successfully");
    console.log(` Database URI: ${DB_URI.replace(/\/\/.*@/, "//***:***@")} `);
  })
  .catch((error) => {
    console.error(" MongoDB connection failed:", error.message);
    console.log(
      "Make sure MongoDB is running or check your DB_CONNECT environment variable",
    );
    process.exit(1);
  });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Reduce caching glitches on sensitive pages (client-side also gates content)
app.disable("etag");
app.use((req, res, next) => {
  if (/^\/(member|president|treasurer|secretary)(\/|$)/.test(req.path)) {
    res.set("Cache-Control", "no-store");
  }
  next();
});

// Mount API routes on /api prefix (single place)
app.use("/api", userRouter);

// Check if Astro build exists
const astroServerPath = path.join(__dirname, "dist", "server", "entry.mjs");
const astroClientPath = path.join(__dirname, "dist", "client");

if (fs.existsSync(astroServerPath) && fs.existsSync(astroClientPath)) {
  console.log(" Astro build found, integrating with Express...");

  // Serve static assets from Astro build
  app.use(express.static(astroClientPath));

  // Dynamic import for Astro SSR handler
  (async () => {
    try {
      const astroModule = await import("./dist/server/entry.mjs");
      const ssrHandler = astroModule.handler;

      // Catch-all handler: send back Astro's SSR response
      app.use(ssrHandler);

      app.listen(PORT, () => {
        console.log(` Server is running on port ${PORT}`);
        console.log(` http://localhost:${PORT}`);
        console.log(" Astro SSR integrated successfully");
      });
    } catch (error) {
      console.error("Error loading Astro SSR handler:", error);
      console.error("Astro SSR required. Run 'npm run build' and restart.");
      process.exit(1);
    }
  })();
} else {
  console.error(" Astro build not found. Run 'npm run build' first.");
  process.exit(1);
}
