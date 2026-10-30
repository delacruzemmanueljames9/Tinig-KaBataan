import { SupportMode, CommunicationTone, SandiganLanguage } from '@/types/sandigan';
import { verifiedBataanServices } from './store';

export interface SandiganChatResponse {
  reply: string;
  isCrisis: boolean;
  activeMode: SupportMode;
  safeguardingOfficer: 'GABAY' | 'AMARA';
  suggestedActions?: { label: string; action: string; path?: string }[];
  urgentFlagDetails?: string;
}

const CRITICAL_CRISIS_KEYWORDS = [
  'kill myself',
  'suicide',
  'end my life',
  'end it all',
  'want to die',
  'better off dead',
  'cut myself',
  'self harm',
  'hang myself',
  'overdose',
  'magpakamatay',
  'ayaw ko na mabuhay',
  'gusto ko na mamatay',
  'saktan ang sarili',
  'tapusin na lahat',
];

export async function processSandiganChat(params: {
  message: string;
  mode: SupportMode;
  tone: CommunicationTone;
  language: SandiganLanguage;
  preferredName?: string;
  anonymousId: string;
  history?: { sender: string; text: string }[];
}): Promise<SandiganChatResponse> {
  const { message, mode, tone, language, preferredName } = params;
  const normalized = message.toLowerCase();

  // 1. GABAY Crisis Screening Check
  const isCrisisTriggered = CRITICAL_CRISIS_KEYWORDS.some(kw => normalized.includes(kw));

  if (isCrisisTriggered) {
    const greeting = preferredName ? `${preferredName}, ` : '';
    const crisisReply = `${greeting}I hear how deeply heavy and painful things are for you right now, and I want to tell you: **You don't have to carry this alone.** 💙\n\nYour life and your safety matter above all else. Because you deserve immediate care from real, licensed human professionals, please reach out right now:\n\n📞 **Bataan Emergency:** Mariveles Mental Wellness and General Hospital (MMWGH) Crisis Desk: **(047) 935-4661** or **0968-854-3858**\n📞 **National Center for Mental Health (NCMH):** Dial **1553** (Toll-Free Nationwide 24/7) or mobile **0917-899-8727**\n📞 **Hopeline Philippines:** **0917-558-4673** or **(02) 8804-4673**\n\nWould you like me to guide you through a gentle 3-minute grounding exercise while you connect, or help you open your private Safety Plan?`;

    return {
      reply: crisisReply,
      isCrisis: true,
      activeMode: mode,
      safeguardingOfficer: 'GABAY',
      suggestedActions: [
        { label: 'Call NCMH 1553', action: 'call', path: 'tel:1553' },
        { label: 'Call MMWGH Bataan', action: 'call', path: 'tel:0479354661' },
        { label: 'Open My Safety Plan', action: 'navigate', path: '/sandigan/safety-plan' },
        { label: 'Reset Room Grounding', action: 'navigate', path: '/sandigan/reset-room' },
      ],
      urgentFlagDetails: 'Crisis escalation protocol triggered by GABAY. Logged for Founder notification.',
    };
  }

  // 2. Check for configured Gemini API key on server
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.length > 10 && apiKey !== 'your-gemini-api-key-here') {
    try {
      const systemPrompt = `
You are "Talk to Tinig" under PROJECT SANDIGAN (An Official Project of Tinig KaBataan).
Founder & Developer: Emmanuel James C. Dela Cruz.
Tagline: "You don't have to carry it alone."

CORE ETHICAL BOUNDARIES:
- You are an empathetic digital companion, NOT a licensed doctor or therapist.
- NEVER diagnose any condition or prescribe treatments.
- User's Preferred Name: ${preferredName || 'Friend'}.
- Active Support Mode: ${mode === 'listening' ? 'LISTENING MODE (Validate, empathize, hold emotional space, do not jump to advice unless requested)' : 'GUIDANCE MODE (Provide gentle coping suggestions, structured reflection, and practical next steps)'}.
- Preferred Tone: ${tone}.
- Preferred Language Style: ${language === 'fil' ? 'Pure Filipino / Tagalog' : language === 'taglish' ? 'Warm Filipino-English (Taglish) natural to Filipino youth' : 'English'}.
- Bataan Focus: When recommending physical clinics, prioritize verified Bataan institutions (Mariveles Mental Wellness Hospital and BGHMC Balanga).
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Message: "${message}"` }],
              },
            ],
            generationConfig: {
              temperature: mode === 'listening' ? 0.6 : 0.7,
              maxOutputTokens: 400,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText) {
          return {
            reply: geminiText,
            isCrisis: false,
            activeMode: mode,
            safeguardingOfficer: 'AMARA',
            suggestedActions: [
              { label: 'Reset Room', action: 'navigate', path: '/sandigan/reset-room' },
              { label: 'Inner Garden', action: 'navigate', path: '/sandigan/inner-garden' },
            ],
          };
        }
      }
    } catch (err) {
      console.warn('Gemini inference error in Sandigan, applying rule-based engine:', err);
    }
  }

  // 3. Compassionate Rule-Based Fallback Engine
  const namePrefix = preferredName ? `${preferredName}, ` : '';
  let fallbackText = '';

  if (mode === 'listening') {
    // Listening Mode: Validation, holding space, compassionate presence
    if (normalized.includes('tired') || normalized.includes('pagod') || normalized.includes('exhaust')) {
      fallbackText = `${namePrefix}I hear you. Deep emotional and physical tiredness is so real, and it makes total sense that you feel this way right now. You have been carrying so much on your shoulders. \n\nI am right here with you. Take all the time you need to just breathe and rest. You don't have to explain anything or have everything figured out right this second. What feels heaviest on your heart today?`;
    } else if (normalized.includes('anxious') || normalized.includes('panic') || normalized.includes('kaba') || normalized.includes('worry')) {
      fallbackText = `${namePrefix}It sounds like your nervous system is in overdrive right now, and that feeling of anxiousness can feel so overwhelming. \n\nTake a slow, gentle breath. Let your shoulders drop. Your feelings are completely valid, and you are in a safe space here. Would you like to tell me what triggered this, or would you simply prefer to sit with me for a moment?`;
    } else if (normalized.includes('alone') || normalized.includes('lonely') || normalized.includes('nobody') || normalized.includes('mag-isa')) {
      fallbackText = `${namePrefix}Feeling isolated can make everything around you seem quiet and heavy. It's so easy for our minds to whisper that we are a burden or that no one understands. \n\nI want to remind you: you are seen here. In Project Sandigan, you don't have to carry it alone. I am listening whenever you're ready to share.`;
    } else {
      fallbackText = `${namePrefix}Thank you for opening up to me. Whatever you are feeling right now—whether you can put it into words or not—your experience matters. \n\nThis is your space to let it out without judgment. I am here listening.`;
    }
  } else {
    // Guidance Mode: Actionable coping steps, reframing, and tools
    if (normalized.includes('burnout') || normalized.includes('school') || normalized.includes('study') || normalized.includes('exam')) {
      fallbackText = `${namePrefix}Academic burnout can feel relentless, especially with tight deadlines and high expectations. Here are three gentle steps we can take right now:\n\n1. **Step away for 5 minutes:** Drink a cool glass of water.\n2. **Break it into tiny fractions:** Pick just ONE tiny paragraph or task for 10 minutes.\n3. **Remember your inherent worth:** You are a human being before you are a student.\n\nWould you like to step into our **Reset Room** for 3 minutes of Box Breathing, or jot your worries down in the **Inner Garden**?`;
    } else if (normalized.includes('bataan') || normalized.includes('clinic') || normalized.includes('doctor') || normalized.includes('help')) {
      fallbackText = `${namePrefix}If you are seeking physical or subsidized consultation in Bataan, verified options are available:\n\n• **Mariveles Mental Wellness and General Hospital (MMWGH):** (047) 935-4661\n• **Bataan General Hospital and Medical Center (BGHMC Balanga):** (047) 237-9770\n\nWould you like me to open the **Find Support Directory** or prepare an anonymous referral summary for you?`;
    } else {
      fallbackText = `${namePrefix}I hear what you're facing. When things feel tangled, focusing on what you can regulate in this exact moment can bring relief. \n\nWould you like to try a 2-minute sensory grounding exercise (5-4-3-2-1), check your **My Safety Plan**, or continue discussing options together?`;
    }
  }

  return {
    reply: fallbackText,
    isCrisis: false,
    activeMode: mode,
    safeguardingOfficer: 'AMARA',
    suggestedActions: [
      { label: 'Try Reset Room', action: 'navigate', path: '/sandigan/reset-room' },
      { label: 'Inner Garden Journal', action: 'navigate', path: '/sandigan/inner-garden' },
      { label: 'Find Support (Bataan)', action: 'navigate', path: '/sandigan/find-support' },
    ],
  };
}
