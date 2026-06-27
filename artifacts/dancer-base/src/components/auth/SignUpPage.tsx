import React from "react";
import { SignUp } from "@clerk/react";
import { basePath, clerkAppearance } from "@/config/clerk";

export function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] w-full max-w-[430px] mx-auto items-center justify-center bg-background px-4 sm:border-x border-border">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}
