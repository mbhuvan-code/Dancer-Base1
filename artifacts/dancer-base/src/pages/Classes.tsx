import React, { useState } from "react";
import { useListBookings, useListSaved } from "@workspace/api-client-react";
import { ClassCard } from "@/components/shared/ClassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function Classes() {
  const [tab, setTab] = useState("upcoming");

  const { data: bookings, isLoading: isLoadingBookings } = useListBookings({
    query: { enabled: tab === "upcoming" } as never
  });

  const { data: savedClasses, isLoading: isLoadingSaved } = useListSaved({
    query: { enabled: tab === "saved" } as never
  });

  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    ))
  );

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border pt-6 pb-2 px-4">
        <h1 className="text-2xl font-bold tracking-tight mb-4">My Classes</h1>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full bg-secondary/50 p-1 rounded-xl h-auto">
            <TabsTrigger value="upcoming" className="flex-1 rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Saved
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 space-y-4">
        {tab === "upcoming" && (
          <div className="flex flex-col gap-4">
            {isLoadingBookings ? (
              renderSkeletons()
            ) : bookings?.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-muted-foreground text-lg mb-2">No upcoming classes</p>
                <p className="text-sm text-muted-foreground">Book a class and it will appear here.</p>
              </div>
            ) : (
              bookings?.map((booking) => (
                booking.class && <ClassCard key={booking.id} danceClass={booking.class} mode="upcoming" />
              ))
            )}
          </div>
        )}

        {tab === "saved" && (
          <div className="flex flex-col gap-4">
            {isLoadingSaved ? (
              renderSkeletons()
            ) : savedClasses?.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-muted-foreground text-lg mb-2">No saved classes</p>
                <p className="text-sm text-muted-foreground">Tap the bookmark icon on any class to save it for later.</p>
              </div>
            ) : (
              savedClasses?.map((danceClass) => (
                <ClassCard key={danceClass.id} danceClass={danceClass} mode="saved" />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
