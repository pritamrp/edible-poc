"use client";

import { useState, useCallback } from "react";
import { Message, EdibleProduct, WizardStep, Recipient, FeedbackType, FeedbackReason, OccasionType } from "@/types";
import { sendChatMessage } from "@/lib/api";
import { OccasionQuickStart } from "./OccasionQuickStart";
import { RecipientStep } from "./RecipientStep";
import { PromptStep } from "./PromptStep";
import { StepIndicator } from "./StepIndicator";
import { ProductGrid } from "./ProductGrid";
import { ProductDetails } from "./ProductDetails";
import { FeedbackOptions } from "./FeedbackOptions";
import { AnimatePresence, motion } from "framer-motion";

// Map occasion messages to display labels
const occasionLabels: Record<string, string> = {
  "I'm looking for a birthday gift": "Birthday",
  "I want to send a thank you gift": "Thank You",
  "I need an anniversary gift": "Anniversary",
  "I'm looking for a corporate gift": "Corporate",
  "Surprise me with gift ideas": "Surprise",
};

// Map recipient IDs to display labels
const recipientLabels: Record<Exclude<Recipient, 'custom'>, string> = {
  spouse: "spouse",
  parents: "parents",
  siblings: "siblings",
  friends: "friends",
  colleague: "colleague",
  client: "client",
  boss: "boss",
  team: "team",
};

// Determine occasion type from occasion message
const getOccasionType = (message: string | null): OccasionType => {
  if (!message) return "personal";
  if (message.includes("corporate")) return "corporate";
  if (message.includes("Surprise")) return "surprise";
  return "personal";
};

