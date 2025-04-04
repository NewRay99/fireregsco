"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import StatusDropdown from "./StatusDropdown";
import { formatSaleFromSupabase } from "@/lib/supabase";
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/solid";

interface Sale {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyType: string;
  doorCount: string;
  preferredDate: string;
  message: string;
  status: string;
  timestamp: string;
  updatedAt: string;
  trackingHistory: Array<{
    status: string;
    timestamp: string;
    notes: string;
  }>;
}

export default function SingleLeadSupport() {
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [workflowStatuses, setWorkflowStatuses] = useState<string[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Sale[]>([]);

  // Fetch workflow statuses
  const fetchWorkflowStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('status_workflow')
        .select('current_status, next_statuses')
        .order('created_at');

      if (error) throw error;

      const statuses = data?.map(item => item.current_status) || [];
      setWorkflowStatuses(statuses.length > 0 ? statuses : [
        'pending', 'contacted', 'interested', 'reserved booking', 'sent invoice',
        'payment received', 'booked', 'completed inspection', 'completed',
        'aftersales', 'refunded', 'not available', 'void'
      ]);
    } catch (error) {
      console.error("Error fetching workflow statuses:", error);
    }
  };

  // Fetch all leads data
  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/sales-management');
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sales data');
      }

      const formattedSales = result.sales.map((s: any) => formatSaleFromSupabase(s));
      setAllSales(formattedSales);
      
    } catch (error) {
      console.error("Error fetching leads:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      const defaultLead = allSales.find(s => s.email === 'william.jones@hotmail.com');
      setSale(defaultLead || null);
      return;
    }

    const results = allSales.filter(s => 
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    
    // If there's exactly one match, select it
    if (results.length === 1) {
      setSale(results[0]);
      setSearchResults([]); // Clear results once selected
    }
  };

  // Select a lead from search results
  const selectLead = (selectedLead: Sale) => {
    setSale(selectedLead);
    setSearchResults([]);
    setSearchQuery(selectedLead.email);
  };

  // Update sale status
  const updateSaleStatus = async (newStatus: string) => {
    if (!sale) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/admin/sales-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          saleId: sale.id,
          status: newStatus,
          notes: statusNote
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Refresh the leads data
      fetchLeads();
      
      // Clear the notes and close modal
      setStatusNote('');
      setShowNoteModal(false);
      
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Error updating status: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setShowNoteModal(true);
    // Store the new status temporarily
    setSale(prev => prev ? { ...prev, tempNewStatus: newStatus as any } : null);
  };

  // Handle note submission
  const handleNoteSubmit = async () => {
    if (!sale || !(sale as any).tempNewStatus) return;
    await updateSaleStatus((sale as any).tempNewStatus);
  };

  useEffect(() => {
    fetchWorkflowStatuses();
    fetchLeads();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      {/* Search Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="pl-10"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full max-w-3xl mt-1"
              >
                <Card>
                  <ScrollArea className="h-[300px]">
                    {searchResults.map((result) => (
                      <motion.button
                        key={result.id}
                        onClick={() => selectLead(result)}
                        className="w-full px-4 py-3 text-left hover:bg-accent focus:outline-none focus:bg-accent transition-colors"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-muted-foreground">{result.email}</div>
                      </motion.button>
                    ))}
                  </ScrollArea>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-destructive/10 text-destructive rounded-md"
        >
          <h3 className="font-bold">Error loading lead</h3>
          <p>{error}</p>
          <Button 
            variant="destructive"
            onClick={fetchLeads}
            className="mt-2"
          >
            Try Again
          </Button>
        </motion.div>
      ) : !sale ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-muted-foreground">No lead selected. Use the search above to find a lead.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              {/* Lead Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{sale.name}</h2>
                  <HoverCard>
                    <HoverCardTrigger>
                      <p className="text-muted-foreground cursor-pointer">{sale.email}</p>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Contact Information</p>
                        <p className="text-sm text-muted-foreground">{sale.phone}</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                  <StatusDropdown 
                    currentStatus={sale.status} 
                    onStatusChange={handleStatusChange}
                    statuses={workflowStatuses}
                  />
                </Badge>
              </div>

              {/* Lead Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="p-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-1">Property Type</CardTitle>
                  <p>{sale.propertyType}</p>
                </Card>
                <Card className="p-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-1">Door Count</CardTitle>
                  <p>{sale.doorCount}</p>
                </Card>
                <Card className="p-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-1">Preferred Date</CardTitle>
                  <p>
                    {sale.preferredDate ? new Date(sale.preferredDate).toLocaleDateString() : "Not specified"}
                  </p>
                </Card>
                <Card className="p-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-1">Created At</CardTitle>
                  <p>{new Date(sale.timestamp).toLocaleDateString()}</p>
                </Card>
              </div>

              {/* Message */}
              <Card className="mb-6 p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Message</CardTitle>
                <p className="text-sm">{sale.message}</p>
              </Card>

              {/* Notes History */}
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Notes History</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedNotes(!expandedNotes)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedNotes ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <AnimatePresence>
                    {sale.trackingHistory && sale.trackingHistory.length > 0 ? (
                      <motion.div
                        initial={false}
                        animate={{ height: expandedNotes ? 'auto' : 0 }}
                        exit={{ height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {expandedNotes && sale.trackingHistory.map((entry, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-muted rounded-lg"
                          >
                            <div className="flex justify-between text-sm mb-2">
                              <Badge variant="outline">{entry.status}</Badge>
                              <span className="text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {entry.notes && (
                              <p className="text-sm">{entry.notes}</p>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <p className="text-muted-foreground">No notes available</p>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Status Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note for Status Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Enter notes about this status change..."
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowNoteModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNoteSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 