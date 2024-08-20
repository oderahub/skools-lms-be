import { type Request } from "express";
import { SessionData, Session } from "express-session";

export interface AuthRequest extends Request {
  user?: { userId: string }; // Add the user property
  session: Session & Partial<SessionData> & { userId?: string };
}
