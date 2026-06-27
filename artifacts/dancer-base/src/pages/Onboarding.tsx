import React, { useState, useRef } from "react";
import { useUpdateMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Camera } from "lucide-react";
import logo from "@assets/dancer_base_logo_1782179346323.jpeg";

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
        canvas.width = w;
        canvas.height = h;
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

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState<string>("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: () => setLocation("/search"),
      onError: (err: any) => {
        setError(err?.data?.error || "Something went wrong. Please try again.");
      },
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setProfilePic(compressed);
    } catch {
      setError("Couldn't read that image — please try another.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    if (!username.trim()) { setError("Username is required."); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError("Username must be 3–20 characters: lowercase letters, numbers, underscores only.");
      return;
    }
    setError("");
    updateMe.mutate({
      data: {
        name: name.trim(),
        username: username.trim(),
        profilePic: profilePic || undefined,
      },
    });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-[430px] mx-auto flex flex-col bg-background sm:border-x border-border">
      <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
        <div className="mb-8">
          <img src={logo} alt="dancerBase" className="w-10 h-10 object-contain mb-6" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Set up your profile</h1>
          <p className="text-muted-foreground text-sm">Tell the dance community who you are.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group"
              disabled={uploading}
            >
              <UserAvatar
                src={profilePic}
                name={name || "?"}
                className="w-20 h-20 text-2xl border-4 border-background shadow-sm"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              {profilePic ? "Tap to change photo" : "Tap to add a photo"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-11 bg-secondary/50 border-transparent rounded-xl focus-visible:ring-primary focus-visible:bg-background"
              autoComplete="name"
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Username
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">@</span>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="yourusername"
                className="h-11 pl-7 bg-secondary/50 border-transparent rounded-xl focus-visible:ring-primary focus-visible:bg-background"
                maxLength={20}
                autoComplete="username"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Lowercase letters, numbers, underscores. 3–20 characters.</p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="mt-auto pt-4">
            <Button
              type="submit"
              className="w-full h-14 rounded-full font-semibold text-base"
              disabled={updateMe.isPending || uploading}
            >
              {updateMe.isPending ? "Saving..." : "Let's go →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
