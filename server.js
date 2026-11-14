/**
 * Startup file for WhoGoHost DirectAdmin (Setup Node.js App).
 * Set the application startup file to server.js.
 * The panel injects PORT. The app listens on 0.0.0.0 so the proxy can reach it.
 *
 * Build first: npm run build
 */
const fs = require("fs");
const path = require("path");

process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

const standalone = path.join(__dirname, ".next", "standalone", "server.js");

if (!fs.existsSync(standalone)) {
  console.error("Missing production build. From the app folder run: npm run build");
  process.exit(1);
}

process.chdir(path.join(__dirname, ".next", "standalone"));
require(standalone);
