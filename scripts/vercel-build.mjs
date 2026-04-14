import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const clientDir = resolve(root, "client");
const clientDist = resolve(clientDir, "dist");
const publicDir = resolve(root, "public");

execSync("npm run build", { stdio: "inherit", cwd: root });
execSync("npm run build", { stdio: "inherit", cwd: clientDir });

if (existsSync(publicDir)) {
  rmSync(publicDir, { recursive: true, force: true });
}

mkdirSync(publicDir, { recursive: true });
cpSync(clientDist, publicDir, { recursive: true });

console.log(`Copied ${clientDist} -> ${publicDir}`);
