"use client";

import { FeedbackReason, FeedbackOption } from "@/types";
import { motion } from "framer-motion";

const feedbackOptions: FeedbackOption[] = [
  { id: "too_expensive", label: "Too expensive", refinement: "looking for something more affordable" },
  { id: "wrong_style", label: "Not my style", refinement: "looking for a different style" },
  { id: "want_different", label: "Show me something different", refinement: "show me different options" },
  { id: "other", label: "Other", refinement: "show me more options" },
];

interface FeedbackOptionsProps {
  onSelect: (reason: FeedbackReason, refinement: string) => void;
  isLoading?: boolean;
}

export function FeedbackOptions({ onSelect, isLoading }: FeedbackOptionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-6 border border-neutral-200"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
          <span className="text-xl">🤔</span>
        </div>
        <div>
          <h4 className="font-display font-semibold text-neutral-900">
            None of these quite right?
          </h4>
          <p className="text-sm text-neutral-500">
            Tell us what you're looking for
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {feedbackOptions.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(option.id, option.refinement)}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-lg
                       text-sm font-medium text-neutral-700
                       hover:bg-red-50 hover:border-edible-red/30 hover:text-edible-red
                       transition-all duration-200 btn-press
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {option.label}
          </motion.button>
        ))}
      </div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-center gap-2 text-edible-red"
        >
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Finding better matches...</span>
        </motion.div>
      )}
    </motion.div>
  );
}
