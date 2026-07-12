import React, { useEffect } from "react";
import { Router as WouterRouter, useLocation } from "wouter";
import { ClerkProvider, useAuth } from "@clerk/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { clerkPubKey, clerkProxyUrl, clerkAppearance, basePath, stripBase } from "@/config/clerk";
import { AppRouter, ClerkQueryClientCacheInvalidator } from "@/router";

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY — add it to your .env file");
}

/**
 * Attaches the Clerk session token as an Authorization: Bearer header on
 * every API request. Cookie-based auth doesn't survive the Vite dev proxy
 * (Codespaces), so explicit header auth is required for the API to see the
 * signed-in user.
 */
function AuthTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <AuthTokenBridge />
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AppRouter />
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
