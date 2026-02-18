"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start"
    >
      <div className="bg-cream-100 rounded-2xl rounded-bl-md border border-gold-300/20 px-5 py-4 shadow-soft">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-cream-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>

          {/* Typing dots */}
          <div className="flex items-center gap-1.5 ml-1">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>

          {/* Label */}
          <span className="text-xs text-chocolate-500/60 ml-2">Finding perfect gifts...</span>
        </div>
      </div>
    </motion.div>
  );
}
