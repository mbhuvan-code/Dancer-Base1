import React from "react";
import { SignIn } from "@clerk/react";
import { basePath, clerkAppearance } from "@/config/clerk";

export function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] w-full max-w-[430px] mx-auto items-center justify-center bg-background px-4 sm:border-x border-border">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}
