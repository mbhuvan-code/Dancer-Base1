import React, { useState } from "react";
import { useListClasses, useGetTrendingClasses } from "@workspace/api-client-react";
import { ClassCard } from "@/components/shared/ClassCard";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CITIES = ["San Francisco", "Oakland", "Berkeley"];
const STYLES = ["Choreo", "KPOP", "Hiphop", "House Dance Footwork", "Breaking", "Jazz Funk", "Heels", "Contemporary", "Afrobeats", "Waacking"];

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = !!selectedCity || !!selectedStyle || !!searchQuery;

  const params = {
    ...(searchQuery ? { search: searchQuery } : {}),
    ...(selectedCity ? { city: selectedCity } : {}),
    ...(selectedStyle ? { style: selectedStyle } : {}),
  };

  const { data: trendingClasses, isLoading: isLoadingTrending } = useGetTrendingClasses({
    query: { enabled: !hasFilters } as never,
  });

  const { data: searchResults, isLoading: isLoadingSearch } = useListClasses(
    params,
    { query: { enabled: hasFilters } as never }
  );

  const classes = hasFilters ? searchResults : trendingClasses;
  const isLoading = hasFilters ? isLoadingSearch : isLoadingTrending;

  const clearAll = () => {
    setSearchQuery("");
    setSelectedCity(null);
    setSelectedStyle(null);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search instructors, studios, styles..."
            className="w-full pl-10 pr-4 h-12 bg-secondary/50 border-transparent rounded-2xl focus-visible:ring-primary focus-visible:bg-background transition-colors text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter chips row */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors shrink-0",
              showFilters || selectedCity || selectedStyle
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-foreground"
            )}
          >
            Filters
            {(selectedCity || selectedStyle) && (
              <span className="w-4 h-4 bg-primary-foreground/20 rounded-full text-[10px] flex items-center justify-center">
                {[selectedCity, selectedStyle].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Active filter pills */}
          {selectedCity && (
            <button
              onClick={() => setSelectedCity(null)}
              className="flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 text-primary shrink-0"
            >
              {selectedCity}
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedStyle && (
            <button
              onClick={() => setSelectedStyle(null)}
              className="flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 text-primary shrink-0"
            >
              {selectedStyle}
              <X className="w-3 h-3" />
            </button>
          )}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="h-8 px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground border border-border bg-background shrink-0"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="space-y-3 pt-1 border-t border-border">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">City</p>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                    className={cn(
                      "h-8 px-3 rounded-full text-xs font-medium border transition-colors",
                      selectedCity === city
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground hover:border-primary/50"
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(selectedStyle === style ? null : style)}
                    className={cn(
                      "h-8 px-3 rounded-full text-xs font-medium border transition-colors",
                      selectedStyle === style
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground hover:border-primary/50"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold tracking-tight">
          {hasFilters ? "Results" : "Trending Now"}
          {classes && !isLoading && (
            <span className="text-base font-normal text-muted-foreground ml-2">
              ({classes.length})
            </span>
          )}
        </h2>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full rounded-xl" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))
          ) : classes?.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-1">No classes found</p>
              <p className="text-sm text-muted-foreground">Try different filters or search terms.</p>
            </div>
          ) : (
            classes?.map((danceClass) => (
              <ClassCard key={danceClass.id} danceClass={danceClass} mode="search" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
