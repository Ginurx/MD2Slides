import { expect, test } from "@playwright/test";

test("applies slide color themes", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#slide-1")).toHaveClass(/theme-light/);
  await expect(page.locator("#slide-1 .slide-stage")).toHaveCSS("background-color", "rgb(255, 250, 240)");
  await expect(page.locator("#slide-1 .slide-content")).toHaveCSS("color", "rgb(37, 45, 52)");

  await expect(page.locator("#slide-2")).toHaveClass(/theme-dark/);
  await expect(page.locator("#slide-2 .slide-stage")).toHaveCSS("background-color", "rgb(17, 24, 32)");
  await expect(page.locator("#slide-2 .slide-content")).toHaveCSS("color", "rgb(244, 239, 230)");

  await expect(page.locator("#slide-5")).toHaveClass(/theme-accent/);
  await expect(page.locator("#slide-5 .slide-stage")).toHaveCSS("background-color", "rgb(255, 248, 230)");
  await expect(page.locator("#slide-5 .slide-stage")).toHaveCSS("border-top-color", "rgb(216, 68, 46)");
  await expect(page.locator("#slide-5 .slide-stage")).toHaveCSS("border-top-width", "10px");

  await page.locator(".theme-toggle").click();
  await expect(page.locator(".theme-panel")).toBeVisible();
  await page.locator(".theme-preset").selectOption("dark");
  await expect(page).toHaveURL(/theme=dark/);
  await expect(page.locator("body")).toHaveClass(/theme-override-dark/);
  await expect(page.locator("#slide-1 .slide-stage")).toHaveCSS("background-color", "rgb(17, 24, 32)");

  await page.locator(".theme-preset").selectOption("auto");
  await expect(page).not.toHaveURL(/theme=/);
  await expect(page.locator("body")).not.toHaveClass(/theme-override-dark/);
  await expect(page.locator("#slide-1 .slide-stage")).toHaveCSS("background-color", "rgb(255, 250, 240)");
});

test("renders slides and supports keyboard, buttons, hash, overview, fonts, and layouts", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Fixture Deck");
  await expect(page.locator(".slide")).toHaveCount(5);
  await expect(page.locator("#slide-1")).toHaveClass(/is-active/);
  await expect(page.locator(".page-input")).toHaveValue("1");

  const stageBox = await page.locator(".slide.is-active .slide-stage").boundingBox();
  expect(stageBox).not.toBeNull();
  expect(stageBox.width / stageBox.height).toBeGreaterThan(1.72);
  expect(stageBox.width / stageBox.height).toBeLessThan(1.84);
  await expect(page.locator(".slide.is-active")).not.toHaveClass(/is-overflowing/);

  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#slide-2")).toHaveClass(/is-active/);
  await expect(page).toHaveURL(/#slide-2$/);

  await expect(page.locator(".slide.is-active .slide-content")).toHaveClass(/split/);
  const activeImage = page.locator(".slide.is-active .media-pane img");
  await expect(activeImage).toHaveJSProperty("complete", true);
  await expect.poll(() => activeImage.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

  await page.locator(".next").click();
  await expect(page.locator("#slide-3")).toHaveClass(/is-active/);
  await expect(page.locator(".slide.is-active .slide-content")).toHaveClass(/columns/);

  await page.locator(".page-input").fill("5");
  await page.locator(".page-input").press("Enter");
  await expect(page.locator("#slide-5")).toHaveClass(/is-active/);
  await expect(page.locator(".slide.is-active .slide-content")).toHaveClass(/compare/);

  await page.keyboard.press("Home");
  await expect(page.locator("#slide-1")).toHaveClass(/is-active/);
  await page.keyboard.press("End");
  await expect(page.locator("#slide-5")).toHaveClass(/is-active/);
  await page.keyboard.press("Backspace");
  await expect(page.locator("#slide-4")).toHaveClass(/is-active/);
  await expect(page.locator(".slide.is-active")).toHaveClass(/layout-full/);

  await page.locator(".overview-toggle").click();
  await expect(page.locator("body")).toHaveClass(/overview/);
  await page.locator("#slide-2").click();
  await expect(page.locator("body")).not.toHaveClass(/overview/);
  await expect(page.locator("#slide-2")).toHaveClass(/is-active/);

  await page.locator(".font-toggle").click();
  await expect(page.locator(".font-panel")).toBeVisible();
  await page.locator(".font-preset").selectOption("mono");
  await expect(page).toHaveURL(/font=mono/);
  await page.locator(".font-custom").fill('"Comic Sans MS", cursive');
  await page.locator(".font-apply").click();
  await expect(page).toHaveURL(/fontFamily=/);
  await expect(page.locator("html")).toHaveCSS("font-family", /Comic Sans MS/);

  await page.goto("/#slide-3");
  await expect(page.locator("#slide-3")).toHaveClass(/is-active/);
});
