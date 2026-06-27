import React from "react";
import { Avatar, AvatarFallback as ShadcnAvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

export function UserAvatar({ src, name, className }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt={name} className="object-cover" />}
      <ShadcnAvatarFallback className="bg-primary/10 text-primary font-medium">
        {initials || "?"}
      </ShadcnAvatarFallback>
    </Avatar>
  );
}
