"use client";

import type React from "react";
import {
  Sunrise,
  Zap,
  Swords,
  Sparkles,
  Moon,
  Clock,
  Star,
  ArrowUp,
  ArrowRight,
  Eye,
  Heart,
  Skull,
  Shield,
  ShieldCheck,
  Settings,
  Mountain,
  Crown,
} from "lucide-react";
import { ReactNode } from "react";

// Official MTG Mana Symbol Components with proper styling
export const WhiteMana = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <div
    className={`${className} rounded-full bg-gradient-to-b from-white to-gray-100 border-2 border-gray-300 flex items-center justify-center text-black font-bold text-xs shadow-sm`}
    style={{ fontFamily: "serif" }}
  >
    W
  </div>
);

export const BlueMana = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div
    className={`${className} rounded-full bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-sm`}
    style={{ fontFamily: "serif" }}
  >
    U
  </div>
);

export const BlackMana = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <div
    className={`${className} rounded-full bg-gradient-to-b from-gray-700 to-black border-2 border-gray-900 flex items-center justify-center text-white font-bold text-xs shadow-sm`}
    style={{ fontFamily: "serif" }}
  >
    B
  </div>
);

export const RedMana = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div
    className={`${className} rounded-full bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-800 flex items-center justify-center text-white font-bold text-xs shadow-sm`}
    style={{ fontFamily: "serif" }}
  >
    R
  </div>
);

export const GreenMana = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <div
    className={`${className} rounded-full bg-gradient-to-b from-green-500 to-green-700 border-2 border-green-800 flex items-center justify-center text-white font-bold text-xs shadow-sm`}
    style={{ fontFamily: "serif" }}
  >
    G
  </div>
);

export const ColorlessMana = ({
  className = "w-5 h-5",
  number = "C",
}: {
  className?: string;
  number?: string | number;
}) => (
  <div
    className={`${className} rounded-full bg-gradient-to-b from-gray-300 to-gray-500 border-2 border-gray-600 flex items-center justify-center text-white font-bold text-xs shadow-sm`}
    style={{ fontFamily: "serif" }}
  >
    {number}
  </div>
);

// Generic mana cost numbers
export const GenericMana = ({
  number,
  className = "w-5 h-5",
}: {
  number: number;
  className?: string;
}) => <ColorlessMana className={className} number={number} />;

// Hybrid mana symbols
export const HybridMana = ({
  color1,
  color2,
  className = "w-5 h-5",
}: {
  color1: string;
  color2: string;
  className?: string;
}) => (
  <div
    className={`${className} rounded-full border-2 border-gray-600 flex items-center justify-center text-xs font-bold shadow-sm relative overflow-hidden`}
  >
    <div className="absolute inset-0 w-1/2 bg-gradient-to-b from-red-500 to-red-700" />
    <div className="absolute inset-0 left-1/2 w-1/2 bg-gradient-to-b from-white to-gray-100" />
    <span className="relative z-10 text-black mix-blend-difference">
      {color1}/{color2}
    </span>
  </div>
);

// Tap symbol
export const TapSymbol = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <div className={`${className} flex items-center justify-center`}>
    <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  </div>
);

// Untap symbol
export const UntapSymbol = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <div
    className={`${className} flex items-center justify-center transform rotate-180`}
  >
    <TapSymbol className={className} />
  </div>
);

// MTG Phase Icons with official styling
export const PhaseIcon = ({
  phase,
  className = "w-5 h-5",
}: {
  phase: string;
  className?: string;
}) => {
  const getPhaseIcon = () => {
    if (phase.includes("Beginning")) return <Sunrise className={className} />;
    if (phase.includes("Main Phase 1")) return <Zap className={className} />;
    if (phase.includes("Combat")) return <Swords className={className} />;
    if (phase.includes("Main Phase 2"))
      return <Sparkles className={className} />;
    if (phase.includes("End")) return <Moon className={className} />;
    return <Clock className={className} />;
  };

  return getPhaseIcon();
};

// Card type symbols with MTG styling
export const CreatureIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <Star className={`${className} text-green-600`} />;

export const SpellIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => <Zap className={`${className} text-blue-600`} />;

export const ArtifactIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => <Settings className={`${className} text-gray-600`} />;

export const EnchantmentIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => <Sparkles className={`${className} text-purple-600`} />;

export const LandIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Mountain className={`${className} text-amber-700`} />
);

export const PlaneswalkerIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => <Crown className={`${className} text-yellow-600`} />;

// Life and game state icons
export const LifeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center`}>
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full fill-current text-red-500"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  </div>
);

export const HandIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center`}>
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full fill-current text-purple-600"
    >
      <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8z" />
    </svg>
  </div>
);

