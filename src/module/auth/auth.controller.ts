import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

/**
 * Register a new user
 * Calls BetterAuth and returns the session info (but doesn't set cookie yet)
 */
const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;

    // Sign up via BetterAuth
    const { headers, response } = await betterAuth.api.signUpEmail({
      returnHeaders: true, // we need headers for cookies
      body: { email, password, name },
    });

    // Extract the set-cookie header from BetterAuth
    const setCookie = headers.get("set-cookie");
    if (setCookie) {
      res.setHeader("Set-Cookie", setCookie);
    }

    res.status(201).json({
      message: "Registration successful",
      data: response, // optional: return user info
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * Sets the __session cookie in browser (HTTP-only)
 */
const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const { headers, response } = await betterAuth.api.signInEmail({
      returnHeaders: true,
      body: { email, password },
    });

    // ✅ Forward the Set-Cookie header from BetterAuth to browser
    const setCookie = headers.get("set-cookie");
    console.log("Data form login controller:", setCookie)
    if (setCookie) {
      res.setHeader("Set-Cookie", setCookie);
    }

    res.status(200).json({
      message: "Login successful",
      user: response.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged-in user
 * Uses middleware to populate req.user
 */
const meController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  registerController,
  loginController,
  meController,
};
