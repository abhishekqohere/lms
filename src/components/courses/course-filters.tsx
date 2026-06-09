"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

const CATEGORIES = [
  "All",
  "Development",
  "Design",
  "Business",
  "Marketing",
  "Photography",
  "Music",
];

const LEVELS = ["All", "beginner", "intermediate", "advanced"];

export function CourseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "All") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/courses?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("search", search);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium self-center mr-2">Category:</span>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={searchParams.get("category") === cat || (!searchParams.get("category") && cat === "All") ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("category", cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium self-center mr-2">Level:</span>
        {LEVELS.map((level) => (
          <Button
            key={level}
            variant={searchParams.get("level") === level || (!searchParams.get("level") && level === "All") ? "default" : "outline"}
            size="sm"
            className="capitalize"
            onClick={() => updateFilter("level", level)}
          >
            {level}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium self-center mr-2">Sort:</span>
        {[
          { value: "newest", label: "Newest" },
          { value: "rating", label: "Top Rated" },
          { value: "popularity", label: "Popular" },
          { value: "price_asc", label: "Price: Low" },
          { value: "price_desc", label: "Price: High" },
        ].map((sort) => (
          <Button
            key={sort.value}
            variant={searchParams.get("sortBy") === sort.value || (!searchParams.get("sortBy") && sort.value === "newest") ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("sortBy", sort.value)}
          >
            {sort.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
