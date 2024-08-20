import { Notification } from "../entity/notifications";
import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import jwt from "jsonwebtoken";
import { User } from "../entity/user";

const secret: string = process.env.JWT_SECRET!;

export const createNotification = async (req: Request, res: Response) => {
  const { title, message } = req.body;
  const { id } = req.params as any;
  console.log(id);

  try {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id },
    });
    if (!user) {
      return res.json({ error: "User not found" });
    }
    const notification = new Notification();
    notification.title = title;
    notification.message = message;
    notification.user = id; // Assign the user object directly

    await AppDataSource.getRepository(Notification).save(notification);
    console.log(notification);
    res.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// get nofication
export const getNotification = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.json({ noTokenError: "Unauthorized - Token not available" });
    }

    const decoded = jwt.verify(token, secret) as { id: string };
    const userId = decoded.id;

    const notifications = await AppDataSource.getRepository(Notification).find({
      where: { user: { id: decoded.id } },
    });

    if (!notifications) {
      return res.json({ error: "Notification not found" });
    }

    res.json({ notifications: notifications });
  } catch {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function getRepository(User: any) {
  throw new Error("Function not implemented.");
}

export const updateNotification = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  const { status } = req.body;
  try {
    const notification = await AppDataSource.getRepository(
      Notification
    ).findOne({
      where: { id },
    });

    if (!notification) {
      return res.json({ error: "Notification not found" });
    }

    notification.status = status;

    await AppDataSource.getRepository(Notification).save(notification);

    res.json({ sucessMessage: "Notification updated successfully" });
  } catch {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  try {
    const notification = await AppDataSource.getRepository(
      Notification
    ).findOne({
      where: { id },
    });

    if (!notification) {
      return res.json({ error: "Notification not found" });
    }

    await AppDataSource.getRepository(Notification).remove(notification);

    res.json({ successMessage: "Notification deleted successfully" });
  } catch {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
