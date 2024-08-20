import express, { Request, Response } from "express";
import { User } from "../entity/user";
import { Program } from "../entity/program";
import { ProfessionalApplication } from "../entity/professional-app";
import { AppDataSource } from "../database/data-source";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { transporter } from "../utilities/emailsender";
import type { AuthRequest } from "../../extender";

dotenv.config();

const frontEndUrl = process.env.FRONTEND_URL;

const secret: any = process.env.JWT_SECRET;
// Create a User
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      countryOfResidence,
      isAdmin,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !countryOfResidence
    )
      return res.json({ error: "All fields are required" });

    let user = await userRepository.findOneBy({ email });

    if (user) {
      return res.json({ existingUserError: "User already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = userRepository.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,
        countryOfResidence,
        isAdmin,
      });

      await userRepository.save(newUser);

      user = await userRepository.findOne({ where: { email } });

      if (!user) {
        return res.json({ notFoundError: "User not found" });
      } else {
        const totpSecret = speakeasy.generateSecret({ length: 20 });

        user.otpSecret = totpSecret.base32;
        user.otp = speakeasy.totp({
          secret: totpSecret.base32,
          encoding: "base32",
        });
        user.otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

        await userRepository.save(user);

        const mailOptions = {
          from: {
            name: "Skool LMS",
            address: "info.skool.lms@gmail.com",
          },
          to: email,
          subject: "Skool LMS - Email Verification",
          text: `TOTP: ${user.otp}`,
          html: `<h3>Hi there,
        Thank you for signing up to Skool LMS. Copy the OTP below to verify your email:</h3>
        <h1>${user.otp}</h1>
        <h3>This OTP will expire in 10 minutes. If you did not sign up for a Skool LMS account,
        you can safely ignore this email. <br>
        <br>
        Best, <br>
        The Skool LMS Team</h3>`,
        };
        await transporter.sendMail(mailOptions);
        res.json({ successfulSignup: "Student signup successful" });
      }
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.json({ error: "Internal server error" });
  }
};

export const loginUser = async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const courseRepository = AppDataSource.getRepository(Program);

    const { email, password } = req.body;

    if (!email || !password)
      return res.json({ error: "Email and password are required" });

    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return res.json({ error: "User not found, try again" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.json({
        error: "Invalid credentials, try again",
      });
    } else {
      const token = jwt.sign({ id: user.id }, secret, {
        expiresIn: "1h",
      });

      if (user.isAdmin) {
        res.json({
          adminSuccessMessage: "Admin logged in successfully",
          token,
        });
      } else {
        const isOnboarded = await courseRepository.findOneBy({
          userId: user.id,
        });

        if (!isOnboarded) {
          return res.json({
            userNotOnboarded: "User has not completed onboarding",
            token,
          });
        }

        res.json({
          userOnboarded: "User logged in successfully",
          token,
        });
      }
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    res.json({ error: "Internal Server Error" });
  }
};

export const forgotPasswordUser = async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { email } = req.body;

    const user = await userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.json({ error: "Account does not exist" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000);

    await userRepository.save(user);

    const mailOptions = {
      from: process.env.GMAIL_SMP_USERNAME,
      to: email,
      subject: "Password Reset",
      text: `Click the following link to reset your password: ${frontEndUrl}/resetpassword/${resetToken} \n\n If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.json({ error: "Error sending reset email" });
      } else {
        console.log("Reset email sent:", info.response);
        res.json({ successMessage: "Reset link sent to your email" });
      }
    });
  } catch (error) {
    console.error("Error initiating password reset:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PASSWORD RESET FUNCTIONALITY

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userRepository = AppDataSource.getRepository(User);
  const { email } = req.body;

  const user = await userRepository.findOne({ where: { email } });

  if (!user) {
    res.json({ error: "User not found" });
    return;
  }

  const token = crypto.randomBytes(20).toString("hex");
  user.resetToken = token;
  user.resetTokenExpires = new Date(Date.now() + 3600000);
  await userRepository.save(user);

  const mailOptions = {
    from: process.env.GMAIL_SMP_USERNAME,
    to: email,
    subject: "Password Reset",
    text: `You are receiving this because you (or someone else) has requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n ${frontEndUrl}/new-password/${token}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };

  await transporter.sendMail(mailOptions);
  res.json({
    successMessage:
      "An email has been sent to the address provided with further instructions.",
  });
};

