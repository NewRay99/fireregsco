'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const codeRef = useRef<HTMLDivElement>(null);
  
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
      
      {activeTab === 'setup' ? (
        <>
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
}

// Function to detect headers in sheet (makes things more robust)
function getHeadersFromSheet(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers;
}

// Main function to handle GET requests
function doGet(e) {
  try {
    // Start with basic CORS headers
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Parse parameters
    const params = e.parameter;
    const sheetName = params.sheet || 'Contacts';
    
    // Access the sheet
    const sheet = getOrCreateSheet(sheetName);
    const headers = getHeadersFromSheet(sheet);
    
    // Get all data except headers
    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1); // Skip header row
    
    // Map rows to objects using headers
    const resultData = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        if (index < row.length) {
          obj[header.toLowerCase().replace(/\\s+/g, '')] = row[index];
        }
      });
      return obj;
    });
    
    // Prepare success response
    const response = {
      success: true,
      source: 'google_sheets',
      data: resultData
    };
    
    output.setContent(JSON.stringify(response));
    return output;
  } catch (error) {
    // Handle errors
    const errorResponse = {
      success: false,
      source: 'google_sheets',
      error: error.toString()
    };
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(errorResponse));
    return output;
  }
}

// Function to handle POST requests (new form submissions)
function doPost(e) {
  try {
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Parse the POST data
    let postData;
    if (e.postData.type === "application/json") {
      postData = JSON.parse(e.postData.contents);
    } else {
      // Handle form URL encoded data if needed
      postData = e.parameter;
    }
    
    // Validate required fields
    if (!postData.name || !postData.email) {
      const errorResponse = {
        success: false,
        error: "Name and email are required fields"
      };
      output.setContent(JSON.stringify(errorResponse));
      return output;
    }
    
    // Generate a unique ID for the contact
    const contactId = Utilities.getUuid();
    
    // Prepare row data for Contacts sheet
    const contactsSheet = getOrCreateSheet('Contacts');
    const timestamp = new Date().toISOString();
    
    // Get headers to ensure we're writing data in the correct order
    const contactHeaders = getHeadersFromSheet(contactsSheet);
    
    // Prepare data using header order
    const contactData = [];
    contactHeaders.forEach(header => {
      const headerLower = header.toLowerCase();
      
      if (headerLower === 'id') {
        contactData.push(contactId);
      } else if (headerLower === 'status') {
        contactData.push(DEFAULT_STATUS);
      } else if (headerLower === 'created at' || headerLower === 'createdat') {
        contactData.push(timestamp);
      } else if (headerLower === 'updated at' || headerLower === 'updatedat') {
        contactData.push(timestamp);
      } else if (headerLower === 'notes') {
        contactData.push('');
      } else {
        // Look for matching field in postData
        const matchingKey = Object.keys(postData).find(key => 
          key.toLowerCase() === headerLower || 
          key.toLowerCase().replace(/\\s+/g, '') === headerLower.replace(/\\s+/g, '')
        );
        
        contactData.push(matchingKey ? postData[matchingKey] : '');
      }
    });
    
    // Add to Contacts sheet
    contactsSheet.appendRow(contactData);
    
    // Add initial entry to Lead Tracking sheet
    const trackingSheet = getOrCreateSheet('Lead Tracking');
    const trackingHeaders = getHeadersFromSheet(trackingSheet);
    
    const trackingData = [];
    trackingHeaders.forEach(header => {
      const headerLower = header.toLowerCase();
      
      if (headerLower === 'lead id') {
        trackingData.push(contactId);
      } else if (headerLower === 'contact id') {
        trackingData.push(contactId);
      } else if (headerLower === 'status') {
        trackingData.push(DEFAULT_STATUS);
      } else if (headerLower === 'updated at' || headerLower === 'updatedat') {
        trackingData.push(timestamp);
      } else if (headerLower === 'notes') {
        trackingData.push('Initial submission');
      } else if (headerLower === 'updated by') {
        trackingData.push('system');
      } else {
        trackingData.push('');
      }
    });
    
    trackingSheet.appendRow(trackingData);
    
    // Return success response
    const response = {
      success: true,
      message: "Form submission saved successfully",
      contactId: contactId
    };
    
    output.setContent(JSON.stringify(response));
    return output;
    
  } catch (error) {
    // Handle errors
    const errorResponse = {
      success: false,
      error: error.toString()
    };
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(errorResponse));
    return output;
  }
}

