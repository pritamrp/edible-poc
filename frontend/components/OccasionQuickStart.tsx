"use client";

import { OccasionOption } from "@/types";
import { motion } from "framer-motion";

const occasions: OccasionOption[] = [
  {
    id: "birthday",
    label: "Birthday",
    emoji: "🎂",
    message: "I'm looking for a birthday gift",
  },
  {
    id: "thank_you",
    label: "Thank You",
    emoji: "💐",
    message: "I want to send a thank you gift",
  },
  {
    id: "anniversary",
    label: "Anniversary",
    emoji: "💝",
    message: "I need an anniversary gift",
  },
  {
    id: "corporate",
    label: "Corporate",
    emoji: "🏢",
    message: "I'm looking for a corporate gift",
  },
  {
    id: "surprise",
    label: "Surprise Me",
    emoji: "✨",
    message: "Surprise me with gift ideas",
  },
];

interface OccasionQuickStartProps {
  onSelect: (message: string) => void;
}

export function OccasionQuickStart({ onSelect }: OccasionQuickStartProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 max-w-lg">
      {occasions.map((occasion, index) => (
        <motion.button
          key={occasion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4 }}
          onClick={() => onSelect(occasion.message)}
          className="group relative px-5 py-3 bg-white rounded-xl border border-neutral-200
                     hover:border-edible-red/50 hover:bg-red-50
                     transition-all duration-300 btn-press shadow-soft hover:shadow-red-glow"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl group-hover:scale-110 transition-transform duration-300">
              {occasion.emoji}
            </span>
            <span className="font-medium text-neutral-700 group-hover:text-edible-red transition-colors">
              {occasion.label}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
