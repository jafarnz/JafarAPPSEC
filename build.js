const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("Building Astro application...");

// Ensure dist directory exists
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build Astro
exec("npx astro build", (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error}`);
    return;
  }

  if (stderr) {
    console.error(`Build stderr: ${stderr}`);
  }

  console.log(`Build stdout: ${stdout}`);
  console.log("Astro build completed successfully!");

  // Check if the build was successful by verifying key files exist
  const serverEntryPath = path.join(__dirname, "dist", "server", "entry.mjs");
  const clientDir = path.join(__dirname, "dist", "client");

  if (fs.existsSync(serverEntryPath) && fs.existsSync(clientDir)) {
    console.log("Build verification passed - all necessary files are present");
  } else {
    console.log("  Build verification failed - some files may be missing");
    console.log(`Server entry exists: ${fs.existsSync(serverEntryPath)}`);
    console.log(`Client dir exists: ${fs.existsSync(clientDir)}`);
  }
});
