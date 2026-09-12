import { test, expect } from "@playwright/test";
import { uniqueEmail, registerUser, loginUser, logout } from "./helpers";

const PASSWORD = "TestPass123!";

test.describe("US3: Part Request System", () => {
  const ownerEmail = uniqueEmail("req-owner");
  const dealerEmail = uniqueEmail("req-dealer");

  test.describe.configure({ mode: "serial" });

  test("vehicle owner registers", async ({ page }) => {
    await registerUser(page, {
      email: ownerEmail,
      password: PASSWORD,
      name: "Request Owner",
      role: "vehicle_owner",
    });
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
  });

  test("dealer registers", async ({ page }) => {
    await registerUser(page, {
      email: dealerEmail,
      password: PASSWORD,
      name: "Request Dealer",
      role: "dealer",
    });
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
  });

  test("vehicle owner creates a part request", async ({ page }) => {
    await loginUser(page, ownerEmail, PASSWORD);

    await page.getByTestId("nav-requests").click();
    await page.waitForURL("**/requests");
    await expect(page.getByTestId("requests-page")).toBeVisible();

    await page.getByTestId("new-request-button").click();
    await page.waitForURL("**/requests/new");
    await expect(page.getByTestId("new-request-page")).toBeVisible();

    // Fill request form
    await page.getByTestId("request-part-name").fill("Alternator");
    await page.getByTestId("request-make").fill("Toyota");
    await page.getByTestId("request-model").fill("Hilux");
    await page.getByTestId("request-year").fill("2019");
    await page.getByTestId("request-urgency").selectOption("high");
    await page
      .getByTestId("request-notes")
      .fill("Need urgently for customer vehicle");
    await page.getByTestId("request-submit").click();

    // Should redirect back to requests list
    await page.waitForURL("**/requests", { timeout: 10000 });
    await expect(page.getByTestId("requests-page")).toBeVisible();

    // Verify request appears in the list
    await expect(page.getByTestId("request-row").first()).toBeVisible();
    await expect(page.getByText("Alternator")).toBeVisible();
  });

  test("vehicle owner can view request details", async ({ page }) => {
    await loginUser(page, ownerEmail, PASSWORD);
    await page.goto("/requests");

    // Click on the request to view details
    await page.getByTestId("request-row").first().click();
    await page.waitForURL(/\/requests\//);
    await expect(page.getByTestId("request-detail-page")).toBeVisible();
    await expect(page.getByText("Alternator")).toBeVisible();
    await expect(page.getByText("Toyota")).toBeVisible();
    await expect(page.getByText("Hilux")).toBeVisible();
  });

  test("dealer sees the request in their list", async ({ page }) => {
    await loginUser(page, dealerEmail, PASSWORD);

    await page.getByTestId("nav-requests").click();
    await page.waitForURL("**/requests");
    await expect(page.getByTestId("requests-page")).toBeVisible();

    // Dealer should see open requests
    await expect(page.getByTestId("request-row").first()).toBeVisible();
    await expect(page.getByText("Alternator")).toBeVisible();
  });

  test("dealer submits a quote on the request", async ({ page }) => {
    await loginUser(page, dealerEmail, PASSWORD);
    await page.goto("/requests");

    // Click on the request
    await page.getByTestId("request-row").first().click();
    await page.waitForURL(/\/requests\//);
    await expect(page.getByTestId("request-detail-page")).toBeVisible();

    // Fill quote form
    await expect(page.getByTestId("quote-form")).toBeVisible();
    await page.getByTestId("quote-price").fill("15000");
    await page.getByTestId("quote-fulfillment").fill("3");
    await page.getByTestId("quote-notes").fill("Have it in stock");
    await page.getByTestId("quote-submit").click();

    // Page should refresh and show the submitted quote
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("quote-card")).toBeVisible();
  });

  test("vehicle owner sees the quote and accepts it", async ({ page }) => {
    await loginUser(page, ownerEmail, PASSWORD);
    await page.goto("/requests");

    // Click on the request with the quote
    await page.getByTestId("request-row").first().click();
    await page.waitForURL(/\/requests\//);

    // Should see the quote
    await expect(page.getByTestId("quote-card")).toBeVisible();
    await expect(page.getByText("15000")).toBeVisible();

    // Accept the quote
    await page.getByTestId("accept-quote-button").first().click();
    await page.waitForTimeout(2000);

    // Verify status changed to accepted
    await expect(page.getByText(/accepted/i).first()).toBeVisible();
  });

  test("request form validates required fields", async ({ page }) => {
    await loginUser(page, ownerEmail, PASSWORD);
    await page.goto("/requests/new");

    // Submit without filling required fields
    await page.getByTestId("request-submit").click();

    // Should show validation error (part name is required)
    await page.waitForTimeout(500);
    // The form should not navigate away
    await expect(page).toHaveURL(/\/requests\/new/);
  });
});
