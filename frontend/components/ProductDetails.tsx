"use client";

import { EdibleProduct } from "@/types";
import { motion } from "framer-motion";
import { trackClick, trackConversion } from "@/lib/api";

interface ProductDetailsProps {
  product: EdibleProduct;
  sessionId: string | null;
  onClose: () => void;
}

export function ProductDetails({ product, sessionId, onClose }: ProductDetailsProps) {
  const handleViewOnSite = async () => {
    if (sessionId) {
      try {
        await trackClick(sessionId, product.sku, product.name, 0);
        await trackConversion(sessionId);
      } catch (error) {
        console.error("Failed to track:", error);
      }
    }
    if (product.pdp_url) {
      window.open(product.pdp_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full
                       flex items-center justify-center shadow-lg
                       hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Product image */}
          <div className="aspect-video bg-neutral-100 overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                <svg className="w-24 h-24 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-red-50 rounded-full text-sm font-medium text-edible-red"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Name */}
          <h2 className="font-display text-2xl font-semibold text-neutral-900">
            {product.name}
          </h2>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl font-bold text-edible-red">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-sm text-neutral-500">Starting price</span>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-neutral-600 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleViewOnSite}
              className="flex-1 px-6 py-4 bg-edible-red text-white rounded-xl
                         font-semibold text-lg shadow-lg hover:bg-edible-red-dark
                         transition-all duration-300 btn-press"
            >
              View on Edible.com
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-neutral-100 text-neutral-700 rounded-xl
                         font-medium hover:bg-neutral-200 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
