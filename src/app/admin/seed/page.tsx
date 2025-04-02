'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SeedPage() {
  const [count, setCount] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState<boolean>(false);
  
  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`/api/seed?count=${count}${dryRun ? '&dryRun=true' : ''}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to seed data');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Error seeding data:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Seed Lead Data</h1>
        <Link
          href="/admin/sales"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Back to Sales
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-medium text-gray-900 mb-6">Generate Dummy Leads</h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="count" className="block text-sm font-medium text-gray-700">
              Number of Leads to Generate
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="count"
                id="count"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                min="1"
                max="200"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Maximum 200 leads can be generated at once
            </p>
          </div>
          
          <div className="flex items-center">
            <input
              id="dryRun"
              name="dryRun"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            <label htmlFor="dryRun" className="ml-2 block text-sm text-gray-900">
              Dry Run (Preview without saving to database)
            </label>
          </div>
          
          <p className="text-sm text-gray-500">
            This will generate dummy lead data with realistic seasonal patterns. Leads will be generated across the past year with:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-500">
            <li>More leads in spring and summer months (April-August)</li>
            <li>Fewer leads in winter months (December-February)</li>
            <li>Varying status progressions (some leads convert quickly, others take longer)</li>
            <li>Realistic tracking history with timestamps and notes</li>
          </ul>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> This action will add dummy data to your Google Sheet. Consider using "Dry Run" first to preview the data.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="button"
              onClick={handleSeed}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {loading ? 'Processing...' : dryRun ? 'Preview Dummy Data' : 'Generate Dummy Data'}
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
              <div className="mt-2 text-sm text-red-700">
                <p className="font-medium">Troubleshooting tips:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Make sure your Google Sheets API is properly configured</li>
                  <li>Check that the GOOGLE_SHEETS_URL environment variable is set</li>
                  <li>Verify that your Google Apps Script is deployed as a web app</li>
                  <li>Try with a smaller batch of leads (10-20)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {result.success ? 'Success!' : 'Failed'}
          </h2>
          
          <p className="text-gray-700 mb-4">{result.message}</p>
          
          {result.failedCount > 0 && (
            <>
              <p className="text-yellow-600 mb-2">
                Failed to insert {result.failedCount} leads. Errors:
              </p>
              <ul className="pl-5 list-disc space-y-1">
                {result.errors.map((err: any, index: number) => (
                  <li key={index} className="text-sm text-gray-600">
                    {err.lead}: {err.error}
                  </li>
                ))}
                {result.errors.length < result.failedCount && (
                  <li className="text-sm text-gray-500">
                    ... and {result.failedCount - result.errors.length} more errors
                  </li>
                )}
              </ul>
            </>
          )}
          
          {result.leads && (
            <>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Sample Generated Leads (Preview):</h3>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto" style={{ maxHeight: '400px' }}>
                {result.leads.map((lead: any, index: number) => (
                  <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
                    <h4 className="font-medium">{lead.name}</h4>
                    <p className="text-gray-600 text-sm">{lead.email} | {lead.phone}</p>
                    <p className="text-gray-600 text-sm">{lead.propertyType} | {lead.doorCount} door(s)</p>
                    <p className="text-gray-600 text-sm mt-1">{lead.message}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Status: {lead.status}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        History: {lead.trackingHistory.length} entries
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {result && result.failedCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Failed to insert {result.failedCount} of {count} leads
              </p>
              
              <div className="mt-2">
                <p className="text-sm text-yellow-700 font-medium">Common reasons for failures:</p>
                <ul className="mt-1 text-sm text-yellow-700 list-disc space-y-1 pl-5">
                  <li>Google Sheets API request limits exceeded</li>
                  <li>Network connectivity issues</li>
                  <li>Formatting issues with the data</li>
                </ul>
                
                <p className="mt-2 text-sm text-yellow-700 font-medium">Specific errors:</p>
                <ul className="pl-5 list-disc space-y-1 mt-1">
                  {result.errors.map((err: any, index: number) => (
                    <li key={index} className="text-sm text-yellow-700">
                      {err.lead}: {err.error}
                    </li>
                  ))}
                  {result.errors.length < result.failedCount && (
                    <li className="text-sm text-yellow-500">
                      ... and {result.failedCount - result.errors.length} more errors
                    </li>
                  )}
                </ul>
                
                <p className="mt-2 text-sm text-yellow-700">
                  <strong>Suggestion:</strong> Try again with a smaller batch size, or check the Google Sheets API configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 