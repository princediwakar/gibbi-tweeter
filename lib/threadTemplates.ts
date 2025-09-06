/**
 * Thread Template System for Indian Business Storytelling
 * 10 comprehensive templates with emotional depth and strategic insights
 */

export interface ThreadTemplate {
  name: string;
  displayName: string;
  story_prompt: string;
  description: string;
}

// 1. Founder Struggle Template
export const FOUNDER_STRUGGLE_TEMPLATE: ThreadTemplate = {
  name: 'founder_struggle',
  displayName: 'Founder Struggle Journey',
  story_prompt: "Tell the story of an Indian founder who overcame significant personal adversity to build a successful company. Focus on their lowest moments, self-doubt, difficult decisions, and how they persevered. Include emotional depth and the human side of entrepreneurship - family pressure, financial struggles, moments of wanting to give up. End with a universal lesson about resilience.",
  description: 'Personal journey of founders overcoming adversity and self-doubt'
};

// 2. Business Decision Template
export const BUSINESS_DECISION_TEMPLATE: ThreadTemplate = {
  name: 'business_decision',
  displayName: 'Strategic Business Decision',
  story_prompt: "Share a story about a critical business decision made by an Indian business leader that had major long-term consequences. Focus on the context and pressure they were under, the difficult trade-offs they had to consider, why the decision was controversial or risky, and what the ultimate outcome was. Show the human side of strategic decision-making.",
  description: 'Critical business decisions with long-term consequences'
};

// 3. Family Business Dynamics Template
export const FAMILY_BUSINESS_TEMPLATE: ThreadTemplate = {
  name: 'family_business_dynamics',
  displayName: 'Family Business Dynamics',
  story_prompt: "Tell a story about complex family dynamics within an Indian business empire. Focus on generational conflicts, different visions between family members, succession challenges, or family feuds that impacted the business. Include the emotional cost of family conflicts in business, how personal relationships affect business decisions, and what lessons can be learned about managing family businesses.",
  description: 'Complex dynamics within family business empires'
};

// 4. Cross-Era Parallel Template
export const CROSS_ERA_PARALLEL_TEMPLATE: ThreadTemplate = {
  name: 'cross_era_parallel',
  displayName: 'Cross-Era Business Patterns',
  story_prompt: "Draw a fascinating parallel between a historical Indian business strategy or decision and a modern business phenomenon. Show how the same underlying principles or patterns repeat across decades. Connect a business strategy from the 1970s-90s with today's startups or business environment. Make it insightful and show timeless business wisdom.",
  description: 'Drawing parallels between historical and modern business strategies'
};

// 5. Failure Recovery Template
export const FAILURE_RECOVERY_TEMPLATE: ThreadTemplate = {
  name: 'failure_recovery',
  displayName: 'Failure to Recovery Journey',
  story_prompt: "Tell a story of an Indian business that went from great heights to spectacular failure, and potentially recovered (or is trying to). Focus on what led to the peak success, what caused the downfall, the human impact, and lessons about business resilience. Include the emotional journey and what can be learned from both the failure and recovery attempts.",
  description: 'Stories of spectacular failure and potential recovery'
};

// 6. Market Disruption Template
export const MARKET_DISRUPTION_TEMPLATE: ThreadTemplate = {
  name: 'market_disruption',
  displayName: 'Market Disruption Story',
  story_prompt: "Share a story about how an Indian company completely disrupted an entire industry. Focus on what the market looked like before disruption, how the disruptor entered with a different approach, the resistance they faced from incumbents, their breakthrough moment, and the industry transformation that followed. Make it dramatic and show the human audacity behind the disruption.",
  description: 'How companies disrupted entire industries'
};

// 7. Crisis Leadership Template
export const CRISIS_LEADERSHIP_TEMPLATE: ThreadTemplate = {
  name: 'crisis_leadership',
  displayName: 'Crisis Leadership Story',
  story_prompt: "Tell a story about exceptional leadership during a major crisis (economic recession, pandemic, natural disaster, industry crisis, etc.). Focus on how an Indian business leader made difficult decisions under pressure, managed competing stakeholder interests, took personal risks for the greater good, and what the outcome was. Highlight the human side of leadership in crisis.",
  description: 'Leadership during unprecedented crises'
};

// 8. Innovation Breakthrough Template
export const INNOVATION_BREAKTHROUGH_TEMPLATE: ThreadTemplate = {
  name: 'innovation_breakthrough',
  displayName: 'Innovation Breakthrough',
  story_prompt: "Share a story about a moment of innovation or breakthrough that changed an Indian business or industry. Focus on the original problem or frustration, the 'aha moment' or breakthrough insight, how it was implemented despite challenges, and the massive impact it had. Make it feel serendipitous but show the persistence behind the innovation.",
  description: 'Moments of innovation that changed everything'
};

// 9. Cultural Adaptation Template
export const CULTURAL_ADAPTATION_TEMPLATE: ThreadTemplate = {
  name: 'cultural_adaptation',
  displayName: 'Cultural Adaptation Success',
  story_prompt: "Tell a story about how a global company succeeded in India by adapting to local culture, or how an Indian company succeeded globally by understanding cultural nuances. Focus on the initial cultural challenges or failures, the key insights about local preferences, the adaptation strategy, and the successful results. Show why cultural intelligence matters in business.",
  description: 'How companies succeeded through cultural adaptation'
};

// 10. Succession Story Template
export const SUCCESSION_STORY_TEMPLATE: ThreadTemplate = {
  name: 'succession_story',
  displayName: 'Business Succession Story',
  story_prompt: "Share a complex business succession story from Indian business families or companies. Focus on the founder's legacy, the succession challenges, competing visions between generations or potential successors, the transition strategy chosen, what worked and what didn't, and lessons about preserving business culture and values across generations.",
  description: 'Complex succession stories in Indian business families'
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
    template.story_prompt.length > 0 &&
    template.displayName.length > 0 &&
    template.name.length > 0
  );
}

export default THREAD_TEMPLATES;