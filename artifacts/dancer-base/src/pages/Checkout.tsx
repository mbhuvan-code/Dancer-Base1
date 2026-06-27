/**
 * Checkout is now external — this page is no longer reachable from the UI.
 * "Book Now" in ClassCard opens the studio's booking URL directly.
 * This stub redirects back to search in case the route is hit directly.
 */
import React, { useEffect } from "react";
import { useLocation } from "wouter";

export default function Checkout() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/search"); }, [setLocation]);
  return null;
}
