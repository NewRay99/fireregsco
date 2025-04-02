/**
 * Google Apps Script for handling form submissions and lead tracking
 * 
 * HOW TO USE:
 * 1. Create a new Google Sheet with two sheets:
 *    - First sheet named "Contacts" with columns: Contact ID, Timestamp, Name, Email, Phone, Property Type, Door Count, Preferred Date, Message, Status, Last Updated
 *    - Second sheet named "Lead Tracking" with columns: Lead ID, Contact ID, Contact Name, Email, Phone, Status, Notes, Timestamp
 * 
 * 2. In Google Sheets, go to Extensions > Apps Script
 * 3. Replace the code with this script
 * 4. Save and deploy as a web app:
 *    - Deploy > New deployment
 *    - Select type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone (IMPORTANT: Select "Anyone", not "Anyone with Google Account")
 * 5. Copy the web app URL and use it in your .env.local as GOOGLE_SHEETS_URL
 * 
 * IMPORTANT: After deploying, you must access the web app URL in your browser and accept the permissions.
 * This is required for the web app to work properly.
 */

// Spreadsheet ID - replace with your Google Sheet ID from the URL
const SPREADSHEET_ID = '1TmHHFR1WMQBoftylemuW28Rfrr9BizunigNHJhbUJOc'; // Replace with your actual Sheet ID

// Global variable for spreadsheet
let ss;

/**
 * Initialize the spreadsheet and ensure headers exist
 */
function initSpreadsheet() {
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    ensureSheetHeaders();
  } catch (error) {
    Logger.log(`Error initializing spreadsheet: ${error.toString()}`);
    throw new Error(`Failed to initialize spreadsheet: ${error.toString()}`);
  }
}

/**
 * Ensures that required headers exist in all sheets
 * This function verifies and adds headers if they don't exist
 */
function ensureSheetHeaders() {
  // Expected headers for each sheet
  const expectedHeaders = {
    'Contacts': [
      'Contact ID', 'Timestamp', 'Name', 'Email', 'Phone', 'Property Type', 
      'Door Count', 'Preferred Date', 'Message', 'Status', 'Last Updated'
    ],
    'Lead Tracking': [
      'Lead ID', 'Contact ID', 'Contact Name', 'Email', 'Phone', 
      'Status', 'Notes', 'Timestamp'
    ]
  };
  
  // Check and update headers for each sheet
  Object.keys(expectedHeaders).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      Logger.log(`Creating missing sheet: ${sheetName}`);
      const newSheet = ss.insertSheet(sheetName);
      newSheet.getRange(1, 1, 1, expectedHeaders[sheetName].length)
        .setValues([expectedHeaders[sheetName]])
        .setFontWeight('bold')
        .setBackground('#f3f3f3');
      return;
    }
    
    // Check if headers exist and match expected
    const headerRange = sheet.getRange(1, 1, 1, expectedHeaders[sheetName].length);
    const existingHeaders = headerRange.getValues()[0];
    
    // If first cell is empty, assume headers don't exist
    if (!existingHeaders[0]) {
      Logger.log(`Adding headers to sheet: ${sheetName}`);
      headerRange.setValues([expectedHeaders[sheetName]])
        .setFontWeight('bold')
        .setBackground('#f3f3f3');
    } else {
      // Check if headers match expected
      const needsUpdate = existingHeaders.some((header, index) => 
        header !== expectedHeaders[sheetName][index]
      );
      
      if (needsUpdate) {
        Logger.log(`Updating headers in sheet: ${sheetName}`);
        headerRange.setValues([expectedHeaders[sheetName]])
          .setFontWeight('bold')
          .setBackground('#f3f3f3');
      }
    }
  });
  
  Logger.log('Sheet headers check completed');
}

/**
 * Handle GET requests - fetch leads or provide documentation
 */
