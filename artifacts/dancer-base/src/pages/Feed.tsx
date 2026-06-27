import React from "react";
import { useGetFeed } from "@workspace/api-client-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Link } from "wouter";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowRight, Bookmark, Rss } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Feed() {
  const { data: feedItems, isLoading } = useGetFeed();

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
          <Link href="/add-friends">
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-secondary/50">
              <UserPlus className="w-5 h-5 text-foreground" />
            </Button>
          </Link>
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
            <Link href="/add-friends">
              <Button variant="outline" className="rounded-full">
                Find Friends
              </Button>
            </Link>
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
            <Link href="/add-friends">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full">
                + Add more friends
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
