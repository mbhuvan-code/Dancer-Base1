import React from "react";
import { useParams } from "wouter";
import { useGetInstructor } from "@workspace/api-client-react";
import { DetailLayout } from "@/components/layout/DetailLayout";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ClassCard } from "@/components/shared/ClassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Instructor() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: instructor, isLoading } = useGetInstructor(id);

  if (isLoading) {
    return (
      <DetailLayout title="Instructor">
        <div className="p-6 flex flex-col items-center border-b border-border">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-16 w-full max-w-sm rounded-xl" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </DetailLayout>
    );
  }

  if (!instructor) {
    return (
      <DetailLayout title="Instructor" backTo="/search">
        <div className="p-8 text-center text-muted-foreground">Instructor not found</div>
      </DetailLayout>
    );
  }

  return (
    <DetailLayout title={instructor.name} backTo="/search">
      <div className="p-6 flex flex-col items-center bg-background border-b border-border">
        <UserAvatar 
          src={instructor.profilePic} 
          name={instructor.name} 
          className="w-24 h-24 text-2xl border-4 border-background shadow-sm mb-4" 
        />
        <h1 className="text-2xl font-bold text-foreground mb-1">{instructor.name}</h1>
        {instructor.styles && instructor.styles.length > 0 && (
          <p className="text-muted-foreground font-medium mb-4">
            {instructor.styles.join(" · ")}
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold tracking-tight px-2">Upcoming Classes</h2>
        <div className="flex flex-col gap-4">
          {instructor.upcomingClasses?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming classes scheduled.
            </div>
          ) : (
            instructor.upcomingClasses?.map(danceClass => (
              <ClassCard key={danceClass.id} danceClass={danceClass} />
            ))
          )}
        </div>
      </div>
    </DetailLayout>
  );
}
