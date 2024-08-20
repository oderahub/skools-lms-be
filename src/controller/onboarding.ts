import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { User } from "../entity/user";
import { Program } from "../entity/program";
import { Onboarding } from "../entity/onboarding";
import jwt from "jsonwebtoken";

const secret: string = process.env.JWT_SECRET!;

export const createOnboarding = async (req: Request, res: Response) => {
  try {
    // Extract the user id from the request parameters
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.json({ noTokenError: "Unauthorized - Token not available" });
    }

    const decoded = jwt.verify(token, secret) as { id: string };
    const userId = decoded.id;

    // Extract onboarding data from the request body
    const { course, applicationType } = req.body;

    const { courseType, studyMode, courseSearch, entryYear, entryMonth } =
      course;

    const { gender, birthCountry, nationality } = applicationType;

    // Check if courseType is present and not null
    if (!courseType) {
      return res.json({ error: "Course type is required" });
    }

    // Find the user in the database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    // Create Course and Application entities
    const courseEntity = new Program(
      courseType,
      studyMode,
      courseSearch,
      entryYear,
      entryMonth,
      userId
    );

    const applicationEntity = new Onboarding(
      gender,
      birthCountry,
      nationality,
      userId
    );

    const courseRepository = AppDataSource.getRepository(Program);
    const applicationRepository = AppDataSource.getRepository(Onboarding);

    await courseRepository.save(courseEntity);
    await applicationRepository.save(applicationEntity);

    // Return a success message
    return res.json({ successMessage: "Onboarding completed successfully" });
  } catch (error) {
    return res.json({ error: "Internal server error" });
  }
};
