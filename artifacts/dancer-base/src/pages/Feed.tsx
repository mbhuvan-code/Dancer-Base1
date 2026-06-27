import React, { useState } from "react";
import { useGetFeed, useAddFriend, useSearchUsers } from "@workspace/api-client-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Link } from "wouter";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowRight, Bookmark, Rss, Search, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFeedQueryKey, getListFriendsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Feed() {
  const { data: feedItems, isLoading } = useGetFeed();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  const { data: searchResults, isLoading: isSearching } = useSearchUsers(
    { q: searchQuery },
    { query: { enabled: dialogOpen } }
  );

  const addFriendMutation = useAddFriend({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
        toast({ title: "Friend added!" });
        setAddingId(null);
      },
      onError: () => {
        toast({ title: "Failed to add friend", variant: "destructive" });
        setAddingId(null);
      }
    }
  });

  const handleAdd = (username: string, userId: number) => {
    setAddingId(userId);
    addFriendMutation.mutate({ data: { username } });
  };

  const openDialog = () => {
    setSearchQuery("");
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-secondary/50" onClick={openDialog}>
                <UserPlus className="w-5 h-5 text-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
                <DialogTitle>Add a Friend</DialogTitle>
              </DialogHeader>

              <div className="px-4 pt-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or username…"
                    className="pl-9 h-10 bg-secondary/50 border-transparent rounded-xl"
                    autoFocus
                  />
                </div>
              </div>

              <div className="px-2 pb-4 max-h-72 overflow-y-auto">
                {isSearching ? (
                  <div className="space-y-1 px-2 py-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8 px-4">
                    {searchQuery ? `No users found for "${searchQuery}"` : "No other users yet — invite friends to join!"}
                  </p>
                ) : (
                  <div className="space-y-0.5 mt-1">
                    {searchResults?.map(user => (
                      <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                        <UserAvatar src={user.profilePic} name={user.name} className="w-10 h-10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{user.username} · {user.badge}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full h-8 px-3 text-xs font-semibold shrink-0"
                          disabled={addingId === user.id || addFriendMutation.isPending}
                          onClick={() => handleAdd(user.username, user.id)}
                        >
                          {addingId === user.id ? (
                            <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><UserCheck className="w-3.5 h-3.5 mr-1" />Add</>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1 pt-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-16 w-full rounded-xl mt-2" />
              </div>
            </div>
          ))
        ) : feedItems?.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rss className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium text-lg mb-2">It's quiet here</p>
            <p className="text-sm text-muted-foreground mb-6">Add friends to see what classes they are taking and saving.</p>
            <Button onClick={openDialog} variant="outline" className="rounded-full">
              Find Friends
            </Button>
          </div>
        ) : (
          feedItems?.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
              <Link href={`/profile/${item.user.id}`} className="shrink-0">
                <UserAvatar src={item.user.profilePic} name={item.user.name} className="w-12 h-12 border border-border" />
              </Link>
              <div className="flex flex-col flex-1">
                <div className="text-sm">
                  <Link href={`/profile/${item.user.id}`} className="font-semibold text-foreground hover:underline">
                    @{item.user.username}
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    {item.type === "booking" ? "is going to" : "saved"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                </div>
                <Link href={`/class/${item.class.id}/checkout`} className="mt-3 group">
                  <div className="p-3 rounded-xl border border-border bg-secondary/30 group-hover:bg-secondary/60 transition-colors flex items-center justify-between">
                    <div className="flex flex-col min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{item.class.instructorName}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.class.style} · {item.class.studioName}</div>
                    </div>
                    {item.type === "booking" ? (
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                    )}
                  </div>
                </Link>
              </div>
            </div>
          ))
        )}

        {feedItems && feedItems.length > 0 && (
          <div className="py-6 flex justify-center">
            <Button onClick={openDialog} variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full">
              + Add more friends
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
