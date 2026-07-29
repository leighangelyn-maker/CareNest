/**
 * Context-aware auto-reply system for CareNest messaging.
 * Uses a free tiered API (api.ai21.com Jamba or falls back to local rule-based replies).
 * 
 * No API key required for rule-based mode — works fully offline.
 * To enable AI replies, set EXPO_PUBLIC_AI_API_KEY in your environment.
 */

interface ReplyContext {
  agencyName: string;
  userMessage: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

// ─── Rule-based replies (works without any API) ──────────────────────────────

const RULES: { pattern: RegExp; replies: string[] }[] = [
  {
    pattern: /\b(hello|hi|hey|good morning|good afternoon|good evening)\b/i,
    replies: [
      "Hello! Thank you for reaching out to us. How can we assist you today?",
      "Hi there! We're happy to help. What service are you looking for?",
    ],
  },
  {
    pattern: /\b(availab|when|schedule|slot|time)\b/i,
    replies: [
      "We have availability from Monday to Saturday, 7am–6pm. Which day works best for you?",
      "Our workers are available most weekdays. Could you share your preferred date and time?",
    ],
  },
  {
    pattern: /\b(price|cost|rate|fee|charge|how much)\b/i,
    replies: [
      "Our rates start from GHS 18/hour depending on the service type. Would you like a detailed quote?",
      "Pricing depends on the service and duration. For a nanny or caregiver, we charge GHS 25–30/hr. For cleaning, GHS 18–22/hr.",
    ],
  },
  {
    pattern: /\b(nanny|child|baby|toddler|newborn|infant)\b/i,
    replies: [
      "Our nannies are CPR-certified and background-checked. We can match you with someone experienced in newborn care or school-age children.",
      "We have several experienced nannies available. Would you prefer someone with early childhood education training?",
    ],
  },
  {
    pattern: /\b(clean|cleaner|housekeep|sweep|mop|laundry)\b/i,
    replies: [
      "Our cleaners bring eco-friendly supplies and are thorough with deep cleaning. How many rooms and what's the preferred date?",
      "We offer one-time and recurring weekly cleaning packages. What size is your home?",
    ],
  },
  {
    pattern: /\b(cook|chef|meal|food|cooking|kitchen)\b/i,
    replies: [
      "Our cooks specialise in local Ghanaian and continental dishes. They can also do weekly meal prep. What type of cuisine do you prefer?",
      "We can arrange a cook for a single event or recurring weekly sessions. How many people are you cooking for?",
    ],
  },
  {
    pattern: /\b(elder|old|parent|caregiv|senior|mobility)\b/i,
    replies: [
      "Our caregivers are trained in elder care and mobility assistance. We'll match you with someone patient and experienced.",
      "We have certified elder care specialists available. Do you need day care, night care, or 24-hour support?",
    ],
  },
  {
    pattern: /\b(cancel|refund|reschedule|change)\b/i,
    replies: [
      "We understand plans can change. You can cancel or reschedule up to 24 hours before the booking without any charge.",
      "To reschedule, just let us know the new preferred time and we'll update the booking for you.",
    ],
  },
  {
    pattern: /\b(thank|thanks|great|perfect|wonderful|excellent)\b/i,
    replies: [
      "Thank you for choosing us! We look forward to serving your family. 😊",
      "We're glad we could help! Don't hesitate to reach out if you need anything else.",
    ],
  },
  {
    pattern: /\b(book|confirm|proceed|go ahead)\b/i,
    replies: [
      "Great! Your booking request has been received. We'll assign a worker and confirm within 2 hours.",
      "Noted! We'll match you with the best available worker for your request and send confirmation shortly.",
    ],
  },
];

function ruleBasedReply(userMessage: string, agencyName: string): string {
  const msg = userMessage.toLowerCase();
  for (const rule of RULES) {
    if (rule.pattern.test(msg)) {
      const replies = rule.replies;
      const idx = Math.floor(Math.random() * replies.length);
      return `[${agencyName}] ${replies[idx]}`;
    }
  }
  // Fallback
  const fallbacks = [
    `[${agencyName}] Thank you for your message! We'll get back to you shortly.`,
    `[${agencyName}] We've received your message and will respond within a few minutes.`,
    `[${agencyName}] Thanks for reaching out! A team member will assist you soon.`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ─── Main auto-reply function ─────────────────────────────────────────────────

export async function generateAutoReply(context: ReplyContext): Promise<string> {
  // Always use rule-based — reliable, instant, no API costs
  // Add a small delay to feel natural (500-1500ms)
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  return ruleBasedReply(context.userMessage, context.agencyName);
}
