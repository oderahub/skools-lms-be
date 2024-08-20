import { Router } from "express";
import {
  createUser,
  loginUser,
  verifyOTPEmailAuth,
  resetPassword,
  resetPasswordToken,
  changePassword,
  editUserDetails,
  fetchUserDashboard,
  hasUserApplied,
} from "../controller/user";
import { createOnboarding } from "../controller/onboarding";
import {
  createProfessionalApplication,
  getProfessionalApplication,
  deleteProfessionalApplication,
  deleteMultipleProfessionalApplications,
  approveProfessionalApplication,
  rejectProfessionalApplication,
} from "../controller/professional";
import {
  getNotification,
  updateNotification,
  deleteNotification,
} from "../controller/nofications";
import {
  getChats,
  createChatMessage,
  deleteChatMessage,
  getChattingUsers,
} from "../controller/chat";
import { createCourse } from "../controller/courses";

const router = Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/forgotpassword", resetPassword);
router.post("/forgotpassword/:token", resetPasswordToken);

//User dahboard routes
router.post("/change-password", changePassword);
router.put("/edit-profile", editUserDetails);
router.get("/dashboard", fetchUserDashboard);
router.get("/notifications", getNotification);

router.get("/professional-application", hasUserApplied);

// Route for updating onboarding details
router.post("/onboarding", createOnboarding);

// Route for creating a new professional application
router.post("/professional-application", createProfessionalApplication);

// Route to get a single Professional application
router.get("/professional-applications/:id", getProfessionalApplication);

// Route to verify OTP for email authentication
router.post("/verify-otp", verifyOTPEmailAuth);

// Route to delete a professional application

router.delete("/professional-application/:id", deleteProfessionalApplication);

// Route to delete multiple professional applications

router.delete(
  "/professional-applications",
  deleteMultipleProfessionalApplications
);

// Route to approve a professional application
router.put("/approve-application/:id", approveProfessionalApplication);

// Route to reject a professional application
router.put("/reject-application/:id", rejectProfessionalApplication);

// Route to get a notification
router.get("/notification", getNotification);

// Route to update notification as read or unread
router.put("/notification/:id", updateNotification);

// Route to delete notification
router.delete("/notification/:id", deleteNotification);

// Route to retrieve chats for a specific user
router.get("/chats/:receiverId/:senderId", getChats);

// Route to create a new chat message
router.post("/messages/chats", createChatMessage);

// Route to delete a chat message
router.delete("/chats/:messageId", deleteChatMessage);

// Route to get all users that the current user is chatting with
router.get("/chats/:userId", getChattingUsers);

router.get("/chats/:receiverId");

// Route to create a new course
router.post("/addCourses", createCourse);

export default router;
