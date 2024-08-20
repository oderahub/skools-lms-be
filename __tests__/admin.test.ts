import { Request, Response } from 'express';
import { singleDownload } from '../src/controller/admin';
import puppeteer, { Browser, Page } from 'puppeteer';

jest.mock('puppeteer');

describe('Admin Controller - singleDownload', () => {
  let mockPage: jest.Mocked<Page>; // Use jest.Mocked<Type>
  let mockBrowser: jest.Mocked<Browser>; // Use jest.Mocked<Type>

  beforeEach(() => {
    // Mock puppeteer functions for each test
    mockPage = {
      goto: jest.fn().mockResolvedValue(null), // Simulate successful navigation
      content: jest.fn().mockResolvedValue('<html></html>'), // Return a Buffer to mimic actual behavior
    } as unknown as jest.Mocked<Page>;

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<Browser>;
    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
  });


  test('should attempt to fetch HTML content', async () => {
    // Setup: No need to simulate failure here since the function doesn't handle it
    const req = { params: { id: '123' } } as unknown as Request;
    const res = {
      send: jest.fn(),
    } as unknown as Response;
  
    await singleDownload(req, res);
  
    // Verification: Check that the critical methods were called, indicating an attempt was made to fetch content
    expect(mockPage.goto).toHaveBeenCalledWith(expect.stringContaining('123'), expect.any(Object));
    expect(mockPage.content).toHaveBeenCalled();
    // Since the function doesn't explicitly handle errors, we don't assert on error handling here
  });

  // Example additional test for error handling
  test('should throw an error on failure', async () => {
    mockPage.goto.mockRejectedValue(new Error('Navigation failed')); // Simulate navigation failure
  
    const req = { params: { id: '123' } } as unknown as Request;
    const res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
  
    try {
      await singleDownload(req, res);
      // If singleDownload does not throw, this test should fail
      fail('singleDownload did not throw an error as expected');
    } catch (error) {
      // Assert that an error is thrown by the singleDownload function
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Navigation failed');
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
