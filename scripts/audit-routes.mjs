import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const appRoot = path.join(process.cwd(), "src/app/aavahana");
const base = process.env.SANDBOX_URL || "http://localhost:3100";

function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return collect(file);
    if (entry.name !== "page.tsx") return [];
    const relative = path.relative(appRoot, dir).replaceAll("\\", "/");
    if (relative.includes("[")) return [];
    return [`/aavahana${relative ? `/${relative}` : ""}`];
  });
}

const browser = await chromium.launch({ headless: true });
const failures = [];
const routes = collect(appRoot).sort();

for (const route of routes) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("tour:daily-plan:v1", "true"));
  try {
    const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(300);
    if (!response || response.status() >= 400 || errors.length) {
      failures.push({ route, status: response?.status() ?? null, errors });
    }
  } catch (error) {
    failures.push({ route, error: error instanceof Error ? error.message : String(error) });
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(JSON.stringify({ checked: routes.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
