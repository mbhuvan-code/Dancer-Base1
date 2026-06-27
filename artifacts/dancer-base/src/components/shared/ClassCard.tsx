import React from "react";
import { Link } from "wouter";
import { Bookmark, BookmarkCheck, MapPin, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DanceClass } from "@workspace/api-client-react";
import { UserAvatar } from "./UserAvatar";
import { useSaveClass, useUnsaveClass, useCreateBooking } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListSavedQueryKey,
  getListClassesQueryKey,
  getGetTrendingClassesQueryKey,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ClassCardProps {
  danceClass: DanceClass;
  mode?: "search" | "upcoming" | "saved";
}

export function ClassCard({ danceClass, mode = "search" }: ClassCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveMutation = useSaveClass({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingClassesQueryKey() });
        toast({ title: "Class saved" });
      },
      onError: () => {
        toast({ title: "Couldn't save class", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const unsaveMutation = useUnsaveClass({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingClassesQueryKey() });
        toast({ title: "Class removed from saved" });
      },
      onError: () => {
        toast({ title: "Couldn't unsave class", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const bookMutation = useCreateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingClassesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
      },
      onError: () => {
        // Booking errors are silent — user already left for the studio site
      },
    },
  });

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (danceClass.isSaved) {
      unsaveMutation.mutate({ classId: danceClass.id });
    } else {
      saveMutation.mutate({ classId: danceClass.id });
    }
  };

  const handleBookNow = () => {
    // Open the studio's booking page in a new tab
    const url = danceClass.bookingUrl || "#";
    window.open(url, "_blank", "noopener,noreferrer");
    // Mark as attending in the app so it shows up in Upcoming
    if (!danceClass.isBooked) {
      bookMutation.mutate({ data: { classId: danceClass.id } });
    }
  };

  const isBooked = danceClass.isBooked;
  const showSaveButton = mode !== "upcoming" && !isBooked;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4 shadow-sm relative group overflow-hidden">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-3 items-center">
          <Link href={`/instructor/${danceClass.instructorId}`} className="shrink-0">
            <UserAvatar src={danceClass.instructorPic} name={danceClass.instructorName} className="w-10 h-10 border border-border" />
          </Link>
          <div className="flex flex-col">
            <Link href={`/instructor/${danceClass.instructorId}`} className="font-semibold text-base text-foreground leading-tight hover:underline">
              {danceClass.instructorName}
            </Link>
            <Link href={`/studio/${danceClass.studioId}`} className="flex items-center text-sm text-muted-foreground mt-0.5 hover:text-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{danceClass.studioName} · {danceClass.city}</span>
            </Link>
          </div>
        </div>

        {showSaveButton && (
          <button
            onClick={toggleSave}
            className="p-2 -m-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            disabled={saveMutation.isPending || unsaveMutation.isPending}
          >
            {danceClass.isSaved ? (
              <BookmarkCheck className="w-5 h-5 text-primary fill-primary/10" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      <div className="bg-secondary/50 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <div className="font-medium text-foreground">
            {format(parseISO(danceClass.date), "EEEE, MMM d")}
          </div>
          <div className="text-muted-foreground">
            {danceClass.startTime} – {danceClass.endTime}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-foreground">
            ${danceClass.price}
          </div>
          <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
            {danceClass.style} · {danceClass.level}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <Link href={`/friends-attending/${danceClass.id}`} className="flex items-center group/friends cursor-pointer">
          <div className="flex -space-x-2 mr-2">
            {danceClass.friendsAttending?.slice(0, 3).map((friend) => (
              <UserAvatar key={friend.id} src={friend.profilePic} name={friend.name} className="w-6 h-6 border-2 border-card" />
            ))}
          </div>
          {danceClass.friendsAttending && danceClass.friendsAttending.length > 0 ? (
            <span className="text-xs text-muted-foreground group-hover/friends:text-foreground transition-colors">
              {danceClass.friendsAttending.length} friend{danceClass.friendsAttending.length !== 1 ? "s" : ""} going
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{danceClass.spotsRemaining} spots left</span>
          )}
        </Link>

        {mode === "upcoming" ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full font-medium gap-1.5"
            onClick={() => {
              const url = danceClass.bookingUrl || "#";
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Booking Site
          </Button>
        ) : isBooked ? (
          <Button disabled variant="secondary" size="sm" className="rounded-full font-medium opacity-60">
            Attending
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-full font-medium shadow-sm gap-1.5"
            onClick={handleBookNow}
            disabled={bookMutation.isPending}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Book Now
          </Button>
        )}
      </div>
    </div>
  );
}
