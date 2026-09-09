const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(root, ".next", "standalone", ".next", "static");

const publicSrc = path.join(root, "public");
const publicDest = path.join(root, ".next", "standalone", "public");

if (fs.existsSync(staticSrc)) {
  fs.mkdirSync(path.dirname(staticDest), { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log("Copied .next/static to .next/standalone/.next/static");
}

if (fs.existsSync(publicSrc)) {
  fs.mkdirSync(publicDest, { recursive: true });
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log("Copied public to .next/standalone/public");
}

// Dereference and replace any Windows symlinks or junctions with real directories
const replaceSymlinks = (dir) => {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    try {
      const stat = fs.lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        const real = fs.realpathSync(fullPath);
        console.log(`Replacing symlink: ${fullPath} -> ${real}`);
        fs.unlinkSync(fullPath);
        fs.cpSync(real, fullPath, { recursive: true, dereference: true });
      } else if (stat.isDirectory()) {
        replaceSymlinks(fullPath);
      }
    } catch (err) {
      console.error(`Error processing symlink at ${fullPath}:`, err.message);
    }
  }
};

const standaloneDir = path.join(root, ".next", "standalone");
replaceSymlinks(standaloneDir);
console.log("Standalone preparation and symlink dereferencing complete.");
