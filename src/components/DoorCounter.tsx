"use client";

import { useState, useEffect } from 'react';

export default function DoorCounter() {
  const [doorCount, setDoorCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    const fetchDoorCount = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the door count from our Twitter API endpoint
        const response = await fetch('/api/twitter/counter');
        const data = await response.json();
        
        // Save debug info
        setDebugInfo(data);
        
        if (!response.ok) {
          // If API failed but returned a fallback count, use it
          if (data.fallbackCount) {
            setDoorCount(data.fallbackCount);
            setError(`Using fallback count: ${data.error}`);
          } else {
            throw new Error(data.error || 'Failed to fetch count from Twitter');
          }
        } else if (data.count) {
          setDoorCount(data.count);
        } else {
          throw new Error('No count returned from API');
        }
      } catch (error) {
        console.error('Error fetching door count:', error);
        // Fallback to a default value if all else fails
        setDoorCount(12311);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoorCount();
    
    // Set up an interval to refresh the count every 5 minutes (300000 ms)
    // This is to avoid hitting Twitter API rate limits but still check regularly
    const intervalId = setInterval(fetchDoorCount, 300000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Force a refresh of the counter
  const refreshCounter = () => {
    setIsLoading(true);
    fetch('/api/twitter/counter?refresh=' + Date.now())
      .then(response => response.json())
      .then(data => {
        setDebugInfo(data);
        if (data.count) {
          setDoorCount(data.count);
          setError(null);
        } else if (data.fallbackCount) {
          setDoorCount(data.fallbackCount);
          setError(`Using fallback count: ${data.error}`);
        } else {
          setError(data.error || 'Failed to fetch count');
        }
      })
      .catch(err => {
        console.error('Error refreshing counter:', err);
        setError(err.message || 'Error refreshing');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-1">Fire Doors Inspected</h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-16">
            <div className="animate-pulse flex space-x-1">
              <div className="h-3 w-3 bg-white rounded-full"></div>
              <div className="h-3 w-3 bg-white rounded-full"></div>
              <div className="h-3 w-3 bg-white rounded-full"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-4xl font-bold mb-1 tabular-nums">
              {doorCount !== null ? formatNumber(doorCount) : "0"}
            </div>
            <p className="text-xs opacity-75">#fireregscocounter</p>
            
            {isDev && (
              <div className="mt-2">
                <button 
                  onClick={refreshCounter}
                  className="text-xs bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700"
                >
                  Refresh Counter
                </button>
                
                {error && (
                  <p className="text-xs text-yellow-200 mt-1">
                    {error}
                  </p>
                )}
                
                {debugInfo && debugInfo.tweet && (
                  <div className="text-xs text-left bg-black/30 p-2 mt-2 rounded">
                    <p className="font-bold">Tweet found:</p>
                    <p className="italic">"{debugInfo.tweet}"</p>
                    <p className="mt-1">Count: {debugInfo.count}</p>
                    <p>Updated: {new Date(debugInfo.updated).toLocaleTimeString()}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 