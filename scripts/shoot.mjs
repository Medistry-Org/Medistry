// usage: node scripts/shoot.mjs <outdir> [url] [--full]
import { chromium } from "playwright";
const out = process.argv[2] || "shots";
const url = process.argv[3] || "http://localhost:3000/";
const full = process.argv.includes("--full");
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [name, vp, mobile] of [["m", { width: 390, height: 844 }, true], ["d", { width: 1440, height: 900 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(url, { waitUntil: "networkidle" });
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `${out}/${name}-0.jpg`, quality: 72 });
  if (full) {
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    let i = 1;
    for (let y = vp.height; y < H; y += vp.height) {
      await p.evaluate((y) => window.scrollTo(0, y), y);
      await p.waitForTimeout(1900);
      await p.screenshot({ path: `${out}/${name}-${i++}.jpg`, quality: 72 });
    }
  }
  const ov = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  console.log(name, "overflow", ov, "errors", errs.slice(0, 5));
  await ctx.close();
}
await b.close();
