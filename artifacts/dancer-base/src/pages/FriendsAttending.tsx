import React from "react";
import { useParams, Link } from "wouter";
import { useGetFriendsAttending } from "@workspace/api-client-react";
import { DetailLayout } from "@/components/layout/DetailLayout";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function FriendsAttending() {
  const params = useParams();
  const id = parseInt(params.classId || "0", 10);
  const { data: friends, isLoading } = useGetFriendsAttending(id);

  if (isLoading) {
    return (
      <DetailLayout title="Friends Attending">
        <div className="p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center p-3">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </DetailLayout>
    );
  }

  return (
    <DetailLayout title="Friends Attending">
      <div className="p-2">
        {friends?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No friends attending this class yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {friends?.map(friend => (
              <Link 
                key={friend.id} 
                href={`/profile/${friend.id}`}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <UserAvatar src={friend.profilePic} name={friend.name} className="w-12 h-12" />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{friend.name}</span>
                  <span className="text-sm text-muted-foreground">@{friend.username}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DetailLayout>
  );
}
