"use client";

import { useState, useEffect } from "react";
import { getNextStatuses } from "@/lib/supabase";

interface StatusDropdownProps {
  currentStatus: string;
  onChange: (newStatus: string) => void;
  disabled?: boolean;
}

export default function StatusDropdown({ 
  currentStatus, 
  onChange, 
  disabled = false 
}: StatusDropdownProps) {
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNextStatuses() {
      try {
        setIsLoading(true);
        // Always include "contacted" and "void" as they can occur at any time
        const nextStatuses = await getNextStatuses(currentStatus);
        const allStatuses = Array.isArray(nextStatuses) 
          ? [...nextStatuses, "contacted", "void"].filter((v, i, a) => a.indexOf(v) === i)
          : ["contacted", "void"];
        
        setAvailableStatuses(allStatuses);
      } catch (error) {
        console.error("Error loading next statuses:", error);
        // Fallback to a basic set of statuses
        setAvailableStatuses(["pending", "contacted", "interested", "not available", "void"]);
      } finally {
        setIsLoading(false);
      }
    }

    loadNextStatuses();
  }, [currentStatus]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      contacted: "bg-blue-100 text-blue-800",
      interested: "bg-purple-100 text-purple-800",
      "reserved booking": "bg-indigo-100 text-indigo-800",
      "sent invoice": "bg-pink-100 text-pink-800",
      "payment received": "bg-green-100 text-green-800",
      booked: "bg-teal-100 text-teal-800",
      "completed inspection": "bg-cyan-100 text-cyan-800",
      completed: "bg-emerald-100 text-emerald-800",
      aftersales: "bg-lime-100 text-lime-800",
      refunded: "bg-orange-100 text-orange-800",
      "not available": "bg-gray-100 text-gray-800",
      void: "bg-red-100 text-red-800"
    };
    
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="animate-pulse h-10 bg-gray-200 rounded w-full"></div>
    );
  }

  return (
    <div className="relative">
      <select
        value={currentStatus}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full p-2 rounded border ${
          disabled ? "bg-gray-100" : "bg-white"
        } ${getStatusColor(currentStatus)}`}
      >
        <option value={currentStatus}>{currentStatus}</option>
        {availableStatuses
          .filter(status => status !== currentStatus)
          .map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
      </select>
    </div>
  );
} 