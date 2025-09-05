/**
 * Thread Template System for Indian Business Storytelling
 * 10 comprehensive templates with emotional depth and strategic insights
 */

export interface ThreadTemplate {
  name: string;
  displayName: string;
  target_tweets: number;
  structure: string[];
  description: string;
  example: Record<string, string>;
  hashtags: string[];
  hook_patterns: string[];
}

// 1. Founder Struggle Template (6 tweets)
export const FOUNDER_STRUGGLE_TEMPLATE: ThreadTemplate = {
  name: 'founder_struggle',
  displayName: 'Founder Struggle Journey',
  target_tweets: 6,
  structure: ['hook', 'background', 'crisis', 'internal_struggle', 'decision', 'lesson'],
  description: 'Personal journey of founders overcoming adversity and self-doubt',
  example: {
    hook: "Vijay Shekhar Sharma was living in a Delhi slum when he got his first business idea.",
    background: "2000: 22-year-old from small UP town, big Silicon Valley dreams.",
    crisis: "2008 recession: His first startup failed, lost family money, wife pregnant.",
    internal_struggle: "The sleepless nights: 'Am I fooling myself? Should I get a job?'",
    decision: "Started One97 from a tiny apartment with borrowed money.",
    lesson: "Today: Paytm founder worth $2B. Sometimes your lowest point becomes your launching pad."
  },
  hashtags: ['#FounderJourney', '#Entrepreneurship', '#StartupStruggles', '#Success'],
  hook_patterns: [
    "{name} was {struggling_situation} when {opportunity_moment}",
    "Before becoming {current_status}, {name} faced {major_challenge}",
    "The story of how {name} went from {low_point} to {high_point}"
  ]
};

// 2. Business Decision Template (5 tweets)
export const BUSINESS_DECISION_TEMPLATE: ThreadTemplate = {
  name: 'business_decision',
  displayName: 'Strategic Business Decision',
  target_tweets: 5,
  structure: ['hook', 'context', 'analysis', 'decision', 'outcome'],
  description: 'Critical business decisions with long-term consequences',
  example: {
    hook: "Ratan Tata rejected Ford's $50B offer for Tata Motors in 2008.",
    context: "Financial crisis, banks calling loans, board wanted to sell everything.",
    analysis: "Decision factors: National pride vs financial safety, long-term vision vs short-term survival.",
    decision: "Kept Jaguar-Land Rover, survived the crisis with internal restructuring.",
    outcome: "Result: JLR now contributes 25% of Tata's revenue, validated Indian automotive capability."
  },
  hashtags: ['#BusinessDecisions', '#Leadership', '#Strategy', '#TataGroup'],
  hook_patterns: [
    "{leader} made a {decision_type} decision that {impact_description}",
    "In {year}, {company} faced {critical_choice} that would {determine_future}",
    "The {amount/scale} decision that {outcome_preview}"
  ]
};

// 3. Family Business Dynamics Template (7 tweets)
export const FAMILY_BUSINESS_TEMPLATE: ThreadTemplate = {
  name: 'family_business_dynamics',
  displayName: 'Family Business Dynamics',
  target_tweets: 7,
  structure: ['hook', 'family_context', 'generational_conflict', 'crisis_point', 'resolution_attempt', 'outcome', 'lesson'],
  description: 'Complex dynamics within family business empires',
  example: {
    hook: "The Ambani brothers' split created two $50B companies from one empire.",
    family_context: "Dhirubhai's vision: Keep the family and business united forever.",
    generational_conflict: "Mukesh (introvert, strategic) vs Anil (extrovert, aggressive). Different visions for growth.",
    crisis_point: "2005: Public feud, stock market confusion, family reputation at stake.",
    resolution_attempt: "Mother Kokilaben's intervention: Divide the empire to save the family.",
    outcome: "Mukesh: Telecom + Retail ($90B), Anil: Infrastructure + Finance ($5B).",
    lesson: "Sometimes division creates more value than unity, but the human cost is immeasurable."
  },
  hashtags: ['#FamilyBusiness', '#AmbaniBrothers', '#BusinessHistory', '#Succession'],
  hook_patterns: [
    "The {family_name} {conflict/event} that {outcome_description}",
    "How {family_patriarch}'s {vision/decision} led to {unexpected_outcome}",
    "The {scale} family business {event} that changed {industry/market}"
  ]
};

