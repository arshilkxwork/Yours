export const DAILY_QUOTES = [
  "Small steps every day lead to big changes.",
  "Peace is found in the stillness of the present moment.",
  "Simplicity is the keynote of all true elegance.",
  "Quiet the mind, and the soul will speak.",
  "Focus on the journey, not just the destination.",
  "Clarity comes from engagement, not thought alone.",
  "Every morning is a clean canvas waiting for your intention.",
  "Breathe gently. You are exactly where you need to be.",
  "Create space in your day for wonder and silence.",
  "Consistency is the quiet architect of greatness.",
  "Cultivate joy in the ordinary, unassuming moments.",
  "Slow down and notice what usually passes you by.",
  "Grace is the beauty of form under the influence of freedom.",
  "A calm mind brings inner strength and self-confidence.",
  "Energy flows where intentional focus goes.",
  "Treat your time as the sacred currency of your life.",
  "Honor your rhythm. Not everything needs to happen at once.",
  "Wisdom begins with listening to the quiet within.",
  "Do less, but do it with deeper presence.",
  "Your peace of mind is your most valuable asset.",
];

export const DAILY_QUESTIONS = [
  "What brought you a moment of genuine clarity today?",
  "What is one small intention you wish to carry forward?",
  "Where did you feel most fully present this week?",
  "What simple pleasure are you most grateful for right now?",
  "What belief or clutter are you ready to let go of?",
  "How can you bring more gentleness to your thoughts today?",
  "What gave you energy today, and what drained it?",
  "What is something beautiful you observed in nature recently?",
  "If today had a central theme, what word would describe it?",
  "What is one creative curiosity you want to explore?",
  "How did you practice patience with yourself today?",
  "What does your ideal peaceful evening look like?",
  "What progress did you make that went unnoticed by others?",
  "What truth about yourself are you learning to accept?",
  "Where can you create more space in your schedule this week?",
];

export const MOODS = [
  { id: 'peaceful', label: 'Peaceful', emoji: '🌿' },
  { id: 'focused', label: 'Focused', emoji: '☕' },
  { id: 'grateful', label: 'Grateful', emoji: '✨' },
  { id: 'reflective', label: 'Reflective', emoji: '🌙' },
  { id: 'energized', label: 'Energized', emoji: '☀️' },
  { id: 'cozy', label: 'Cozy', emoji: '🕯️' },
] as const;

export const EVENT_TYPES: Record<string, { label: string; emoji: string; color: string }> = {
  focus: { label: 'Deep Work', emoji: '⏱️', color: '#94877A' },
  mindfulness: { label: 'Mindfulness', emoji: '🌿', color: '#7C8E79' },
  journal: { label: 'Reflection', emoji: '✍️', color: '#B5A89B' },
  reading: { label: 'Study & Read', emoji: '📖', color: '#6E6256' },
  wellness: { label: 'Wellness', emoji: '🍵', color: '#8FA08C' },
  other: { label: 'Personal', emoji: '✦', color: '#ABA59E' },
};

export const INITIAL_PLAN_TASKS = [
  { id: 'task-1', title: 'Morning Meditation & Breathwork', time: '08:00 AM', category: 'Mindfulness', done: true },
  { id: 'task-2', title: 'Deep Work: Creative Project', time: '10:00 AM', category: 'Focus', done: true },
  { id: 'task-3', title: 'Midday Herbal Tea & Reading', time: '01:30 PM', category: 'Wellness', done: false },
  { id: 'task-4', title: 'Journal Reflection & Flow', time: '03:00 PM', category: 'Journal', done: false },
];

export function getDailyIndex(arr: readonly unknown[]): number {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dayOfYear % arr.length;
}
