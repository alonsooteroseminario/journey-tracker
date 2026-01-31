import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock getCurrentUser
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

describe('POST /api/profile/image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload profile image with valid data URL', async () => {
    const mockUser = { id: 'user-123', name: 'John' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Small valid base64 PNG (1x1 pixel)
    const validDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const updatedUser = {
      id: 'user-123',
      profileImage: validDataUrl,
    };
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile/image', {
      method: 'POST',
      body: JSON.stringify({ image: validDataUrl }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profileImage).toBe(validDataUrl);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { profileImage: validDataUrl },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const validDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const request = new NextRequest('http://localhost:3000/api/profile/image', {
      method: 'POST',
      body: JSON.stringify({ image: validDataUrl }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should return 400 if image is not a data URL', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile/image', {
      method: 'POST',
      body: JSON.stringify({ image: 'not-a-data-url' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should return 400 if image field is missing', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile/image', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should return 400 if image exceeds 2MB size limit (SECURITY)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Create a base64 string larger than 2MB
    // Base64 encoding increases size by ~33%, so we need ~2.67MB of data
    const largeData = 'A'.repeat(2_800_000); // ~2.8MB
    const largeDataUrl = `data:image/png;base64,${largeData}`;

    const request = new NextRequest('http://localhost:3000/api/profile/image', {
      method: 'POST',
      body: JSON.stringify({ image: largeDataUrl }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should fail validation due to size limit
    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should accept image at exactly 2MB size limit', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Create a base64 string at exactly 2MB (2,097,152 bytes)
    const exactSize = 2_097_152;
    const dataUrlPrefix = 'data:image/png;base64,';
    const dataSize = exactSize - dataUrlPrefix.length;
    const exactData = 'A'.repeat(dataSize);
    const exactDataUrl = dataUrlPrefix + exactData;

    const updatedUser = {
      id: 'user-123',
      profileImage: exactDataUrl,
    };
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile/image', {
      method: 'POST',
      body: JSON.stringify({ image: exactDataUrl }),
    });

    const response = await POST(request);

    // Should succeed
    expect(response.status).toBe(200);
  });

  it('should handle different image formats (JPEG)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const jpegDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDA==';

    const updatedUser = {
      id: 'user-123',
      profileImage: jpegDataUrl,
    };
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile/image', {
      method: 'POST',
      body: JSON.stringify({ image: jpegDataUrl }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('should return 500 if database error occurs', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'));

    const validDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const request = new NextRequest('http://localhost:3000/api/profile/image', {
      method: 'POST',
      body: JSON.stringify({ image: validDataUrl }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
