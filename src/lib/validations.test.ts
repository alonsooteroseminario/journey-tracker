import { describe, it, expect } from 'vitest';
import { 
  CreateGoalSchema, 
  UpdateProfileSchema, 
  ProfileImageSchema,
  PaginationSchema,
  validateRequest 
} from './validations';

describe('Validation Schemas', () => {
  describe('CreateGoalSchema', () => {
    it('should validate a valid goal', () => {
      const validGoal = {
        title: 'Test Goal',
        description: 'Test description',
        tasks: [],
        isPublic: true,
      };

      const result = validateRequest(CreateGoalSchema, validGoal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Goal');
      }
    });

    it('should reject goal without title', () => {
      const invalidGoal = {
        description: 'Test description',
      };

      const result = validateRequest(CreateGoalSchema, invalidGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('title');
      }
    });

    it('should reject goal with title too long', () => {
      const invalidGoal = {
        title: 'a'.repeat(201),
      };

      const result = validateRequest(CreateGoalSchema, invalidGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Title too long');
      }
    });
  });

  describe('UpdateProfileSchema', () => {
    it('should validate valid profile update', () => {
      const validUpdate = {
        name: 'John Doe',
        bio: 'A test bio',
        email: 'john@example.com',
      };

      const result = validateRequest(UpdateProfileSchema, validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidUpdate = {
        email: 'not-an-email',
      };

      const result = validateRequest(UpdateProfileSchema, invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid email format');
      }
    });
  });

  describe('ProfileImageSchema', () => {
    it('should reject non-data-URL image', () => {
      const invalidImage = {
        image: 'not-a-data-url',
      };

      const result = validateRequest(ProfileImageSchema, invalidImage);
      expect(result.success).toBe(false);
    });

    it('should accept valid data URL (mock)', () => {
      // Small valid data URL
      const validImage = {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      const result = validateRequest(ProfileImageSchema, validImage);
      expect(result.success).toBe(true);
    });
  });

  describe('PaginationSchema', () => {
    it('should default limit to 50 and offset to 0', () => {
      const result = validateRequest(PaginationSchema, {});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should reject limit > 100', () => {
      const result = validateRequest(PaginationSchema, { limit: 101 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('cannot exceed 100');
      }
    });

    it('should reject negative offset', () => {
      const result = validateRequest(PaginationSchema, { offset: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be non-negative');
      }
    });

    it('should coerce string numbers', () => {
      const result = validateRequest(PaginationSchema, { limit: '25', offset: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(10);
      }
    });
  });
});
