"use client";

import { useState, useEffect } from 'react';
import { getDoorCountRanges } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type DoorCountRange = {
  id: number;
  range_name: string;
  min_count: number;
  max_count: number | null;
  display_order: number;
};

export default function DoorCounter() {
  const [doorCountRanges, setDoorCountRanges] = useState<DoorCountRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDoorCountRanges() {
      try {
        const ranges = await getDoorCountRanges();
        setDoorCountRanges(ranges);
      } catch (error) {
        console.error("Error loading door count ranges:", error);
        // Fallback to hardcoded ranges if API fails
        setDoorCountRanges([
          { id: 1, range_name: "20-100", min_count: 20, max_count: 100, display_order: 1 },
          { id: 2, range_name: "100-200", min_count: 100, max_count: 200, display_order: 2 },
          { id: 3, range_name: "200-1000", min_count: 200, max_count: 1000, display_order: 3 },
          { id: 4, range_name: "1000-2000", min_count: 1000, max_count: 2000, display_order: 4 },
          { id: 5, range_name: "2000+", min_count: 2000, max_count: null, display_order: 5 }
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDoorCountRanges();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-8 w-24 mx-auto" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      {doorCountRanges.map((range) => (
        <Card key={range.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-700 text-center">
              {range.range_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Fire Doors
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 