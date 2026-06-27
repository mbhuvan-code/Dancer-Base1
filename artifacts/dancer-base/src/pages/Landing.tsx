import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logo from "@assets/dancer_base_logo_1782179346323.jpeg";

export default function Landing() {
  return (
    <div className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col sm:border-x border-border p-6 justify-center">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <img
          src={logo}
          alt="dancerBase"
          className="w-16 h-16 object-contain mb-8"
        />

        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          Discover classes.<br />Find your flow.
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          dancerBase is where serious dancers book classes and connect with their community.
        </p>

        <div className="space-y-4">
          <Button asChild size="lg" className="w-full h-14 rounded-full text-base font-semibold">
            <Link href="/sign-up">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full h-14 rounded-full text-base font-semibold border-border">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
