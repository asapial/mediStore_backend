import { NextFunction, Request, Response } from "express";
import { auth } from "../../lib/auth";

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

    res.status(200).json({
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const authController={
registerController,
loginController
}