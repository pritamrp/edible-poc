"use client";

import { EdibleProduct, FeedbackType } from "@/types";
import { ProductCard } from "./ProductCard";
import { motion } from "framer-motion";

interface ProductGridProps {
  products: EdibleProduct[];
  sessionId: string | null;
  feedbackMap?: Map<string, FeedbackType>;
  onFeedback?: (sku: string, feedback: FeedbackType) => void;
  onExpand?: (product: EdibleProduct) => void;
  showFeedbackPrompt?: boolean;
}

export function ProductGrid({
  products,
  sessionId,
  feedbackMap,
  onFeedback,
  onExpand,
  showFeedbackPrompt = false
}: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <div className="border-t border-neutral-200 bg-gradient-to-b from-neutral-50 to-white p-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-edible-red flex items-center justify-center shadow-soft">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-neutral-900">
            {showFeedbackPrompt ? "Anything that catches your eye?" : "Recommended for you"}
          </h3>
          <p className="text-sm text-neutral-500">
            {showFeedbackPrompt
              ? "Give a thumbs up to see more details"
              : `${products.length} perfect ${products.length === 1 ? "match" : "matches"} found`
            }
          </p>
        </div>
      </div>

      {/* Product cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.slice(0, 5).map((product, index) => (
          <motion.div
            key={product.sku}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <ProductCard
              product={product}
              position={index + 1}
              sessionId={sessionId}
              feedback={feedbackMap?.get(product.sku)}
              onFeedback={onFeedback}
              onExpand={onExpand}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
