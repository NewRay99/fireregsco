'use client';

import { useState } from 'react';
import { Switch } from '@headlessui/react';

interface SeedingOptions {
  includeVoidedSales: boolean;
  includeSeasonalTrends: boolean;
  includeDelayedBookings: boolean;
}

export default function DatabaseSeeding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState(50);
  const [options, setOptions] = useState<SeedingOptions>({
    includeVoidedSales: true,
    includeSeasonalTrends: true,
    includeDelayedBookings: true
  });

  const handleSeedAction = async (action: 'clear' | 'seed' | 'both') => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'sales',
          count: action === 'clear' ? 0 : recordCount,
          clearExisting: action === 'clear' || action === 'both',
          options: action === 'seed' || action === 'both' ? options : undefined
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to perform seeding action');
      }

      setSuccess(`Successfully ${action === 'clear' ? 'cleared' : action === 'seed' ? 'seeded' : 'cleared and reseeded'} the database`);
      
      // Refresh the page data after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Database Seeding Controls</h2>
      
      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-md">
          {success}
        </div>
      )}
      
      {/* Record Count Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Number of Records</label>
        <input
          type="number"
          min="1"
          max="1000"
          value={recordCount}
          onChange={(e) => setRecordCount(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
        />
      </div>
      
      {/* Options */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700">Seeding Options</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Include Voided Sales</span>
          <Switch
            checked={options.includeVoidedSales}
            onChange={(checked: boolean) => setOptions(prev => ({ ...prev, includeVoidedSales: checked }))}
            className={`${
              options.includeVoidedSales ? 'bg-red-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                options.includeVoidedSales ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Include Seasonal Trends</span>
          <Switch
            checked={options.includeSeasonalTrends}
            onChange={(checked: boolean) => setOptions(prev => ({ ...prev, includeSeasonalTrends: checked }))}
            className={`${
              options.includeSeasonalTrends ? 'bg-red-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                options.includeSeasonalTrends ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Include Delayed Bookings</span>
          <Switch
            checked={options.includeDelayedBookings}
            onChange={(checked: boolean) => setOptions(prev => ({ ...prev, includeDelayedBookings: checked }))}
            className={`${
              options.includeDelayedBookings ? 'bg-red-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                options.includeDelayedBookings ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleSeedAction('clear')}
          disabled={isLoading}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {isLoading ? 'Clearing...' : 'Clear All Data'}
        </button>
        
        <button
          onClick={() => handleSeedAction('seed')}
          disabled={isLoading}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? 'Seeding...' : 'Seed Fresh Data'}
        </button>
        
        <button
          onClick={() => handleSeedAction('both')}
          disabled={isLoading}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Clear & Reseed'}
        </button>
      </div>
    </div>
  );
} 