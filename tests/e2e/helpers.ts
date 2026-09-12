import { type Page, expect } from "@playwright/test";

const TS = Date.now();

export function uniqueEmail(prefix: string) {
  return `e2e-${prefix}-${TS}@test.gamparts.dev`;
}

export async function registerUser(
  page: Page,
  opts: {
    email: string;
    password: string;
    name: string;
    role: "vehicle_owner" | "mechanic" | "dealer";
  },
) {
  await page.goto("/register");
  await page.getByTestId("register-name").fill(opts.name);
  await page.getByTestId("register-email").fill(opts.email);
  await page.getByTestId("register-password").fill(opts.password);
  await page.getByTestId("register-phone").fill("+2201234567");
  await page.getByTestId("register-role").selectOption(opts.role);
  // Select the first available town
  const townSelect = page.getByTestId("register-town");
  await townSelect.selectOption({ index: 1 });
  await page.getByTestId("register-submit").click();
  // App redirects to login after registration, then we login
  await page.waitForURL("**/login**", { timeout: 10000 });
  await page.getByTestId("login-email").fill(opts.email);
  await page.getByTestId("login-password").fill(opts.password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}

export async function loginUser(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}

export async function logout(page: Page) {
  await page.getByTestId("logout-button").click();
  await page.waitForURL("**/login", { timeout: 10000 });
}
