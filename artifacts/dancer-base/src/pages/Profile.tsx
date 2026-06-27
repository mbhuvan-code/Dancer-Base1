import React, { useState, useRef } from "react";
import { useGetMe, useListPastClasses, useUpdateMe } from "@workspace/api-client-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Music, Video, X, LogOut, Camera } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { useClerk } from "@clerk/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

function compressImage(file: File, maxSize = 256, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
        else { w = Math.round((w * maxSize) / h); h = maxSize; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: pastClasses, isLoading: isLoadingPastClasses } = useListPastClasses();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPic, setEditPic] = useState("");
  const [editError, setEditError] = useState("");
  const [uploading, setUploading] = useState(false);

  const openSettings = () => {
    setEditName(user?.name ?? "");
    setEditUsername(user?.username ?? "");
    setEditPic(user?.profilePic ?? "");
    setEditError("");
    setShowSettings(true);
  };

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setShowSettings(false);
        toast({ title: "Profile updated" });
      },
      onError: (err: any) => {
        setEditError(err?.data?.error ?? "Something went wrong.");
      },
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setEditPic(compressed);
    } catch {
      setEditError("Couldn't read that image — please try another.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) { setEditError("Name is required."); return; }
    if (!editUsername.trim()) { setEditError("Username is required."); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(editUsername)) {
      setEditError("Username: 3–20 chars, lowercase/numbers/underscores.");
      return;
    }
    setEditError("");
    updateMe.mutate({ data: { name: editName.trim(), username: editUsername.trim(), profilePic: editPic || undefined } });
  };

  return (
    <div className="flex flex-col min-h-full pb-6">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 bg-background relative border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-full"
          onClick={openSettings}
        >
          <Settings className="w-5 h-5" />
        </Button>

        {isLoadingUser ? (
          <div className="flex flex-col items-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ) : user ? (
          <div className="flex flex-col items-center text-center">
            <UserAvatar src={user.profilePic} name={user.name} className="w-24 h-24 text-2xl border-4 border-background shadow-sm mb-4" />
            <h1 className="text-2xl font-bold text-foreground leading-tight">{user.name}</h1>
            <p className="text-muted-foreground font-medium mb-3">@{user.username}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
              {user.badge}
            </div>
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border w-full justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-foreground">{user.classesAttended}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Classes</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Past classes */}
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold tracking-tight px-2">Past Classes</h2>

        {isLoadingPastClasses ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : pastClasses?.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-2xl mx-2">
            <p className="text-muted-foreground mb-2">No past classes yet.</p>
            <Button variant="link" asChild className="text-primary">
              <Link href="/search">Find a class</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-2">
            {pastClasses?.map((past) => (
              <div key={past.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{past.class?.instructorName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {past.class?.studioName} · {past.class ? format(parseISO(past.class.date), "MMM d, yyyy") : ""}
                  </p>
                </div>
                {past.songPlayed && (
                  <div className="flex items-center gap-2 text-sm text-foreground bg-secondary/50 rounded-lg p-2.5">
                    <Music className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium truncate">{past.songPlayed}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-2">
                      {past.attendees?.slice(0, 3).map((attendee) => (
                        <UserAvatar key={attendee.id} src={attendee.profilePic} name={attendee.name} className="w-6 h-6 border-2 border-card" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{past.attendeeCount} attended</span>
                  </div>
                  <Button asChild variant="secondary" size="sm" className="rounded-full h-8 px-3 text-xs font-semibold bg-background border border-border hover:bg-secondary">
                    <Link href={`/class/${past.classId}/videos`}>
                      <Video className="w-3 h-3 mr-1.5" />Videos
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit profile bottom sheet */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-[430px] bg-background rounded-t-3xl p-6 space-y-5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="relative group" disabled={uploading}>
                  <UserAvatar src={editPic} name={editName || "?"} className="w-16 h-16 text-xl border-4 border-background shadow-sm" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
                <p className="text-xs text-muted-foreground">{editPic ? "Tap to change" : "Tap to add photo"}</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div>
                <Label htmlFor="ep-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Name</Label>
                <Input id="ep-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" className="h-11 bg-secondary/50 border-transparent rounded-xl" />
              </div>

              <div>
                <Label htmlFor="ep-username" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Username</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input id="ep-username" value={editUsername} onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="yourusername" className="h-11 pl-7 bg-secondary/50 border-transparent rounded-xl" maxLength={20} />
                </div>
              </div>

              {editError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{editError}</p>}

              <Button type="submit" className="w-full h-12 rounded-full font-semibold" disabled={updateMe.isPending || uploading}>
                {updateMe.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>

            <div className="border-t border-border pt-4">
              <Button variant="ghost" className="w-full h-12 rounded-full font-medium text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => signOut({ redirectUrl: "/" })}>
                <LogOut className="w-4 h-4 mr-2" />Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