function doGet(e) {
  // Set CORS headers for cross-domain requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Initialize the spreadsheet
  try {
    initSpreadsheet();
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Check if we have a query parameter for action
  if (e && e.parameter && e.parameter.action === 'getLeads') {
    try {
      // Get all leads from the Contacts sheet
      const leads = getLeadsFromSheet();
      
      // Get tracking history for each lead
      const trackingHistoryByEmail = getTrackingHistoryByEmail();
      const trackingHistoryById = getTrackingHistoryById();
      
      // Debug log the tracking history
      Logger.log(`Found tracking history for ${Object.keys(trackingHistoryByEmail).length} emails and ${Object.keys(trackingHistoryById).length} IDs`);
      
      // Combine lead data with tracking history
      const leadsWithHistory = leads.map(lead => {
        // First try to match the lead ID directly
        if (trackingHistoryById[lead.id] && trackingHistoryById[lead.id].length > 0) {
          lead.trackingHistory = trackingHistoryById[lead.id];
          return lead;
        }
        
        // If no match by ID, try to match by email (case insensitive)
        const email = lead.email.toLowerCase();
        if (trackingHistoryByEmail[email] && trackingHistoryByEmail[email].length > 0) {
          lead.trackingHistory = trackingHistoryByEmail[email];
          return lead;
        }
        
        // If still no match, initialize an empty array
        lead.trackingHistory = [];
        return lead;
      });
      
      // Log the results for debugging
      Logger.log(`Returning ${leadsWithHistory.length} leads with history`);
      if (leadsWithHistory.length > 0) {
        Logger.log(`First lead has ${leadsWithHistory[0].trackingHistory.length} history entries`);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        leads: leadsWithHistory
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      Logger.log(`Error in doGet: ${error.toString()}`);
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Default to sending documentation about the API
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'This is a Google Apps Script Web App for handling contact form submissions and lead tracking. Please use POST requests to submit data, or GET with action=getLeads to fetch lead data.'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get tracking history by email for all leads in the Lead Tracking sheet
 * Groups by email (case insensitive)
 */
function getTrackingHistoryByEmail() {
  const trackingSheet = ss.getSheetByName('Lead Tracking');
  
  if (!trackingSheet) {
    return {};
  }
  
  const trackingData = trackingSheet.getDataRange().getValues();
  
  if (trackingData.length <= 1) {
    return {};
  }
  
  const trackingHistoryByEmail = {};
  
  // Find the indices for the tracking sheet columns using header row
  const headers = trackingData[0];
  const leadIdIdx = headers.indexOf('Lead ID');
  const contactIdIdx = headers.indexOf('Contact ID');
  const nameIdx = headers.indexOf('Contact Name');
  const emailIdx = headers.indexOf('Email');
  const phoneIdx = headers.indexOf('Phone');
  const statusIdx = headers.indexOf('Status');
  const notesIdx = headers.indexOf('Notes');
  const timestampIdx = headers.indexOf('Timestamp');
  
  // Verify all required columns exist
  if (leadIdIdx === -1 || emailIdx === -1 || statusIdx === -1) {
    Logger.log('Missing required columns in Lead Tracking sheet');
    return {};
  }
  
  // Process all rows
  for (let i = 1; i < trackingData.length; i++) {
    const row = trackingData[i];
    
    // Extract data from the row
    const leadId = row[leadIdIdx];
    const contactId = contactIdIdx !== -1 ? row[contactIdIdx] : '';
    const name = nameIdx !== -1 ? row[nameIdx] : '';
    const email = emailIdx !== -1 ? row[emailIdx] : '';
    const phone = phoneIdx !== -1 ? row[phoneIdx] : '';
    const status = statusIdx !== -1 ? row[statusIdx] : '';
    const notes = notesIdx !== -1 ? row[notesIdx] : '';
    const timestamp = timestampIdx !== -1 ? row[timestampIdx] : '';
    
    // Skip entries with missing data
    if (!leadId || !email) {
      continue;
    }
    
    const emailKey = email.toString().toLowerCase();
    
    const history = {
      leadId: leadId,
      contactId: contactId,
      name: name,
      email: email,
      phone: phone,
      status: status,
      notes: notes,
      timestamp: timestamp
    };
    
    // Group by email (lowercase for case insensitivity)
    if (!trackingHistoryByEmail[emailKey]) {
      trackingHistoryByEmail[emailKey] = [];
    }
    
    trackingHistoryByEmail[emailKey].push(history);
  }
  
  // Sort each email's history in descending order by timestamp
  Object.keys(trackingHistoryByEmail).forEach(email => {
    trackingHistoryByEmail[email].sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timeB.getTime() - timeA.getTime(); // Descending order
    });
  });
  
  return trackingHistoryByEmail;
}

/**
 * Get tracking history by ID for all leads in the Lead Tracking sheet
 * Groups by contact ID or lead ID
 */
function getTrackingHistoryById() {
  const trackingSheet = ss.getSheetByName('Lead Tracking');
  
  if (!trackingSheet) {
    return {};
  }
  
  const trackingData = trackingSheet.getDataRange().getValues();
  
  if (trackingData.length <= 1) {
    return {};
  }
  
  const trackingHistoryById = {};
  
  // Find the indices for the tracking sheet columns using header row
  const headers = trackingData[0];
  const leadIdIdx = headers.indexOf('Lead ID');
  const contactIdIdx = headers.indexOf('Contact ID');
  const nameIdx = headers.indexOf('Contact Name');
  const emailIdx = headers.indexOf('Email');
  const phoneIdx = headers.indexOf('Phone');
  const statusIdx = headers.indexOf('Status');
  const notesIdx = headers.indexOf('Notes');
  const timestampIdx = headers.indexOf('Timestamp');
  
  // Verify all required columns exist
  if (leadIdIdx === -1 || statusIdx === -1) {
    Logger.log('Missing required columns in Lead Tracking sheet');
    return {};
  }
  
  for (let i = 1; i < trackingData.length; i++) {
    const row = trackingData[i];
    
    // Extract data from the row
    const leadId = row[leadIdIdx];
    const contactId = contactIdIdx !== -1 ? row[contactIdIdx] : '';
    const name = nameIdx !== -1 ? row[nameIdx] : '';
    const email = emailIdx !== -1 ? row[emailIdx] : '';
    const phone = phoneIdx !== -1 ? row[phoneIdx] : '';
    const status = statusIdx !== -1 ? row[statusIdx] : '';
    const notes = notesIdx !== -1 ? row[notesIdx] : '';
    const timestamp = timestampIdx !== -1 ? row[timestampIdx] : '';
    
    // Skip entries with missing data
    if (!leadId) {
      continue;
    }
    
    const history = {
      leadId: leadId,
      contactId: contactId,
      name: name,
      email: email,
      phone: phone,
      status: status,
      notes: notes,
      timestamp: timestamp
    };
    
    // Group by both contact ID and lead ID to maximize chances of matching
    if (contactId) {
      if (!trackingHistoryById[contactId]) {
        trackingHistoryById[contactId] = [];
      }
      trackingHistoryById[contactId].push(history);
    }
    
    if (!trackingHistoryById[leadId]) {
      trackingHistoryById[leadId] = [];
    }
    trackingHistoryById[leadId].push(history);
  }
  
  // Sort each ID's history in descending order by timestamp
  Object.keys(trackingHistoryById).forEach(id => {
    trackingHistoryById[id].sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timeB.getTime() - timeA.getTime(); // Descending order
    });
  });
  
  return trackingHistoryById;
}

/**
 * Fetch leads from the Contacts sheet and group by email
 */
function getLeadsFromSheet() {
  const contactsSheet = ss.getSheetByName('Contacts');
  
  if (!contactsSheet) {
    throw new Error('Sheet "Contacts" not found');
  }
  
  const data = contactsSheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find the indices of the columns by header names
  const contactIdIdx = headers.indexOf('Contact ID');
  const timestampIdx = headers.indexOf('Timestamp');
  const nameIdx = headers.indexOf('Name');
  const emailIdx = headers.indexOf('Email');
  const phoneIdx = headers.indexOf('Phone');
  const propertyTypeIdx = headers.indexOf('Property Type');
  const doorCountIdx = headers.indexOf('Door Count');
  const preferredDateIdx = headers.indexOf('Preferred Date');
  const messageIdx = headers.indexOf('Message');
  const statusIdx = headers.indexOf('Status');
  const lastUpdatedIdx = headers.indexOf('Last Updated');
  
  // Verify all required columns exist
  if (contactIdIdx === -1 || emailIdx === -1 || statusIdx === -1) {
    Logger.log('Missing required columns in Contacts sheet');
    
    // Ensure headers are properly set
    ensureSheetHeaders();
    
    throw new Error('Contact sheet columns are missing or incorrectly named. The sheet has been updated with the correct headers. Please add your data to the matching columns.');
  }
  
  // Temporary map to group contacts by email
  const contactsByEmail = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip rows with missing required data
    if (!row[emailIdx]) continue;
    
    // Create or update contact
    const contact = {
      id: row[contactIdIdx] || ('contact-' + Utilities.getUuid()),
      timestamp: row[timestampIdx] || new Date().toISOString(),
      name: row[nameIdx] || '',
      email: row[emailIdx] || '',
      phone: row[phoneIdx] || '',
      propertyType: row[propertyTypeIdx] || '',
      doorCount: row[doorCountIdx] || '',
      preferredDate: row[preferredDateIdx] || '',
      message: row[messageIdx] || '',
      status: row[statusIdx] || 'pending',
      lastUpdated: row[lastUpdatedIdx] || row[timestampIdx] || new Date().toISOString(),
      rowIndex: i + 1 // Store the row index for later updates
    };
    
    // If we already have this email, keep only the latest one
    if (!contactsByEmail[contact.email] || 
        (contact.lastUpdated && contactsByEmail[contact.email].lastUpdated && 
         new Date(contact.lastUpdated) > new Date(contactsByEmail[contact.email].lastUpdated))) {
      contactsByEmail[contact.email] = contact;
    }
  }
  
  // Convert the map to an array
  return Object.values(contactsByEmail);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  // Initialize the spreadsheet
  try {
    initSpreadsheet();
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Check if we have valid JSON data
  if (e.postData.type === "application/json") {
    try {
      // Parse the request data
      const data = JSON.parse(e.postData.contents);
      let result;
      
      // Determine action type
      if (data.action === 'saveNewLead') {
        // This is a new contact form submission
        result = saveNewLead(data.data);
      } else if (data.action === 'updateLeadStatus') {
        // This is a lead status update
        result = updateLeadStatus(data.leadId, data.status, data.notes, data.timestamp);
      } else {
        // Default to saving to contacts sheet for backward compatibility
        result = saveToContactsSheet(data);
      }
      
      // Return success response
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        result: result
      })).setMimeType(ContentService.MimeType.JSON);
      
    } catch (error) {
      Logger.log(`Error in doPost: ${error.toString()}`);
      // Return error response
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } else {
    // Handle non-JSON requests
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Invalid content type. Expected application/json."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions() {
  // Create response with CORS headers
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setContent("");
}

