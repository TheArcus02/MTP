import { z } from 'zod/v4';

export const createLeaveRequestSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return start >= now;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export const updateLeaveRequestSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return start >= now;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export const leaveRequestIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number),
});

export const approveLeaveRequestSchema = z.object({
  adminComment: z.string().optional(),
});

export const rejectLeaveRequestSchema = z.object({
  adminComment: z.string().min(1, 'Admin comment is required for rejection'),
});
