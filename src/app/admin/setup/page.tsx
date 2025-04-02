'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const codeRef = useRef<HTMLDivElement>(null);
  const [statusWorkflow, setStatusWorkflow] = useState<any>(null);
  
  useEffect(() => {
    // Fetch the status workflow information on component mount
    const fetchStatusWorkflow = async () => {
      try {
        const response = await fetch(`/api/leads/status-workflow`);
        
        if (!response.ok) {
          console.error('Failed to fetch status workflow');
          return;
        }
        
        const data = await response.json();
        
        if (data.success && data.statusWorkflow) {
          setStatusWorkflow(data.statusWorkflow);
        }
      } catch (err) {
        console.error('Error fetching status workflow:', err);
      }
    };
    
    fetchStatusWorkflow();
  }, []);
  
  const copyToClipboard = () => {
    if (codeRef.current) {
      const text = codeRef.current.innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert('Code copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold pb-6">Google Sheets Setup Guide</h1>
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('setup')}
            className={`${
              activeTab === 'setup'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Setup Instructions
          </button>
          <button
            onClick={() => setActiveTab('statusflow')}
            className={`${
              activeTab === 'statusflow'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Status Workflow
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`${
              activeTab === 'supabase'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Supabase Setup
          </button>
          <button
            onClick={() => setActiveTab('troubleshooting')}
            className={`${
              activeTab === 'troubleshooting'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Troubleshooting
          </button>
        </nav>
      </div>
      
      {activeTab === 'setup' && (
        <div className="prose max-w-none mb-8">
          <p className="text-lg">
            Follow these steps to integrate your lead management system with Google Sheets.
            This will allow you to save form submissions to a Google Sheet and track their status.
          </p>
          
          <ol className="mt-6 list-decimal pl-6 space-y-6">
            <li className="pl-2">
              <h3 className="text-xl font-medium text-gray-900">Create a new Google Sheet</h3>
              <p>Create a new Google Sheet with two sheets:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Contacts</strong> - For storing form submissions</li>
                <li><strong>Lead Tracking</strong> - For tracking status changes</li>
              </ul>
            </li>
            
            <li className="pl-2">
              <h3 className="text-xl font-medium text-gray-900">Open Google Apps Script</h3>
              <p>
                In your Google Sheet, go to <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.
                This will open the Google Apps Script editor in a new tab.
              </p>
            </li>
            
            <li className="pl-2">
              <h3 className="text-xl font-medium text-gray-900">Replace the code</h3>
              <p>
                Delete any code in the editor and replace it with the code below. Make sure to
                update the <code>SPREADSHEET_ID</code> variable with your Google Sheet ID.
              </p>
              
              <div className="mt-4 mb-2">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showCode ? 'Hide Code' : 'Show Code'}
                </button>
              </div>
              
              {showCode && (
                <div className="relative">
                  <div 
                    ref={codeRef}
                    className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto text-sm font-mono"
                    style={{ maxHeight: '400px' }}
                  >
                    {`// Replace with your actual Google Sheet ID
const SPREADSHEET_ID = 'your-spreadsheet-id-here';

// Status values
const VALID_STATUSES = ['pending', 'contacted', 'sent invoice', 'completed', 'not available'];
const DEFAULT_STATUS = 'pending';

// Function to get active spreadsheet using ID
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Get sheet by name or create it if it doesn't exist
function getOrCreateSheet(name) {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    if (name === 'Contacts') {
      // Setup headers for Contacts sheet
      sheet.appendRow([
        'ID', 'Name', 'Email', 'Phone', 'Message', 
        'Status', 'Created At', 'Updated At', 'Notes'
      ]);
    } else if (name === 'Lead Tracking') {
      // Setup headers for Lead Tracking sheet
      sheet.appendRow([
        'Lead ID', 'Contact ID', 'Status', 'Notes', 'Updated At', 'Updated By'
      ]);
    }
  }
  
  return sheet;
}`}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 bg-gray-700 text-gray-100 px-2 py-1 rounded text-xs hover:bg-gray-600"
                  >
                    Copy
                  </button>
                </div>
              )}
            </li>
          </ol>
        </div>
      )}
      
      {activeTab === 'statusflow' && (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-6">Lead Status Workflow</h2>
          <p className="mb-4">
            The lead management system follows a specific workflow for tracking the progression of leads.
            Each status represents a different phase in the customer journey:
          </p>
          
          {statusWorkflow ? (
            <div className="mt-6 space-y-8">
              <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {Object.entries(statusWorkflow)
                    .sort((a: any, b: any) => a[1].order - b[1].order)
                    .map(([status, info]: [string, any]) => (
                      <li key={status} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className={`
                                h-4 w-4 rounded-full
                                ${status === 'pending' ? 'bg-yellow-400' : ''}
                                ${status === 'contacted' ? 'bg-blue-400' : ''}
                                ${status === 'interested' ? 'bg-indigo-400' : ''}
                                ${status === 'reserved booking' ? 'bg-purple-400' : ''}
                                ${status === 'sent invoice' ? 'bg-pink-400' : ''}
                                ${status === 'payment received' ? 'bg-green-400' : ''}
                                ${status === 'booked' ? 'bg-teal-400' : ''}
                                ${status === 'completed inspection' ? 'bg-cyan-400' : ''}
                                ${status === 'completed' ? 'bg-green-600' : ''}
                                ${status === 'refunded' ? 'bg-orange-400' : ''}
                                ${status === 'aftersales' ? 'bg-emerald-400' : ''}
                                ${status === 'void' ? 'bg-red-500' : ''}
                                ${status === 'not available' ? 'bg-gray-400' : ''}
                              `}></div>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-medium text-gray-900 capitalize">{status}</h3>
                              <p className="mt-1 text-sm text-gray-500">{info.description}</p>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Order: {info.order}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> The statuses follow a general workflow, but some statuses like "contacted" can occur multiple times, and "void" can happen at any point in the process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-gray-400">Loading status workflow...</div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'supabase' && (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-6">Using Supabase Instead of Google Sheets</h2>
          <p className="mb-4">
            Supabase is a modern alternative to Google Sheets for storing lead and tracking data.
            It provides a more robust database solution with better performance and scalability.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> You can use either Google Sheets or Supabase as your data storage solution. 
                  The system will automatically detect which one to use based on your environment configuration.
                </p>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-medium mb-4">Prerequisites</h3>
          <ol className="list-decimal pl-6 mb-6 space-y-2">
            <li>A Supabase account (free tier works fine for testing)</li>
            <li>Your project's environment variables properly configured</li>
          </ol>
          
          <h3 className="text-xl font-medium mb-4">Setting Up Supabase</h3>
          <ol className="list-decimal pl-6 space-y-6">
            <li className="pl-2">
              <h4 className="text-lg font-medium text-gray-900">Create a Supabase Project</h4>
              <p>Sign up or log in at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">supabase.com</a> and create a new project.</p>
            </li>
            
            <li className="pl-2">
              <h4 className="text-lg font-medium text-gray-900">Set Up Database Tables</h4>
              <p>Run the following SQL in the Supabase SQL Editor to create the required tables:</p>
              
              <div className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto text-sm font-mono mt-4">
                <pre>{`-- Leads table
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_type TEXT,
  door_count TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  preferred_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Status tracking table
CREATE TABLE status_tracking (
  id SERIAL PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id),
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Status workflow reference table
CREATE TABLE status_workflow (
  id SERIAL PRIMARY KEY,
  status TEXT UNIQUE NOT NULL,
  description TEXT,
  order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_status_tracking_lead_id ON status_tracking(lead_id);`}</pre>
              </div>
            </li>
            
            <li className="pl-2">
              <h4 className="text-lg font-medium text-gray-900">Configure Environment Variables</h4>
              <p>Add the following to your <code>.env.local</code> file:</p>
              
              <div className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto text-sm font-mono mt-4">
                <pre>{`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
USE_SUPABASE_STORAGE=true`}</pre>
              </div>
            </li>
            
            <li className="pl-2">
              <h4 className="text-lg font-medium text-gray-900">Populate Status Workflow</h4>
              <p>Run the following SQL to populate the status workflow table:</p>
              
              <div className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto text-sm font-mono mt-4">
                <pre>{`INSERT INTO status_workflow (status, description, order)
VALUES
  ('pending', 'Initial status for new leads', 0),
  ('contacted', 'The lead has been contacted', 1),
  ('interested', 'Lead has expressed interest', 2),
  ('reserved booking', 'Booking tentatively reserved', 3),
  ('sent invoice', 'Invoice sent to lead', 4),
  ('payment received', 'Payment received for booking', 5),
  ('booked', 'Booking confirmed and scheduled', 6),
  ('completed inspection', 'Inspection completed', 7),
  ('completed', 'Service process completed', 8),
  ('not available', 'Lead unavailable or uninterested', 999);`}</pre>
              </div>
            </li>
            
            <li className="pl-2">
              <h4 className="text-lg font-medium text-gray-900">Test the Setup</h4>
              <p>Navigate to <code>/admin/seed</code> and generate test data with a small batch (10-20 leads).</p>
              <p>Check the Supabase dashboard to verify data is being saved correctly.</p>
            </li>
          </ol>
          
          <h3 className="text-xl font-medium mb-4 mt-8">Switching Between Storage Options</h3>
          <p className="mb-4">
            You can easily switch between Google Sheets and Supabase by changing a single environment variable:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To use Supabase: Set <code>USE_SUPABASE_STORAGE=true</code></li>
            <li>To use Google Sheets: Set <code>USE_SUPABASE_STORAGE=false</code> (or remove the variable)</li>
          </ul>
          
          <p className="mt-6">
            For detailed instructions and troubleshooting, refer to the <code>SUPABASE_SETUP.md</code> file in the project root.
          </p>
        </div>
      )}
      
      {activeTab === 'troubleshooting' && (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-6">Troubleshooting</h2>
          <p className="mb-4">
            If you encounter any issues with the integration, here are some common problems and solutions:
          </p>
          
          <ul className="mt-4 space-y-4">
            <li className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900">Form submissions not saving</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ensure that your Google Sheet ID is correct and that you've published your Apps Script as a web app.
                Also check that your sheet has the correct headers for Contacts and Lead Tracking.
              </p>
            </li>
            
            <li className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900">Status updates not working</h3>
              <p className="mt-1 text-sm text-gray-500">
                Verify that the lead ID exists in your Contacts sheet and that you're using valid status values.
                Valid statuses are: pending, contacted, interested, reserved booking, sent invoice, payment received, booked, completed inspection, completed, refunded, aftersales, void, not available.
              </p>
            </li>
            
            <li className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900">CORS errors</h3>
              <p className="mt-1 text-sm text-gray-500">
                Make sure you've published your Apps Script as a web app with the correct access permissions.
                The web app should be published with "Execute as: Me" and "Who has access: Anyone".
              </p>
            </li>
          </ul>
          
          <div className="mt-8">
            <h3 className="text-xl font-medium text-gray-900">Need more help?</h3>
            <p className="mt-2">
              If you're still experiencing issues, check the browser console for error messages and 
              contact support with these details for faster resolution.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 