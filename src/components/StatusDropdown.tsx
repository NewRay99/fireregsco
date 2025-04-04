"use client";

import { useState, useEffect } from "react";
import { getNextStatuses } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
        const nextStatuses = await getNextStatuses(currentStatus);
        const allStatuses = Array.isArray(nextStatuses) 
          ? [...nextStatuses, "contacted", "void"].filter((v, i, a) => a.indexOf(v) === i)
          : ["contacted", "void"];
        
        setAvailableStatuses(allStatuses);
      } catch (error) {
        console.error("Error loading next statuses:", error);
        setAvailableStatuses(["pending", "contacted", "interested", "not available", "void"]);
      } finally {
        setIsLoading(false);
      }
    }

    loadNextStatuses();
  }, [currentStatus]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
      contacted: { bg: "bg-blue-100", text: "text-blue-800" },
      interested: { bg: "bg-purple-100", text: "text-purple-800" },
      "reserved booking": { bg: "bg-indigo-100", text: "text-indigo-800" },
      "sent invoice": { bg: "bg-pink-100", text: "text-pink-800" },
      "payment received": { bg: "bg-green-100", text: "text-green-800" },
      booked: { bg: "bg-teal-100", text: "text-teal-800" },
      "completed inspection": { bg: "bg-cyan-100", text: "text-cyan-800" },
      completed: { bg: "bg-emerald-100", text: "text-emerald-800" },
      aftersales: { bg: "bg-lime-100", text: "text-lime-800" },
      refunded: { bg: "bg-orange-100", text: "text-orange-800" },
      "not available": { bg: "bg-gray-100", text: "text-gray-800" },
      void: { bg: "bg-red-100", text: "text-red-800" }
    };
    
    return colors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  const statusColor = getStatusColor(currentStatus);

  return (
    <Select
      value={currentStatus}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn(
        "w-full",
        statusColor.bg,
        statusColor.text,
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <SelectValue placeholder={currentStatus} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={currentStatus} className={cn(
          statusColor.bg,
          statusColor.text
        )}>
          {currentStatus}
        </SelectItem>
        {availableStatuses
          .filter(status => status !== currentStatus)
          .map(status => {
            const color = getStatusColor(status);
            return (
              <SelectItem
                key={status}
                value={status}
                className={cn(color.bg, color.text)}
              >
                {status}
              </SelectItem>
            );
          })}
      </SelectContent>
    </Select>
  );
} 