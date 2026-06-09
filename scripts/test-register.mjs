import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

function normalizeRegistrationEmail(email) {
  return email.trim().toLowerCase();
}

test("registerSchema accepts valid signup payload", () => {
  const result = registerSchema.parse({
    email: "user@school.edu.au",
    password: "securepass",
    name: "Jane Smith",
  });
  assert.equal(result.email, "user@school.edu.au");
});

test("registerSchema rejects short password", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "user@example.com",
        password: "short",
        name: "Jane",
      }),
    (error) =>
      error instanceof z.ZodError &&
      error.issues[0]?.message === "Password must be at least 8 characters"
  );
});

test("registerSchema rejects invalid email", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "not-an-email",
        password: "securepass",
        name: "Jane",
      }),
    (error) => error instanceof z.ZodError
  );
});

test("normalizeRegistrationEmail trims and lowercases", () => {
  assert.equal(
    normalizeRegistrationEmail("  User@Example.COM  "),
    "user@example.com"
  );
});
