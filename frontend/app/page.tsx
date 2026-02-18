"use client";

import { GiftConcierge } from "@/components/GiftConcierge";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="py-4 px-8 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-edible-red flex items-center justify-center shadow-soft">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-neutral-900">
                Edible<span className="text-edible-red">.</span>
              </h1>
              <p className="text-xs text-neutral-500 -mt-0.5">Gift Concierge</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="https://www.ediblearrangements.com" target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 hover:text-edible-red transition-colors">
              Browse All Gifts
            </a>
            <a href="https://www.ediblearrangements.com/stores" target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 hover:text-edible-red transition-colors">
              Find a Store
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-8 pt-10 pb-6 bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-neutral-900 leading-tight animate-fade-up">
            Find the{" "}
            <span className="text-edible-red">perfect gift</span>
            <br />
            for any occasion
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Tell us who you're shopping for and we'll help you discover
            something they'll absolutely love.
          </p>
          <div className="red-line w-24 mx-auto mt-6 animate-fade-up" style={{ animationDelay: "0.2s" }} />
        </div>
      </section>

      {/* Gift Concierge Interface */}
      <section className="flex-1 px-4 md:px-8 pb-8 bg-neutral-50">
        <GiftConcierge />
      </section>

      {/* Footer */}
      <footer className="py-6 px-8 bg-white border-t border-neutral-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">
            AI-powered gift recommendations
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.ediblearrangements.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-edible-red transition-colors"
            >
              ediblearrangements.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
