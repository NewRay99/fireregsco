// Temporary implementation of Twitter cache functions
// This prevents build errors when Supabase isn't fully configured

/**
 * Check if a Twitter handle has been scraped today
 */
export const hasBeenScrapedToday = async (twitterHandle: string): Promise<boolean> => {
  console.log('Checking if Twitter handle has been scraped today:', twitterHandle);
  // Always return false in development to allow scraping
  return false;
};

/**
 * Record a Twitter scrape event (mock implementation)
 */
export const recordTwitterScrape = async (
  twitterHandle: string,
  success: boolean = true,
  details: any = {}
): Promise<any> => {
  console.log('Recording Twitter scrape:', { twitterHandle, success, details });
  // Return mock data
  return { id: 'mock-id', twitterHandle, success, details };
}; 