export const BattlefieldIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <div className={`${className} flex items-center justify-center`}>
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full fill-current text-amber-600"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  </div>
);

// Power/Toughness display
export const PowerToughnessIcon = ({
  power,
  toughness,
  className = "w-8 h-6",
}: {
  power: number;
  toughness: number;
  className?: string;
}) => (
  <div
    className={`${className} bg-gradient-to-b from-yellow-200 to-yellow-400 border-2 border-yellow-600 rounded flex items-center justify-center text-black font-bold text-xs`}
  >
    {power}/{toughness}
  </div>
);

// Mana cost display component
export const ManaCost = ({
  cost,
  className = "flex items-center gap-1",
}: {
  cost: string;
  className?: string;
}) => {
  const parseManaSymbols = (costString: string) => {
    // Parse mana cost string like "{2}{R}{G}" or "2RG"
    const symbols: ReactNode[] = [];
    const matches = costString.match(/\{([^}]+)\}|([WUBRGC])|(\d+)/g);

    if (matches) {
      matches.forEach((match) => {
        const clean = match.replace(/[{}]/g, "");
        if (/^\d+$/.test(clean)) {
          symbols.push(
            <GenericMana
              key={symbols.length}
              number={Number.parseInt(clean)}
              className="w-4 h-4"
            />,
          );
        } else {
          switch (clean) {
            case "W":
              symbols.push(
                <WhiteMana key={symbols.length} className="w-4 h-4" />,
              );
              break;
            case "U":
              symbols.push(
                <BlueMana key={symbols.length} className="w-4 h-4" />,
              );
              break;
            case "B":
              symbols.push(
                <BlackMana key={symbols.length} className="w-4 h-4" />,
              );
              break;
            case "R":
              symbols.push(
                <RedMana key={symbols.length} className="w-4 h-4" />,
              );
              break;
            case "G":
              symbols.push(
                <GreenMana key={symbols.length} className="w-4 h-4" />,
              );
              break;
            case "C":
              symbols.push(
                <ColorlessMana key={symbols.length} className="w-4 h-4" />,
              );
              break;
          }
        }
      });
    }

    return symbols;
  };

  return <div className={className}>{parseManaSymbols(cost)}</div>;
};

// Add these new icons after the existing ones

// Enhanced Tap/Untap symbols with better styling
export const TapIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center`}>
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full fill-current text-muted-foreground"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  </div>
);

export const UntapIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => (
  <div
    className={`${className} flex items-center justify-center transform rotate-180`}
  >
    <TapIcon className={className} />
  </div>
);

// Ability icons
export const FlyingIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <ArrowUp className={`${className} text-blue-500`} />;

export const TrampleIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <ArrowRight className={`${className} text-green-600`} />;

export const HasteIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <Zap className={`${className} text-red-500`} />;

export const VigilanceIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <Eye className={`${className} text-yellow-600`} />;

export const LifelinkIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <Heart className={`${className} text-pink-500`} />;

export const DeathtouchIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <Skull className={`${className} text-purple-600`} />;

export const FirstStrikeIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <Shield className={`${className} text-orange-500`} />;

export const HexproofIcon = ({
  className = "w-4 h-4",
}: {
  className?: string;
}) => <ShieldCheck className={`${className} text-cyan-500`} />;

// Ability parser function
export const getAbilityIcons = (
  oracleText: string,
): { icon: React.ReactNode; name: string }[] => {
  const abilities: { icon: React.ReactNode; name: string }[] = [];
  const text = oracleText.toLowerCase();

  if (text.includes("flying"))
    abilities.push({ icon: <FlyingIcon />, name: "Flying" });
  if (text.includes("trample"))
    abilities.push({ icon: <TrampleIcon />, name: "Trample" });
  if (text.includes("haste"))
    abilities.push({ icon: <HasteIcon />, name: "Haste" });
  if (text.includes("vigilance"))
    abilities.push({ icon: <VigilanceIcon />, name: "Vigilance" });
  if (text.includes("lifelink"))
    abilities.push({ icon: <LifelinkIcon />, name: "Lifelink" });
  if (text.includes("deathtouch"))
    abilities.push({ icon: <DeathtouchIcon />, name: "Deathtouch" });
  if (text.includes("first strike"))
    abilities.push({ icon: <FirstStrikeIcon />, name: "First Strike" });
  if (text.includes("hexproof"))
    abilities.push({ icon: <HexproofIcon />, name: "Hexproof" });
  if (text.includes("{t}") || text.includes("tap"))
    abilities.push({ icon: <TapIcon />, name: "Tap Ability" });

  return abilities;
};
