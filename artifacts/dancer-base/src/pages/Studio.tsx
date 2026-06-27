import React from "react";
import { useParams } from "wouter";
import { useGetStudio } from "@workspace/api-client-react";
import { DetailLayout } from "@/components/layout/DetailLayout";
import { ClassCard } from "@/components/shared/ClassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

export default function Studio() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: studio, isLoading } = useGetStudio(id);

  if (isLoading) {
    return (
      <DetailLayout title="Studio">
        <div className="p-6 border-b border-border flex flex-col gap-2">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </DetailLayout>
    );
  }

  if (!studio) {
    return (
      <DetailLayout title="Studio" backTo="/search">
        <div className="p-8 text-center text-muted-foreground">Studio not found</div>
      </DetailLayout>
    );
  }

  return (
    <DetailLayout title={studio.displayName} backTo="/search">
      <div className="p-6 bg-background border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-2">{studio.displayName}</h1>
        <div className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p>{studio.address}</p>
            <p>{studio.city}, {studio.state}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold tracking-tight px-2">Upcoming Classes Here</h2>
        <div className="flex flex-col gap-4">
          {studio.upcomingClasses?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming classes scheduled at this studio.
            </div>
          ) : (
            studio.upcomingClasses?.map(danceClass => (
              <ClassCard key={danceClass.id} danceClass={danceClass} />
            ))
          )}
        </div>
      </div>
    </DetailLayout>
  );
}
