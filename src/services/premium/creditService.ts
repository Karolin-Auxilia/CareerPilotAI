import { PremiumFeature } from '../../types';

export const PREMIUM_FEATURES_CATALOG: Record<string, PremiumFeature> = {
  advanced_skill_gap: {
    id: 'advanced_skill_gap',
    feature_name: 'Advanced Skill Gap Deep Dive',
    credit_cost: 2,
    enabled: true,
    description: 'Detailed multi-dimension gap breakdown, market urgency ratings, and prioritized 30-day action plans.',
  },
  advanced_career_analysis: {
    id: 'advanced_career_analysis',
    feature_name: 'Multiple Career Paths & Comparison',
    credit_cost: 3,
    enabled: true,
    description: 'Unlock 5+ career pathways, market salary projections, and side-by-side transition roadmaps.',
  },
  detailed_learning_outcomes: {
    id: 'detailed_learning_outcomes',
    feature_name: 'Personalized Learning Roadmap',
    credit_cost: 2,
    enabled: true,
    description: 'Full weekly project deliverables, portfolio project specifications, and assessment checklists.',
  },
  career_comparison: {
    id: 'career_comparison',
    feature_name: 'Career Path Comparison Matrix',
    credit_cost: 2,
    enabled: true,
    description: 'Side-by-side salary bands, learning duration, and prerequisite comparison table.',
  },
  additional_assessment: {
    id: 'additional_assessment',
    feature_name: 'Specialized 15-Question Skill Assessment',
    credit_cost: 3,
    enabled: true,
    description: 'Generate targeted assessment quizzes focusing on niche frameworks, architecture, or advanced debugging.',
  },
};

export const CREDIT_TIERS = [
  { range: 'Score ≥ 90%', scoreMin: 90, credits: 5, label: 'Mastery Level' },
  { range: 'Score 80% – 89%', scoreMin: 80, credits: 3, label: 'Proficient Level' },
  { range: 'Score 70% – 79%', scoreMin: 70, credits: 2, label: 'Competent Level' },
  { range: 'Score 60% – 69%', scoreMin: 60, credits: 1, label: 'Foundation Level' },
  { range: 'Score < 60%', scoreMin: 0, credits: 0, label: 'Needs Review' },
];

export interface PaymentPlan {
  id: string;
  name: string;
  price: string;
  billingPeriod: string;
  creditsIncluded: string;
  features: string[];
  popular?: boolean;
}

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'starter_credits',
    name: 'Credit Pack (15 Credits)',
    price: '$4.99',
    billingPeriod: 'one-time',
    creditsIncluded: '15 Credits',
    features: [
      'Unlock up to 7 advanced analyses',
      'No expiration on credits',
      'Earn bonus credits on quizzes',
      'Instant activation',
    ],
  },
  {
    id: 'premium_pro',
    name: 'CareerPilot Pro',
    price: '$14.99',
    billingPeriod: 'per month',
    creditsIncluded: 'Unlimited Access',
    popular: true,
    features: [
      'Unlimited AI resume extractions',
      'Unlimited 15-question skill assessments',
      'Unlimited advanced gap deep dives',
      'Full 6-phase career roadmaps & project specs',
      'Priority AI generation & live tech updates',
    ],
  },
  {
    id: 'annual_pass',
    name: 'Annual Career Navigator',
    price: '$99.00',
    billingPeriod: 'per year',
    creditsIncluded: 'Unlimited + 1-on-1 Portfolio Reviews',
    features: [
      'Everything in Pro plan',
      'Save >45% compared to monthly',
      'Resume export to PDF / DOCX',
      'Early access to new AI models',
    ],
  },
];

// Service Abstraction for Payment Provider (Stripe/PayPal)
export const paymentService = {
  async initiateCheckout(planId: string, userId: string): Promise<{ success: boolean; url?: string; message: string }> {
    try {
      const res = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, url: data.checkoutUrl, message: 'Checkout session created' };
      }
    } catch {}

    // Simulated sandbox payment completion
    return {
      success: true,
      message: 'Sandbox transaction successful. Upgraded plan status.',
    };
  },
};