/**
 * Find or create a contact by email in the Contacts sheet
 * @returns {Object} The contact including its ID and row index
 */
function findOrCreateContact(email, formData) {
  const contactsSheet = ss.getSheetByName('Contacts');
  
  if (!contactsSheet) {
    throw new Error('Sheet "Contacts" not found');
  }
  
  const data = contactsSheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find the indices of the columns we need
  const contactIdIdx = headers.indexOf('Contact ID');
  const emailIdx = headers.indexOf('Email');
  
  if (contactIdIdx === -1 || emailIdx === -1) {
    ensureSheetHeaders();
    throw new Error('Contact sheet headers are missing. The sheet has been updated with the correct headers. Please try again.');
  }
  
  // Search for existing contact with this email
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIdx] === email) {
      // Return existing contact data
      return {
        id: data[i][contactIdIdx] || ('contact-' + Utilities.getUuid()),
        rowIndex: i + 1, // 1-indexed row
        isNew: false
      };
    }
  }
  
  // No existing contact found, create a new one
  const contactId = 'contact-' + Utilities.getUuid();
  const now = new Date();
  
  // Get the indices of all necessary columns
  const timestampIdx = headers.indexOf('Timestamp');
  const nameIdx = headers.indexOf('Name');
  const phoneIdx = headers.indexOf('Phone');
  const propertyTypeIdx = headers.indexOf('Property Type');
  const doorCountIdx = headers.indexOf('Door Count');
  const preferredDateIdx = headers.indexOf('Preferred Date');
  const messageIdx = headers.indexOf('Message');
  const statusIdx = headers.indexOf('Status');
  const lastUpdatedIdx = headers.indexOf('Last Updated');
  
  // Create a new row array with data in the correct columns
  const newRow = [];
  
  // Ensure all columns have a value (empty string if no value)
  for (let i = 0; i < headers.length; i++) {
    if (i === contactIdIdx) {
      newRow[i] = contactId;
    } else if (i === timestampIdx) {
      newRow[i] = formData.timestamp || now;
    } else if (i === nameIdx) {
      newRow[i] = formData.name || '';
    } else if (i === emailIdx) {
      newRow[i] = email || '';
    } else if (i === phoneIdx) {
      newRow[i] = formData.phone || '';
    } else if (i === propertyTypeIdx) {
      newRow[i] = formData.propertyType || '';
    } else if (i === doorCountIdx) {
      newRow[i] = formData.doorCount || '';
    } else if (i === preferredDateIdx) {
      newRow[i] = formData.preferredDate || '';
    } else if (i === messageIdx) {
      newRow[i] = formData.message || '';
    } else if (i === statusIdx) {
      newRow[i] = formData.status || 'pending';
    } else if (i === lastUpdatedIdx) {
      newRow[i] = now;
    } else {
      newRow[i] = '';
    }
  }
  
  // Add to contacts sheet with the new contact ID
  contactsSheet.appendRow(newRow);
  
  return {
    id: contactId,
    rowIndex: contactsSheet.getLastRow(),
    isNew: true
  };
}

