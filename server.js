/**
 * Startup file for the WhoGoHost cPanel Node.js application.
 * Set the application startup file to server.js.
 * The panel injects PORT. The app listens on 0.0.0.0 so the proxy can reach it.
 *
 * Build first: npm run build
 */
const fs = require("fs");
const path = require("path");

// WhoGoHost keeps panel variables in the app folder. Next's standalone
// server changes directory before it starts, so load them here first.
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, ".env"));
loadEnvFile(path.join(__dirname, ".env.production"));
loadEnvFile(path.join(__dirname, ".env.local"));
loadEnvFile(path.join(path.dirname(process.execPath), "..", ".env"));

process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

const standalone = path.join(__dirname, ".next", "standalone", "server.js");

if (!fs.existsSync(standalone)) {
  console.error("Missing production build. From the app folder run: npm run build");
  process.exit(1);
}

process.chdir(path.join(__dirname, ".next", "standalone"));
require(standalone);
