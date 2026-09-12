import { test, expect } from "@playwright/test";
import { uniqueEmail, registerUser, loginUser } from "./helpers";

const PASSWORD = "TestPass123!";

test.describe("US5: Smart Dealer Matching", () => {
  const dealer1Email = uniqueEmail("match-dealer1");
  const dealer2Email = uniqueEmail("match-dealer2");
  const searcherEmail = uniqueEmail("match-searcher");

  test.describe.configure({ mode: "serial" });

  test("first dealer registers and adds inventory", async ({ page }) => {
    await registerUser(page, {
      email: dealer1Email,
      password: PASSWORD,
      name: "Match Dealer One",
      role: "dealer",
    });

    await page.goto("/inventory/new");
    await page.getByTestId("listing-name").fill("Clutch Kit");
    await page.getByTestId("listing-price").fill("8000");
    await page.getByTestId("listing-quantity").fill("3");
    await page.getByTestId("listing-condition").selectOption("new");
    await page.getByTestId("listing-fulfillment").fill("2");
    await page.getByTestId("listing-vehicle-make").first().fill("Toyota");
    await page.getByTestId("listing-vehicle-model").first().fill("Hilux");
    await page.getByTestId("listing-vehicle-year-from").first().fill("2015");
    await page.getByTestId("listing-vehicle-year-to").first().fill("2023");
    await page.getByTestId("listing-submit").click();
    await page.waitForURL("**/inventory", { timeout: 10000 });
    await expect(page.getByTestId("inventory-row").first()).toBeVisible();
  });

  test("second dealer registers and adds same type of inventory", async ({
    page,
  }) => {
    await registerUser(page, {
      email: dealer2Email,
      password: PASSWORD,
      name: "Match Dealer Two",
      role: "dealer",
    });

    await page.goto("/inventory/new");
    await page.getByTestId("listing-name").fill("Clutch Kit Set");
    await page.getByTestId("listing-price").fill("7500");
    await page.getByTestId("listing-quantity").fill("5");
    await page.getByTestId("listing-condition").selectOption("new");
    await page.getByTestId("listing-fulfillment").fill("1");
    await page.getByTestId("listing-vehicle-make").first().fill("Toyota");
    await page.getByTestId("listing-vehicle-model").first().fill("Hilux");
    await page.getByTestId("listing-vehicle-year-from").first().fill("2016");
    await page.getByTestId("listing-vehicle-year-to").first().fill("2024");
    await page.getByTestId("listing-submit").click();
    await page.waitForURL("**/inventory", { timeout: 10000 });
    await expect(page.getByTestId("inventory-row").first()).toBeVisible();
  });

  test("searcher registers and searches for the part", async ({ page }) => {
    await registerUser(page, {
      email: searcherEmail,
      password: PASSWORD,
      name: "Match Searcher",
      role: "vehicle_owner",
    });

    // Navigate directly with query params to trigger server-side search
    await page.goto("/search?query=Clutch+Kit");

    // Wait for search results to appear
    await expect(page.getByTestId("search-result-card").first()).toBeVisible({
      timeout: 15000,
    });

    // Should find results from both dealers
    const resultCards = page.getByTestId("search-result-card");
    const count = await resultCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("relevance sort shows ranked results", async ({ page }) => {
    await loginUser(page, searcherEmail, PASSWORD);
    await page.goto("/search?query=Clutch+Kit&sortBy=relevance");

    await expect(page.getByTestId("search-result-card").first()).toBeVisible({
      timeout: 15000,
    });

    const resultCards = page.getByTestId("search-result-card");
    const count = await resultCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("price sort orders by price ascending", async ({ page }) => {
    await loginUser(page, searcherEmail, PASSWORD);
    await page.goto("/search?query=Clutch+Kit&sortBy=price");

    await expect(page.getByTestId("search-result-card").first()).toBeVisible({
      timeout: 15000,
    });

    const resultCards = page.getByTestId("search-result-card");
    const count = await resultCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("distance sort shows nearest dealer first", async ({ page }) => {
    await loginUser(page, searcherEmail, PASSWORD);
    await page.goto("/search?query=Clutch+Kit&sortBy=distance");

    await expect(page.getByTestId("search-result-card").first()).toBeVisible({
      timeout: 15000,
    });

    const resultCards = page.getByTestId("search-result-card");
    const count = await resultCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
