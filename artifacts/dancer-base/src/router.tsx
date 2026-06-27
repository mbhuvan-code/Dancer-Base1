/**
 * App router — defines all routes and auth-gated layouts.
 * Rendered inside <ClerkProvider> and <QueryClientProvider>.
 */
import React, { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { Show, useAuth, useClerk } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@workspace/api-client-react";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { SignInPage } from "@/components/auth/SignInPage";
import { SignUpPage } from "@/components/auth/SignUpPage";

import Landing from "@/pages/Landing";
import Search from "@/pages/Search";
import Classes from "@/pages/Classes";
import Feed from "@/pages/Feed";
import Profile from "@/pages/Profile";
import Instructor from "@/pages/Instructor";
import Studio from "@/pages/Studio";
import Checkout from "@/pages/Checkout";
import Receipt from "@/pages/Receipt";
import Videos from "@/pages/Videos";
import FriendsAttending from "@/pages/FriendsAttending";
import AddFriends from "@/pages/AddFriends";
import Onboarding from "@/pages/Onboarding";

// ---------------------------------------------------------------------------
// Auth-aware home redirect — sends new users to onboarding, returning to /search
// ---------------------------------------------------------------------------
export function HomeRedirect() {
  const { isSignedIn } = useAuth();
  const { data: me, isLoading } = useQuery({
    queryKey: ["me-redirect"],
    queryFn: () => getMe(),
    enabled: !!isSignedIn,
    retry: 1,
  });

  if (!isSignedIn) return <Landing />;
  if (isLoading) return null;

  if (me?.username?.startsWith("dancer_")) return <Redirect to="/onboarding" />;
  return <Redirect to="/search" />;
}

// ---------------------------------------------------------------------------
// Wraps a tab-bar page with MobileLayout and redirects unauthenticated users
// ---------------------------------------------------------------------------
export function AuthLayout({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <MobileLayout>
          <Component />
        </MobileLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

// ---------------------------------------------------------------------------
// Clears React Query cache when the Clerk user changes (sign-in / sign-out)
// ---------------------------------------------------------------------------
export function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

// ---------------------------------------------------------------------------
// Full route tree
// ---------------------------------------------------------------------------
export function AppRouter() {
  return (
    <div className="bg-muted min-h-screen">
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />

        {/* Onboarding — signed-in only */}
        <Route path="/onboarding">
          {() => (
            <Show when="signed-in">
              <Onboarding />
            </Show>
          )}
        </Route>

        {/* Tab-bar pages */}
        <Route path="/search">{() => <AuthLayout component={Search} />}</Route>
        <Route path="/classes">{() => <AuthLayout component={Classes} />}</Route>
        <Route path="/feed">{() => <AuthLayout component={Feed} />}</Route>
        <Route path="/profile">{() => <AuthLayout component={Profile} />}</Route>

        {/* Detail pages — signed-in only, no tab bar */}
        <Route path="/instructor/:id">
          {() => <Show when="signed-in"><Instructor /></Show>}
        </Route>
        <Route path="/studio/:id">
          {() => <Show when="signed-in"><Studio /></Show>}
        </Route>
        <Route path="/class/:id/checkout">
          {() => <Show when="signed-in"><Checkout /></Show>}
        </Route>
        <Route path="/booking/:id/receipt">
          {() => <Show when="signed-in"><Receipt /></Show>}
        </Route>
        <Route path="/class/:id/videos">
          {() => <Show when="signed-in"><Videos /></Show>}
        </Route>
        <Route path="/friends-attending/:classId">
          {() => <Show when="signed-in"><FriendsAttending /></Show>}
        </Route>
        <Route path="/add-friends">
          {() => <Show when="signed-in"><AddFriends /></Show>}
        </Route>

        <Route><Redirect to="/" /></Route>
      </Switch>
    </div>
  );
}