// 4. Cross-Era Parallel Template (5 tweets)
export const CROSS_ERA_PARALLEL_TEMPLATE: ThreadTemplate = {
  name: 'cross_era_parallel',
  displayName: 'Cross-Era Business Patterns',
  target_tweets: 5,
  structure: ['hook', 'historical_example', 'modern_parallel', 'pattern', 'application'],
  description: 'Drawing parallels between historical and modern business strategies',
  example: {
    hook: "Dhirubhai Ambani's 1970s strategy predicted every modern fintech startup.",
    historical_example: "1970s: Used informal 'hawala' networks when banks wouldn't lend to him.",
    modern_parallel: "2020s: Fintech startups use 'alternative credit scoring' when banks won't lend.",
    pattern: "Same principle: Build trust networks when institutions fail you.",
    application: "Whether 1970s polyester or 2020s payments, the formula works: Trust + Innovation + Persistence."
  },
  hashtags: ['#BusinessHistory', '#PatternRecognition', '#Innovation', '#Timeless'],
  hook_patterns: [
    "{historical_figure}'s {era} strategy {prediction/parallel} {modern_phenomenon}",
    "The {time_period} business lesson that explains {current_trend}",
    "How {historical_event} predicted {modern_business_pattern}"
  ]
};

// 5. Failure Recovery Template (6 tweets)
export const FAILURE_RECOVERY_TEMPLATE: ThreadTemplate = {
  name: 'failure_recovery',
  displayName: 'Failure to Recovery Journey',
  target_tweets: 6,
  structure: ['hook', 'peak_success', 'downfall', 'rock_bottom', 'comeback_strategy', 'lesson'],
  description: 'Stories of spectacular failure and potential recovery',
  example: {
    hook: "Byju Raveendran went from $22B valuation to insolvency in 18 months.",
    peak_success: "2021: World's most valuable edtech company, 150M users, global expansion.",
    downfall: "WhiteHat Jr acquisition disaster, audit delays, governance breakdown.",
    rock_bottom: "2024: Insolvency proceedings, investors fleeing, reputation destroyed.",
    comeback_strategy: "Lesson in progress: Can Indian founders recover from public spectacular failure?",
    lesson: "Success without systems is just luck waiting to run out."
  },
  hashtags: ['#FailureStories', '#BusinessLessons', '#Resilience', '#StartupReality'],
  hook_patterns: [
    "{name} went from {peak_achievement} to {failure_state} in {timeframe}",
    "The {scale} rise and fall of {company/founder}",
    "How {success_metric} became {failure_outcome} - {business_name} story"
  ]
};

// 6. Market Disruption Template (6 tweets)
export const MARKET_DISRUPTION_TEMPLATE: ThreadTemplate = {
  name: 'market_disruption',
  displayName: 'Market Disruption Story',
  target_tweets: 6,
  structure: ['hook', 'market_status_quo', 'disruptor_entry', 'resistance', 'breakthrough', 'transformation'],
  description: 'How companies disrupted entire industries',
  example: {
    hook: "Jio gave free internet to 400M Indians and still made billions.",
    market_status_quo: "2016: Airtel, Vodafone charging ₹250/GB, 2G speeds, limited coverage.",
    disruptor_entry: "Mukesh Ambani's bet: Free 4G for 6 months, unlimited calls forever.",
    resistance: "Competitors called it 'predatory', filed lawsuits, claimed it was impossible.",
    breakthrough: "400M users in 12 months, forced entire industry to cut prices 90%.",
    transformation: "Result: India became world's largest data consumer, enabled digital revolution."
  },
  hashtags: ['#MarketDisruption', '#Jio', '#DigitalIndia', '#Innovation'],
  hook_patterns: [
    "{company} {disruption_action} and {surprising_outcome}",
    "How {company} destroyed {industry} by {strategy}",
    "The {scale} disruption that {market_transformation}"
  ]
};

