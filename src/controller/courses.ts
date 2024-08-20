import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import jwt, { Jwt, JwtPayload } from "jsonwebtoken";
import { User } from "../entity/user";
import { Courses } from "../entity/courses";
import dotenv from "dotenv";

dotenv.config();

const secret: any = process.env.JWT_SECRET;

export const createCourse = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    const { courseTitle } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    if (!token) {
      res.json({ noTokenError: "Unauthorized - Token not available" });
    } else {
      const decoded = jwt.verify(token, secret) as { id: string };

      const user = await userRepository.findOne({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.json({ error: "User not found" });
      }

      const course = new Courses();
      course.courseTitle = courseTitle;
      course.user = user;

      await AppDataSource.getRepository(Courses).save(course);
      res.json({ successMessage: "Course created successfully" });
    }
  } catch (error) {
    console.error("Error creating course:", error);
    res.json({ error: "Internal Server Error" });
  }
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await AppDataSource.getRepository(Courses).find();

    res.json({ courses });
  } catch (error) {}
};

//Check course availability
export const checkCourseAvailability = async (req: Request, res: Response) => {
  const availableCourses = [
    "Accounting",
    "Biology",
    "Computer Science",
    "Economics",
  ];

  const { courseName } = req.body;

  const course = await availableCourses.filter(
    (course) => course.toLowerCase() === courseName.toLowerCase()
  );

  try {
    if (course.length === 0) {
      return res.json({ isAvailable: false, message: "Course not available" });
    }

    res.json({ isAvailable: true, message: "Course is available" });
  } catch (error) {
    res.json({ error: "Internal server error" });
  }
};
