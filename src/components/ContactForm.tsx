"use client";

import { useState, useEffect } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: "",
    doorCount: "",
    preferredDate: "",
    message: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isDev, setIsDev] = useState(false);
  const [doorCountRanges, setDoorCountRanges] = useState<Array<{
    id: number;
    range_name: string;
    min_count: number;
    max_count: number | null;
    display_order: number;
  }>>([]);

  useEffect(() => {
    // Check if we're in development mode
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    // Load door count ranges from Supabase
    async function loadDoorCountRanges() {
      try {
        const { getDoorCountRanges } = await import('@/lib/supabase');
        const ranges = await getDoorCountRanges();
        setDoorCountRanges(ranges);
      } catch (error) {
        console.error("Error loading door count ranges:", error);
        // Fallback to hardcoded ranges
        setDoorCountRanges([
          { id: 1, range_name: "20-100", min_count: 20, max_count: 100, display_order: 1 },
          { id: 2, range_name: "100-200", min_count: 100, max_count: 200, display_order: 2 },
          { id: 3, range_name: "200-1000", min_count: 200, max_count: 1000, display_order: 3 },
          { id: 4, range_name: "1000-2000", min_count: 1000, max_count: 2000, display_order: 4 },
          { id: 5, range_name: "2000+", min_count: 2000, max_count: null, display_order: 5 }
        ]);
      }
    }
    
    loadDoorCountRanges();
  }, []);

  // Add a useEffect to clear success messages after 5 seconds
  useEffect(() => {
    if (submitStatus?.success) {
      const timer = setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const fillWithTestData = () => {
    // Array of sample names
    const names = ["John Smith", "Jane Doe", "Robert Johnson", "Emily Williams", "David Brown"];
    // Array of sample property types
    const propertyTypes = ["hmo", "hotel", "commercial", "public", "other"];
    // Array of sample door counts
    const doorCounts = ["20-100", "100-200", "200-1000", "1000-2000", "2000+"];
    // Array of sample messages
    const messages = [
      "I need all fire doors in our building inspected as soon as possible.",
      "We're renovating our hotel and need all fire doors certified.",
      "Looking for a quote on fire door inspection for our office building.",
      "Need inspection for regulatory compliance by end of next month.",
      "Interested in a comprehensive fire safety assessment including all doors."
    ];

    // Generate a random future date within the next 30 days
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);
    const formattedDate = futureDate.toISOString().split('T')[0];

    // Set random form data
    setFormData({
      name: names[Math.floor(Math.random() * names.length)],
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `07${Math.floor(Math.random() * 900000000 + 100000000)}`,
      propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      doorCount: doorCounts[Math.floor(Math.random() * doorCounts.length)],
      preferredDate: formattedDate,
      message: messages[Math.floor(Math.random() * messages.length)],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Format the data for sending as HTML email
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fire Safety Inspection Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #c53030; border-bottom: 2px solid #c53030; padding-bottom: 10px; }
            h2 { color: #c53030; margin-top: 20px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; }
            .value { margin-bottom: 10px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>New Fire Safety Inspection Request</h1>
          
          <div class="section">
            <h2>Contact Information</h2>
            <p class="label">Name:</p>
            <p class="value">${formData.name}</p>
            
            <p class="label">Email:</p>
            <p class="value">${formData.email}</p>
            
            <p class="label">Phone:</p>
            <p class="value">${formData.phone || "Not provided"}</p>
          </div>
          
          <div class="section">
            <h2>Property Details</h2>
            <p class="label">Property Type:</p>
            <p class="value">${formData.propertyType}</p>
            
            <p class="label">Number of Doors for Inspection:</p>
            <p class="value">${formData.doorCount}</p>

            <p class="label">Preferred Inspection Date:</p>
            <p class="value">${formData.preferredDate || "No specific date requested"}</p>
          </div>
          
          <div class="section">
            <h2>Additional Information</h2>
            <p>${formData.message}</p>
          </div>
          
          <div class="footer">
            <p>This request was submitted from the Fire Safety Services website on ${new Date().toLocaleString()}.</p>
          </div>
        </body>
        </html>
      `;

      // Send the email through our API route
      const emailResponse = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'infofireregsco@gmail.com', // Always send to the company email
          subject: `Fire Door Inspection Request - ${formData.name}`,
          html: emailHtml,
          formData
        }),
      });

      const emailResult = await emailResponse.json();
      
      if (!emailResponse.ok) {
        throw new Error(emailResult.message || 'Failed to send the email');
      }
      
      // Save to Supabase via the sales API
      try {
        console.log('Submitting to Supabase sales table:', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          propertyType: formData.propertyType,
          doorCount: formData.doorCount,
          preferredDate: formData.preferredDate,
          message: formData.message
        });
        
        const supabaseResponse = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            propertyType: formData.propertyType,
            doorCount: formData.doorCount,
            preferredDate: formData.preferredDate,
            message: formData.message
          }),
        });
        
        // Log the raw response for debugging
        console.log('Supabase API response status:', supabaseResponse.status);
        
        const supabaseResult = await supabaseResponse.json();
        
        console.log('Supabase API response body:', supabaseResult);
        
        if (!supabaseResponse.ok) {
          console.warn('Form submitted but failed to save to Supabase:', supabaseResult.error);
        } else {
          console.log('Form data saved to Supabase sales table successfully');
        }
      } catch (dbError) {
        // Don't fail the form submission if Supabase save fails
        console.error('Error saving to Supabase:', dbError);
      }
      
      setSubmitStatus({
        success: true,
        message: "Thank you! We'll be in touch shortly.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        propertyType: "",
        doorCount: "",
        preferredDate: "",
        message: "",
      });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        success: false,
        message: "There was an error submitting your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isDev && (
        <div className="md:col-span-2 mb-4 bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-blue-700 font-medium text-center mb-2">Development Mode</p>
          <div className="text-center">
            <button
              type="button"
              onClick={fillWithTestData}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
            >
              Fill With Test Data
            </button>
          </div>
        </div>
      )}
      <div>
        <label htmlFor="name" className="block mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded text-gray-800"
          placeholder="Your name"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded text-gray-800"
          placeholder="Your email"
          required
        />
      </div>
      <div>
        <label htmlFor="phone" className="block mb-2">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded text-gray-800"
          placeholder="Your phone number"
        />
      </div>
      <div>
        <label htmlFor="propertyType" className="block mb-2">
          Property Type
        </label>
        <select 
          id="propertyType" 
          value={formData.propertyType}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded text-gray-800"
          required
        >
          <option value="">Select property type</option>
          <option value="hmo">HMO</option>
          <option value="hotel">Hotel</option>
          <option value="commercial">Commercial Building</option>
          <option value="public">Public Building</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="doorCount" className="block mb-2">
          Number of Doors for Inspection
        </label>
        <select 
          id="doorCount" 
          value={formData.doorCount}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded text-gray-800"
          required
        >
          <option value="">Select range</option>
          {doorCountRanges.map(range => (
            <option key={range.id} value={range.range_name}>
              {range.range_name} doors
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="preferredDate" className="block mb-2">
          Preferred Inspection Date
        </label>
        <input
          type="date"
          id="preferredDate"
          value={formData.preferredDate}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded text-gray-800"
          min={today}
        />
        <p className="text-xs text-gray-400 mt-1">Select a preferred date for the inspection (optional)</p>
      </div>
      <div className="md:col-span-2">
        <label htmlFor="message" className="block mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded text-gray-800"
          placeholder="Tell us about your property and requirements"
          required
        ></textarea>
      </div>
      <div className="md:col-span-2">
        {submitStatus && (
          <div 
            className={`p-4 mb-4 rounded ${
              submitStatus.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {submitStatus.message}
          </div>
        )}
        <div className="text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-md transition-colors ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Submitting..." : "Request Quote"}
          </button>
        </div>
      </div>
    </form>
  );
} 