/**
 * Rule-Based Analysis Helpers
 *
 * Deterministic extraction from transcript text using regex/keyword patterns.
 * Used as the first pass before any AI call, or as the sole method when AI is disabled.
 *
 * All functions return structured arrays/objects suitable for the CallAnalysis model.
 */

// ─── Action Item Patterns ─────────────────────────────────────────────────────

const ACTION_VERBS = [
    'will', "i'll", "we'll", "you'll", "they'll",
    'need to', 'needs to', 'going to', 'gonna',
    'plan to', 'planning to',
    'should', 'must', 'have to', 'has to',
    'would like to', "let's", "let us",
    'please', 'make sure', 'ensure', 'confirm',
    'send', 'share', 'prepare', 'create', 'update',
    'review', 'check', 'look into', 'follow up', 'schedule'
];

// Looser "action" sentence matcher
const ACTION_PATTERN = new RegExp(
    `\\b(${ACTION_VERBS.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b.{5,120}`,
    'gi'
);

// ─── Decision Patterns ────────────────────────────────────────────────────────

const DECISION_PHRASES = [
    'decided', 'agreed', 'approved', 'confirmed',
    'selected', 'chosen', 'went with', 'going with',
    'accepted', 'finalized', 'settled on', 'resolved',
    'concluded', 'determined', 'signed off'
];
const DECISION_PATTERN = new RegExp(
    `[^.!?]*\\b(${DECISION_PHRASES.join('|')})\\b[^.!?]*[.!?]`,
    'gi'
);

// ─── Follow-up Patterns ───────────────────────────────────────────────────────

const FOLLOWUP_PHRASES = [
    'follow up', 'follow-up', 'get back to',
    'send over', 'send across', 'share the',
    'schedule a', 'set up a', 'arrange a',
    'next call', 'next meeting', 'next step',
    'circle back', 'touch base', 'reconnect',
    'will send', "i'll send", "we'll send",
    'will share', 'will schedule', 'call you back',
    'confirm by', 'let you know', 'keep you posted'
];
const FOLLOWUP_PATTERN = new RegExp(
    `[^.!?]*\\b(${FOLLOWUP_PHRASES.join('|')})\\b[^.!?]*[.!?]`,
    'gi'
);

// ─── Sentiment/Urgency Patterns ───────────────────────────────────────────────

const URGENT_KEYWORDS = [
    'urgent', 'urgently', 'asap', 'as soon as possible',
    'immediately', 'right away', 'critical', 'emergency',
    'deadline', 'overdue', 'escalate', 'escalation',
    'priority one', 'p1', 'blocker', 'blocking',
    'must be done', 'cannot wait', "can't wait", 'time sensitive',
    'by end of day', 'by end of week', 'eod', 'eow'
];

const CRITICAL_KEYWORDS = [
    'critical', 'crisis', 'emergency', 'failure', 'down',
    'outage', 'breach', 'compromised', 'legal', 'lawsuit',
    'compliance', 'audit', 'investigation', 'escalated',
    'termination', 'cancelled', 'cancel', 'losing'
];

const POSITIVE_KEYWORDS = [
    'great', 'excellent', 'fantastic', 'happy', 'pleased',
    'successful', 'good progress', 'well done', 'congratulations',
    'positive', 'approved', 'agreed', 'confirmed', 'closed',
    'deal', 'signed', 'won', 'achieved', 'completed', 'resolved',
    'smooth', 'on track', 'ahead of schedule'
];

// ─── Date Inference ───────────────────────────────────────────────────────────

const DATE_HINTS = [
    { pattern: /\bby (?:end of )?(?:this )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, label: 'this week' },
    { pattern: /\bby (?:end of )?(?:next )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, label: 'next week' },
    { pattern: /\bby (?:end of |the )?(day|week|month|quarter|year)\b/i, label: 'period-end' },
    { pattern: /\bin (\d+) (day|days|week|weeks|month|months)\b/i, label: 'relative' },
    { pattern: /\btomorrow\b/i, label: 'tomorrow' },
    { pattern: /\bnext week\b/i, label: 'next-week' },
    { pattern: /\bnext month\b/i, label: 'next-month' },
    { pattern: /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/, label: 'date' }
];

function inferDueDate(text) {
    for (const hint of DATE_HINTS) {
        if (hint.pattern.test(text)) return hint.label;
    }
    return null;
}

// ─── Priority Inference ───────────────────────────────────────────────────────

function inferPriority(text) {
    const lower = text.toLowerCase();
    if (CRITICAL_KEYWORDS.some(k => lower.includes(k))) return 'High';
    if (URGENT_KEYWORDS.some(k => lower.includes(k))) return 'High';
    if (lower.includes('important') || lower.includes('priority')) return 'Medium';
    return 'Medium';
}

// ─── Extraction Functions ─────────────────────────────────────────────────────

/**
 * Extract action items from transcript text.
 * Returns array of { title, notes, due_date_hint, priority, source_excerpt }
 */
