import { expect, test } from "@playwright/test";
import { settled } from "./helpers";

for (const path of ["/", "/states", "/system", "/about"]) {
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path === "/") await settled(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("Reduce Motion: the stream still completes, with no blur", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto("/");
  await settled(page);
  const filter = await page.locator("#card-moment").evaluate((el) => getComputedStyle(el).animationName);
  expect(filter).toBe("fade");
  await ctx.close();
});