export function GiftConcierge() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [occasionLabel, setOccasionLabel] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [customRecipient, setCustomRecipient] = useState<string>("");
  const [suggestedPrompt, setSuggestedPrompt] = useState("");

  // API state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProducts, setCurrentProducts] = useState<EdibleProduct[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Feedback state
  const [feedbackMap, setFeedbackMap] = useState<Map<string, FeedbackType>>(new Map());
  const [selectedProduct, setSelectedProduct] = useState<EdibleProduct | null>(null);

  // Generate suggested prompt from occasion + recipient
  const generatePrompt = (occ: string, rec: Recipient, customRec?: string): string => {
    const occLabel = occasionLabels[occ] || "gift";
    const recLabel = rec === "custom" && customRec ? customRec : recipientLabels[rec as Exclude<Recipient, 'custom'>];
    return `${occLabel} gifts for ${recLabel}`;
  };

  // Step 1: Occasion selected
  const handleOccasionSelect = useCallback((message: string) => {
    setOccasion(message);
    setOccasionLabel(occasionLabels[message] || "Gift");
    setCurrentStep(2);
  }, []);

  // Step 2: Recipient selected
  const handleRecipientSelect = useCallback((rec: Recipient, customText?: string) => {
    setRecipient(rec);
    if (customText) {
      setCustomRecipient(customText);
    }
    if (occasion) {
      setSuggestedPrompt(generatePrompt(occasion, rec, customText));
    }
    setCurrentStep(3);
  }, [occasion]);

  // Step 2 alternative: Natural language query (skip to products)
  const handleNaturalQuery = useCallback(async (query: string) => {
    setIsLoading(true);
    setSuggestedPrompt(query);

    try {
      const response = await sendChatMessage({
        message: query,
        session_id: sessionId,
        history: [],
      });

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        products: response.products,
        timestamp: new Date(),
      };

      setMessages([userMessage, assistantMessage]);

      if (response.products && response.products.length > 0) {
        setCurrentProducts(response.products);
        setFeedbackMap(new Map());
        setCurrentStep(4);
      }
    } catch (error) {
      console.error("Natural query error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Step 3: Prompt submitted - fetch products
  const handlePromptSubmit = useCallback(async (prompt: string, isCustom: boolean) => {
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage({
        message: prompt,
        session_id: sessionId,
        history,
      });

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Add to message history
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt,
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        products: response.products,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      if (response.products && response.products.length > 0) {
        setCurrentProducts(response.products);
        setFeedbackMap(new Map()); // Reset feedback for new products
        setCurrentStep(4);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId]);

  // Step 4: Product feedback
  const handleProductFeedback = useCallback((sku: string, feedback: FeedbackType) => {
    setFeedbackMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(sku, feedback);
      return newMap;
    });
  }, []);

  // Expand product details
  const handleProductExpand = useCallback((product: EdibleProduct) => {
    setSelectedProduct(product);
  }, []);

  // Close product details
  const handleCloseDetails = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  // Handle feedback refinement (when all products have thumbs down)
  const handleFeedbackRefinement = useCallback(async (reason: FeedbackReason, refinement: string) => {
    setIsLoading(true);

    try {
      // Build a refined prompt
      const refinedPrompt = `${suggestedPrompt}, ${refinement}`;

      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage({
        message: refinedPrompt,
        session_id: sessionId,
        history,
      });

      if (response.products && response.products.length > 0) {
        setCurrentProducts(response.products);
        setFeedbackMap(new Map()); // Reset feedback
      }

      // Add to history
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: refinedPrompt,
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        products: response.products,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch (error) {
      console.error("Refinement error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [suggestedPrompt, messages, sessionId]);

  // Navigate to previous step
  const handleStepClick = useCallback((step: WizardStep) => {
    if (step < currentStep) {
      setCurrentStep(step);
      // Reset downstream state
      if (step === 1) {
        setOccasion(null);
        setOccasionLabel(null);
        setRecipient(null);
        setCustomRecipient("");
        setSuggestedPrompt("");
        setCurrentProducts([]);
        setFeedbackMap(new Map());
      } else if (step === 2) {
        setRecipient(null);
        setCustomRecipient("");
        setSuggestedPrompt("");
        setCurrentProducts([]);
        setFeedbackMap(new Map());
      } else if (step === 3) {
        setCurrentProducts([]);
        setFeedbackMap(new Map());
      }
    }
  }, [currentStep]);

  // Check if all visible products have thumbs down
  const allProductsRejected = currentProducts.slice(0, 5).every(
    (p) => feedbackMap.get(p.sku) === "down"
  ) && feedbackMap.size >= Math.min(5, currentProducts.length);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-soft-lg border border-neutral-200 overflow-hidden">
        {/* Step indicator - always visible after step 1 */}
        {currentStep > 1 && (
          <div className="pt-6 px-6">
            <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />
          </div>
        )}

        {/* Main content area */}
        <div className="min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 1: Occasion */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col items-center justify-center p-8"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-edible-red flex items-center justify-center shadow-red-glow animate-float">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
                    What's the occasion?
                  </h3>
                  <p className="text-neutral-500">
                    Let's find the perfect gift together
                  </p>
                </div>

                <OccasionQuickStart onSelect={handleOccasionSelect} />
              </motion.div>
            )}

            {/* Step 2: Recipient */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col items-center justify-center p-8"
              >
                <RecipientStep
                  onSelect={handleRecipientSelect}
                  onNaturalQuery={handleNaturalQuery}
                  selectedOccasion={occasionLabel}
                  occasionType={getOccasionType(occasion)}
                />
                {isLoading && (
                  <div className="mt-4 flex items-center gap-2 text-neutral-600">
                    <div className="animate-spin w-5 h-5 border-2 border-edible-red border-t-transparent rounded-full"></div>
                    <span>Finding gifts...</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Prompt */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col items-center justify-center p-8"
              >
                <PromptStep
                  suggestedPrompt={suggestedPrompt}
                  onSubmit={handlePromptSubmit}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {/* Step 4: Products */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <ProductGrid
                  products={currentProducts}
                  sessionId={sessionId}
                  feedbackMap={feedbackMap}
                  onFeedback={handleProductFeedback}
                  onExpand={handleProductExpand}
                  showFeedbackPrompt={true}
                />

                {/* Feedback options when all rejected */}
                {allProductsRejected && (
                  <div className="p-6 pt-0">
                    <FeedbackOptions
                      onSelect={handleFeedbackRefinement}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back button on steps 2-4 */}
        {currentStep > 1 && (
          <div className="border-t border-neutral-200 p-4 bg-neutral-50">
            <button
              onClick={() => handleStepClick((currentStep - 1) as WizardStep)}
              className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-edible-red transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        )}
      </div>

      {/* Product details modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            sessionId={sessionId}
            onClose={handleCloseDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
