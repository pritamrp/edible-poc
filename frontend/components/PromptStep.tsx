"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PromptStepProps {
  suggestedPrompt: string;
  onSubmit: (prompt: string, isCustom: boolean) => void;
  isLoading?: boolean;
}

export function PromptStep({ suggestedPrompt, onSubmit, isLoading }: PromptStepProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleUseSuggested = () => {
    onSubmit(suggestedPrompt, false);
  };

  const handleCustomSubmit = () => {
    if (customPrompt.trim()) {
      onSubmit(customPrompt.trim(), true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-lg mx-auto"
    >
      <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
        Looking for something like this?
      </h2>
      <p className="text-neutral-500 mb-6">
        Use our suggestion or customize your search
      </p>

      {/* Suggested prompt card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-red-50 to-white rounded-xl p-6 mb-6 border border-edible-red/20 shadow-soft"
      >
        <p className="text-lg text-neutral-800 font-medium mb-4">
          "{suggestedPrompt}"
        </p>
        <button
          onClick={handleUseSuggested}
          disabled={isLoading}
          className="px-6 py-3 bg-edible-red text-white rounded-lg
                     font-medium shadow-lg hover:bg-edible-red-dark
                     transition-all duration-300 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Finding gifts...
            </span>
          ) : (
            "Use this prompt"
          )}
        </button>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        <span className="text-sm text-neutral-400">or customize</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
      </div>

      {/* Custom input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="relative">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              setIsCustomMode(e.target.value.length > 0);
            }}
            placeholder="Type your own description..."
            className="w-full px-5 py-4 bg-white border border-neutral-300 rounded-xl
                       text-neutral-800 placeholder:text-neutral-400
                       focus:outline-none focus:border-edible-red focus:ring-2 focus:ring-edible-red/20
                       transition-all duration-200"
            onKeyDown={(e) => {
              if (e.key === "Enter" && customPrompt.trim()) {
                handleCustomSubmit();
              }
            }}
          />
        </div>

        {isCustomMode && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleCustomSubmit}
            disabled={isLoading || !customPrompt.trim()}
            className="px-6 py-3 bg-neutral-900 text-white rounded-lg
                       font-medium shadow-lg hover:bg-neutral-800
                       transition-all duration-300 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Searching..." : "Search with custom prompt"}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
