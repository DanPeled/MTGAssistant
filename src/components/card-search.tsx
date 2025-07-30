"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  Gamepad2,
  Mountain,
  Star,
  Zap,
  Sparkles,
  Settings,
  Crown,
} from "lucide-react";

interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  type_line: string;
  power?: string;
  toughness?: string;
  image_uris?: {
    small: string;
  };
  cmc?: number;
}

interface CardSearchProps {
  onCardSelect: (card: ScryfallCard) => void;
  placeholder?: string;
  className?: string;
}

interface CacheEntry {
  results: ScryfallCard[];
  timestamp: number;
}

const typeQueries = {
  lands: "type:land",
  creatures: "type:creature",
  instants: "type:instant",
  sorceries: "type:sorcery",
  enchantments: "type:enchantment",
  artifacts: "type:artifact",
  planeswalkers: "type:planeswalker",
};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries

// Global cache to persist across component instances
const searchCache = new Map<string, CacheEntry>();

// Common basic lands and their variations
const basicLandSuggestions = [
  "Plains",
  "Island",
  "Swamp",
  "Mountain",
  "Forest",
  "Wastes",
];

export function CardSearch({
  onCardSelect,
  placeholder = "Search for any Magic card...",
  className = "",
}: CardSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScryfallCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cache management functions
  const getCacheKey = (searchQuery: string, filter: string) => {
    return `${searchQuery.toLowerCase()}|${filter}`;
  };

  const getCachedResults = (cacheKey: string): ScryfallCard[] | null => {
    const cached = searchCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      searchCache.delete(cacheKey);
      return null;
    }

    return cached.results;
  };

  const setCachedResults = (cacheKey: string, results: ScryfallCard[]) => {
    // Clean up old entries if cache is getting too large
    if (searchCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) {
        searchCache.delete(oldestKey);
      }
    }

    searchCache.set(cacheKey, {
      results: results,
      timestamp: Date.now(),
    });
  };

  // Validate and normalize card data
  const validateCard = (card: {
    id: string;
    name: string;
    type_line?: string;
    mana_cost?: string;
    power?: string;
    toughness?: string;
    image_uris?: { small: string };
    cmc: number;
  }): ScryfallCard | null => {
    if (!card || typeof card !== "object") return null;

    // Ensure required fields exist
    if (!card.id || !card.name || !card.type_line) return null;

    return {
      id: card.id,
      name: card.name,
      type_line: card.type_line || "",
      mana_cost: card.mana_cost || undefined,
      power: card.power || undefined,
      toughness: card.toughness || undefined,
      image_uris: card.image_uris || undefined,
      cmc: card.cmc || undefined,
    };
  };

  const searchCards = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const cacheKey = getCacheKey(searchQuery, typeFilter);

    // Check cache first
    const cachedResults = getCachedResults(cacheKey);
    if (cachedResults) {
      setResults(cachedResults);
      setIsOpen(true);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let results: ScryfallCard[] = [];

      // Special handling for basic lands and short queries
      if (
        searchQuery.length <= 3 ||
        basicLandSuggestions.some((land) =>
          land.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      ) {
        // For short queries or basic land searches, use autocomplete first
        try {
          const autocompleteResponse = await fetch(
            `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(searchQuery)}`,
          );

          if (autocompleteResponse.ok) {
            const autocompleteData = await autocompleteResponse.json();
            const cardNames = autocompleteData.data || [];

            // Filter by type if needed
            let filteredNames = cardNames;
            if (typeFilter !== "all") {
              // For autocomplete, we'll fetch a few cards to check their types
              const sampleCards = await Promise.all(
                cardNames.slice(0, 15).map(async (name: string) => {
                  try {
                    // Check if we have this card cached individually
                    const individualCacheKey = getCacheKey(name, "all");
                    const cachedCard = getCachedResults(individualCacheKey);
                    if (cachedCard && cachedCard.length > 0) {
                      return cachedCard[0];
                    }

                    const cardResponse = await fetch(
                      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
                    );
                    if (cardResponse.ok) {
                      const cardData = await cardResponse.json();
                      const validatedCard = validateCard(cardData);
                      if (validatedCard) {
                        // Cache individual card
                        setCachedResults(individualCacheKey, [validatedCard]);
                        return validatedCard;
                      }
                    }
                  } catch (e) {
                    console.warn("Failed to fetch card:", name, e);
                    return null;
                  }
                  return null;
                }),
              );

              const validCards = sampleCards.filter(
                (card) => card !== null,
              ) as ScryfallCard[];
              filteredNames = validCards
                .filter((card) => {
                  const typeLine = (card.type_line || "").toLowerCase();
                  switch (typeFilter) {
                    case "lands":
                      return typeLine.includes("land");
                    case "creatures":
                      return typeLine.includes("creature");
                    case "instants":
                      return typeLine.includes("instant");
                    case "sorceries":
                      return typeLine.includes("sorcery");
                    case "enchantments":
                      return typeLine.includes("enchantment");
                    case "artifacts":
                      return typeLine.includes("artifact");
                    case "planeswalkers":
                      return typeLine.includes("planeswalker");
                    default:
                      return true;
                  }
                })
                .map((card) => card.name);
            }

            // Fetch full card data for the filtered names
            const cardPromises = filteredNames
              .slice(0, 10)
              .map(async (name: string) => {
                try {
                  // Check individual cache first
                  const individualCacheKey = getCacheKey(name, "all");
                  const cachedCard = getCachedResults(individualCacheKey);
                  if (cachedCard && cachedCard.length > 0) {
                    return cachedCard[0];
                  }

                  const cardResponse = await fetch(
                    `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
                  );
                  if (cardResponse.ok) {
                    const cardData = await cardResponse.json();
                    const validatedCard = validateCard(cardData);
                    if (validatedCard) {
                      // Cache individual card
                      setCachedResults(individualCacheKey, [validatedCard]);
                      return validatedCard;
                    }
                  }
                } catch (e) {
                  console.warn("Failed to fetch card:", name, e);
                  return null;
                }
                return null;
              });

            const cardResults = await Promise.all(cardPromises);
            results = cardResults.filter(
              (card) => card !== null,
            ) as ScryfallCard[];
          }
        } catch {
          console.log("Autocomplete failed, falling back to search");
        }
      }

      // If autocomplete didn't work or didn't return enough results, use regular search
      if (results.length < 5) {
        // Build search query with type filter
        let searchUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}`;

        if (typeFilter !== "all") {
          searchUrl += `+${typeQueries[typeFilter as keyof typeof typeQueries]}`;
        }

        searchUrl += "&order=name&unique=cards";

        try {
          const searchResponse = await fetch(searchUrl);

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const additionalResults = (searchData.data || [])
              .map(validateCard)
              .filter((card: ScryfallCard | null) => card !== null)
              .slice(0, 10 - results.length) as ScryfallCard[];

            // Merge results, avoiding duplicates
            const existingNames = new Set(results.map((card) => card.name));
            const newResults = additionalResults.filter(
              (card) => !existingNames.has(card.name),
            );
            results = [...results, ...newResults];
          }
        } catch {
          console.log("Search failed");
        }
      }

      if (results.length === 0) {
        setError("No cards found");
      } else {
        // Cache the results
        setCachedResults(cacheKey, results.slice(0, 10));
        setResults(results.slice(0, 10));
        setIsOpen(true);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search cards");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCards(value);
    }, 300);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    if (query.length >= 1) {
      searchCards(query);
    }
  };

  const handleCardSelect = (card: ScryfallCard) => {
    onCardSelect(card);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const getCardTypeIcon = (typeLine?: string) => {
    if (!typeLine || typeof typeLine !== "string")
      return <Gamepad2 className="w-4 h-4" />;

    const typeLineLower = typeLine.toLowerCase();
    if (typeLineLower.includes("land"))
      return <Mountain className="w-4 h-4 text-amber-700" />;
    if (typeLineLower.includes("creature"))
      return <Star className="w-4 h-4 text-green-600" />;
    if (typeLineLower.includes("instant"))
      return <Zap className="w-4 h-4 text-blue-600" />;
    if (typeLineLower.includes("sorcery"))
      return <Sparkles className="w-4 h-4 text-purple-600" />;
    if (typeLineLower.includes("enchantment"))
      return <Sparkles className="w-4 h-4 text-purple-600" />;
    if (typeLineLower.includes("artifact"))
      return <Settings className="w-4 h-4 text-gray-600" />;
    if (typeLineLower.includes("planeswalker"))
      return <Crown className="w-4 h-4 text-yellow-600" />;
    return <Gamepad2 className="w-4 h-4" />;
  };

  return (
    <div ref={searchRef} className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 bg-background"
            onFocus={() =>
              query.length >= 1 && results.length > 0 && setIsOpen(true)
            }
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 animate-spin" />
          )}
        </div>

        <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                All Types
              </div>
            </SelectItem>
            <SelectItem value="lands">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4" />
                Lands
              </div>
            </SelectItem>
            <SelectItem value="creatures">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Creatures
              </div>
            </SelectItem>
            <SelectItem value="instants">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Instants
              </div>
            </SelectItem>
            <SelectItem value="sorceries">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Sorceries
              </div>
            </SelectItem>
            <SelectItem value="enchantments">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Enchantments
              </div>
            </SelectItem>
            <SelectItem value="artifacts">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Artifacts
              </div>
            </SelectItem>
            <SelectItem value="planeswalkers">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Planeswalkers
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isOpen && (results.length > 0 || error) && (
        <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border bg-popover">
          {error ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {error}
            </div>
          ) : (
            <div className="py-1">
              {results.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardSelect(card)}
                  className="w-full px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">
                        {getCardTypeIcon(card.type_line)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-foreground">
                          {card.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {card.type_line || "Unknown Type"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {card.mana_cost && (
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {card.mana_cost}
                        </span>
                      )}
                      {card.power && card.toughness && (
                        <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          {card.power}/{card.toughness}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
