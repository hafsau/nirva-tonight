import { expect, test } from "@playwright/test";
import { axe, settled } from "./helpers";

test("tonight, settled", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await axe(page);
});

test("tonight, sheets open", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await page.getByRole("button", { name: "That's not how I felt" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await axe(page);
});

for (const path of ["/states", "/system", "/about"]) {
  test(`page ${path}`, async ({ page }) => {
    await page.goto(path);
    await axe(page);
  });
}
