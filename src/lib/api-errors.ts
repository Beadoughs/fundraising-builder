import { Prisma } from "@prisma/client";

const isDev = process.env.NODE_ENV === "development";

export function getClientErrorMessage(
  error: unknown,
  fallback: string
): { message: string; status: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        message: "An account with this email already exists",
        status: 409,
      };
    }

    // Table or column missing — migrations not applied
    if (error.code === "P2021" || error.code === "P2022") {
      console.error("Database schema mismatch:", error.code, error.message);
      return {
        message: isDev
          ? `Database schema out of date (${error.code}): ${error.message}`
          : "Registration is temporarily unavailable. Please try again shortly.",
        status: 503,
      };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Database connection failed:", error.message);
    return {
      message: isDev
        ? `Database connection failed: ${error.message}`
        : "Registration is temporarily unavailable. Please try again shortly.",
      status: 503,
    };
  }

  if (error instanceof Error) {
    console.error(fallback, error.message, error.stack);
  } else {
    console.error(fallback, error);
  }

  return {
    message: isDev && error instanceof Error ? error.message : fallback,
    status: 500,
  };
}
