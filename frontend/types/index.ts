export type Occasion = 'birthday' | 'sympathy' | 'anniversary' | 'corporate' | 'thank_you' | 'other';
export type Urgency = 'today' | 'this_week' | 'flexible';
export type Budget = 'low' | 'mid' | 'high';

export interface ExtractedIntent {
  occasion: Occasion | null;
  urgency: Urgency | null;
  recipient: string | null;
  budget: Budget | null;
  dietary: string[];
  keywords: string[];
  needs_clarification: boolean;
  clarifying_question: string | null;
  confidence: number;
}

export interface EdibleProduct {
  sku: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  tags: string[];
  pdp_url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: EdibleProduct[];
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  session_id: string | null;
  history: { role: string; content: string }[];
}

export interface ChatResponse {
  reply: string;
  products: EdibleProduct[];
  intent: ExtractedIntent;
  session_id: string;
}

export interface OccasionOption {
  id: Occasion | 'surprise';
  label: string;
  emoji: string;
  message: string;
}

// Wizard Flow Types
export type WizardStep = 1 | 2 | 3 | 4;
export type PersonalRecipient = 'spouse' | 'parents' | 'siblings' | 'friends';
export type CorporateRecipient = 'colleague' | 'client' | 'boss' | 'team';
export type Recipient = PersonalRecipient | CorporateRecipient | 'custom';
export type FeedbackType = 'up' | 'down' | null;
export type FeedbackReason = 'too_expensive' | 'wrong_style' | 'want_different' | 'other';
export type OccasionType = 'personal' | 'corporate' | 'surprise';

export interface WizardState {
  currentStep: WizardStep;
  occasion: string | null;
  recipient: Recipient | null;
  customRecipient: string;
  suggestedPrompt: string;
  customPrompt: string;
  useCustomPrompt: boolean;
}

export interface ProductFeedback {
  sku: string;
  feedback: FeedbackType;
  reason?: FeedbackReason;
}

export interface RecipientOption {
  id: Recipient;
  label: string;
  icon: string;
}

export interface FeedbackOption {
  id: FeedbackReason;
  label: string;
  refinement: string;
}
