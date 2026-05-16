const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "content", "site.json");
const targetPath = path.join(root, "site-content.js");

const content = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const output = `window.kamSiteContent = ${JSON.stringify(content, null, 2)};\n`;

fs.writeFileSync(targetPath, output);
console.log("Updated site-content.js from content/site.json");

