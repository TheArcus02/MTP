import { NotFoundError } from '../../shared/errors/app-error';
import type { PublicHoliday } from './holidays.types';

class HolidaysService {
  private readonly baseUrl = 'https://date.nager.at/api/v3';

  async getPublicHolidays(
    year: number,
    countryCode: string
  ): Promise<PublicHoliday[]> {
    const url = `${this.baseUrl}/PublicHolidays/${year}/${countryCode}`;

    try {
      const response = await fetch(url);

      if (response.status === 404) {
        throw new NotFoundError(
          `No public holidays found for country code: ${countryCode}`
        );
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch holidays: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as PublicHoliday[];
      return data;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new Error(
        `Error fetching public holidays: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const holidaysService = new HolidaysService();
