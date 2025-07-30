"use client";

import React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Filter } from "lucide-react";

interface HandFiltersProps {
  cards: string[];
  onFilteredCards: (filteredCards: string[]) => void;
}

export function HandFilters({ cards, onFilteredCards }: HandFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setSortBy("name");
    onFilteredCards(cards);
  };

  // Apply filters whenever any filter changes
  React.useEffect(() => {
    let filtered = [...cards];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((card) =>
        card.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply type filter (basic implementation - could be enhanced with actual card data)
    if (typeFilter !== "all") {
      filtered = filtered.filter((card) => {
        const cardLower = card.toLowerCase();
        switch (typeFilter) {
          case "creatures":
            return (
              cardLower.includes("creature") ||
              cardLower.includes("dragon") ||
              cardLower.includes("knight") ||
              cardLower.includes("goblin") ||
              cardLower.includes("elf")
            );
          case "spells":
            return (
              cardLower.includes("instant") ||
              cardLower.includes("sorcery") ||
              cardLower.includes("spell")
            );
          case "lands":
            return (
              cardLower.includes("land") ||
              cardLower.includes("plains") ||
              cardLower.includes("island") ||
              cardLower.includes("swamp") ||
              cardLower.includes("mountain") ||
              cardLower.includes("forest")
            );
          case "artifacts":
            return cardLower.includes("artifact");
          case "enchantments":
            return cardLower.includes("enchantment");
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sortBy === "name") {
      filtered.sort((a, b) => a.localeCompare(b));
    } else if (sortBy === "type") {
      filtered.sort((a, b) => {
        const getTypeOrder = (card: string) => {
          const cardLower = card.toLowerCase();
          if (cardLower.includes("land")) return 0;
          if (cardLower.includes("creature")) return 1;
          if (cardLower.includes("artifact")) return 2;
          if (cardLower.includes("enchantment")) return 3;
          if (cardLower.includes("instant")) return 4;
          if (cardLower.includes("sorcery")) return 5;
          return 6;
        };
        return getTypeOrder(a) - getTypeOrder(b);
      });
    }
    onFilteredCards(filtered);
  }, [searchTerm, typeFilter, sortBy, cards, onFilteredCards]);

  const hasActiveFilters =
    searchTerm || typeFilter !== "all" || sortBy !== "name";

  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filter & Sort Cards</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <Label htmlFor="search" className="text-xs">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>

        <div>
          <Label htmlFor="type" className="text-xs">
            Type
          </Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="creatures">Creatures</SelectItem>
              <SelectItem value="spells">Spells</SelectItem>
              <SelectItem value="lands">Lands</SelectItem>
              <SelectItem value="artifacts">Artifacts</SelectItem>
              <SelectItem value="enchantments">Enchantments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sort" className="text-xs">
            Sort By
          </Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Search: {searchTerm}
            </Badge>
          )}
          {typeFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Type: {typeFilter}
            </Badge>
          )}
          {sortBy !== "name" && (
            <Badge variant="secondary" className="text-xs">
              Sort: {sortBy}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