export const resetPasswordToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userRepository = AppDataSource.getRepository(User);
  const { token } = req.params;
  const { password } = req.body;

  const user = await userRepository.findOne({
    where: { resetToken: token },
  });

  if (!user) {
    res.json({ error: "Password reset token is invalid" });
    return;
  }

  if (
    !user.resetTokenExpires ||
    Date.now() > user.resetTokenExpires.getTime()
  ) {
    res.json({ error: "Password reset token has expired." });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  user.password = hashedPassword;

  user.resetToken = null;
  user.resetTokenExpires = null;
  await userRepository.save(user);

  res.json({ successMessage: "Your password has been reset!" });
};

export const verifyOTPEmailAuth = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { otp } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    // Find user by OTP
    const user = await userRepository.findOne({ where: { otp } });

    if (!user) {
      res.json({ invalidOtp: "Invalid OTP, try again" });
      return;
    }

    // Verify OTP
    const verified = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: "base32",
      token: otp,
    });

    if (Date.now() > user.otpExpiration.getTime()) {
      res.json({ expiredOtp: "Expired OTP" });
      return;
    }

    // Clear the OTP from the user record
    user.otp = "";
    user.otpExpiration = new Date(0);

    // Add the isVerified property to the user object
    user.isVerified = true;
    await userRepository.save(user);

    res.json({ verifySuccessful: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userRepository = AppDataSource.getRepository(User);

  const { currentPassword, newPassword } = req.body;

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.json({ noTokenError: "Unauthorized - Token not available" });
  } else {
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await userRepository.findOne({
      where: { id: decoded.id },
    });

    if (!user) {
      res.json({ userNotFoundError: "User not found" });
      return;
    } else {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        res.json({
          incorrectPasswordError: "Current password is incorrect, try again",
        });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      user.password = hashedNewPassword;

      await userRepository.save(user);

      res.json({ successMessage: "Password updated successfully" });
    }
  }
};

export const editUserDetails = async (req: Request, res: Response) => {
  const userRepository = AppDataSource.getRepository(User);

  const { phoneNumber, countryOfResidence } = req.body;

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.json({ noTokenError: "Unauthorized - Token not provided" });
  } else {
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await userRepository.findOne({
      where: { id: decoded.id },
    });

    if (!user) {
      res.json({ userNotFoundError: "User not found" });
      return;
    } else {
      user.countryOfResidence = countryOfResidence;
      user.phoneNumber = phoneNumber;

      await userRepository.save(user);

      res.json({ successMessage: "Profile updated successfully" });
    }
  }
};

export const fetchUserDashboard = async (req: Request, res: Response) => {
  const userRepository = AppDataSource.getRepository(User);

  const applicationRepository = AppDataSource.getRepository(
    ProfessionalApplication
  );

  const courseRepository = AppDataSource.getRepository(Program);

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.json({ noTokenError: "Unauthorized - Token not provided" });
  } else {
    const decoded = jwt.verify(token, secret) as { id: string };

    const userDetails = await userRepository.findOne({
      where: { id: decoded.id },
    });

    const applicationDetails = await AppDataSource.getRepository(
      ProfessionalApplication
    ).findOne({
      where: { user: { id: decoded.id } },
    });

    const courseDetails = await courseRepository.findOne({
      where: { userId: decoded.id },
    });

    if (!userDetails) {
      res.json({ userNotFoundError: "User not found" });
      return;
    } else {
      res.json({ userDetails, applicationDetails, courseDetails });
    }
  }
};

export const hasUserApplied = async (req: Request, res: Response) => {
  try {
    const professionalApplicationRepository = AppDataSource.getRepository(
      ProfessionalApplication
    );
    const courseRepository = AppDataSource.getRepository(Program);

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.json({ error: "Unauthorized - Token not provided" });
    } else {
      const decoded = jwt.verify(token, secret) as { id: string };

      const hasApplied = await professionalApplicationRepository.findOne({
        where: { user: { id: decoded.id } },
      });

      const userCourse = await courseRepository.findOne({
        where: { userId: decoded.id },
      });

      if (!hasApplied) {
        return res.json({ hasApplied: false, userCourse });
      }

      if (!userCourse) {
        return res.json({ error: "No course exists" });
      }
      res.json({ hasApplied: true, userCourse });
    }
  } catch (error) {
    console.error("Error checking if user has applied:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