/**
 * Save a new lead to both Contacts and Lead Tracking sheets
 */
function saveNewLead(formData) {
  // Get both sheets
  const contactsSheet = ss.getSheetByName('Contacts');
  const trackingSheet = ss.getSheetByName('Lead Tracking');
  
  if (!contactsSheet || !trackingSheet) {
    ensureSheetHeaders();
    throw new Error('Required sheets not found or created. Please try again.');
  }
  
  // Find or create the contact
  const contact = findOrCreateContact(formData.email, formData);
  
  // If this is an existing contact, update their information
  if (!contact.isNew) {
    // Update the existing contact with the new information
    const now = new Date();
    const data = contactsSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find the status column
    const statusIdx = headers.indexOf('Status');
    const lastUpdatedIdx = headers.indexOf('Last Updated');
    
    // Update the timestamp column
    if (lastUpdatedIdx !== -1) {
      contactsSheet.getRange(contact.rowIndex, lastUpdatedIdx + 1).setValue(now);
    }
    
    // Update status only if this is newer than current status
    if (statusIdx !== -1) {
      contactsSheet.getRange(contact.rowIndex, statusIdx + 1).setValue(formData.status || 'pending');
    }
  }
  
  // Generate a unique lead ID for tracking
  const leadId = 'lead-' + Utilities.getUuid();
  
  // Find the column indexes in the tracking sheet
  const trackingHeaders = trackingSheet.getRange(1, 1, 1, trackingSheet.getLastColumn()).getValues()[0];
  const leadIdIdx = trackingHeaders.indexOf('Lead ID');
  const contactIdIdx = trackingHeaders.indexOf('Contact ID');
  const nameIdx = trackingHeaders.indexOf('Contact Name');
  const emailIdx = trackingHeaders.indexOf('Email');
  const phoneIdx = trackingHeaders.indexOf('Phone');
  const statusIdx = trackingHeaders.indexOf('Status');
  const notesIdx = trackingHeaders.indexOf('Notes');
  const timestampIdx = trackingHeaders.indexOf('Timestamp');
  
  // Create a new row array with data in the correct columns
  const newRow = [];
  
  // Ensure all columns have a value (empty string if no value)
  for (let i = 0; i < trackingHeaders.length; i++) {
    if (i === leadIdIdx) {
      newRow[i] = leadId;
    } else if (i === contactIdIdx) {
      newRow[i] = contact.id;
    } else if (i === nameIdx) {
      newRow[i] = formData.name || '';
    } else if (i === emailIdx) {
      newRow[i] = formData.email || '';
    } else if (i === phoneIdx) {
      newRow[i] = formData.phone || '';
    } else if (i === statusIdx) {
      newRow[i] = formData.status || 'pending';
    } else if (i === notesIdx) {
      newRow[i] = 'Initial contact via website';
    } else if (i === timestampIdx) {
      newRow[i] = formData.timestamp || new Date();
    } else {
      newRow[i] = '';
    }
  }
  
  // Add data to Lead Tracking sheet with contact ID link
  trackingSheet.appendRow(newRow);
  
  return {
    message: 'Lead saved to both sheets',
    contactId: contact.id,
    leadId: leadId,
    isNewContact: contact.isNew
  };
}

