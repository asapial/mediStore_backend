import { NextFunction, Request, Response } from "express";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
      },
    });

    console.log(result)
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    // ✅ Set token in HTTP-only cookie
    res.cookie("medistore_token", result.token, {
      httpOnly: true,
      secure: true,        // REQUIRED (Vercel = HTTPS)
      sameSite: "none",    // REQUIRED (cross-origin)
    });
    res.status(200).json({
      message: "Login successful",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};


const meController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
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
  meController
}