// 7. Crisis Leadership Template (7 tweets)
export const CRISIS_LEADERSHIP_TEMPLATE: ThreadTemplate = {
  name: 'crisis_leadership',
  displayName: 'Crisis Leadership Story',
  target_tweets: 7,
  structure: ['hook', 'crisis_context', 'immediate_response', 'difficult_decisions', 'stakeholder_management', 'outcome', 'leadership_lesson'],
  description: 'Leadership during unprecedented crises',
  example: {
    hook: "When COVID hit, Harsh Mariwala made a decision that saved his entire supply chain.",
    crisis_context: "March 2020: Lockdown announced, Marico's rural suppliers facing bankruptcy.",
    immediate_response: "Within 24 hours: Advanced payments to all suppliers, no questions asked.",
    difficult_decisions: "Used company's cash reserves, risked Marico's own liquidity position.",
    stakeholder_management: "Convinced board: 'We survive together or fail separately.'",
    outcome: "Result: Zero supply disruption, suppliers stayed loyal, competitors struggled for months.",
    leadership_lesson: "True leadership isn't about protecting yourself first, it's about protecting your ecosystem."
  },
  hashtags: ['#CrisisLeadership', '#COVID19', '#SupplyChain', '#Leadership'],
  hook_patterns: [
    "When {crisis} hit, {leader} made {decision_type} that {outcome}",
    "During {crisis_period}, {leader}'s {action} {result_preview}",
    "The {crisis} decision that {defined/saved} {company/industry}"
  ]
};

// 8. Innovation Breakthrough Template (5 tweets)
export const INNOVATION_BREAKTHROUGH_TEMPLATE: ThreadTemplate = {
  name: 'innovation_breakthrough',
  displayName: 'Innovation Breakthrough',
  target_tweets: 5,
  structure: ['hook', 'problem', 'breakthrough_moment', 'implementation', 'impact'],
  description: 'Moments of innovation that changed everything',
  example: {
    hook: "A Bangalore traffic jam inspired India's biggest fintech breakthrough.",
    problem: "2010: Vijay Shekhar Sharma stuck in traffic, needed to recharge phone, no cash.",
    breakthrough_moment: "'What if we could pay for everything with just a phone number?'",
    implementation: "Built mobile recharge platform, then expanded to bill payments, then to everything.",
    impact: "Today: Paytm processes $100B+ annually, digitized millions of small merchants."
  },
  hashtags: ['#Innovation', '#Fintech', '#Paytm', '#DigitalPayments'],
  hook_patterns: [
    "A {everyday_situation} inspired {breakthrough_description}",
    "The {moment/incident} that led to {innovation}",
    "{simple_problem} became the inspiration for {major_innovation}"
  ]
};

// 9. Cultural Adaptation Template (6 tweets)
export const CULTURAL_ADAPTATION_TEMPLATE: ThreadTemplate = {
  name: 'cultural_adaptation',
  displayName: 'Cultural Adaptation Success',
  target_tweets: 6,
  structure: ['hook', 'cultural_challenge', 'local_insight', 'adaptation_strategy', 'result', 'universal_principle'],
  description: 'How global companies succeeded by adapting to Indian culture',
  example: {
    hook: "McDonald's failed in India until they learned one cultural lesson.",
    cultural_challenge: "1990s entry: Beef burgers in Hindu-majority country, expensive pricing for local market.",
    local_insight: "Indians want flavors, variety, and value - not standardized global menu.",
    adaptation_strategy: "Created Maharaja Mac (chicken), McAloo Tikki, ₹20 price points, local sourcing.",
    result: "Today: 400+ outlets, ₹2000 crore revenue, Indian menu exported globally.",
    universal_principle: "Global brand success requires local cultural intelligence, not just marketing translation."
  },
  hashtags: ['#CulturalAdaptation', '#GlobalLocal', '#McDonald', '#IndianMarket'],
  hook_patterns: [
    "{global_company} failed in India until {cultural_learning}",
    "How {company} cracked the Indian market by {adaptation_strategy}",
    "The {cultural_insight} that transformed {company}'s India strategy"
  ]
};

