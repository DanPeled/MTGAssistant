"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Sword,
  Shield,
  Zap,
  Settings,
  Plus,
  Users,
  Target,
  Gamepad2,
} from "lucide-react";
import { CardSearch } from "@/components/card-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { HandDisplay } from "@/components/hand-display";
import {
  WhiteMana,
  BlueMana,
  BlackMana,
  RedMana,
  GreenMana,
  ColorlessMana,
  PhaseIcon,
  LifeIcon,
  CreatureIcon,
  SpellIcon,
  HandIcon,
  BattlefieldIcon,
} from "@/components/mtg-icons";

interface ManaCount {
  white: number;
  blue: number;
  black: number;
  red: number;
  green: number;
  colorless: number;
}

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

interface Creature {
  id: string;
  name: string;
  power: number;
  toughness: number;
  tapped: boolean;
  summingSickness: boolean;
  abilities?: string[];
  manaCost?: string;
  typeLine?: string;
}

interface GameState {
  playerLife: number;
  opponentLife: number;
  playerHand: string[];
  playerCreatures: Creature[];
  opponentCreatures: Creature[];
  availableMana: ManaCount;
  currentPhase: string;
}

interface Recommendation {
  type: "cast" | "attack" | "block";
  action: string;
  priority: number;
  explanation: string;
  icon: ReactNode;
}

interface PlayableCard {
  name: string;
  cost: {
    total: number;
    colors: string[];
    specific: Record<string, number>;
  };
  abilities: string[];
}

const PHASES = [
  "Beginning",
  "Main Phase 1",
  "Combat - Declare Attackers",
  "Combat - Declare Blockers",
  "Combat - Damage",
  "Main Phase 2",
  "End Step",
];

const MANA_COMPONENTS = {
  white: WhiteMana,
  blue: BlueMana,
  black: BlackMana,
  red: RedMana,
  green: GreenMana,
  colorless: ColorlessMana,
};

