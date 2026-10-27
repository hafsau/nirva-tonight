import { expect, test } from "@playwright/test";
import { settled } from "./helpers";

test("autoplays: blocks arrive in order and the summary lands last", async ({ page }) => {
  await page.goto("/");
  const phone = page.getByRole("region", { name: /reflection/ });
  await expect(phone.getByText("Your day")).toBeVisible({ timeout: 5_000 });
  // Summary hasn't been written while the cards are still arriving.
  await expect(page.getByRole("heading", { level: 2, name: /walk worth keeping/ })).toHaveCount(0);
  await settled(page);
  for (const name of ["The call where the site walk moved", "You reach for sorry first", "Who you were with", "The walk with Priya"]) {
    await expect(phone.getByText(name, { exact: true })).toBeVisible();
  }
  await expect(phone.getByText("Was lunch rushed today?")).toBeVisible();
});

test("the dial changes delivery, not the count", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await page.getByText("Straight", { exact: true }).click();
  await expect(page.getByText("You apologize for other people's changes")).toBeVisible();
  await expect(page.getByText(/Four times in nine days, someone else changed a plan and you opened with sorry/)).toBeVisible();
  await page.getByText("Just the pattern", { exact: true }).click();
  await expect(page.getByText("Last Thu, Tue, Wed, today. Four times in nine days.")).toBeVisible();
  await expect(page.getByText(/4 times in 9 days/).first()).toBeVisible();
});

test("a feeling correction changes the read but not the facts", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await page.getByRole("button", { name: "That's not how I felt" }).click();
  const sheet = page.getByRole("dialog", { name: "What fits better?" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Relieved" }).click();
  await expect(sheet).toBeHidden();
  await expect(page.locator("section").getByText("Thanks. I'll read that one as relief.")).toBeVisible();
  await expect(page.getByText(/sounded relieved to have it settled/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Still counted: you said sorry first. I'll read the speed differently.")).toBeVisible();
  await expect(page.getByText(/4 times in 9 days/)).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /ended in relief/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#card-moment")).toBeFocused();
});

test("'Forget this' removes 4:40 from everything that leaned on it", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await page.getByRole("button", { name: "That's not how I felt" }).click();
  await page.getByRole("button", { name: "Forget this" }).click();
  await expect(page.locator("section").getByText(/Forgotten. The notes from 4:40 are deleted/)).toBeVisible();
  await expect(page.getByText("The call where the site walk moved")).toHaveCount(0);
  await expect(page.getByText(/3 times in 9 days/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("You asked me to leave this out", { exact: true })).toBeVisible();
  await expect(page.getByText(/sped up early on Wednesday's call/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { level: 2, name: "A steady Friday and a walk worth keeping." })).toBeVisible({ timeout: 10_000 });
});

test("the dial keeps keyboard focus while the delivery re-streams", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  const straight = page.getByRole("radio", { name: "Straight" });
  await straight.focus();
  await page.keyboard.press("ArrowRight");
  const gentle = page.getByRole("radio", { name: "Gentle" });
  await expect(gentle).toBeChecked();
  await expect(gentle).toBeFocused();
  await page.waitForTimeout(1500);
  await expect(gentle).toBeFocused();
});

test("'Not tonight' has a way back", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await page.getByRole("button", { name: "Not tonight" }).click();
  await expect(page.getByText("Okay. It'll be here if you want it later.")).toBeVisible();
  await page.getByRole("button", { name: "Show it now" }).click();
  await expect(page.getByText("You reach for sorry first")).toBeVisible();
});

test("hunch replies are answered in kind", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.locator("section").getByText("Okay. I'll leave lunch alone.")).toBeVisible();
});

test("why sheet shows the basis and the heard / kept receipt, Escape closes and returns focus", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  const why = page.getByRole("button", { name: "Why am I seeing this?" }).first();
  await why.click();
  const sheet = page.getByRole("dialog", { name: "What this rests on" });
  await expect(sheet.getByText("Heard, then let go")).toBeVisible();
  await expect(sheet.getByText("Kept", { exact: true })).toBeVisible();
  await expect(sheet.getByText(/Not a description of Nirva's actual system/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(why).toBeFocused();
});

test("people: stop including someone", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await page.getByRole("button", { name: "Stop including Dev" }).click();
  await expect(page.locator("section").getByText("Dev won't appear here again.")).toBeVisible();
});

test("under the hood shows the stream and the SwiftUI render that follows the dial", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  await page.getByRole("button", { name: "Under the hood" }).click();
  await expect(page.getByText(/Patch \d+ of \d+/)).toBeVisible();
  await page.getByRole("button", { name: "SwiftUI", exact: true }).click();
  await expect(page.getByRole("img", { name: /SwiftUI render of the pattern card, gentle/ })).toBeVisible();
  await page.getByText("Straight", { exact: true }).click();
  await expect(page.getByRole("img", { name: /pattern card, straight/ })).toBeVisible();
});
