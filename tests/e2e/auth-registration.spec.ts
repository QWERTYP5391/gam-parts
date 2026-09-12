import { test, expect } from "@playwright/test";
import { uniqueEmail, registerUser, loginUser, logout } from "./helpers";

const PASSWORD = "TestPass123!";

test.describe("US1: Account Registration & Login", () => {
  test.describe("Landing Page", () => {
    test("should show landing page with login and register links", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.getByTestId("home-title")).toContainText("GAM Parts");
      await expect(page.getByTestId("home-login-link")).toBeVisible();
      await expect(page.getByTestId("home-register-link")).toBeVisible();
    });
  });

  test.describe("Registration Form", () => {
    test("should display registration form with all fields", async ({
      page,
    }) => {
      await page.goto("/register");
      await expect(page.getByTestId("register-title")).toBeVisible();
      await expect(page.getByTestId("register-form")).toBeVisible();
      await expect(page.getByTestId("register-name")).toBeVisible();
      await expect(page.getByTestId("register-email")).toBeVisible();
      await expect(page.getByTestId("register-password")).toBeVisible();
      await expect(page.getByTestId("register-phone")).toBeVisible();
      await expect(page.getByTestId("register-role")).toBeVisible();
      await expect(page.getByTestId("register-town")).toBeVisible();
      await expect(page.getByTestId("register-submit")).toBeVisible();
    });

    test("should have link to login page", async ({ page }) => {
      await page.goto("/register");
      await expect(page.getByTestId("register-login-link")).toBeVisible();
      await page.getByTestId("register-login-link").click();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Login Form", () => {
    test("should display login form with all fields", async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByTestId("login-title")).toBeVisible();
      await expect(page.getByTestId("login-form")).toBeVisible();
      await expect(page.getByTestId("login-email")).toBeVisible();
      await expect(page.getByTestId("login-password")).toBeVisible();
      await expect(page.getByTestId("login-submit")).toBeVisible();
    });

    test("should have link to register page", async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByTestId("login-register-link")).toBeVisible();
      await page.getByTestId("login-register-link").click();
      await expect(page).toHaveURL(/\/register/);
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");
      await page.getByTestId("login-email").fill("nonexistent@example.com");
      await page.getByTestId("login-password").fill("wrongpassword");
      await page.getByTestId("login-submit").click();
      await expect(page.getByTestId("login-error")).toBeVisible();
    });
  });

  test.describe("Register as Vehicle Owner", () => {
    const email = uniqueEmail("owner");

    test("should register and see vehicle owner dashboard", async ({
      page,
    }) => {
      await registerUser(page, {
        email,
        password: PASSWORD,
        name: "Test Owner",
        role: "vehicle_owner",
      });

      await expect(page.getByTestId("dashboard-page")).toBeVisible();
      await expect(page.getByTestId("dashboard-welcome")).toContainText(
        "Test Owner",
      );
      await expect(page.getByTestId("dashboard-role-label")).toContainText(
        "Vehicle Owner",
      );
      await expect(page.getByTestId("dashboard-buyer-section")).toBeVisible();
      await expect(page.getByTestId("nav-search")).toBeVisible();
      await expect(page.getByTestId("nav-requests")).toBeVisible();
      // Dealer-only nav should not be visible
      await expect(page.getByTestId("nav-inventory")).not.toBeVisible();
    });
  });

  test.describe("Register as Mechanic", () => {
    const email = uniqueEmail("mechanic");

    test("should register and see mechanic dashboard with client section", async ({
      page,
    }) => {
      await registerUser(page, {
        email,
        password: PASSWORD,
        name: "Test Mechanic",
        role: "mechanic",
      });

      await expect(page.getByTestId("dashboard-page")).toBeVisible();
      await expect(page.getByTestId("dashboard-role-label")).toContainText(
        "Mechanic",
      );
      await expect(page.getByTestId("dashboard-buyer-section")).toBeVisible();
      await expect(
        page.getByTestId("dashboard-mechanic-section"),
      ).toBeVisible();
    });
  });

  test.describe("Register as Dealer", () => {
    const email = uniqueEmail("dealer");

    test("should register and see dealer dashboard", async ({ page }) => {
      await registerUser(page, {
        email,
        password: PASSWORD,
        name: "Test Dealer",
        role: "dealer",
      });

      await expect(page.getByTestId("dashboard-page")).toBeVisible();
      await expect(page.getByTestId("dashboard-role-label")).toContainText(
        "Dealer",
      );
      await expect(page.getByTestId("dashboard-dealer-section")).toBeVisible();
      await expect(page.getByTestId("nav-inventory")).toBeVisible();
      // Buyer-only nav should not be visible
      await expect(page.getByTestId("nav-search")).not.toBeVisible();
    });
  });

  test.describe("Login and Logout", () => {
    const email = uniqueEmail("logintest");

    test("should register, logout, and login again", async ({ page }) => {
      // Register
      await registerUser(page, {
        email,
        password: PASSWORD,
        name: "Login Test",
        role: "vehicle_owner",
      });
      await expect(page.getByTestId("dashboard-page")).toBeVisible();

      // Logout
      await logout(page);
      await expect(page.getByTestId("login-form")).toBeVisible();

      // Login again
      await loginUser(page, email, PASSWORD);
      await expect(page.getByTestId("dashboard-page")).toBeVisible();
      await expect(page.getByTestId("dashboard-welcome")).toContainText(
        "Login Test",
      );
    });
  });

  test.describe("Route Protection", () => {
    test("should redirect unauthenticated users to login", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect unauthenticated users from search to login", async ({
      page,
    }) => {
      await page.goto("/search");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect authenticated users away from login page", async ({
      page,
    }) => {
      const email = uniqueEmail("redirect");
      await registerUser(page, {
        email,
        password: PASSWORD,
        name: "Redirect Test",
        role: "vehicle_owner",
      });
      // Try navigating to login while authenticated
      await page.goto("/login");
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});
