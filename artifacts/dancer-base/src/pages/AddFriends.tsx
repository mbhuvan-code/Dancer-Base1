import React, { useState } from "react";
import { useAddFriend, useSearchUsers } from "@workspace/api-client-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { DetailLayout } from "@/components/layout/DetailLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, UserCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFeedQueryKey, getListFriendsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddFriends() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addingId, setAddingId] = useState<number | null>(null);

  const { data: searchResults, isLoading } = useSearchUsers({ q: searchQuery });

  const addFriendMutation = useAddFriend({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
        toast({ title: "Friend added!" });
        setAddingId(null);
      },
      onError: () => {
        toast({ title: "Failed to add friend", variant: "destructive" });
        setAddingId(null);
      },
    },
  });

  const handleAdd = (username: string, userId: number) => {
    setAddingId(userId);
    setAddedIds(prev => new Set(prev).add(userId));
    addFriendMutation.mutate({ data: { username } });
  };

  const suggested = searchResults?.filter(u => !addedIds.has(u.id)) ?? [];
  const label = searchQuery ? "Results" : "Suggested for you";

  return (
    <DetailLayout title="Add Friends" backTo="/feed">
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username…"
            className="pl-9 h-11 bg-secondary/50 border-transparent rounded-xl"
            autoFocus
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">{label}</p>

          {isLoading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : suggested.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {searchQuery ? `No users found for "${searchQuery}"` : "No suggestions right now — invite friends to join!"}
            </p>
          ) : (
            <div className="space-y-0.5">
              {suggested.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                  <UserAvatar src={user.profilePic} name={user.name} className="w-11 h-11 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username} · {user.badge}</p>
                  </div>
                  {addedIds.has(user.id) ? (
                    <Button size="sm" variant="secondary" className="rounded-full h-8 px-3 text-xs font-semibold shrink-0" disabled>
                      <UserCheck className="w-3.5 h-3.5 mr-1" />Added
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full h-8 px-3 text-xs font-semibold shrink-0"
                      disabled={addingId === user.id}
                      onClick={() => handleAdd(user.username, user.id)}
                    >
                      {addingId === user.id ? (
                        <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><UserPlus className="w-3.5 h-3.5 mr-1" />Add</>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DetailLayout>
  );
}
