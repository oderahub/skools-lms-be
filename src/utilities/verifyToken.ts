import express, { Request, Response } from "express";
import { User } from "../entity/user";
import { AppDataSource } from "../database/data-source";
import jwt from "jsonwebtoken";

const secret: string = process.env.JWT_SECRET ?? "";

export async function checkAndVerifyToken(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.json({ noTokenError: "Unauthorized - Token not provided" });
    } else {
      const decoded = jwt.verify(token, secret) as { id: string };

      const userInfo = await userRepository.findOne({
        where: { id: decoded.id },
      });

      if (userInfo) {
        const user = {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phoneNumber,
          country: userInfo.countryOfResidence,
          userId: userInfo.id,
        };

        res.json({ user });
      }
    }
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.json({ TokenExpiredError: "Unauthorized - Token has expired" });
    } else {
      res.json({
        verificationError: "Unauthorized - Token verification failed",
      });
    }
  }
}
