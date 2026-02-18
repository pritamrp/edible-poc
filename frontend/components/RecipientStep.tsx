"use client";

import { useState } from "react";
import { Recipient, RecipientOption, OccasionType } from "@/types";
import { motion } from "framer-motion";

const personalRecipients: RecipientOption[] = [
  { id: "spouse", label: "Spouse", icon: "💑" },
  { id: "parents", label: "Parents", icon: "👨‍👩‍👧" },
  { id: "siblings", label: "Siblings", icon: "👫" },
  { id: "friends", label: "Friends", icon: "🤝" },
];

const corporateRecipients: RecipientOption[] = [
  { id: "colleague", label: "Colleague", icon: "🧑‍💼" },
  { id: "client", label: "Client", icon: "🤝" },
  { id: "boss", label: "Boss", icon: "👔" },
  { id: "team", label: "Team", icon: "👥" },
];

const naturalQueryExamples = [
  "Anniversary gift for wife under $100",
  "Thank you gift for my neighbor",
  "Birthday surprise for coworker who loves chocolate",
];

interface RecipientStepProps {
  onSelect: (recipient: Recipient, customText?: string) => void;
  onNaturalQuery: (query: string) => void;
  selectedOccasion: string | null;
  occasionType: OccasionType;
}

export function RecipientStep({
  onSelect,
  onNaturalQuery,
  selectedOccasion,
  occasionType
}: RecipientStepProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customRecipient, setCustomRecipient] = useState("");
  const [naturalQuery, setNaturalQuery] = useState("");

  // Determine which recipients to show based on occasion type
  const recipients = occasionType === "corporate" ? corporateRecipients : personalRecipients;

  const handleCustomSubmit = () => {
    if (customRecipient.trim()) {
      onSelect("custom", customRecipient.trim());
    }
  };

  const handleNaturalQuerySubmit = () => {
    if (naturalQuery.trim()) {
      onNaturalQuery(naturalQuery.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setNaturalQuery(example);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
        Who is this gift for?
      </h2>
      <p className="text-neutral-500 mb-6">
        {selectedOccasion && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full text-edible-red text-sm mr-2">
            {selectedOccasion}
          </span>
        )}
        Select the recipient
      </p>

      {/* Recipient buttons */}
      <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
        {recipients.map((recipient, index) => (
          <motion.button
            key={recipient.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            onClick={() => onSelect(recipient.id)}
            className="group relative px-6 py-4 bg-white rounded-xl border border-neutral-200
                       hover:border-edible-red/50 hover:bg-red-50
                       transition-all duration-300 btn-press shadow-soft hover:shadow-red-glow
                       min-w-[120px]"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                {recipient.icon}
              </span>
              <span className="font-medium text-neutral-700 group-hover:text-edible-red transition-colors">
                {recipient.label}
              </span>
            </div>
          </motion.button>
        ))}

        {/* Someone else button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: recipients.length * 0.08, duration: 0.4 }}
          onClick={() => setShowCustomInput(true)}
          className={`group relative px-6 py-4 bg-white rounded-xl border
                     transition-all duration-300 btn-press shadow-soft min-w-[120px]
                     ${showCustomInput
                       ? "border-edible-red bg-red-50"
                       : "border-neutral-200 hover:border-edible-red/50 hover:bg-red-50 hover:shadow-red-glow"
                     }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
              ✏️
            </span>
            <span className="font-medium text-neutral-700 group-hover:text-edible-red transition-colors">
              Someone else
            </span>
          </div>
        </motion.button>
      </div>

      {/* Custom recipient input */}
      {showCustomInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 max-w-md mx-auto"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={customRecipient}
              onChange={(e) => setCustomRecipient(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              placeholder="e.g., my neighbor, aunt, teacher..."
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 bg-white
                         focus:border-edible-red focus:ring-2 focus:ring-edible-red/20 focus:outline-none
                         text-neutral-800 placeholder:text-neutral-400"
              autoFocus
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customRecipient.trim()}
              className="px-5 py-3 bg-edible-red rounded-xl
                         text-white font-medium shadow-soft
                         hover:bg-edible-red-dark
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 btn-press"
            >
              Continue
            </button>
          </div>
        </motion.div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4 my-8 max-w-lg mx-auto">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        <span className="text-neutral-400 text-sm font-medium">or describe what you need</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
      </div>

      {/* Natural language query section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-lg mx-auto"
      >
        <div className="relative">
          <input
            type="text"
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNaturalQuerySubmit()}
            placeholder="Describe what you're looking for..."
            className="w-full px-5 py-4 pr-28 rounded-xl border border-neutral-300 bg-white
                       focus:border-edible-red focus:ring-2 focus:ring-edible-red/20 focus:outline-none
                       text-neutral-800 placeholder:text-neutral-400 text-lg"
          />
          <button
            onClick={handleNaturalQuerySubmit}
            disabled={!naturalQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       px-5 py-2.5 bg-edible-red rounded-lg
                       text-white font-medium shadow-soft
                       hover:bg-edible-red-dark
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 btn-press"
          >
            Search
          </button>
        </div>

        {/* Example hints */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="text-neutral-400 text-xs">Try:</span>
          {naturalQueryExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="px-3 py-1 text-xs text-neutral-600 bg-neutral-100 rounded-full
                         hover:bg-red-50 hover:text-edible-red transition-colors"
            >
              "{example}"
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
