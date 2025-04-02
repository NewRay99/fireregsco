import { NextRequest, NextResponse } from 'next/server';

// Define a type for Twitter API response tweet
interface Tweet {
  text: string;
  id: string;
  created_at?: string;
  [key: string]: any; // For any other fields
}

export async function GET(request: NextRequest) {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    if (!bearerToken) {
      throw new Error('Twitter API Bearer Token is not configured');
    }
    
    // Use Twitter API v2 to search for tweets with the hashtag
    // Adding more parameters to get the most recent tweets
    const response = await fetch(
      'https://api.twitter.com/2/tweets/search/recent?query=%23fireregscocounter&max_results=10&tweet.fields=created_at&sort_order=recency',
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Disable caching to always get fresh data
      }
    );

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Twitter API response:', JSON.stringify(data, null, 2));
    
    // Check if we have tweets
    if (!data.data || data.data.length === 0) {
      throw new Error('No tweets found with #fireregscocounter');
    }
    
    // Get all tweets and find the one with a number
    const tweets: Tweet[] = data.data;
    console.log('Found tweets:', tweets.map((t: Tweet) => t.text).join(', '));
    
    let highestCount = null;
    let latestTweet = null;
    
    // Try to find the highest number in the tweets
    for (const tweet of tweets) {
      const counterMatch = tweet.text.match(/(\d+)/);
      if (counterMatch) {
        const count = parseInt(counterMatch[1], 10);
        if (highestCount === null || count > highestCount) {
          highestCount = count;
          latestTweet = tweet.text;
        }
      }
    }
    
    if (!highestCount || !latestTweet) {
      throw new Error('Could not extract door count from any tweets');
    }
    
    return NextResponse.json({ 
      count: highestCount,
      tweet: latestTweet,
      updated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      fallbackCount: 12311
    }, { status: 500 });
  }
} 