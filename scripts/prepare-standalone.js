/**
 * Next's standalone output does not include public assets until they are copied
 * next to the generated server. WhoGoHost starts that server through server.js.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
}

if (!fs.existsSync(standalone)) {
  console.error("No standalone build found. Run next build with output: 'standalone'.");
  process.exit(1);
}

copyDir(path.join(root, "public"), path.join(standalone, "public"));
copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
console.log("Standalone server is ready.");
