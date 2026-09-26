import type { BusinessHours, PlanLimits } from '@haazir/shared'

/**
 * Plans exactly as priced in the spec (§1). Changing these numbers is a pricing
 * decision for Pratap, not a code change — after launch, edit them in
 * super admin instead of here.
 */
export const PLANS: {
  code: string
  name: string
  setupFeePaise: number
  monthlyPaise: number
  sort: number
  limits: PlanLimits
}[] = [
  {
    code: 'starter',
    name: 'Starter',
    setupFeePaise: 7_999_00,
    monthlyPaise: 2_499_00,
    sort: 1,
    limits: {
      numbers: 1,
      seats: 2,
      aiReplies: 1_500,
      campaigns: 1,
      features: ['faq_bot', 'leads'],
    },
  },
  {
    code: 'growth',
    name: 'Growth',
    setupFeePaise: 19_999_00,
    monthlyPaise: 4_999_00,
    sort: 2,
    limits: {
      numbers: 1,
      seats: 5,
      aiReplies: 5_000,
      campaigns: 4,
      features: ['faq_bot', 'leads', 'courses', 'demo_booking', 'fee_reminders'],
    },
  },
  {
    code: 'pro',
    name: 'Pro',
    setupFeePaise: 39_999_00,
    monthlyPaise: 9_999_00,
    sort: 3,
    limits: {
      numbers: 3,
      seats: 15,
      aiReplies: 15_000,
      campaigns: null, // assumption: "everything" means no monthly campaign cap
      features: [
        'faq_bot',
        'leads',
        'courses',
        'demo_booking',
        'fee_reminders',
        'sheets_sync',
        'priority_support',
      ],
    },
  },
]

const weekday = { open: '08:00', close: '20:00' }

export const DEMO_ORG = {
  name: 'Shiksha Computer Institute',
  slug: 'shiksha-computer-sikar',
  vertical: 'coaching' as const,
  city: 'Sikar',
  state: 'Rajasthan',
  address: 'Station Road, Sikar, Rajasthan 332001',
  defaultLanguage: 'hinglish' as const,
  status: 'active' as const,
  businessHours: {
    mon: weekday,
    tue: weekday,
    wed: weekday,
    thu: weekday,
    fri: weekday,
    sat: weekday,
    sun: { open: '09:00', close: '13:00' },
  } satisfies BusinessHours,
  brand: { displayName: 'Shiksha Computer, Sikar' },
  onboardingStep: 8,
}

// `.example` addresses can never reach a real inbox.
export const DEMO_USERS = {
  owner: { name: 'Rakesh Sharma', email: 'rakesh@shiksha.example', uiLanguage: 'hi' as const },
  staff: { name: 'Pooja Verma', email: 'pooja@shiksha.example', uiLanguage: 'hi' as const },
  superAdmin: { name: 'Pratap', email: 'pratap@haazir.example', uiLanguage: 'en' as const },
}
