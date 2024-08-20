import jwt, { Jwt, JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { validationResult, check } from "express-validator";
import { User } from "../entity/user";

import { ProfessionalApplication } from "../entity/professional-app";
import { Program } from "../entity/program";
import { AppDataSource } from "../database/data-source";
import cloudinary from "../utilities/cloudinary";
import dotenv from "dotenv";

dotenv.config();

const secretKey: string = process.env.JWT_SECRET || "your_secret_key";

export const createProfessionalApplication = async (
  req: Request,
  res: Response
) => {
  try {
    // Extract JWT token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.json({ error: "Unauthorized" });
    }

    let decodedToken: (Jwt & JwtPayload) | undefined;
    try {
      // Verify and decode JWT token
      decodedToken = jwt.verify(token, secretKey) as Jwt & JwtPayload;
    } catch (error) {
      console.error("Error decoding token:", error);
      return res.json({ error: "Unauthorized: Invalid token" });
    }

    if (!decodedToken || !decodedToken.id) {
      console.error("Invalid token payload");
      return res.json({
        error: "Unauthorized: Invalid token payload",
      });
    }

    const loggedInUserId = decodedToken.id;

    // Validate request body fields
    const fieldsToValidate = [
      "personalStatement",
      "addQualification",
      "academicReference",
      "employmentDetails",
      "fundingInformation",
      "disability",
      "passportUpload",
      "englishLanguageQualification",
    ];

    const validateRequest = fieldsToValidate.map((field) =>
      check(field)
        .notEmpty()
        .withMessage(`${field.replace(/([a-z])([A-Z])/g, "$1 $2")} is required`)
    );

    await Promise.all(validateRequest.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ error: errors.array() });
    }

    // Fetch user from database
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: loggedInUserId },
    });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    // Save professional application with passport upload
    const {
      personalStatement,
      addQualification,
      academicReference,
      employmentDetails,
      fundingInformation,
      disability,
      passportUpload,
      englishLanguageQualification,
    } = req.body;

    // Upload passport to cloudinary
    const passportUploadResponse = await cloudinary.v2.uploader.upload(
      passportUpload,
      {
        image: "passport",
      }
    );

    console.log("passportUpload", passportUploadResponse);

    const imageUrl = passportUploadResponse.secure_url;

    const professionalApplicationRepository = AppDataSource.getRepository(
      ProfessionalApplication
    );

    const ifApplied = await professionalApplicationRepository.findOne({
      where: { user: { id: loggedInUserId } },
    });

    if (ifApplied) {
      return res.json({
        error: "You have already applied",
      });
    }

    const newProfessionalApplication = professionalApplicationRepository.create(
      {
        user,
        personalStatement,
        addQualification,
        academicReference,
        employmentDetails,
        fundingInformation,
        disability,
        passportUpload: imageUrl,
        englishLanguageQualification,
      }
    );

    await professionalApplicationRepository.save(newProfessionalApplication);

    return res.json({
      successMessage: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error creating professional application:", error);
    return res.json({ error: "Internal server error" });
  }
};

