import React from "react";
import { useParams, Link } from "wouter";
import { useGetBooking } from "@workspace/api-client-react";
import { DetailLayout } from "@/components/layout/DetailLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, MapPin, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Receipt() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: booking, isLoading } = useGetBooking(id);

  if (isLoading) {
    return (
      <DetailLayout title="Attending" backTo="/classes">
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
          <Skeleton className="w-20 h-20 rounded-full mb-6" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-12" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </DetailLayout>
    );
  }

  if (!booking || !booking.class) {
    return (
      <DetailLayout title="Attending" backTo="/classes">
        <div className="p-8 text-center text-muted-foreground">Booking not found</div>
      </DetailLayout>
    );
  }

  const danceClass = booking.class;

  const openBookingSite = () => {
    const url = danceClass.bookingUrl || "#";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <DetailLayout title="Attending" backTo="/classes">
      <div className="flex-1 p-6 flex flex-col items-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2 text-center">You're attending!</h1>
        <p className="text-muted-foreground text-center mb-8">
          {danceClass.instructorName}'s class is saved in your upcoming tab.
          Complete your booking on the studio's site.
        </p>

        <div className="w-full bg-card border border-border rounded-3xl p-6 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary/20"></div>

          <div className="space-y-4 mt-2">
            <div>
              <h3 className="font-semibold text-lg">{danceClass.instructorName}</h3>
              <p className="text-muted-foreground text-sm">{danceClass.style} · {danceClass.level}</p>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{format(parseISO(danceClass.date), "EEEE, MMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">{danceClass.startTime} – {danceClass.endTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{danceClass.studioName}</p>
                <p className="text-sm text-muted-foreground">{danceClass.studioAddress}, {danceClass.city}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4 mt-auto">
          {danceClass.bookingUrl && (
            <Button
              className="w-full h-14 rounded-full font-semibold gap-2"
              onClick={openBookingSite}
            >
              <ExternalLink className="w-4 h-4" />
              Complete Booking on Studio Site
            </Button>
          )}
          <Button asChild variant="outline" className="w-full h-14 rounded-full font-semibold bg-background border-border">
            <Link href="/classes">View My Classes</Link>
          </Button>
        </div>
      </div>
    </DetailLayout>
  );
}