/**
 * Update lead status in both sheets
 */
function updateLeadStatus(leadId, status, notes, timestamp) {
  // Get both sheets
  const contactsSheet = ss.getSheetByName('Contacts');
  const trackingSheet = ss.getSheetByName('Lead Tracking');
  
  if (!contactsSheet || !trackingSheet) {
    ensureSheetHeaders();
    throw new Error('Required sheets "Contacts" and "Lead Tracking" not found');
  }
  
  // Variables to hold the contact info
  let contactId = '';
  let email = '';
  let contactName = '';
  let phone = '';
  
  // Check what kind of ID we're dealing with
  if (leadId.startsWith('contact-')) {
    // This is a contact ID, find it in the contacts sheet
    const contactsData = contactsSheet.getDataRange().getValues();
    const headers = contactsData[0];
    
    // Find the indices of the columns we need
    const contactIdIdx = headers.indexOf('Contact ID');
    const emailIdx = headers.indexOf('Email');
    const nameIdx = headers.indexOf('Name');
    const phoneIdx = headers.indexOf('Phone');
    const statusIdx = headers.indexOf('Status');
    const lastUpdatedIdx = headers.indexOf('Last Updated');
    
    if (contactIdIdx === -1) {
      ensureSheetHeaders();
      throw new Error('Contact sheet headers are missing. The sheet has been updated with the correct headers. Please try again.');
    }
    
    // Find the contact row
    let contactRow = -1;
    for (let i = 1; i < contactsData.length; i++) {
      if (contactsData[i][contactIdIdx] === leadId) {
        contactRow = i + 1;
        contactId = leadId;
        email = contactsData[i][emailIdx];
        contactName = contactsData[i][nameIdx];
        phone = contactsData[i][phoneIdx];
        break;
      }
    }
    
    if (contactRow === -1) {
      throw new Error(`Contact with ID ${leadId} not found`);
    }
    
    // Update the contact status
    contactsSheet.getRange(contactRow, statusIdx + 1).setValue(status);
    contactsSheet.getRange(contactRow, lastUpdatedIdx + 1).setValue(timestamp || new Date());
    
  } else if (leadId.startsWith('auto-')) {
    // For auto-generated IDs, find the contact in the contacts sheet by email
    const contactsData = contactsSheet.getDataRange().getValues();
    const headers = contactsData[0];
    
    // Find the indices of the columns we need
    const contactIdIdx = headers.indexOf('Contact ID');
    const emailIdx = headers.indexOf('Email');
    const nameIdx = headers.indexOf('Name');
    const phoneIdx = headers.indexOf('Phone');
    const statusIdx = headers.indexOf('Status');
    const lastUpdatedIdx = headers.indexOf('Last Updated');
    
    // Loop through all contacts to find a matching one
    let contactRow = -1;
    for (let i = 1; i < contactsData.length; i++) {
      const row = contactsData[i];
      // For auto IDs we need to match any contact
      if (row[emailIdx]) {
        contactRow = i + 1;
        contactId = row[contactIdIdx] || ('contact-' + Utilities.getUuid());
        email = row[emailIdx];
        contactName = row[nameIdx] || '';
        phone = row[phoneIdx] || '';
        break;
      }
    }
    
    if (contactRow === -1) {
      throw new Error(`Cannot find any contacts to update for auto ID: ${leadId}`);
    }
    
    // Update the contact status
    contactsSheet.getRange(contactRow, statusIdx + 1).setValue(status);
    contactsSheet.getRange(contactRow, lastUpdatedIdx + 1).setValue(timestamp || new Date());
    
    // Ensure the contact has a contact ID
    if (!contactsData[contactRow-1][contactIdIdx]) {
      contactsSheet.getRange(contactRow, contactIdIdx + 1).setValue(contactId);
    }
    
  } else if (leadId.startsWith('lead-')) {
    // This is a lead ID, find it in the tracking sheet
    const trackingData = trackingSheet.getDataRange().getValues();
    const headers = trackingData[0];
    
    // Find the indices of the columns we need
    const leadIdIdx = headers.indexOf('Lead ID');
    const contactIdIdx = headers.indexOf('Contact ID');
    const nameIdx = headers.indexOf('Contact Name');
    const emailIdx = headers.indexOf('Email');
    const phoneIdx = headers.indexOf('Phone');
    
    if (leadIdIdx === -1) {
      ensureSheetHeaders();
      throw new Error('Lead Tracking sheet headers are missing. The sheet has been updated with the correct headers. Please try again.');
    }
    
    // Find the lead row
    let leadRow = -1;
    for (let i = 1; i < trackingData.length; i++) {
      if (trackingData[i][leadIdIdx] === leadId) {
        leadRow = i + 1;
        contactId = trackingData[i][contactIdIdx];
        email = trackingData[i][emailIdx];
        contactName = trackingData[i][nameIdx];
        phone = trackingData[i][phoneIdx];
        break;
      }
    }
    
    if (leadRow === -1) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }
    
    // Update contact status in contacts sheet
    if (contactId) {
      // We have a contact ID, find and update it
      const contactsData = contactsSheet.getDataRange().getValues();
      const contactHeaders = contactsData[0];
      const cIdIdx = contactHeaders.indexOf('Contact ID');
      const statusIdx = contactHeaders.indexOf('Status');
      const lastUpdatedIdx = contactHeaders.indexOf('Last Updated');
      
      let contactRow = -1;
      for (let i = 1; i < contactsData.length; i++) {
        if (contactsData[i][cIdIdx] === contactId) {
          contactRow = i + 1;
          break;
        }
      }
      
      if (contactRow !== -1) {
        contactsSheet.getRange(contactRow, statusIdx + 1).setValue(status);
        contactsSheet.getRange(contactRow, lastUpdatedIdx + 1).setValue(timestamp || new Date());
      }
    } else if (email) {
      // Fall back to email if no contact ID
      const contactsData = contactsSheet.getDataRange().getValues();
      const contactHeaders = contactsData[0];
      const emailIdx = contactHeaders.indexOf('Email');
      const statusIdx = contactHeaders.indexOf('Status');
      const lastUpdatedIdx = contactHeaders.indexOf('Last Updated');
      
      let contactRow = -1;
      for (let i = 1; i < contactsData.length; i++) {
        if (contactsData[i][emailIdx] === email) {
          contactRow = i + 1;
          break;
        }
      }
      
      if (contactRow !== -1) {
        contactsSheet.getRange(contactRow, statusIdx + 1).setValue(status);
        contactsSheet.getRange(contactRow, lastUpdatedIdx + 1).setValue(timestamp || new Date());
      }
    }
  } else {
    throw new Error(`Unrecognized ID format: ${leadId}`);
  }
  
  // Add a new tracking entry regardless of ID type
  const now = timestamp || new Date();
  
  // Make sure we have a contact ID
  if (!contactId && email) {
    // Try to find the contact by email
    const contactsData = contactsSheet.getDataRange().getValues();
    const headers = contactsData[0];
    const contactIdIdx = headers.indexOf('Contact ID');
    const emailIdx = headers.indexOf('Email');
    
    for (let i = 1; i < contactsData.length; i++) {
      if (contactsData[i][emailIdx] === email) {
        contactId = contactsData[i][contactIdIdx];
        break;
      }
    }
    
    // If still no contact ID, generate one
    if (!contactId) {
      contactId = 'contact-' + Utilities.getUuid();
    }
  }
  
  // Create a new lead ID for this tracking entry
  const newLeadId = 'lead-' + Utilities.getUuid();
  
  // Find the column indexes in the tracking sheet
  const trackingHeaders = trackingSheet.getRange(1, 1, 1, trackingSheet.getLastColumn()).getValues()[0];
  const leadIdIdx = trackingHeaders.indexOf('Lead ID');
  const contactIdIdx = trackingHeaders.indexOf('Contact ID');
  const nameIdx = trackingHeaders.indexOf('Contact Name');
  const emailIdx = trackingHeaders.indexOf('Email');
  const phoneIdx = trackingHeaders.indexOf('Phone');
  const statusIdx = trackingHeaders.indexOf('Status');
  const notesIdx = trackingHeaders.indexOf('Notes');
  const timestampIdx = trackingHeaders.indexOf('Timestamp');
  
  // Create a new row array with data in the correct columns
  const newRow = [];
  
  // Ensure all columns have a value (empty string if no value)
  for (let i = 0; i < trackingHeaders.length; i++) {
    if (i === leadIdIdx) {
      newRow[i] = newLeadId;
    } else if (i === contactIdIdx) {
      newRow[i] = contactId;
    } else if (i === nameIdx) {
      newRow[i] = contactName;
    } else if (i === emailIdx) {
      newRow[i] = email;
    } else if (i === phoneIdx) {
      newRow[i] = phone;
    } else if (i === statusIdx) {
      newRow[i] = status;
    } else if (i === notesIdx) {
      newRow[i] = notes || 'Status updated via admin panel';
    } else if (i === timestampIdx) {
      newRow[i] = now;
    } else {
      newRow[i] = '';
    }
  }
  
  // Add data to Lead Tracking sheet
  trackingSheet.appendRow(newRow);
  
  return {
    message: 'Lead status updated',
    leadId: leadId,
    status: status
  };
}

/**
 * Legacy function for backward compatibility
 */
function saveToContactsSheet(formData) {
  // Rather than using the old method, use our new contact linking system
  return saveNewLead(formData);
}