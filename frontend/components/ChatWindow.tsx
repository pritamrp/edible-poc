"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/types";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6 space-y-4"
    >
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          isLatest={index === messages.length - 1}
        />
      ))}

      {isLoading && <TypingIndicator />}

      {/* Spacer for better scrolling */}
      <div className="h-2" />
    </div>
  );
}