// get a single user application
export const getProfessionalApplication = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const professionalApplication = await AppDataSource.getRepository(
      ProfessionalApplication
    ).findOne({
      where: { id },
      relations: ["user"], // Specify the relation to fetch the associated user
    });

    if (!professionalApplication) {
      return res
        .status(404)
        .json({ error: "Professional application not found" });
    }

    // Destructure user details from the associated user
    const {
      id: userId,
      firstName,
      lastName,
      email,
      phoneNumber,
      countryOfResidence,
    } = professionalApplication.user;

    // Include user details in the response
    const responsePayload = {
      ...professionalApplication,
      user: {
        id: userId,
        firstName,
        lastName,
        email,
        phoneNumber,
        countryOfResidence,
      },
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error fetching professional application:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// fetching all application and adding a status field of pending
export const getAllProfessionalApplicationsWithStatus = async (
  req: Request,
  res: Response
) => {
  try {
    // Fetch all professional applications
    const professionalApplications = await AppDataSource.getRepository(
      ProfessionalApplication
    ).find();

    // Add status field "pending" to each application
    const applicationsWithStatus = professionalApplications.map(
      (application) => ({
        ...application,
        status: "Pending",
      })
    );

    return res.status(200).json(applicationsWithStatus);
  } catch (error) {
    console.error("Error fetching professional applications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// fetching all applications regardless of status
export const getAllProfessionalApplications = async (
  req: Request,
  res: Response
) => {
  try {
    const professionalApplications = await AppDataSource.getRepository(
      ProfessionalApplication
    )
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.user", "user")
      .getMany();

    // Map and structure the response payload
    const responsePayload = await Promise.all(
      professionalApplications.map(async (application) => {
        const {
          id,
          status,
          personalStatement,
          addQualification,
          employmentDetails,
          fundingInformation,
          disability,
          academicReference,
          englishLanguageQualification,
          passportUpload,
          user,
        } = application;

        // Fetch course information based on user ID
        const userCourses = await AppDataSource.getRepository(Program).find({
          where: { userId: user.id },
        });

        return {
          id,
          status,
          personalStatement,
          addQualification,
          employmentDetails,
          fundingInformation,
          disability,
          academicReference,
          englishLanguageQualification,
          passportUpload,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            countryOfResidence: user.countryOfResidence,
          },
          course: userCourses,
        };
      })
    );

    return res.json(responsePayload);
  } catch (error) {
    console.error("Error fetching professional applications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// delete application

export const deleteProfessionalApplication = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const professionalApplicationRepository = AppDataSource.getRepository(
      ProfessionalApplication
    );

    const applicationToDelete = await professionalApplicationRepository.findOne(
      {
        where: { id },
      }
    );

    if (!applicationToDelete) {
      return res
        .status(400)
        .json({ error: "Professional application not found" });
    }

    await professionalApplicationRepository.remove(applicationToDelete);

    return res
      .status(200)
      .json({ message: "Professional application deleted sucessfully" });
  } catch (error) {
    console.error("Error deleting professional application:", error);
    return res.status(500).json({ erreo: "Internal server Error" });
  }
};

export const deleteMultipleProfessionalApplications = async (
  req: Request,
  res: Response
) => {
  try {
    const { applicationIds } = req.body;
    console.log(applicationIds);

    const professionalApplicationRepository = AppDataSource.getRepository(
      ProfessionalApplication
    );
    await professionalApplicationRepository.delete(applicationIds);

    return res.json({
      message: "Selected professional applications deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting multiple professional applications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Admin to approve professional application

export const approveProfessionalApplication = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const professionalApplicationRepository = AppDataSource.getRepository(
      ProfessionalApplication
    );

    const applicationToApprove =
      await professionalApplicationRepository.findOne({
        where: { id },
      });

    if (!applicationToApprove) {
      return res
        .status(400)
        .json({ error: "Professional application not found" });
    }

    applicationToApprove.status = "Accepted";
    await professionalApplicationRepository.save(applicationToApprove);

    return res
      .status(200)
      .json({ message: "Application approved successfully" });
  } catch (error) {
    console.error("Error approving application:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Admin to reject professional application

export const rejectProfessionalApplication = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const professionalApplicationRepository = AppDataSource.getRepository(
      ProfessionalApplication
    );

    const applicationToReject = await professionalApplicationRepository.findOne(
      {
        where: { id },
      }
    );

    if (!applicationToReject) {
      return res
        .status(400)
        .json({ error: "Professional application not found" });
    }

    applicationToReject.status = "Rejected";
    await professionalApplicationRepository.save(applicationToReject);

    return res
      .status(200)
      .json({ message: "Application rejected successfully" });
  } catch (error) {
    console.error("Error rejecting application:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Function to fetch user professional applications and courses
