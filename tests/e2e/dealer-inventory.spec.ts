import { test, expect } from "@playwright/test";
import { uniqueEmail, registerUser, loginUser } from "./helpers";

const PASSWORD = "TestPass123!";

test.describe("US4: Dealer Inventory Management", () => {
  const dealerEmail = uniqueEmail("inv-dealer");

  test.describe.configure({ mode: "serial" });

  test("dealer registers and sees empty inventory", async ({ page }) => {
    await registerUser(page, {
      email: dealerEmail,
      password: PASSWORD,
      name: "Inventory Dealer",
      role: "dealer",
    });

    await page.getByTestId("nav-inventory").click();
    await page.waitForURL("**/inventory");
    await expect(page.getByTestId("inventory-page")).toBeVisible();
    await expect(page.getByTestId("inventory-add-button")).toBeVisible();
  });

  test("dealer adds a part listing", async ({ page }) => {
    await loginUser(page, dealerEmail, PASSWORD);
    await page.goto("/inventory");
    await page.getByTestId("inventory-add-button").click();
    await page.waitForURL("**/inventory/new");
    await expect(page.getByTestId("inventory-new-page")).toBeVisible();

    // Fill listing form
    await page.getByTestId("listing-name").fill("Oil Filter");
    await page
      .getByTestId("listing-description")
      .fill("Premium oil filter for Toyota engines");
    await page.getByTestId("listing-price").fill("500");
    await page.getByTestId("listing-quantity").fill("25");
    await page.getByTestId("listing-condition").selectOption("new");
    await page.getByTestId("listing-fulfillment").fill("1");

    // Vehicle compatibility
    await page.getByTestId("listing-vehicle-make").first().fill("Toyota");
    await page.getByTestId("listing-vehicle-model").first().fill("Camry");
    await page.getByTestId("listing-vehicle-year-from").first().fill("2010");
    await page.getByTestId("listing-vehicle-year-to").first().fill("2024");

    await page.getByTestId("listing-submit").click();
    await page.waitForURL("**/inventory", { timeout: 10000 });

    // Verify listing appears
    await expect(page.getByTestId("inventory-row").first()).toBeVisible();
    await expect(page.getByText("Oil Filter")).toBeVisible();
  });

  test("dealer adds a second listing with multiple vehicles", async ({
    page,
  }) => {
    await loginUser(page, dealerEmail, PASSWORD);
    await page.goto("/inventory/new");

    await page.getByTestId("listing-name").fill("Spark Plugs Set");
    await page.getByTestId("listing-price").fill("1200");
    await page.getByTestId("listing-quantity").fill("15");
    await page.getByTestId("listing-condition").selectOption("new");
    await page.getByTestId("listing-fulfillment").fill("1");

    // First vehicle
    await page.getByTestId("listing-vehicle-make").first().fill("Toyota");
    await page.getByTestId("listing-vehicle-model").first().fill("Corolla");
    await page.getByTestId("listing-vehicle-year-from").first().fill("2015");
    await page.getByTestId("listing-vehicle-year-to").first().fill("2023");

    // Add second vehicle
    await page.getByTestId("listing-add-vehicle").click();
    const makes = page.getByTestId("listing-vehicle-make");
    const models = page.getByTestId("listing-vehicle-model");
    const yearFroms = page.getByTestId("listing-vehicle-year-from");
    const yearTos = page.getByTestId("listing-vehicle-year-to");
    await makes.nth(1).fill("Honda");
    await models.nth(1).fill("Civic");
    await yearFroms.nth(1).fill("2016");
    await yearTos.nth(1).fill("2022");

    await page.getByTestId("listing-submit").click();
    await page.waitForURL("**/inventory", { timeout: 10000 });

    // Should have at least 2 rows now
    const rows = page.getByTestId("inventory-row");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("dealer edits a listing price", async ({ page }) => {
    await loginUser(page, dealerEmail, PASSWORD);
    await page.goto("/inventory");

    // Click edit on first listing
    const firstRow = page.getByTestId("inventory-row").first();
    await firstRow.getByRole("link", { name: /edit/i }).click();
    await page.waitForURL(/\/inventory\/.*\/edit/);
    await expect(page.getByTestId("inventory-edit-page")).toBeVisible();

    // Update the price
    const priceInput = page.getByTestId("listing-price");
    await priceInput.clear();
    await priceInput.fill("600");

    await page.getByTestId("listing-submit").click();
    await page.waitForURL("**/inventory", { timeout: 10000 });

    // Verify updated price
    await expect(page.getByText("600")).toBeVisible();
  });

  test("dealer deletes a listing", async ({ page }) => {
    await loginUser(page, dealerEmail, PASSWORD);
    await page.goto("/inventory");

    const rowsBefore = await page.getByTestId("inventory-row").count();

    // Handle the native confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Click delete on last listing
    const lastRow = page.getByTestId("inventory-row").last();
    await lastRow.getByTestId("inventory-delete-button").click();
    await page.waitForTimeout(2000);

    // Verify listing was removed
    const rowsAfter = await page.getByTestId("inventory-row").count();
    expect(rowsAfter).toBe(rowsBefore - 1);
  });

  test("listing form validates required fields", async ({ page }) => {
    await loginUser(page, dealerEmail, PASSWORD);
    await page.goto("/inventory/new");

    // Submit empty form
    await page.getByTestId("listing-submit").click();
    await page.waitForTimeout(500);

    // Should stay on the form page
    await expect(page).toHaveURL(/\/inventory\/new/);
  });

  test("non-dealer cannot access inventory", async ({ page }) => {
    const ownerEmail = uniqueEmail("inv-owner");
    await registerUser(page, {
      email: ownerEmail,
      password: PASSWORD,
      name: "Inventory Blocked Owner",
      role: "vehicle_owner",
    });

    await page.goto("/inventory");
    // Should redirect to dashboard (middleware blocks non-dealers)
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
