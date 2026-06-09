import { test, expect } from "@playwright/test";

test.describe("LearnHub LMS", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Learn Without Limits/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse Courses/i })).toBeVisible();
  });

  test("courses page loads", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByRole("heading", { name: /Explore Courses/i })).toBeVisible();
  });

  test("registration page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Create an account/i })).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });

  test("navigation to courses from home", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Browse Courses/i }).click();
    await expect(page).toHaveURL("/courses");
  });
});
