import { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma/client";


const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";

  /* ---------------- PRISMA CLIENT ERRORS ---------------- */

  // Prisma schema / query validation
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid request data";
  }

  // Prisma known request errors (P2xxx, P1xxx, etc.)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      /* ---------- CONNECTION / AUTH ---------- */
      case "P1000":
        statusCode = 401;
        message = "Database authentication failed";
        break;
      case "P1001":
      case "P1002":
      case "P1017":
        statusCode = 503;
        message = "Database server unreachable";
        break;
      case "P1003":
      case "P1014":
        statusCode = 404;
        message = "Database or table not found";
        break;
      case "P1013":
        statusCode = 400;
        message = "Invalid database connection string";
        break;

      /* ---------- DATA & QUERY ---------- */
      case "P2000":
      case "P2005":
      case "P2006":
      case "P2019":
      case "P2020":
        statusCode = 400;
        message = "Invalid data provided";
        break;

      case "P2001":
      case "P2025":
        statusCode = 404;
        message = "Record not found";
        break;

      case "P2002":
        statusCode = 409;
        message = "Duplicate value violates unique constraint";
        break;

      case "P2003":
        statusCode = 400;
        message = "Foreign key constraint failed";
        break;

      case "P2011":
      case "P2012":
      case "P2013":
        statusCode = 400;
        message = "Missing required field";
        break;

      case "P2021":
      case "P2022":
        statusCode = 404;
        message = "Database table or column not found";
        break;

      case "P2024":
      case "P2037":
        statusCode = 503;
        message = "Database connection pool exhausted";
        break;

      case "P2034":
        statusCode = 409;
        message = "Transaction conflict, please retry";
        break;

      /* ---------- DEFAULT ---------- */
      default:
        statusCode = 400;
        message = err.message;
    }
  }

  /* ---------------- PRISMA ENGINE / UNKNOWN ---------------- */

  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = "Unknown database error";
  }

  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    message = "Failed to initialize database connection";
  }

  else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = "Database engine crashed";
  }

  /* ---------------- CUSTOM / GENERIC ---------------- */

  else if (err instanceof Error) {
    message = err.message;
  }

  if (typeof err === "object" && err !== null && "status" in err) {
    statusCode = (err as any).status;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;