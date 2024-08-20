import { createOnboarding } from "../src/controller/onboarding";
import { AppDataSource } from "../src/database/data-source";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../src/entity/user";
import { Course } from "../src/entity/course";
import { Onboarding } from "../src/entity/onboarding";

jest.mock("jsonwebtoken");
jest.mock("../src/database/data-source");

describe("createOnboarding Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockJson: jest.Mock;
  let userRepositoryMock: any;
  let courseRepositoryMock: any;
  let onboardingRepositoryMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();

    req = {
      headers: {
        authorization: "Bearer validtoken",
      },
      body: {
        course: {
          courseType: "Online",
          studyMode: "Full-time",
          courseSearch: "Software Engineering",
          entryYear: 2023,
          entryMonth: "January",
        },
        applicationType: {
          gender: "Other",
          birthCountry: "Wonderland",
          nationality: "Wonderlandian",
        },
      },
    };

    res = {
      json: mockJson,
    };

    userRepositoryMock = {
      findOne: jest.fn(),
    };
    courseRepositoryMock = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    onboardingRepositoryMock = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    (jwt.verify as jest.Mock).mockReturnValue({ id: "user_id" });

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === User) {
        return userRepositoryMock;
      } else if (entity === Course) {
        return courseRepositoryMock;
      } else if (entity === Onboarding) {
        return onboardingRepositoryMock;
      }
      throw new Error("Unknown entity");
    });
  });

  it("should complete onboarding successfully for a valid request", async () => {
    // Setup mocks for a successful path
    userRepositoryMock.findOne.mockResolvedValue({ id: "user_id", username: "testUser" }); // Simulate finding a user

    await createOnboarding(req as Request, res as Response);

    // Verify interactions with the userRepository
    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: "user_id" } });

    // Verify course and onboarding information was attempted to be saved
    expect(courseRepositoryMock.save).toHaveBeenCalledTimes(1);
    expect(onboardingRepositoryMock.save).toHaveBeenCalledTimes(1);

    // Verify successful response
    expect(mockJson).toHaveBeenCalledWith({ successMessage: "Onboarding completed successfully" });
  });

it("should return an error message when the authorization token is missing", async () => {
    // Remove the authorization header to simulate the missing token
    if (req.headers) {
        delete req.headers.authorization;
    }

    await createOnboarding(req as Request, res as Response);

    // Verify the response for missing token
    expect(mockJson).toHaveBeenCalledWith({ noTokenError: "Unauthorized - Token not available" });
});

  it("should return an error message when the course type is missing", async () => {
    // Simulate missing courseType
    delete req.body.course.courseType;

    await createOnboarding(req as Request, res as Response);

    // Verify the response for missing courseType
    expect(mockJson).toHaveBeenCalledWith({ error: "Course type is required" });
  });

  it("should return an error message when the user is not found in the database", async () => {
    userRepositoryMock.findOne.mockResolvedValueOnce(null); // Simulate user not being found
    await createOnboarding(req as Request, res as Response);
  
    // This ensures the query was made correctly
    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: "user_id" } });
  
    // This checks the correct handling of the "user not found" scenario
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("should handle internal server errors gracefully", async () => {
    // Setup the userRepository mock to simulate finding a user
    userRepositoryMock.findOne.mockResolvedValue({ id: "user_id", username: "testUser" });
  
    // Simulate an error thrown during the courseRepository.save operation
    courseRepositoryMock.save.mockRejectedValue(new Error("Internal server error"));
  
    await createOnboarding(req as Request, res as Response);
  
    // Verify the function responds with a generic internal server error message
    expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
  });
  
  // Additional afterEach() may be added if needed for cleanup
});
