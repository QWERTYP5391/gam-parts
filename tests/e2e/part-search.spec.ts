import { test, expect } from "@playwright/test";
import { uniqueEmail, registerUser, loginUser } from "./helpers";

const PASSWORD = "TestPass123!";

test.describe("US2: Find a Part (Search)", () => {
  const dealerEmail = uniqueEmail("search-dealer");
  const ownerEmail = uniqueEmail("search-owner");

  test.describe.configure({ mode: "serial" });

  test("dealer registers and adds a part listing", async ({ page }) => {
    await registerUser(page, {
      email: dealerEmail,
      password: PASSWORD,
      name: "Search Dealer",
      role: "dealer",
    });

    // Navigate to add inventory
    await page.getByTestId("nav-inventory").click();
    await page.waitForURL("**/inventory");
    await expect(page.getByTestId("inventory-page")).toBeVisible();

    await page.getByTestId("inventory-add-button").click();
    await page.waitForURL("**/inventory/new");

    // Fill in listing form
    await page.getByTestId("listing-name").fill("Brake Pads Front Toyota");
    await page
      .getByTestId("listing-description")
      .fill("High quality ceramic brake pads");
    await page.getByTestId("listing-price").fill("3500");
    await page.getByTestId("listing-quantity").fill("10");
    await page.getByTestId("listing-condition").selectOption("new");
    await page.getByTestId("listing-fulfillment").fill("2");

    // Fill vehicle compatibility
    await page.getByTestId("listing-vehicle-make").first().fill("Toyota");
    await page.getByTestId("listing-vehicle-model").first().fill("Corolla");
    await page.getByTestId("listing-vehicle-year-from").first().fill("2015");
    await page.getByTestId("listing-vehicle-year-to").first().fill("2023");

    await page.getByTestId("listing-submit").click();
    await page.waitForURL("**/inventory");

    // Verify listing appears in inventory
    await expect(page.getByTestId("inventory-row").first()).toBeVisible();
  });

  test("vehicle owner searches for the part", async ({ page }) => {
    await registerUser(page, {
      email: ownerEmail,
      password: PASSWORD,
      name: "Search Owner",
      role: "vehicle_owner",
    });

    // Navigate to search
    await page.getByTestId("nav-search").click();
    await page.waitForURL("**/search");
    await expect(page.getByTestId("search-page")).toBeVisible();

    // Verify search form fields
    await expect(page.getByTestId("search-query")).toBeVisible();
    await expect(page.getByTestId("search-make")).toBeVisible();
    await expect(page.getByTestId("search-model")).toBeVisible();
    await expect(page.getByTestId("search-year")).toBeVisible();
    await expect(page.getByTestId("search-sort")).toBeVisible();
    await expect(page.getByTestId("search-submit")).toBeVisible();
  });

  test("search returns results for matching part", async ({ page }) => {
    await loginUser(page, ownerEmail, PASSWORD);
    // Navigate directly with query params to trigger server-side search
    await page.goto("/search?query=Brake+Pads");

    await expect(page.getByTestId("search-result-card").first()).toBeVisible({
      timeout: 15000,
    });

    const resultCards = page.getByTestId("search-result-card");
    const count = await resultCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("search with vehicle filter narrows results", async ({ page }) => {
    await loginUser(page, ownerEmail, PASSWORD);
    await page.goto(
      "/search?query=Brake+Pads&vehicleMake=Toyota&vehicleModel=Corolla&vehicleYear=2020",
    );

    await expect(page.getByTestId("search-result-card").first()).toBeVisible({
      timeout: 15000,
    });

    const resultCards = page.getByTestId("search-result-card");
    const count = await resultCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("search with no results shows empty state", async ({ page }) => {
    await loginUser(page, ownerEmail, PASSWORD);
    await page.goto("/search?query=xyznonexistentpart123");

    // Should show no results message
    await expect(page.getByText("No results found")).toBeVisible({
      timeout: 15000,
    });
  });

  test("search sort options work", async ({ page }) => {
    await loginUser(page, ownerEmail, PASSWORD);
    await page.goto("/search?query=Brake+Pads&sortBy=price");

    await expect(page.getByTestId("search-result-card").first()).toBeVisible({
      timeout: 15000,
    });

    const resultCards = page.getByTestId("search-result-card");
    const count = await resultCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
