import React from "react";
import { useParams } from "wouter";
import { useGetClass, useListPastClasses } from "@workspace/api-client-react";
import { DetailLayout } from "@/components/layout/DetailLayout";
import { PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Videos() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  // We need the past class details which has the video links
  const { data: pastClasses, isLoading } = useListPastClasses();
  
  const pastClass = pastClasses?.find(p => p.classId === id);

  if (isLoading) {
    return (
      <DetailLayout title="Class Videos">
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </DetailLayout>
    );
  }

  if (!pastClass || !pastClass.videoLinks || pastClass.videoLinks.length === 0) {
    return (
      <DetailLayout title="Class Videos">
        <div className="p-12 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-secondary/50 rounded-full flex items-center justify-center">
            <PlayCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">No videos from this class yet</p>
          <p className="text-sm text-muted-foreground">Videos will appear here once they're uploaded.</p>
        </div>
      </DetailLayout>
    );
  }

  return (
    <DetailLayout title="Class Videos">
      <div className="p-4 space-y-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">{pastClass.class?.instructorName}</h1>
          <p className="text-muted-foreground">{pastClass.class?.style} · {pastClass.class?.studioName}</p>
        </div>

        <div className="space-y-4">
          {pastClass.videoLinks.map((link, index) => (
            <a 
              key={index}
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group relative rounded-2xl overflow-hidden bg-secondary aspect-video border border-border"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <div className="w-14 h-14 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-8 h-8 text-primary ml-1" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm">
                Video {index + 1}
              </div>
            </a>
          ))}
        </div>
      </div>
    </DetailLayout>
  );
}