// Function to handle PUT requests (status updates)
function doPut(e) {
  try {
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Parse the PUT data
    let putData;
    if (e.postData.type === "application/json") {
      putData = JSON.parse(e.postData.contents);
    } else {
      putData = e.parameter;
    }
    
    // Validate required fields
    if (!putData.id || !putData.status) {
      const errorResponse = {
        success: false,
        error: "Lead ID and status are required fields"
      };
      output.setContent(JSON.stringify(errorResponse));
      return output;
    }
    
    // Validate status
    if (!VALID_STATUSES.includes(putData.status.toLowerCase())) {
      const errorResponse = {
        success: false,
        error: "Invalid status value. Valid values are: " + VALID_STATUSES.join(", ")
      };
      output.setContent(JSON.stringify(errorResponse));
      return output;
    }
    
    const leadId = putData.id;
    const newStatus = putData.status.toLowerCase();
    const notes = putData.notes || '';
    const timestamp = new Date().toISOString();
    const updatedBy = putData.updatedBy || 'admin';
    
    // Update status in Contacts sheet
    const contactsSheet = getOrCreateSheet('Contacts');
    const contactsData = contactsSheet.getDataRange().getValues();
    const contactsHeaders = contactsData[0];
    
    // Find ID column index
    const idColIndex = contactsHeaders.findIndex(h => 
      h.toLowerCase() === 'id'
    );
    
    // Find status column index
    const statusColIndex = contactsHeaders.findIndex(h => 
      h.toLowerCase() === 'status'
    );
    
    // Find notes column index
    const notesColIndex = contactsHeaders.findIndex(h => 
      h.toLowerCase() === 'notes'
    );
    
    // Find updated at column index
    const updatedAtColIndex = contactsHeaders.findIndex(h => 
      h.toLowerCase() === 'updated at' || h.toLowerCase() === 'updatedat'
    );
    
    if (idColIndex === -1 || statusColIndex === -1) {
      const errorResponse = {
        success: false,
        error: "Required columns not found in Contacts sheet"
      };
      output.setContent(JSON.stringify(errorResponse));
      return output;
    }
    
    // Find the row with matching leadId
    let found = false;
    for (let i = 1; i < contactsData.length; i++) {
      if (contactsData[i][idColIndex] === leadId) {
        // Update status
        contactsSheet.getRange(i + 1, statusColIndex + 1).setValue(newStatus);
        
        // Update notes if notes column exists
        if (notesColIndex !== -1 && notes) {
          contactsSheet.getRange(i + 1, notesColIndex + 1).setValue(notes);
        }
        
        // Update updated at timestamp if column exists
        if (updatedAtColIndex !== -1) {
          contactsSheet.getRange(i + 1, updatedAtColIndex + 1).setValue(timestamp);
        }
        
        found = true;
        break;
      }
    }
    
    if (!found) {
      const errorResponse = {
        success: false,
        error: "Lead ID not found in Contacts sheet"
      };
      output.setContent(JSON.stringify(errorResponse));
      return output;
    }
    
    // Add entry to Lead Tracking sheet
    const trackingSheet = getOrCreateSheet('Lead Tracking');
    const trackingHeaders = getHeadersFromSheet(trackingSheet);
    
    const trackingData = [];
    trackingHeaders.forEach(header => {
      const headerLower = header.toLowerCase();
      
      if (headerLower === 'lead id') {
        trackingData.push(leadId);
      } else if (headerLower === 'contact id') {
        trackingData.push(leadId);
      } else if (headerLower === 'status') {
        trackingData.push(newStatus);
      } else if (headerLower === 'notes') {
        trackingData.push(notes);
      } else if (headerLower === 'updated at' || headerLower === 'updatedat') {
        trackingData.push(timestamp);
      } else if (headerLower === 'updated by') {
        trackingData.push(updatedBy);
      } else {
        trackingData.push('');
      }
    });
    
    trackingSheet.appendRow(trackingData);
    
    // Return success response
    const response = {
      success: true,
      message: "Lead status updated successfully"
    };
    
    output.setContent(JSON.stringify(response));
    return output;
    
  } catch (error) {
    // Handle errors
    const errorResponse = {
      success: false,
      error: error.toString()
    };
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(errorResponse));
    return output;
  }
}`}
                    </div>
                    <button 
                      className="absolute top-2 right-2 bg-gray-700 text-white p-1 rounded-md hover:bg-gray-600"
                      onClick={copyToClipboard}
                    >
                      Copy
                    </button>
                  </div>
                )}
              </li>
              
              <li className="pl-2">
                <h3 className="text-xl font-medium text-gray-900">Get your Google Sheet ID</h3>
                <p>
                  Your Google Sheet ID is the long string of characters in the URL of your sheet:
                </p>
                <div className="bg-gray-100 p-2 rounded-md mt-2 text-sm font-mono overflow-auto">
                  https://docs.google.com/spreadsheets/d/<strong className="text-red-700">1ABC123_YOUR_SHEET_ID_HERE</strong>/edit
                </div>
                <p className="mt-2">
                  Replace <code>your-spreadsheet-id-here</code> in the code with your actual Sheet ID.
                </p>
              </li>
              
              <li className="pl-2">
                <h3 className="text-xl font-medium text-gray-900">Deploy as a web app</h3>
                <div className="space-y-3">
                  <p>Follow these steps to deploy your script as a web app:</p>
                  <ol className="list-decimal pl-6">
                    <li>Click on <strong>Deploy</strong> &gt; <strong>New deployment</strong></li>
                    <li>Select <strong>Web app</strong> as the deployment type</li>
                    <li>Set the following configuration:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Description: "Lead Tracking API"</li>
                        <li>Execute as: "Me" (your Google account)</li>
                        <li>Who has access: <strong>"Anyone"</strong></li>
                      </ul>
                    </li>
                    <li>Click <strong>Deploy</strong></li>
                    <li>Authorize the app when prompted</li>
                    <li>Copy the Web App URL that appears after deployment</li>
                  </ol>
                </div>
              </li>
              
              <li className="pl-2">
                <h3 className="text-xl font-medium text-gray-900">Update your environment variables</h3>
                <p>
                  Add the Web App URL to your <code>.env.local</code> file:
                </p>
                <div className="bg-gray-100 p-2 rounded-md mt-2 text-sm font-mono">
                  GOOGLE_SHEETS_URL=your-web-app-url-here
                </div>
              </li>
              
              <li className="pl-2">
                <h3 className="text-xl font-medium text-gray-900">Test the integration</h3>
                <p>
                  Submit a contact form on your website and verify that the data appears in your Google Sheet.
                  Then, check the admin page to ensure that you can view and update lead statuses.
                </p>
              </li>
            </ol>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Note</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    You must visit the Web App URL directly in your browser at least once after deployment 
                    to accept the permissions. Otherwise, the API calls might be blocked.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Troubleshooting tab content
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Troubleshooting Common Issues</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium text-gray-900">CORS Errors</h3>
              <p>
                If you're seeing CORS errors in your browser console, make sure:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Your Apps Script is deployed with access set to "Anyone"</li>
                <li>You've visited the Web App URL directly in your browser at least once</li>
                <li>The Web App URL in your <code>.env.local</code> file is correct</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-medium text-gray-900">Data Not Appearing in Google Sheets</h3>
              <p>
                If form submissions aren't appearing in your Google Sheet:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Verify that the <code>SPREADSHEET_ID</code> in your Apps Script is correct</li>
                <li>Check that your Google Sheet has sheets named exactly "Contacts" and "Lead Tracking"</li>
                <li>Look for errors in your browser console when submitting the form</li>
                <li>Ensure your Google account has edit access to the Sheet</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-medium text-gray-900">Status Updates Not Working</h3>
              <p>
                If you can't update lead statuses from the admin page:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Check that the Lead ID format matches between your app and the Google Sheet</li>
                <li>Verify that your Google Sheet has the correct column headers</li>
                <li>Make sure the Web App URL is correct in your environment variables</li>
                <li>Look for error messages in your browser console or server logs</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-medium text-gray-900">API Errors</h3>
              <p>
                If you're seeing API errors:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Check the error message in the response for specific details</li>
                <li>Verify that your Apps Script deployment is still active</li>
                <li>Make sure you haven't exceeded Google's quotas or rate limits</li>
                <li>Try redeploying your Apps Script with a new version</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Fallback System</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    If Google Sheets integration isn't working, the system will automatically fall back to 
                    using local storage. Your leads won't be lost, but they will only be available on your 
                    current server instance.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-medium text-gray-900">Still Need Help?</h3>
            <p>
              If you're still experiencing issues, check the following resources:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Google Apps Script documentation</li>
              <li>Google Sheets API quotas and limits</li>
              <li>Server logs for detailed error messages</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="mt-12 flex">
        <Link 
          href="/admin"
          className="text-red-700 hover:text-red-800 font-medium"
        >
          Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
} 