import { z } from 'zod/v4';

const currentYear = new Date().getFullYear();

export const holidaysParamsSchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, 'Year must be a 4-digit number')
    .transform(Number)
    .refine((year) => year >= 2000 && year <= currentYear + 10, {
      message: `Year must be between 2000 and ${currentYear + 10}`,
    }),
  countryCode: z
    .string()
    .length(2, 'Country code must be exactly 2 characters')
    .toUpperCase(),
});
