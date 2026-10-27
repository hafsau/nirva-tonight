import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function axe(page: Page) {
  // Let entrance animations finish so contrast isn't sampled mid-fade.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

/** Wait for tonight's first stream to finish: the summary is the last field written. */
export async function settled(page: Page) {
  await expect(page.getByRole("heading", { level: 2, name: /walk worth keeping/ })).toBeVisible({ timeout: 30_000 });
}
