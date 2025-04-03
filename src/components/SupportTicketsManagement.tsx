"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupportTicketFromSupabase } from "@/lib/supabase";
interface SupportTicket {
  id: string;
  title: string;
  description: string;
  userId: string | null;
  userEmail: string | null;
  status: string;
  priority: string;
  category: string;
  assigneeId: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SupportTicketsManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [resolution, setResolution] = useState("");
  const [ticketStatus, setTicketStatus] = useState("open");
  const [responses, setResponses] = useState<any[]>([]);
  const [responseText, setResponseText] = useState("");
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch support tickets from Supabase
  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      
      // Use the API route instead of direct Supabase client
      const response = await fetch('/api/admin/support-tickets');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching tickets: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      setTickets(result.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      alert(`Error fetching tickets: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Handle opening a ticket for resolution
  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResolution(ticket.resolution || "");
    setTicketStatus(ticket.status);
    setShowTicketModal(true);
  };

  // Handle ticket resolution submission
  const handleTicketSubmit = async () => {
    if (!selectedTicket) return;
    
    try {
      setIsUpdating(true);
      
      // Update the ticket in Supabase
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({
          status: ticketStatus,
          resolution: resolution,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);
      
      if (updateError) {
        throw new Error(`Error updating ticket: ${updateError.message}`);
      }
      
      // Update the local state
      const updatedTickets = tickets.map(ticket => {
        if (ticket.id === selectedTicket.id) {
          return {
            ...ticket,
            status: ticketStatus,
            resolution: resolution,
            updatedAt: new Date().toISOString()
          };
        }
        return ticket;
      });
      
      setTickets(updatedTickets);
      setShowTicketModal(false);
      setSelectedTicket(null);
      setResolution("");
      setTicketStatus("open");
    } catch (err) {
      console.error("Error updating ticket:", err);
      alert(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update the fetchTicketDetails function
  const fetchTicketDetails = async (id: string) => {
    try {
      setIsLoadingDetails(true);
      
      // Use the API route instead of direct Supabase client
      const response = await fetch(`/api/admin/support-tickets?id=${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching ticket details: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      setSelectedTicket(result.ticket);
      setResponses(result.responses || []);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      alert(`Error fetching ticket details: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Update the updateTicketStatus function
  const updateTicketStatus = async (id: string, newStatus: string) => {
    try {
      setIsUpdating(true);
      
      // Use the API route instead of direct Supabase client
      const response = await fetch('/api/admin/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          ticketId: id,
          status: newStatus
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error updating ticket status: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      // Update the selected ticket
      setSelectedTicket(prev => prev ? {
        ...prev,
        status: newStatus
      } : null);
      
      // Show success message
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      alert(`Error updating ticket status: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update the addResponse function
  const addResponse = async () => {
    try {
      if (!responseText.trim() || !selectedTicket) {
        alert('Please enter a response message');
        return;
      }
      
      setIsSendingResponse(true);
      
      // Use the API route instead of direct Supabase client
      const response = await fetch('/api/admin/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_response',
          ticketId: selectedTicket.id,
          message: responseText,
          isAdmin: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error adding response: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API error: ${result.error}`);
      }
      
      // Clear the response text
      setResponseText('');
      
      // Refresh the ticket details to get the updated responses
      fetchTicketDetails(selectedTicket.id);
      
      // Show success message
      alert("Response added successfully");
    } catch (error) {
      console.error("Error adding response:", error);
      alert(`Error adding response: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSendingResponse(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h3 className="font-bold">Error loading support tickets</h3>
        <p>{error}</p>
        <button 
          onClick={fetchTickets}
          className="mt-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Support Tickets</h2>
      
      {tickets.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-md">
          <p className="text-gray-500">No support tickets found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Priority</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Created</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{ticket.title}</div>
                    <div className="text-sm text-gray-500">
                      {ticket.userEmail || "Anonymous"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'in progress' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                      ticket.priority === 'low' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">{ticket.category}</td>
                  <td className="py-3 px-4">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleOpenTicket(ticket)}
                      className="text-red-700 hover:text-red-800 font-medium"
                    >
                      View/Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Ticket Resolution Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <h3 className="text-lg font-bold mb-2">{selectedTicket.title}</h3>
            <div className="mb-4">
              <span className="text-sm text-gray-500">
                From: {selectedTicket.userEmail || "Anonymous"} • 
                Created: {new Date(selectedTicket.createdAt).toLocaleString()}
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Status</label>
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="open">Open</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Resolution / Notes</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="Enter resolution details or notes"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowTicketModal(false);
                  setSelectedTicket(null);
                  setResolution("");
                  setTicketStatus("open");
                }}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleTicketSubmit}
                className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 