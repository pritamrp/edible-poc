"use client";

import { Message } from "@/types";
import { motion } from "framer-motion";

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? "bg-gradient-to-br from-forest-500 to-forest-600 text-cream-50 rounded-2xl rounded-br-md"
            : "bg-cream-100 text-chocolate-800 rounded-2xl rounded-bl-md border border-gold-300/20"
        } px-5 py-3 shadow-soft`}
      >
        {/* Avatar for assistant */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gold-300/20">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-cream-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <span className="text-xs font-medium text-forest-600">Gift Concierge</span>
          </div>
        )}

        {/* Message content */}
        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "" : "text-chocolate-700"}`}>
          {message.content}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? "text-cream-100/60" : "text-chocolate-500/50"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
