"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSend(value);
      setValue("");

      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me about who you're shopping for..."
          disabled={isLoading}
          rows={1}
          className="w-full resize-none bg-cream-50 border border-gold-300/30 rounded-2xl
                     px-5 py-3.5 pr-12 text-chocolate-800 placeholder-chocolate-500/40
                     focus:outline-none focus:border-forest-400/50 focus:ring-2 focus:ring-forest-400/20
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
        />

        {/* Character hint */}
        {value.length > 0 && (
          <div className="absolute right-4 bottom-3.5 text-xs text-chocolate-400/50">
            {value.length}/500
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600
                   text-cream-50 flex items-center justify-center
                   hover:from-forest-400 hover:to-forest-500
                   disabled:from-chocolate-300 disabled:to-chocolate-400 disabled:cursor-not-allowed
                   shadow-soft hover:shadow-golden btn-press
                   transition-all duration-200"
      >
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </div>
  );
}