// 10. Succession Story Template (7 tweets)
export const SUCCESSION_STORY_TEMPLATE: ThreadTemplate = {
  name: 'succession_story',
  displayName: 'Business Succession Story',
  target_tweets: 7,
  structure: ['hook', 'patriarch_legacy', 'succession_challenge', 'competing_visions', 'transition_strategy', 'outcome', 'succession_wisdom'],
  description: 'Complex succession stories in Indian business families',
  example: {
    hook: "N.R. Narayana Murthy's Infosys succession became a template for Indian IT.",
    patriarch_legacy: "1980s-2000s: Built Infosys from garage startup to $100B company with strong governance.",
    succession_challenge: "How to transition from founder-CEO to professional leadership without losing culture?",
    competing_visions: "Founders wanted continuity, new generation wanted aggressive growth, board wanted stability.",
    transition_strategy: "Gradual handover: Murthy as Chairman, professional CEOs, founder oversight on values.",
    outcome: "Mixed results: Growth continued, but cultural dilution and founder conflicts emerged.",
    succession_wisdom: "Succession isn't just about finding next CEO, it's about preserving institutional DNA."
  },
  hashtags: ['#Succession', '#Infosys', '#Leadership', '#CorporateGovernance'],
  hook_patterns: [
    "{founder}'s succession at {company} became {template/example}",
    "How {company} handled {succession_challenge}",
    "The {complexity} succession story of {business_empire}"
  ]
};

// Template registry
export const THREAD_TEMPLATES: Record<string, ThreadTemplate> = {
  founder_struggle: FOUNDER_STRUGGLE_TEMPLATE,
  business_decision: BUSINESS_DECISION_TEMPLATE,
  family_business_dynamics: FAMILY_BUSINESS_TEMPLATE,
  cross_era_parallel: CROSS_ERA_PARALLEL_TEMPLATE,
  failure_recovery: FAILURE_RECOVERY_TEMPLATE,
  market_disruption: MARKET_DISRUPTION_TEMPLATE,
  crisis_leadership: CRISIS_LEADERSHIP_TEMPLATE,
  innovation_breakthrough: INNOVATION_BREAKTHROUGH_TEMPLATE,
  cultural_adaptation: CULTURAL_ADAPTATION_TEMPLATE,
  succession_story: SUCCESSION_STORY_TEMPLATE
};

// Utility functions
export function getThreadTemplate(templateName: string): ThreadTemplate | undefined {
  return THREAD_TEMPLATES[templateName];
}

export function getAllThreadTemplates(): ThreadTemplate[] {
  return Object.values(THREAD_TEMPLATES);
}

export function getRandomThreadTemplate(): ThreadTemplate {
  const templates = getAllThreadTemplates();
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

export function getThreadTemplatesByPersona(personaKey: string): ThreadTemplate[] {
  if (personaKey === 'business_storyteller') {
    return getAllThreadTemplates();
  }
  return [];
}

// Template structure validation
export function validateThreadStructure(template: ThreadTemplate): boolean {
  return (
    template.structure.length === template.target_tweets &&
    template.structure.length > 0 &&
    template.example &&
    Object.keys(template.example).length === template.structure.length
  );
}

export default THREAD_TEMPLATES;