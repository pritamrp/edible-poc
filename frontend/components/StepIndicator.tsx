"use client";

import { WizardStep } from "@/types";
import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
}

const steps = [
  { step: 1 as WizardStep, label: "Occasion" },
  { step: 2 as WizardStep, label: "Recipient" },
  { step: 3 as WizardStep, label: "Describe" },
  { step: 4 as WizardStep, label: "Browse" },
];

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, index) => {
        const isCompleted = s.step < currentStep;
        const isCurrent = s.step === currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <div key={s.step} className="flex items-center">
            {/* Step dot and label */}
            <button
              onClick={() => isClickable && onStepClick(s.step)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300
                ${isClickable ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? "#E10700"
                    : isCurrent
                    ? "#E10700"
                    : "#E5E5E5",
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center
                  shadow-sm transition-shadow duration-300
                  ${isCurrent ? "shadow-red-glow" : ""}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-sm font-medium ${isCurrent ? "text-white" : "text-neutral-500"}`}>
                    {s.step}
                  </span>
                )}
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors duration-300
                  ${isCurrent || isCompleted ? "text-edible-red" : "text-neutral-400"}`}
              >
                {s.label}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="w-8 h-0.5 mx-2 mt-[-18px]">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted ? "#E10700" : "#E5E5E5",
                  }}
                  className="h-full rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
