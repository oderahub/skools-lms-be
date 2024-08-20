import { Request, Response } from 'express';
import { createUser, loginUser, forgotPasswordUser } from '../src/controller/user';
import { AppDataSource } from '../src/database/data-source';
import bcrypt from 'bcrypt';

// Mock external dependencies
jest.mock('../src/database/data-source');
jest.mock('bcrypt');
jest.mock('speakeasy');
jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn().mockResolvedValue(null), // User does not exist initially
  findOne: jest.fn().mockResolvedValue({
    id: 1,
    email: 'john@example.com',
    otp: '123456', // Expected OTP from mocked speakeasy
  }), // Mock finding the newly created user
};

(AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);

// Mock bcrypt.hash to return a constant hashed password
// jest.mock('bcrypt', () => ({
//   hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
// }));
// Mock speakeasy methods
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({ base32: 'secret_base32' }),
  totp: jest.fn().mockReturnValue('123456'),
}));
describe('User Controller', () => {
  beforeEach(() => {
    // Reset all mocks before each test to ensure a clean slate
    jest.clearAllMocks();

    // Directly mock bcrypt.hash here to ensure it's applied correctly
    (bcrypt.hash as jest.Mock).mockImplementation(() => Promise.resolve('hashed_password'));
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user', async () => {
    const req = {
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        password: 'password123',
        countryOfResidence: 'USA',
        isAdmin: false,
      },
    } as Request;

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await createUser(req, res);

    expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'john@example.com' });
    expect(mockUserRepository.create).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      password: expect.any(String),
      countryOfResidence: 'USA',
      isAdmin: false,
    });
    expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ successfulSignup: "Student signup successful" });
  });
});

describe('loginUser Function', () => {
    it('should reject login for a user with incorrect password', async () => {
      const req = {
        body: {
          email: 'john@example.com',
          password: 'wrongPassword',
        },
      } as Partial<Request>;
  
      const res = {
        json: jest.fn(),
      } as Partial<Response> & { json: jest.Mock };
  
      // Simulate finding a user but with a different password hash
      mockUserRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        password: await bcrypt.hash('correctPassword', 12),
      });
  
      await loginUser(req as Request, res as Response);
  
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials, try again" });
    });
  });

  describe('forgotPasswordUser Function', () => {
    it('should report error if the email does not exist', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
        },
      } as Partial<Request>;
  
      const res = {
        json: jest.fn(),
      } as Partial<Response> & { json: jest.Mock };
  
      mockUserRepository.findOne.mockResolvedValue(null); // Simulate no user found
  
      await forgotPasswordUser(req as Request, res as Response);
  
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com'.toLowerCase() },
      });
      expect(res.json).toHaveBeenCalledWith({ error: "Account does not exist" });
    });
  });
  
  