export default function MTGAssistant() {
  const [gameState, setGameState] = useState<GameState>({
    playerLife: 20,
    opponentLife: 20,
    playerHand: [],
    playerCreatures: [],
    opponentCreatures: [],
    availableMana: {
      white: 0,
      blue: 0,
      black: 0,
      red: 0,
      green: 0,
      colorless: 0,
    },
    currentPhase: "Main Phase 1",
  });

  const [newCreature, setNewCreature] = useState({
    name: "",
    power: 1,
    toughness: 1,
    tapped: false,
    summingSickness: true,
  });

  const handleHandCardSelect = (card: ScryfallCard) => {
    setGameState((prev) => ({
      ...prev,
      playerHand: [...prev.playerHand, card.name],
    }));
  };

  const handleCreatureCardSelect = (card: ScryfallCard) => {
    if (card.type_line.toLowerCase().includes("creature")) {
      setNewCreature({
        name: card.name,
        power: Number.parseInt(card.power || "1"),
        toughness: Number.parseInt(card.toughness || "1"),
        tapped: false,
        summingSickness: true,
      });
    } else {
      setNewCreature((prev) => ({
        ...prev,
        name: card.name,
      }));
    }
  };

  const removeHandCard = (index: number) => {
    setGameState((prev) => ({
      ...prev,
      playerHand: prev.playerHand.filter((_, i) => i !== index),
    }));
  };

  const addCreature = (isPlayer: boolean) => {
    if (newCreature.name.trim()) {
      const creature: Creature = {
        id: Date.now().toString(),
        ...newCreature,
        name: newCreature.name.trim(),
      };

      setGameState((prev) => ({
        ...prev,
        [isPlayer ? "playerCreatures" : "opponentCreatures"]: [
          ...prev[isPlayer ? "playerCreatures" : "opponentCreatures"],
          creature,
        ],
      }));

      setNewCreature({
        name: "",
        power: 1,
        toughness: 1,
        tapped: false,
        summingSickness: true,
      });
    }
  };

  const removeCreature = (id: string, isPlayer: boolean) => {
    setGameState((prev) => ({
      ...prev,
      [isPlayer ? "playerCreatures" : "opponentCreatures"]: prev[
        isPlayer ? "playerCreatures" : "opponentCreatures"
      ].filter((c) => c.id !== id),
    }));
  };

  const toggleCreatureTapped = (id: string, isPlayer: boolean) => {
    setGameState((prev) => ({
      ...prev,
      [isPlayer ? "playerCreatures" : "opponentCreatures"]: prev[
        isPlayer ? "playerCreatures" : "opponentCreatures"
      ].map((c) => (c.id === id ? { ...c, tapped: !c.tapped } : c)),
    }));
  };

  const parseManaCost = (
    cardName: string,
  ): { total: number; colors: string[]; specific: Record<string, number> } => {
    const cardLower = cardName.toLowerCase();
    let total = 1;
    const colors: string[] = [];
    const specific: Record<string, number> = {
      W: 0,
      U: 0,
      B: 0,
      R: 0,
      G: 0,
      C: 0,
    };

    // Basic lands cost 0
    if (
      cardLower.includes("plains") ||
      cardLower.includes("island") ||
      cardLower.includes("swamp") ||
      cardLower.includes("mountain") ||
      cardLower.includes("forest") ||
      (cardLower.includes("land") && !cardLower.includes("wasteland"))
    ) {
      return { total: 0, colors: [], specific };
    }

    // Specific well-known cards with exact costs
    const knownCards: Record<
      string,
      { total: number; colors: string[]; specific: Record<string, number> }
    > = {
      "lightning bolt": {
        total: 1,
        colors: ["R"],
        specific: { ...specific, R: 1 },
      },
      counterspell: {
        total: 2,
        colors: ["U"],
        specific: { ...specific, U: 2 },
      },
      "swords to plowshares": {
        total: 1,
        colors: ["W"],
        specific: { ...specific, W: 1 },
      },
      "path to exile": {
        total: 1,
        colors: ["W"],
        specific: { ...specific, W: 1 },
      },
      "dark ritual": {
        total: 1,
        colors: ["B"],
        specific: { ...specific, B: 1 },
      },
      "giant growth": {
        total: 1,
        colors: ["G"],
        specific: { ...specific, G: 1 },
      },
      "rampant growth": {
        total: 2,
        colors: ["G"],
        specific: { ...specific, G: 1, C: 1 },
      },
      "llanowar elves": {
        total: 1,
        colors: ["G"],
        specific: { ...specific, G: 1 },
      },
      "birds of paradise": {
        total: 1,
        colors: ["G"],
        specific: { ...specific, G: 1 },
      },
      "sol ring": { total: 1, colors: [], specific: { ...specific, C: 1 } },
      "mana crypt": { total: 0, colors: [], specific },
      "black lotus": { total: 0, colors: [], specific },
      "ancestral recall": {
        total: 1,
        colors: ["U"],
        specific: { ...specific, U: 1 },
      },
      divination: {
        total: 3,
        colors: ["U"],
        specific: { ...specific, U: 1, C: 2 },
      },
      shock: { total: 1, colors: ["R"], specific: { ...specific, R: 1 } },
      "doom blade": {
        total: 2,
        colors: ["B"],
        specific: { ...specific, B: 1, C: 1 },
      },
    };

    if (knownCards[cardLower]) {
      return knownCards[cardLower];
    }

    // Estimate costs based on card names and types
    if (cardLower.includes("dragon") || cardLower.includes("angel")) {
      total = 5;
      if (cardLower.includes("red") || cardLower.includes("fire"))
        colors.push("R");
      if (cardLower.includes("white") || cardLower.includes("serra"))
        colors.push("W");
    } else if (cardLower.includes("knight") || cardLower.includes("soldier")) {
      total = 2;
      colors.push("W");
    } else if (cardLower.includes("goblin") || cardLower.includes("orc")) {
      total = 2;
      colors.push("R");
    } else if (cardLower.includes("elf") || cardLower.includes("beast")) {
      total = 2;
      colors.push("G");
    } else if (cardLower.includes("wizard") || cardLower.includes("merfolk")) {
      total = 2;
      colors.push("U");
    } else if (cardLower.includes("zombie") || cardLower.includes("demon")) {
      total = 3;
      colors.push("B");
    } else if (cardLower.includes("artifact")) {
      total = 3;
      specific.C = 3;
    } else {
      // Default estimates based on card type
      if (cardLower.includes("instant") || cardLower.includes("sorcery"))
        total = 2;
      else if (cardLower.includes("creature")) total = 3;
      else if (cardLower.includes("enchantment")) total = 3;
      else total = 2;
    }

    return { total, colors, specific };
  };

  const getManaProduction = (
    cardName: string,
  ): { colors: string[]; amount: number; conditions?: string } => {
    const cardLower = cardName.toLowerCase();

    // Basic lands
    if (cardLower.includes("plains")) return { colors: ["W"], amount: 1 };
    if (cardLower.includes("island")) return { colors: ["U"], amount: 1 };
    if (cardLower.includes("swamp")) return { colors: ["B"], amount: 1 };
    if (cardLower.includes("mountain")) return { colors: ["R"], amount: 1 };
    if (cardLower.includes("forest")) return { colors: ["G"], amount: 1 };

    // Mana-producing creatures
    if (
      cardLower.includes("llanowar elves") ||
      cardLower.includes("elvish mystic")
    ) {
      return { colors: ["G"], amount: 1, conditions: "Tap this creature" };
    }
    if (cardLower.includes("birds of paradise")) {
      return {
        colors: ["W", "U", "B", "R", "G"],
        amount: 1,
        conditions: "Tap this creature",
      };
    }
    if (cardLower.includes("noble hierarch")) {
      return {
        colors: ["W", "U", "G"],
        amount: 1,
        conditions: "Tap this creature",
      };
    }

    // Mana artifacts
    if (cardLower.includes("sol ring")) {
      return { colors: ["C"], amount: 2, conditions: "Tap this artifact" };
    }
    if (cardLower.includes("mana crypt")) {
      return {
        colors: ["C"],
        amount: 2,
        conditions: "Tap, flip coin (may take damage)",
      };
    }
    if (cardLower.includes("black lotus")) {
      return {
        colors: ["W", "U", "B", "R", "G"],
        amount: 3,
        conditions: "Sacrifice this artifact",
      };
    }
    if (cardLower.includes("mox")) {
      return { colors: ["C"], amount: 1, conditions: "Tap this artifact" };
    }

    // Ramp spells
    if (
      cardLower.includes("rampant growth") ||
      cardLower.includes("cultivate")
    ) {
      return {
        colors: ["Any"],
        amount: 1,
        conditions: "Search for basic land, put into play",
      };
    }
    if (cardLower.includes("dark ritual")) {
      return {
        colors: ["B"],
        amount: 3,
        conditions: "Add BBB to mana pool this turn only",
      };
    }
    if (cardLower.includes("ritual")) {
      return {
        colors: ["R", "B"],
        amount: 2,
        conditions: "Temporary mana this turn only",
      };
    }

    // Dual lands and special lands
    if (
      cardLower.includes("dual") ||
      (cardLower.includes("shock") && cardLower.includes("land"))
    ) {
      return {
        colors: ["W", "U", "B", "R", "G"],
        amount: 1,
        conditions: "Choose one color",
      };
    }
    if (cardLower.includes("command tower")) {
      return {
        colors: ["W", "U", "B", "R", "G"],
        amount: 1,
        conditions: "Any color in your commander's identity",
      };
    }

    // Generic land detection
    if (cardLower.includes("land") && !cardLower.includes("wasteland")) {
      return { colors: ["C"], amount: 1 };
    }

    return { colors: [], amount: 0 };
  };

  const getCardAbilities = (cardName: string): string[] => {
    const cardLower = cardName.toLowerCase();
    const abilities: string[] = [];

    // Mana abilities
    const manaProduction = getManaProduction(cardName);
    if (manaProduction.amount > 0) {
      const colorText =
        manaProduction.colors.length > 3
          ? "any color"
          : manaProduction.colors.join("/");
      abilities.push(
        `Produces ${manaProduction.amount} ${colorText} mana${manaProduction.conditions ? ` (${manaProduction.conditions})` : ""}`,
      );
    }

    // Combat keywords
    if (
      cardLower.includes("flying") ||
      cardLower.includes("dragon") ||
      cardLower.includes("angel")
    )
      abilities.push("Flying");
    if (
      cardLower.includes("trample") ||
      cardLower.includes("beast") ||
      cardLower.includes("giant")
    )
      abilities.push("Trample");
    if (
      cardLower.includes("haste") ||
      cardLower.includes("goblin") ||
      cardLower.includes("lightning")
    )
      abilities.push("Haste");
    if (
      cardLower.includes("vigilance") ||
      cardLower.includes("knight") ||
      cardLower.includes("soldier")
    )
      abilities.push("Vigilance");
    if (
      cardLower.includes("lifelink") ||
      cardLower.includes("angel") ||
      cardLower.includes("cleric")
    )
      abilities.push("Lifelink");
    if (
      cardLower.includes("deathtouch") ||
      cardLower.includes("assassin") ||
      cardLower.includes("spider")
    )
      abilities.push("Deathtouch");
    if (
      cardLower.includes("first strike") ||
      cardLower.includes("knight") ||
      cardLower.includes("warrior")
    )
      abilities.push("First Strike");
    if (
      cardLower.includes("hexproof") ||
      cardLower.includes("troll") ||
      cardLower.includes("spirit")
    )
      abilities.push("Hexproof");
    if (
      cardLower.includes("indestructible") ||
      cardLower.includes("god") ||
      cardLower.includes("avatar")
    )
      abilities.push("Indestructible");

    // Spell effects with detailed descriptions
    if (
      cardLower.includes("destroy") ||
      cardLower.includes("kill") ||
      cardLower.includes("doom")
    )
      abilities.push("Destroy target creature/permanent");
    if (cardLower.includes("counter") || cardLower.includes("negate"))
      abilities.push("Counter target spell");
    if (cardLower.includes("draw") || cardLower.includes("divination"))
      abilities.push("Draw cards");
    if (
      cardLower.includes("damage") ||
      cardLower.includes("bolt") ||
      cardLower.includes("shock")
    )
      abilities.push("Deal damage to any target");
    if (cardLower.includes("gain") && cardLower.includes("life"))
      abilities.push("Gain life");
    if (cardLower.includes("search") || cardLower.includes("tutor"))
      abilities.push("Search library for cards");
    if (cardLower.includes("exile") || cardLower.includes("path"))
      abilities.push("Exile target permanent");

    // Specific powerful effects
    if (cardLower.includes("ancestral recall"))
      abilities.push("Draw 3 cards for 1 mana");
    if (cardLower.includes("time walk")) abilities.push("Take an extra turn");
    if (cardLower.includes("lightning bolt"))
      abilities.push("3 damage to any target");
    if (cardLower.includes("swords to plowshares"))
      abilities.push("Exile creature, opponent gains life equal to power");
    if (cardLower.includes("dark ritual"))
      abilities.push("Add BBB to mana pool");
    if (cardLower.includes("giant growth"))
      abilities.push("Target creature gets +3/+3 until end of turn");

    return abilities;
  };

  // Add this new function to calculate total available mana including mana-producing cards
  const calculateTotalAvailableMana = (): {
    total: number;
    breakdown: Record<string, number>;
    sources: string[];
  } => {
    let total = Object.values(gameState.availableMana).reduce(
      (sum, mana) => sum + mana,
      0,
    );
    const breakdown = { ...gameState.availableMana };
    const sources: string[] = [];

    // Add mana from untapped creatures and artifacts in hand/battlefield
    gameState.playerCreatures.forEach((creature) => {
      if (!creature.tapped) {
        const manaProduction = getManaProduction(creature.name);
        if (manaProduction.amount > 0) {
          total += manaProduction.amount;
          sources.push(`${creature.name} (+${manaProduction.amount})`);
        }
      }
    });

    // Check for mana-producing spells in hand
    gameState.playerHand.forEach((card) => {
      const manaProduction = getManaProduction(card);
      if (manaProduction.amount > 0) {
        const cost = parseManaCost(card);
        if (cost.total <= total) {
          // Can afford to cast it
          total += manaProduction.amount - cost.total;
          sources.push(`${card} (net +${manaProduction.amount - cost.total})`);
        }
      }
    });

    return { total, breakdown, sources };
  };

  const getPlayableCards = (): PlayableCard[] => {
    return gameState.playerHand
      .map((cardName) => {
        const cost = parseManaCost(cardName);
        const abilities = getCardAbilities(cardName);
        return {
          name: cardName,
          cost: cost,
          abilities: abilities,
        };
      })
      .filter((card) => canAffordCard(card.name));
  };

  const canAffordCard = (cardName: string): boolean => {
    const cost = parseManaCost(cardName);
    const totalAvailableMana = Object.values(gameState.availableMana).reduce(
      (sum, mana) => sum + mana,
      0,
    );

    // Check if enough generic mana is available
    if (totalAvailableMana < cost.total) {
      return false;
    }

    // Check if enough specific colored mana is available
    const availableColors: ManaCount = { ...gameState.availableMana };
    for (const color in cost.specific) {
      if (availableColors[color] < cost.specific[color]) {
        return false;
      }
    }

    return true;
  };

  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    const baseMana = Object.values(gameState.availableMana).reduce(
      (sum, mana) => sum + mana,
      0,
    );
    const manaAnalysis = calculateTotalAvailableMana();
    const totalMana = manaAnalysis.total;
    const untappedCreatures = gameState.playerCreatures.filter(
      (c) => !c.tapped && !c.summingSickness,
    );
    const playerBoardPower = gameState.playerCreatures.reduce(
      (sum, c) => sum + (c.tapped ? 0 : c.power),
      0,
    );
    const opponentBoardPower = gameState.opponentCreatures.reduce(
      (sum, c) => sum + (c.tapped ? 0 : c.power),
      0,
    );
    const canWinThisTurn =
      untappedCreatures.reduce((sum, c) => sum + c.power, 0) >=
      gameState.opponentLife;

    // Enhanced card analysis functions

    // CRITICAL: Lethal damage available
    if (
      canWinThisTurn &&
      (gameState.currentPhase === "Main Phase 1" ||
        gameState.currentPhase === "Combat - Declare Attackers")
    ) {
      recommendations.push({
        type: "attack",
        action: "ATTACK FOR LETHAL DAMAGE!",
        priority: 5,
        explanation: `You can deal ${untappedCreatures.reduce((sum, c) => sum + c.power, 0)} damage and opponent has ${gameState.opponentLife} life. This wins the game!`,
        icon: <Sword className="w-4 h-4 text-red-500" />,
      });
    }

    // CRITICAL: Very low life - defensive priority
    if (gameState.playerLife <= 3) {
      if (gameState.currentPhase === "Combat - Declare Blockers") {
        recommendations.push({
          type: "block",
          action: "Block everything possible - you're at critical life",
          priority: 5,
          explanation: `At ${gameState.playerLife} life, any unblocked damage could be lethal. Prioritize survival over card advantage.`,
          icon: <Shield className="w-4 h-4 text-red-500" />,
        });
      }

      // Look for defensive cards
      const defensiveCards = getPlayableCards().filter(
        (card) =>
          card.abilities.includes("Life Gain") ||
          card.abilities.includes("Removal") ||
          card.name.toLowerCase().includes("heal") ||
          card.name.toLowerCase().includes("fog"),
      );

      if (defensiveCards.length > 0) {
        recommendations.push({
          type: "cast",
          action: `Cast ${defensiveCards[0].name} for survival`,
          priority: 4,
          explanation: `${defensiveCards[0].name} (${defensiveCards[0].cost.total} mana) can help you survive. Abilities: ${defensiveCards[0].abilities.join(", ") || "Defensive effect"}`,
          icon: <Shield className="w-4 h-4 text-red-500" />,
        });
      }
    }

    // MAIN PHASES: Enhanced spell casting with mana production analysis
    if (
      gameState.currentPhase === "Main Phase 1" ||
      gameState.currentPhase === "Main Phase 2"
    ) {
      const playableCards = getPlayableCards();

      // High priority: Mana acceleration when you have expensive cards
      const manaProducers = playableCards.filter((card) => {
        const production = getManaProduction(card.name);
        return production.amount > 0;
      });

      if (manaProducers.length > 0) {
        const expensiveCards = gameState.playerHand.filter((card) => {
          const cost = parseManaCost(card);
          return cost.total > totalMana && cost.total <= totalMana + 3;
        });

        if (expensiveCards.length > 0) {
          const bestManaProducer = manaProducers[0];
          const production = getManaProduction(bestManaProducer.name);
          recommendations.push({
            type: "cast",
            action: `Cast ${bestManaProducer.name} for mana acceleration`,
            priority: 4,
            explanation: `${bestManaProducer.name} (${bestManaProducer.cost.total} mana) ${production.conditions || `produces ${production.amount} mana`}. This enables casting ${expensiveCards[0]} next turn.`,
            icon: <ColorlessMana className="w-4 h-4 text-green-500" />,
          });
        }
      }

      // Enhanced land recommendations with mana source analysis
      const landCards = gameState.playerHand.filter(
        (card) =>
          card.toLowerCase().includes("land") ||
          card.toLowerCase().includes("plains") ||
          card.toLowerCase().includes("island") ||
          card.toLowerCase().includes("swamp") ||
          card.toLowerCase().includes("mountain") ||
          card.toLowerCase().includes("forest"),
      );

      if (landCards.length > 0) {
        const unplayableCards = gameState.playerHand.filter(
          (card) => !canAffordCard(card),
        );
        const expensiveCards = unplayableCards
          .map((card) => parseManaCost(card))
          .filter((cost) => cost.total > totalMana);

        let landPriority = 1;
        let explanation =
          "Extra mana is always useful for multiple spells or activated abilities.";

        if (baseMana < 3) {
          landPriority = 4;
          explanation = `You have ${baseMana} lands. Playing lands early is crucial for casting spells later.`;
        } else if (baseMana < 6) {
          landPriority = 3;
          explanation = `More mana opens up bigger spells and multiple spells per turn.`;
        } else if (expensiveCards.length > 0) {
          landPriority = 3;
          explanation = `You have ${expensiveCards.length} unplayable cards that need more mana. Total available: ${totalMana} (including mana creatures).`;
        } else if (manaAnalysis.sources.length > 0) {
          landPriority = 2;
          explanation = `Current mana: ${baseMana} lands + ${manaAnalysis.sources.join(", ")} = ${totalMana} total.`;
        }

        // Suggest specific land types based on hand
        const neededColors = gameState.playerHand
          .map(parseManaCost)
          .flatMap((cost) => cost.colors)
          .filter((color, index, arr) => arr.indexOf(color) === index);

        const colorNames: Record<string, string> = {
          W: "White",
          U: "Blue",
          B: "Black",
          R: "Red",
          G: "Green",
        };
        const suggestedColors = neededColors
          .map((c) => colorNames[c])
          .filter(Boolean);

        if (suggestedColors.length > 0) {
          explanation += ` Consider ${suggestedColors.join(" or ")} sources for cards in hand.`;
        }

        recommendations.push({
          type: "cast",
          action:
            landPriority >= 3
              ? "Play a land for mana development"
              : "Consider playing a land",
          priority: landPriority,
          explanation,
          icon: <span className="w-4 h-4">🏔️</span>,
        });
      }

      // High priority: Removal spells when opponent has threats
      if (gameState.opponentCreatures.length > 0) {
        const removalCards = playableCards.filter(
          (card) =>
            card.abilities.includes("Removal") ||
            card.abilities.includes("Direct Damage") ||
            card.name.toLowerCase().includes("destroy") ||
            card.name.toLowerCase().includes("exile"),
        );

        if (removalCards.length > 0) {
          const biggestThreat = gameState.opponentCreatures.reduce(
            (biggest, creature) =>
              creature.power > biggest.power ? creature : biggest,
          );

          const bestRemoval = removalCards[0];
          recommendations.push({
            type: "cast",
            action: `Cast ${bestRemoval.name} to remove ${biggestThreat.name}`,
            priority: biggestThreat.power >= 4 ? 4 : 3,
            explanation: `${bestRemoval.name} (${bestRemoval.cost.total} mana, ${bestRemoval.cost.colors.join("")}) can remove ${biggestThreat.name} (${biggestThreat.power}/${biggestThreat.toughness}). Effects: ${bestRemoval.abilities.join(", ")}`,
            icon: <Zap className="w-4 h-4 text-red-500" />,
          });
        }
      }

      // Creature deployment
      const creatureCards = playableCards.filter(
        (card) =>
          card.name.toLowerCase().includes("creature") ||
          card.name.toLowerCase().includes("dragon") ||
          card.name.toLowerCase().includes("knight") ||
          card.name.toLowerCase().includes("goblin") ||
          card.name.toLowerCase().includes("elf"),
      );

      if (
        creatureCards.length > 0 &&
        (opponentBoardPower > playerBoardPower ||
          gameState.playerCreatures.length < 2)
      ) {
        const bestCreature = creatureCards.reduce((best, current) =>
          current.cost.total < best.cost.total ? current : best,
        );

        recommendations.push({
          type: "cast",
          action: `Cast ${bestCreature.name} for board presence`,
          priority: opponentBoardPower > playerBoardPower + 3 ? 4 : 3,
          explanation: `${bestCreature.name} (${bestCreature.cost.total} mana, ${bestCreature.cost.colors.join("")}) develops your board. Abilities: ${bestCreature.abilities.join(", ") || "Creature abilities"}`,
          icon: <CreatureIcon className="w-4 h-4" />,
        });
      }

      // Card advantage spells
      const cardDrawSpells = playableCards.filter(
        (card) =>
          card.abilities.includes("Card Draw") ||
          card.name.toLowerCase().includes("draw") ||
          card.name.toLowerCase().includes("divination"),
      );

      if (cardDrawSpells.length > 0 && gameState.playerHand.length <= 2) {
        const drawSpell = cardDrawSpells[0];
        recommendations.push({
          type: "cast",
          action: `Cast ${drawSpell.name} for card advantage`,
          priority: 3,
          explanation: `${drawSpell.name} (${drawSpell.cost.total} mana, ${drawSpell.cost.colors.join("")}) refills your hand. With only ${gameState.playerHand.length} cards, you need more options.`,
          icon: <SpellIcon className="w-4 h-4 text-blue-500" />,
        });
      }

      // Efficient mana usage
      if (totalMana >= 4 && playableCards.length >= 2) {
        const cheapCards = playableCards.filter(
          (card) => card.cost.total <= totalMana / 2,
        );
        if (cheapCards.length >= 2) {
          recommendations.push({
            type: "cast",
            action: `Cast multiple spells for mana efficiency`,
            priority: 2,
            explanation: `You have ${totalMana} mana and multiple cheap spells. Consider casting ${cheapCards
              .slice(0, 2)
              .map((c) => c.name)
              .join(" and ")} in the same turn.`,
            icon: <ColorlessMana className="w-4 h-4" />,
          });
        }
      }
    }

    // COMBAT PHASES: Enhanced attack analysis
    if (gameState.currentPhase === "Combat - Declare Attackers") {
      untappedCreatures.forEach((creature) => {
        const creatureAbilities = getCardAbilities(creature.name);
        const hasEvasion = creatureAbilities.some((ability) =>
          ["Flying", "Trample", "Unblockable", "Hexproof"].includes(ability),
        );

        const canBeBlocked = gameState.opponentCreatures.some(
          (opp) =>
            !opp.tapped &&
            opp.toughness >= creature.power &&
            opp.power >= creature.toughness,
        );

        let attackPriority = 1;
        let explanation = `${creature.name} (${creature.power}/${creature.toughness})`;

        if (creatureAbilities.length > 0) {
          explanation += ` with ${creatureAbilities.join(", ")}`;
        }

        if (hasEvasion || !canBeBlocked) {
          attackPriority = playerBoardPower > opponentBoardPower ? 4 : 3;
          explanation += hasEvasion
            ? " has evasion and can attack safely."
            : " can attack safely - no good blockers.";
        } else if (creature.power >= 4) {
          attackPriority = 2;
          explanation += " is a significant threat that applies pressure.";
        } else {
          explanation += " can attack but evaluate trades carefully.";
        }

        if (attackPriority >= 2) {
          recommendations.push({
            type: "attack",
            action: `Attack with ${creature.name}`,
            priority: attackPriority,
            explanation,
            icon: <Sword className="w-4 h-4 text-green-500" />,
          });
        }
      });
    }

    if (gameState.currentPhase === "Combat - Declare Blockers") {
      const incomingDamage = gameState.opponentCreatures
        .filter((c) => !c.tapped)
        .reduce((sum, c) => sum + c.power, 0);

      if (incomingDamage >= gameState.playerLife) {
        recommendations.push({
          type: "block",
          action: "BLOCK TO SURVIVE - incoming damage is lethal",
          priority: 5,
          explanation: `Opponent can deal ${incomingDamage} damage and you have ${gameState.playerLife} life. Block everything you can!`,
          icon: <Shield className="w-4 h-4 text-red-500" />,
        });
      } else if (incomingDamage > gameState.playerLife / 2) {
        recommendations.push({
          type: "block",
          action: "Block major threats to preserve life total",
          priority: 3,
          explanation: `Taking ${incomingDamage} damage would put you in a dangerous position. Block their biggest creatures.`,
          icon: <Shield className="w-4 h-4 text-yellow-500" />,
        });
      }
    }

    // Empty hand warning
    if (gameState.playerHand.length === 0) {
      recommendations.push({
        type: "cast",
        action: "You're in topdeck mode - make each draw count",
        priority: 1,
        explanation:
          "With no cards in hand, you're relying on drawing the right answer. Play conservatively and maximize each card's impact.",
        icon: <HandIcon className="w-4 h-4 text-orange-500" />,
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
  };

  const recommendations = generateRecommendations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                MTG Assistant
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex">
                Strategic Game Analysis
              </Badge>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 pb-20 md:pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3">
            <Tabs defaultValue="game" className="w-full">
              {/* Game State Tab */}
              <TabsContent value="game" className="space-y-6 mt-0">
                {/* Game Basics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6 bg-card">
                    <div className="flex items-center gap-2 mb-4">
                      <LifeIcon />
                      <h3 className="text-lg font-semibold">Life Totals</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="playerLife"
                          className="text-sm font-medium"
                        >
                          Your Life
                        </Label>
                        <Input
                          id="playerLife"
                          type="number"
                          value={gameState.playerLife}
                          onChange={(e) =>
                            setGameState((prev) => ({
                              ...prev,
                              playerLife: Number.parseInt(e.target.value) || 0,
                            }))
                          }
                          className="mt-1 text-lg font-bold text-center"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="opponentLife"
                          className="text-sm font-medium"
                        >
                          Opponent`s Life
                        </Label>
                        <Input
                          id="opponentLife"
                          type="number"
                          value={gameState.opponentLife}
                          onChange={(e) =>
                            setGameState((prev) => ({
                              ...prev,
                              opponentLife:
                                Number.parseInt(e.target.value) || 0,
                            }))
                          }
                          className="mt-1 text-lg font-bold text-center"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card">
                    <div className="flex items-center gap-2 mb-4">
                      <PhaseIcon phase={gameState.currentPhase} />
                      <h3 className="text-lg font-semibold">Current Phase</h3>
                    </div>
                    <Select
                      value={gameState.currentPhase}
                      onValueChange={(value) =>
                        setGameState((prev) => ({
                          ...prev,
                          currentPhase: value,
                        }))
                      }
                    >
                      <SelectTrigger className="text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASES.map((phase) => (
                          <SelectItem key={phase} value={phase}>
                            <div className="flex items-center gap-2">
                              <PhaseIcon phase={phase} className="w-4 h-4" />
                              {phase}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Card>
                </div>

                {/* Mana Pool */}
                <Card className="p-6 bg-card">
                  <div className="flex items-center gap-2 mb-4">
                    <ColorlessMana />
                    <h3 className="text-lg font-semibold">Available Mana</h3>
                    <Badge variant="outline" className="ml-auto">
                      Total:{" "}
                      {Object.values(gameState.availableMana).reduce(
                        (sum, mana) => sum + mana,
                        0,
                      )}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {Object.entries(gameState.availableMana).map(
                      ([color, amount]) => {
                        const ManaComponent =
                          MANA_COMPONENTS[
                            color as keyof typeof MANA_COMPONENTS
                          ];
                        return (
                          <div key={color} className="text-center">
                            <Label
                              htmlFor={color}
                              className="capitalize flex items-center justify-center gap-1 mb-2"
                            >
                              <ManaComponent />
                              <span className="text-xs">{color}</span>
                            </Label>
                            <Input
                              id={color}
                              type="number"
                              min="0"
                              value={amount}
                              onChange={(e) =>
                                setGameState((prev) => ({
                                  ...prev,
                                  availableMana: {
                                    ...prev.availableMana,
                                    [color]:
                                      Number.parseInt(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="text-center font-bold"
                            />
                          </div>
                        );
                      },
                    )}
                  </div>
                </Card>

                {/* Hand Display - Only show on non-hand tabs */}
                <HandDisplay
                  cards={gameState.playerHand}
                  onCardSelect={handleHandCardSelect}
                  onRemoveCard={removeHandCard}
                  isCompact={true}
                  showSearch={false}
                />
              </TabsContent>

              {/* Hand Tab */}
              <TabsContent value="hand" className="space-y-6 mt-0">
                <HandDisplay
                  cards={gameState.playerHand}
                  onCardSelect={handleHandCardSelect}
                  onRemoveCard={removeHandCard}
                  isCompact={false}
                  showSearch={true}
                />
              </TabsContent>

              {/* Battlefield Tab */}
              <TabsContent value="battlefield" className="space-y-6 mt-0">
                {/* Add Creature */}
                <Card className="p-6 bg-card">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Add Creature</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Search for Creature</Label>
                      <CardSearch
                        onCardSelect={handleCreatureCardSelect}
                        placeholder="Search any Magic card..."
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        placeholder="Creature name"
                        value={newCreature.name}
                        onChange={(e) =>
                          setNewCreature((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Power"
                          value={newCreature.power}
                          onChange={(e) =>
                            setNewCreature((prev) => ({
                              ...prev,
                              power: Number.parseInt(e.target.value) || 1,
                            }))
                          }
                          className="w-20"
                        />
                        <span className="self-center text-muted-foreground font-bold">
                          /
                        </span>
                        <Input
                          type="number"
                          placeholder="Toughness"
                          value={newCreature.toughness}
                          onChange={(e) =>
                            setNewCreature((prev) => ({
                              ...prev,
                              toughness: Number.parseInt(e.target.value) || 1,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="tapped"
                          checked={newCreature.tapped}
                          onCheckedChange={(checked) =>
                            setNewCreature((prev) => ({
                              ...prev,
                              tapped: checked,
                            }))
                          }
                        />
                        <Label htmlFor="tapped">Tapped</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="summingSickness"
                          checked={newCreature.summingSickness}
                          onCheckedChange={(checked) =>
                            setNewCreature((prev) => ({
                              ...prev,
                              summingSickness: checked,
                            }))
                          }
                        />
                        <Label htmlFor="summingSickness">
                          Summing Sickness
                        </Label>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => addCreature(true)}
                        className="flex-1"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Add to Your Battlefield
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addCreature(false)}
                        className="flex-1"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Add to Opponent`s
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Battlefield Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6 bg-card">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <CreatureIcon className="text-green-600 w-4 h-4" />
                      Your Creatures
                      <Badge variant="outline" className="ml-auto">
                        {gameState.playerCreatures.length}
                      </Badge>
                    </h4>
                    <div className="space-y-3">
                      {gameState.playerCreatures.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BattlefieldIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No creatures on battlefield</p>
                        </div>
                      ) : (
                        gameState.playerCreatures.map((creature) => (
                          <div
                            key={creature.id}
                            className="p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CreatureIcon className="w-4 h-4" />
                                <span
                                  className={`font-medium ${creature.tapped ? "text-muted-foreground" : "text-foreground"}`}
                                >
                                  {creature.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {creature.power}/{creature.toughness}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleCreatureTapped(creature.id, true)
                                  }
                                  className="text-xs"
                                >
                                  {creature.tapped ? "Untap" : "Tap"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeCreature(creature.id, true)
                                  }
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {creature.tapped && (
                                <Badge variant="secondary" className="text-xs">
                                  Tapped
                                </Badge>
                              )}
                              {creature.summingSickness && (
                                <Badge variant="outline" className="text-xs">
                                  Summon Sick
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  <Card className="p-6 bg-card">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <CreatureIcon className="text-red-600 w-4 h-4" />
                      Opponent`s Creatures
                      <Badge variant="outline" className="ml-auto">
                        {gameState.opponentCreatures.length}
                      </Badge>
                    </h4>
                    <div className="space-y-3">
                      {gameState.opponentCreatures.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BattlefieldIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No opponent creatures</p>
                        </div>
                      ) : (
                        gameState.opponentCreatures.map((creature) => (
                          <div
                            key={creature.id}
                            className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CreatureIcon className="w-4 h-4" />
                                <span
                                  className={`font-medium ${creature.tapped ? "text-muted-foreground" : "text-red-700 dark:text-red-400"}`}
                                >
                                  {creature.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {creature.power}/{creature.toughness}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleCreatureTapped(creature.id, false)
                                  }
                                  className="text-xs"
                                >
                                  {creature.tapped ? "Untap" : "Tap"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeCreature(creature.id, false)
                                  }
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {creature.tapped && (
                              <Badge variant="secondary" className="text-xs">
                                Tapped
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>

                {/* Hand Display - Compact version */}
                <HandDisplay
                  cards={gameState.playerHand}
                  onCardSelect={handleHandCardSelect}
                  onRemoveCard={removeHandCard}
                  isCompact={true}
                  showSearch={false}
                />
              </TabsContent>

              {/* Desktop Tabs */}
              <div className="hidden md:block">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="game" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Game State
                  </TabsTrigger>
                  <TabsTrigger value="hand" className="flex items-center gap-2">
                    <HandIcon className="w-4 h-4" />
                    Hand
                  </TabsTrigger>
                  <TabsTrigger
                    value="battlefield"
                    className="flex items-center gap-2"
                  >
                    <BattlefieldIcon className="w-4 h-4" />
                    Battlefield
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Mobile Bottom Tabs */}
              <div className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden z-50">
                <TabsList className="grid w-full grid-cols-3 h-16 bg-transparent">
                  <TabsTrigger value="game" className="flex-col gap-1 h-full">
                    <Settings className="w-4 h-4" />
                    <span className="text-xs">Game</span>
                  </TabsTrigger>
                  <TabsTrigger value="hand" className="flex-col gap-1 h-full">
                    <HandIcon className="w-4 h-4" />
                    <span className="text-xs">Hand</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="battlefield"
                    className="flex-col gap-1 h-full"
                  >
                    <BattlefieldIcon className="w-4 h-4" />
                    <span className="text-xs">Board</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>

          {/* Sidebar - Recommendations and Summary */}
          <div className="xl:col-span-1 space-y-6">
            {/* Recommendations */}
            <Card className="p-6 bg-card sticky top-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Strategic Recommendations
              </h3>
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Enter your game state to get strategic recommendations
                    </p>
                  </div>
                ) : (
                  recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="mt-0.5">{rec.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm leading-tight">
                              {rec.action}
                            </span>
                            <Badge
                              variant={
                                rec.priority >= 4
                                  ? "destructive"
                                  : rec.priority >= 3
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-xs shrink-0"
                            >
                              P{rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {rec.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Game Summary */}
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Game Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-2 text-sm">
                    <LifeIcon className="w-4 h-4" />
                    Your Life:
                  </span>
                  <span
                    className={`font-bold ${gameState.playerLife <= 5 ? "text-red-600" : ""}`}
                  >
                    {gameState.playerLife}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-2 text-sm">
                    <LifeIcon className="w-4 h-4" />
                    Opponent`s Life:
                  </span>
                  <span
                    className={`font-bold ${gameState.opponentLife <= 5 ? "text-red-600" : ""}`}
                  >
                    {gameState.opponentLife}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-2 text-sm">
                    <HandIcon className="w-4 h-4" />
                    Cards in Hand:
                  </span>
                  <span className="font-medium">
                    {gameState.playerHand.length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-2 text-sm">
                    <CreatureIcon className="w-4 h-4" />
                    Your Creatures:
                  </span>
                  <span className="font-medium">
                    {gameState.playerCreatures.length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-2 text-sm">
                    <CreatureIcon className="w-4 h-4" />
                    Opponent`s Creatures:
                  </span>
                  <span className="font-medium">
                    {gameState.opponentCreatures.length}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-2 text-sm">
                    <ColorlessMana className="w-4 h-4" />
                    Total Mana:
                  </span>
                  <span className="font-bold text-lg">
                    {Object.values(gameState.availableMana).reduce(
                      (sum, mana) => sum + mana,
                      0,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-2 text-sm">
                    <PhaseIcon
                      phase={gameState.currentPhase}
                      className="w-4 h-4"
                    />
                    Current Phase:
                  </span>
                  <span className="text-xs font-medium">
                    {gameState.currentPhase}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