export function extractActionItems(text) {
    const matches = new Set();
    const results = [];

    let match;
    ACTION_PATTERN.lastIndex = 0;

    while ((match = ACTION_PATTERN.exec(text)) !== null) {
        const raw = match[0].trim().replace(/\s+/g, ' ');
        // Deduplicate
        const key = raw.toLowerCase().slice(0, 80);
        if (matches.has(key)) continue;
        matches.add(key);

        const title = _capitalizeFirst(_trimToSentence(raw, 80));
        if (title.split(' ').length < 3) continue; // too short to be meaningful

        results.push({
            title,
            notes: raw.length > 80 ? raw : null,
            due_date_hint: inferDueDate(raw),
            priority: inferPriority(raw),
            source_excerpt: _trimToSentence(raw, 150)
        });

        if (results.length >= 10) break; // cap
    }

    return results;
}

/**
 * Extract decisions from transcript text.
 * Returns array of { statement, source_excerpt, confidence }
 */
export function extractDecisions(text) {
    const matches = new Set();
    const results = [];

    let match;
    DECISION_PATTERN.lastIndex = 0;

    while ((match = DECISION_PATTERN.exec(text)) !== null) {
        const raw = match[0].trim().replace(/\s+/g, ' ');
        const key = raw.toLowerCase().slice(0, 80);
        if (matches.has(key)) continue;
        matches.add(key);

        results.push({
            statement: _capitalizeFirst(_trimToSentence(raw, 120)),
            source_excerpt: raw,
            confidence: 'medium'  // rule-based → medium confidence
        });

        if (results.length >= 8) break;
    }

    return results;
}

/**
 * Extract follow-ups from transcript text.
 * Returns array of { action, source_excerpt }
 */
export function extractFollowUps(text) {
    const matches = new Set();
    const results = [];

    let match;
    FOLLOWUP_PATTERN.lastIndex = 0;

    while ((match = FOLLOWUP_PATTERN.exec(text)) !== null) {
        const raw = match[0].trim().replace(/\s+/g, ' ');
        const key = raw.toLowerCase().slice(0, 80);
        if (matches.has(key)) continue;
        matches.add(key);

        results.push({
            action: _capitalizeFirst(_trimToSentence(raw, 100)),
            source_excerpt: raw
        });

        if (results.length >= 8) break;
    }

    return results;
}

/**
 * Determine sentiment label from transcript text.
 * Returns { label: 'positive'|'urgent'|'critical'|'neutral', confidence: number, rationale: string }
 */
export function analyzeSentiment(text) {
    const lower = text.toLowerCase();

    const criticalScore = CRITICAL_KEYWORDS.filter(k => lower.includes(k)).length;
    const urgentScore = URGENT_KEYWORDS.filter(k => lower.includes(k)).length;
    const positiveScore = POSITIVE_KEYWORDS.filter(k => lower.includes(k)).length;

    // Determine dominant sentiment
    if (criticalScore >= 2 || (criticalScore >= 1 && urgentScore >= 1)) {
        return {
            label: 'critical',
            confidence: Math.min(0.9, 0.5 + criticalScore * 0.1),
            rationale: `Detected ${criticalScore} critical keyword(s): ${_matchedKeywords(lower, CRITICAL_KEYWORDS).slice(0, 3).join(', ')}`
        };
    }

    if (urgentScore >= 2) {
        return {
            label: 'urgent',
            confidence: Math.min(0.85, 0.5 + urgentScore * 0.08),
            rationale: `Detected ${urgentScore} urgency indicator(s): ${_matchedKeywords(lower, URGENT_KEYWORDS).slice(0, 3).join(', ')}`
        };
    }

    if (positiveScore >= 2 && urgentScore === 0 && criticalScore === 0) {
        return {
            label: 'positive',
            confidence: Math.min(0.85, 0.4 + positiveScore * 0.08),
            rationale: `Positive tone detected: ${_matchedKeywords(lower, POSITIVE_KEYWORDS).slice(0, 3).join(', ')}`
        };
    }

    if (urgentScore === 1) {
        return {
            label: 'urgent',
            confidence: 0.55,
            rationale: `One urgency indicator found: "${_matchedKeywords(lower, URGENT_KEYWORDS)[0]}"`
        };
    }

    return {
        label: 'neutral',
        confidence: 0.6,
        rationale: 'No strong sentiment indicators detected'
    };
}

/**
 * Extract a simple key-points summary from transcript text (rule-based fallback).
 * Returns array of strings.
 */
export function extractKeyPointsFallback(text) {
    const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.split(' ').length >= 5);

    if (sentences.length === 0) return ['Transcript too short to extract key points.'];

    // Score sentences: prefer those that contain action/decision/positive indicators
    const scored = sentences.map(s => {
        const l = s.toLowerCase();
        let score = 0;
        if (DECISION_PHRASES.some(p => l.includes(p))) score += 3;
        if (URGENT_KEYWORDS.some(k => l.includes(k))) score += 2;
        if (POSITIVE_KEYWORDS.some(k => l.includes(k))) score += 1;
        if (ACTION_VERBS.some(v => l.includes(v))) score += 1;
        return { text: s, score };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text)) // restore order
        .map(s => _capitalizeFirst(s.text));
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function _trimToSentence(text, maxLen) {
    if (text.length <= maxLen) return text;
    const cut = text.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(' ');
    return lastSpace > maxLen / 2 ? cut.slice(0, lastSpace) + '…' : cut + '…';
}

function _capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function _matchedKeywords(text, keywords) {
    return keywords.filter(k => text.includes(k));
}
