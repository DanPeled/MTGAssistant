"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  Loader2,
  Hand,
  ImageIcon,
} from "lucide-react";
import { HandFilters } from "@/components/hand-filters";
import { CardSearch } from "@/components/card-search";
import { Label } from "@/components/ui/label";
import {
  LandIcon,
  CreatureIcon,
  SpellIcon,
  ArtifactIcon,
  EnchantmentIcon,
  PlaneswalkerIcon,
  getAbilityIcons,
} from "@/components/mtg-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManaCost } from "@/components/mtg-icons";

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
}

interface DetailedCard {
  name: string;
  mana_cost?: string;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  cmc?: number;
  rarity?: string;
  set_name?: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
  };
  prices?: {
    usd?: string;
  };
}

interface HandDisplayProps {
  cards: string[];
  onCardSelect: (card: ScryfallCard) => void;
  onRemoveCard: (index: number) => void;
  isCompact?: boolean;
  showSearch?: boolean;
}

// Global cache for card details
const cardDetailsCache = new Map<string, DetailedCard>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const cacheTimestamps = new Map<string, number>();

export function HandDisplay({
  cards,
  onCardSelect,
  onRemoveCard,
  isCompact = false,
  showSearch = true,
}: HandDisplayProps) {
  const [filteredCards, setFilteredCards] = useState<string[]>(cards);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "buttons">(
    "buttons",
  );
  const [isVisible, setIsVisible] = useState(!isCompact);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState<DetailedCard | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  React.useEffect(() => {
    setFilteredCards(cards);
  }, [cards]);

  const getCardIcon = (cardName: string) => {
    const cardLower = cardName.toLowerCase();
    if (
      cardLower.includes("land") ||
      cardLower.includes("plains") ||
      cardLower.includes("island") ||
      cardLower.includes("swamp") ||
      cardLower.includes("mountain") ||
      cardLower.includes("forest")
    )
      return <LandIcon className="w-4 h-4" />;
    if (cardLower.includes("creature"))
      return <CreatureIcon className="w-4 h-4" />;
    if (cardLower.includes("instant") || cardLower.includes("sorcery"))
      return <SpellIcon className="w-4 h-4" />;
    if (cardLower.includes("enchantment"))
      return <EnchantmentIcon className="w-4 h-4" />;
    if (cardLower.includes("artifact"))
      return <ArtifactIcon className="w-4 h-4" />;
    if (cardLower.includes("planeswalker"))
      return <PlaneswalkerIcon className="w-4 h-4" />;
    return <SpellIcon className="w-4 h-4" />;
  };

  const parseManaCost = (cardName: string): string => {
    const cardLower = cardName.toLowerCase();

    // Basic lands cost 0
    if (
      cardLower.includes("plains") ||
      cardLower.includes("island") ||
      cardLower.includes("swamp") ||
      cardLower.includes("mountain") ||
      cardLower.includes("forest") ||
      (cardLower.includes("land") && !cardLower.includes("wasteland"))
    ) {
      return "";
    }

    // Specific well-known cards with exact costs
    const knownCards: Record<string, string> = {
      "lightning bolt": "{R}",
      counterspell: "{U}{U}",
      "swords to plowshares": "{W}",
      "path to exile": "{W}",
      "dark ritual": "{B}",
      "giant growth": "{G}",
      "rampant growth": "{1}{G}",
      "llanowar elves": "{G}",
      "birds of paradise": "{G}",
      "sol ring": "{1}",
      "mana crypt": "{0}",
      "black lotus": "{0}",
      "ancestral recall": "{U}",
      divination: "{2}{U}",
      shock: "{R}",
      "doom blade": "{1}{B}",
    };

    if (knownCards[cardLower]) {
      return knownCards[cardLower];
    }

    // Estimate costs based on card names and types
    if (cardLower.includes("dragon") || cardLower.includes("angel")) {
      if (cardLower.includes("red") || cardLower.includes("fire"))
        return "{4}{R}";
      if (cardLower.includes("white") || cardLower.includes("serra"))
        return "{4}{W}";
      return "{5}";
    } else if (cardLower.includes("knight") || cardLower.includes("soldier")) {
      return "{1}{W}";
    } else if (cardLower.includes("goblin") || cardLower.includes("orc")) {
      return "{1}{R}";
    } else if (cardLower.includes("elf") || cardLower.includes("beast")) {
      return "{1}{G}";
    } else if (cardLower.includes("wizard") || cardLower.includes("merfolk")) {
      return "{1}{U}";
    } else if (cardLower.includes("zombie") || cardLower.includes("demon")) {
      return "{2}{B}";
    } else if (cardLower.includes("artifact")) {
      return "{3}";
    } else {
      // Default estimates based on card type
      if (cardLower.includes("instant") || cardLower.includes("sorcery"))
        return "{2}";
      else if (cardLower.includes("creature")) return "{2}";
      else if (cardLower.includes("enchantment")) return "{2}";
      else return "{1}";
    }
  };

  const getCardStats = (cardName: string) => {
    const cardLower = cardName.toLowerCase();

    // Estimate power/toughness for creatures
    let power = null;
    let toughness = null;

    if (
      cardLower.includes("creature") ||
      cardLower.includes("dragon") ||
      cardLower.includes("knight") ||
      cardLower.includes("goblin") ||
      cardLower.includes("elf")
    ) {
      if (cardLower.includes("dragon")) {
        power = 4;
        toughness = 4;
      } else if (cardLower.includes("angel")) {
        power = 3;
        toughness = 4;
      } else if (cardLower.includes("knight")) {
        power = 2;
        toughness = 2;
      } else if (cardLower.includes("goblin")) {
        power = 1;
        toughness = 1;
      } else if (cardLower.includes("elf")) {
        power = 1;
        toughness = 1;
      } else if (cardLower.includes("llanowar elves")) {
        power = 1;
        toughness = 1;
      } else if (cardLower.includes("birds of paradise")) {
        power = 0;
        toughness = 1;
      } else {
        power = 2;
        toughness = 2;
      }
    }

    return { power, toughness };
  };

  const getCardType = (cardName: string): string => {
    const cardLower = cardName.toLowerCase();

    if (
      cardLower.includes("land") ||
      cardLower.includes("plains") ||
      cardLower.includes("island") ||
      cardLower.includes("swamp") ||
      cardLower.includes("mountain") ||
      cardLower.includes("forest")
    ) {
      return "Land";
    }
    if (cardLower.includes("creature")) return "Creature";
    if (cardLower.includes("instant")) return "Instant";
    if (cardLower.includes("sorcery")) return "Sorcery";
    if (cardLower.includes("enchantment")) return "Enchantment";
    if (cardLower.includes("artifact")) return "Artifact";
    if (cardLower.includes("planeswalker")) return "Planeswalker";

    // Guess based on card name
    if (
      cardLower.includes("dragon") ||
      cardLower.includes("knight") ||
      cardLower.includes("goblin") ||
      cardLower.includes("elf")
    ) {
      return "Creature";
    }
    if (cardLower.includes("bolt") || cardLower.includes("shock")) {
      return "Instant";
    }

    return "Spell";
  };

  // Enhanced cache management
  const isCacheValid = (cardName: string): boolean => {
    const timestamp = cacheTimestamps.get(cardName);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  };

  const setCachedCard = (cardName: string, data: DetailedCard) => {
    cardDetailsCache.set(cardName, data);
    cacheTimestamps.set(cardName, Date.now());
  };

  const getCachedCard = (cardName: string): DetailedCard | null => {
    if (isCacheValid(cardName)) {
      return cardDetailsCache.get(cardName) || null;
    }
    // Clean up expired cache entry
    cardDetailsCache.delete(cardName);
    cacheTimestamps.delete(cardName);
    return null;
  };

  // Enhanced fetch function with caching
  const fetchCardDetails = async (cardName: string) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    setImageLoading(true);

    // Check cache first
    const cachedCard = getCachedCard(cardName);
    if (cachedCard) {
      setCardDetails(cachedCard);
      setIsLoadingDetails(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`,
      );

      if (!response.ok) {
        throw new Error("Card not found");
      }

      const data = await response.json();
      setCachedCard(cardName, data);
      setCardDetails(data);
    } catch (error) {
      console.error("Error fetching card details:", error);
      setDetailsError("Failed to load card details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Update the card selection handler
  const handleCardSelect = (card: string) => {
    setSelectedCard(card);
    setCardDetails(null);
    setImageLoading(true);
    fetchCardDetails(card);
  };

  const renderCards = () => {
    if (filteredCards.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Hand className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No cards in hand</p>
        </div>
      );
    }

    switch (viewMode) {
      case "grid":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCards.map((card) => {
              const originalIndex = cards.indexOf(card);
              const manaCost = parseManaCost(card);
              const cardType = getCardType(card);
              const stats = getCardStats(card);

              return (
                <Card
                  key={`${card}-${originalIndex}`}
                  className="p-3 hover:shadow-md transition-all hover:scale-105 bg-gradient-to-br from-card to-muted/20"
                >
                  <div className="space-y-2">
                    {/* Header with icon and mana cost */}
                    <div className="flex items-center justify-between">
                      {getCardIcon(card)}
                      {manaCost && (
                        <ManaCost
                          cost={manaCost}
                          className="flex items-center gap-0.5"
                        />
                      )}
                    </div>

                    {/* Card name */}
                    <h4 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                      {card}
                    </h4>

                    {/* Type and stats */}
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {cardType}
                      </Badge>
                      {stats.power !== null && stats.toughness !== null && (
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="secondary"
                            className="text-xs font-mono"
                          >
                            {stats.power}/{stats.toughness}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-7 bg-transparent"
                        onClick={() => handleCardSelect(card)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => onRemoveCard(originalIndex)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case "list":
        return (
          <div className="space-y-2">
            {filteredCards.map((card) => {
              const originalIndex = cards.indexOf(card);
              const manaCost = parseManaCost(card);
              const cardType = getCardType(card);
              const stats = getCardStats(card);

              return (
                <Card
                  key={`${card}-${originalIndex}`}
                  className="p-3 hover:shadow-sm transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getCardIcon(card)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{card}</span>
                          {manaCost && (
                            <ManaCost
                              cost={manaCost}
                              className="flex items-center gap-0.5"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {cardType}
                          </Badge>
                          {stats.power !== null && stats.toughness !== null && (
                            <Badge
                              variant="secondary"
                              className="text-xs font-mono"
                            >
                              {stats.power}/{stats.toughness}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCardSelect(card)}
                        className="text-xs"
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveCard(originalIndex)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case "buttons":
      default:
        return (
          <div className="flex flex-wrap gap-2">
            {filteredCards.map((card) => {
              const originalIndex = cards.indexOf(card);
              const manaCost = parseManaCost(card);

              return (
                <div
                  key={`${card}-${originalIndex}`}
                  className="relative group"
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-2 py-2 px-3 hover:bg-secondary/80 transition-colors cursor-pointer"
                    onClick={() => handleCardSelect(card)}
                  >
                    {getCardIcon(card)}
                    <span className="text-sm font-medium">{card}</span>
                    {manaCost && (
                      <ManaCost
                        cost={manaCost}
                        className="flex items-center gap-0.5 ml-1"
                      />
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCard(originalIndex);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        );
    }
  };

  if (isCompact) {
    return (
      <Card className="p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Your Hand</h4>
            <Badge variant="outline" className="text-xs">
              {cards.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={viewMode}
              onValueChange={(value: "list" | "grid" | "buttons") =>
                setViewMode(value)
              }
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buttons">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-current rounded-sm" />
                    Tags
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-1">
                    <List className="w-3 h-3" />
                    List
                  </div>
                </SelectItem>
                <SelectItem value="grid">
                  <div className="flex items-center gap-1">
                    <Grid3X3 className="w-3 h-3" />
                    Grid
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="h-8 w-8 p-0"
            >
              {isVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {isVisible && (
          <div className="space-y-3">
            {cards.length > 0 && (
              <HandFilters cards={cards} onFilteredCards={setFilteredCards} />
            )}
            {renderCards()}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hand className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">Your Hand</h3>
          <Badge variant="outline">{cards.length} / 7</Badge>
        </div>
        <Select
          value={viewMode}
          onValueChange={(value: "list" | "grid" | "buttons") =>
            setViewMode(value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buttons">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-current rounded-sm" />
                Button Tags
              </div>
            </SelectItem>
            <SelectItem value="list">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                List View
              </div>
            </SelectItem>
            <SelectItem value="grid">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Grid View
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showSearch && (
        <div className="mb-4">
          <Label className="mb-2 block">Search and Add Cards</Label>
          <CardSearch
            onCardSelect={onCardSelect}
            placeholder="Search any Magic card..."
            className="w-full"
          />
        </div>
      )}

      {cards.length > 0 && (
        <div className="mb-4">
          <HandFilters cards={cards} onFilteredCards={setFilteredCards} />
        </div>
      )}

      {renderCards()}

      {/* Enhanced Card Details Modal */}
      <Dialog
        open={selectedCard !== null}
        onOpenChange={() => {
          setSelectedCard(null);
          setCardDetails(null);
          setDetailsError(null);
          setImageLoading(true);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCard && getCardIcon(selectedCard)}
              {selectedCard}
              {getCachedCard(selectedCard || "") && (
                <Badge variant="outline" className="text-xs">
                  Cached
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-6">
              {/* Loading state for initial data fetch */}
              {isLoadingDetails && !cardDetails && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 mr-3" />
                  <span className="text-lg">Loading card details...</span>
                </div>
              )}

              {/* Error state */}
              {detailsError && !cardDetails && (
                <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive font-medium">{detailsError}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing estimated information based on card name.
                  </p>
                </div>
              )}

              {/* Card content - shows immediately when modal opens */}
              {(cardDetails || (!isLoadingDetails && !cardDetails)) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card Image Container */}
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-sm">
                      {cardDetails?.image_uris?.normal ? (
                        <div className="relative">
                          {imageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                              <Loader2 className="animate-spin h-8 w-8" />
                            </div>
                          )}
                          <img
                            src={
                              cardDetails.image_uris.normal ||
                              "/placeholder.svg"
                            }
                            alt={cardDetails.name}
                            className={`rounded-lg shadow-lg w-full h-auto transition-opacity duration-300 ${
                              imageLoading ? "opacity-0" : "opacity-100"
                            }`}
                            onLoad={() => setImageLoading(false)}
                            onError={() => setImageLoading(false)}
                          />
                        </div>
                      ) : (
                        <div className="aspect-[5/7] bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No image available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Information */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      <Badge variant="outline">
                        {cardDetails?.type_line || getCardType(selectedCard)}
                      </Badge>
                    </div>

                    {(cardDetails?.mana_cost ||
                      parseManaCost(selectedCard)) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mana Cost:</span>
                        <ManaCost
                          cost={
                            cardDetails?.mana_cost ||
                            parseManaCost(selectedCard)
                          }
                        />
                      </div>
                    )}

                    {cardDetails?.cmc !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mana Value:</span>
                        <Badge variant="secondary">{cardDetails.cmc}</Badge>
                      </div>
                    )}

                    {(cardDetails?.power && cardDetails?.toughness) ||
                      (getCardStats(selectedCard).power !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Power/Toughness:
                          </span>
                          <Badge variant="secondary" className="font-mono">
                            {cardDetails?.power ||
                              getCardStats(selectedCard).power}
                            /
                            {cardDetails?.toughness ||
                              getCardStats(selectedCard).toughness}
                          </Badge>
                        </div>
                      ))}

                    {cardDetails?.rarity && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rarity:</span>
                        <Badge
                          variant={
                            cardDetails.rarity === "mythic"
                              ? "destructive"
                              : cardDetails.rarity === "rare"
                                ? "default"
                                : cardDetails.rarity === "uncommon"
                                  ? "secondary"
                                  : "outline"
                          }
                          className="capitalize"
                        >
                          {cardDetails.rarity}
                        </Badge>
                      </div>
                    )}

                    {cardDetails?.set_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Set:</span>
                        <span className="text-sm text-muted-foreground">
                          {cardDetails.set_name}
                        </span>
                      </div>
                    )}

                    {cardDetails?.prices?.usd && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Price:</span>
                        <span className="text-sm font-mono">
                          ${cardDetails.prices.usd}
                        </span>
                      </div>
                    )}

                    {/* Abilities Icons */}
                    {cardDetails?.oracle_text && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Abilities:</span>
                        <div className="flex flex-wrap gap-2">
                          {getAbilityIcons(cardDetails.oracle_text).map(
                            (ability, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 p-1 bg-muted rounded"
                              >
                                {ability.icon}
                                <span className="text-xs">{ability.name}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Oracle Text */}
              {cardDetails?.oracle_text && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Rules Text:</h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {cardDetails.oracle_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setSelectedCard(null);
                    setCardDetails(null);
                    setDetailsError(null);
                    setImageLoading(true);
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    const index = cards.indexOf(selectedCard);
                    if (index !== -1) {
                      onRemoveCard(index);
                      setSelectedCard(null);
                      setCardDetails(null);
                      setDetailsError(null);
                      setImageLoading(true);
                    }
                  }}
                >
                  Remove from Hand
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
