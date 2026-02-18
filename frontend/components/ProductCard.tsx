"use client";

import { EdibleProduct, FeedbackType } from "@/types";
import { trackClick, trackConversion } from "@/lib/api";

interface ProductCardProps {
  product: EdibleProduct;
  position: number;
  sessionId: string | null;
  feedback?: FeedbackType;
  onFeedback?: (sku: string, feedback: FeedbackType) => void;
  onExpand?: (product: EdibleProduct) => void;
}

export function ProductCard({ product, position, sessionId, feedback, onFeedback, onExpand }: ProductCardProps) {
  const handleClick = async () => {
    // Track the click
    if (sessionId) {
      try {
        await trackClick(sessionId, product.sku, product.name, position);
        await trackConversion(sessionId);
      } catch (error) {
        console.error("Failed to track click:", error);
      }
    }

    // Open product page
    if (product.pdp_url) {
      window.open(product.pdp_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleThumbsUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFeedback) {
      onFeedback(product.sku, "up");
    }
    if (onExpand) {
      onExpand(product);
    }
  };

  const handleThumbsDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFeedback) {
      onFeedback(product.sku, "down");
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group bg-white rounded-xl border overflow-hidden
                 cursor-pointer card-hover shadow-soft transition-all duration-300
                 ${feedback === "down" ? "opacity-50 border-neutral-300" : "border-neutral-200"}
                 ${feedback === "up" ? "ring-2 ring-edible-red border-edible-red/50" : ""}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onLoad={(e) => (e.currentTarget.style.opacity = "1")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <svg className="w-16 h-16 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        )}

        {/* Tags overlay */}
        {product.tags && product.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full
                           text-xs font-medium text-neutral-700 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        flex items-end justify-center pb-4">
          <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-neutral-900
                          shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-display font-semibold text-neutral-900 line-clamp-2 group-hover:text-edible-red transition-colors">
          {product.name}
        </h4>

        {product.description && (
          <p className="mt-1.5 text-sm text-neutral-500 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-edible-red">
            ${product.price.toFixed(2)}
          </span>

          {/* Feedback buttons */}
          {onFeedback && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleThumbsUp}
                className={`w-9 h-9 rounded-full flex items-center justify-center
                           transition-all duration-200 btn-press
                           ${feedback === "up"
                             ? "bg-edible-red text-white shadow-md"
                             : "bg-neutral-100 text-neutral-600 hover:bg-red-50 hover:text-edible-red"
                           }`}
                title="I like this"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <button
                onClick={handleThumbsDown}
                className={`w-9 h-9 rounded-full flex items-center justify-center
                           transition-all duration-200 btn-press
                           ${feedback === "down"
                             ? "bg-neutral-600 text-white shadow-md"
                             : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                           }`}
                title="Not for me"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </button>
            </div>
          )}

          {/* Fallback select button when no feedback handler */}
          {!onFeedback && (
            <button
              className="px-3 py-1.5 bg-edible-red rounded-lg
                         text-xs font-medium text-white
                         hover:bg-edible-red-dark btn-press
                         shadow-sm transition-all duration-200"
            >
              Select
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
