import { DataSource } from "typeorm";
import { User } from "../entity/user";
import { Program } from "../entity/program";
import { Onboarding } from "../entity/onboarding";
import { ProfessionalApplication } from "../entity/professional-app";
import { Notification } from "../entity/notifications";
import { Chat } from "../entity/chat";
import { Courses } from "../entity/courses";
import dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_CONNECTION_URL,
  synchronize: true,
  logging: false,
  entities: [
    User,
    Program,
    Onboarding,
    ProfessionalApplication,
    Notification,
    Chat,
    Courses,
  ],
  subscribers: [],
  migrations: [],
  extra: {
    timezone: "local",
  },
});
