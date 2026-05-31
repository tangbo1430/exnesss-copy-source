import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://127.0.0.1:4173/pa/trading/open-account", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(500);
const inputType = await page.locator('label:has-text("Trading password")').locator("..").locator("input").first().getAttribute("type");
console.log("password input type:", inputType);
await browser.close();
