import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bookmark, BookmarkCheck, MapPin, ExternalLink, Check, X, CheckCircle2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface ClassCardProps {
  danceClass: DanceClass;
  mode?: "search" | "upcoming" | "saved";
  onBooked?: (classId: number) => void;
}

export function ClassCard({ danceClass, mode = "search", onBooked }: ClassCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmState, setConfirmState] = useState<"idle" | "pending" | "confirmed">(
    danceClass.isBooked ? "confirmed" : "idle"
  );

  // After showing the confirmed animation, notify parent to remove card,
  // then refetch the discovery lists (server now excludes booked classes).
  useEffect(() => {
    if (confirmState !== "confirmed" || danceClass.isBooked) return;
    const timer = setTimeout(() => {
      onBooked?.(danceClass.id);
      queryClient.invalidateQueries({ queryKey: getGetTrendingClassesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
    }, 1500);
    return () => clearTimeout(timer);
  }, [confirmState, danceClass.id, danceClass.isBooked, onBooked, queryClient]);

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
        // Discovery lists (trending/search) are invalidated after the
        // confirmed animation completes — see the effect above.
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSavedQueryKey() });
      },
      onError: () => {
        toast({ title: "Couldn't record booking", description: "Please try again.", variant: "destructive" });
        setConfirmState("idle");
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
    const url = danceClass.bookingUrl || "#";
    window.open(url, "_blank", "noopener,noreferrer");
    setConfirmState("pending");
  };

  const handleConfirmYes = () => {
    setConfirmState("confirmed");
    if (!danceClass.isBooked) {
      bookMutation.mutate({ data: { classId: danceClass.id } });
    }
  };

  const handleConfirmNo = () => {
    setConfirmState("idle");
  };

  const isBooked = danceClass.isBooked;
  const showSaveButton = mode !== "upcoming" && !isBooked && confirmState !== "confirmed";

  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Green confirmed overlay */}
      {confirmState === "confirmed" && !isBooked && (
        <div className="absolute inset-0 z-20 bg-green-500 rounded-2xl flex flex-col items-center justify-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={1.5} />
          <span className="text-white font-bold text-xl tracking-tight">Confirmed!</span>
        </div>
      )}

      <div className={cn("p-4 flex flex-col gap-4", confirmState === "confirmed" && !isBooked && "opacity-0")}>
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
            <div className="text-sm font-medium text-foreground">${danceClass.price}</div>
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
              {(danceClass.friendsAttending?.length ?? 0) > 3 && (
                <div className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                  +{(danceClass.friendsAttending?.length ?? 0) - 3}
                </div>
              )}
            </div>
            {danceClass.friendsAttending && danceClass.friendsAttending.length > 0 && (
              <span className="text-xs text-muted-foreground group-hover/friends:text-foreground transition-colors">
                {danceClass.friendsAttending.length} friend{danceClass.friendsAttending.length !== 1 ? "s" : ""} going
              </span>
            )}
          </Link>

          {mode === "upcoming" || isBooked ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full font-medium gap-1.5"
              onClick={() => window.open(danceClass.bookingUrl || "#", "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Booking Site
            </Button>
          ) : confirmState === "pending" ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-0.5">Did you book?</span>
              <Button
                size="sm"
                variant="default"
                className="rounded-full h-7 px-2.5 text-xs font-semibold gap-1"
                onClick={handleConfirmYes}
                disabled={bookMutation.isPending}
              >
                <Check className="w-3 h-3" />Yes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full h-7 px-2.5 text-xs font-semibold gap-1"
                onClick={handleConfirmNo}
              >
                <X className="w-3 h-3" />No
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="rounded-full font-medium shadow-sm gap-1.5"
              onClick={handleBookNow}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Book Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
