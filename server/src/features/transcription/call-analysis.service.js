/**
 * Call Analysis Service
 *
 * Hybrid pipeline:
 *   1. Rule-based extraction (deterministic, always runs)
 *   2. AI enrichment (optional, runs when AI_ENABLED=true)
 *      - Uses existing AI_PROVIDER / AI_API_KEY / AI_MODEL env vars
 *      - Falls back gracefully if AI is unavailable
 *
 * Stores structured CallAnalysis record linked to the CallTranscript.
 */

import { PrismaClient } from '@prisma/client';
import {
    extractActionItems,
    extractDecisions,
    extractFollowUps,
    analyzeSentiment,
    extractKeyPointsFallback
} from './analysis-helpers.js';
import { AppError } from '../../utils/app-error.js';

const prisma = new PrismaClient();

const AI_ENABLED = process.env.AI_ENABLED === 'true';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'mock').toLowerCase();
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

// Minimum transcript length for meaningful analysis
const MIN_TRANSCRIPT_CHARS = 50;

export class CallAnalysisService {

    /**
     * Trigger analysis for a call (async — marks PROCESSING and runs in background).
     *
     * @param {object} user      - req.user
     * @param {string} callLogId
     * @returns {Promise<CallAnalysis>}
     */
    async analyzeCall(user, callLogId) {
        // 1. Ownership check
        const callLog = await prisma.callLog.findUnique({
            where: { id: callLogId },
            include: { transcript: true, analysis: true }
        });
        if (!callLog || callLog.owner_user_id !== user.uid) {
            throw new AppError('Call not found or access denied', 404, 'RESOURCE_NOT_FOUND');
        }

        // 2. Transcript must exist and be COMPLETED
        const transcript = callLog.transcript;
        if (!transcript) {
            throw new AppError(
                'No transcript found for this call. Transcribe the call first.',
                400, 'VALIDATION_ERROR'
            );
        }
        if (transcript.status !== 'COMPLETED') {
            throw new AppError(
                `Transcript is not ready (status: ${transcript.status}). Wait for transcription to complete.`,
                400, 'VALIDATION_ERROR'
            );
        }

        // 3. Upsert analysis record as PROCESSING
        const analysis = await this._upsertAnalysis(callLog.id, transcript.id, user.uid, {
            status: 'PROCESSING',
            error_message: null
        });

        // 4. Run analysis pipeline asynchronously
        setImmediate(() => {
            this._runAnalysis(analysis.id, transcript.transcript_text)
                .catch(err => console.error(`[Analysis] Pipeline failed for analysis ${analysis.id}:`, err.message));
        });

        return analysis;
    }

    /**
     * Retrieve analysis for a call.
     */
    async getAnalysis(user, callLogId) {
        const callLog = await prisma.callLog.findUnique({ where: { id: callLogId } });
        if (!callLog || callLog.owner_user_id !== user.uid) {
            throw new AppError('Call not found or access denied', 404, 'RESOURCE_NOT_FOUND');
        }

        const analysis = await prisma.callAnalysis.findUnique({
            where: { call_log_id: callLogId }
        });

        return analysis || null;
    }

    // ─── Private pipeline ───────────────────────────────────────────────────

    async _runAnalysis(analysisId, text) {
        const startTime = Date.now();

        try {
            // Sanity check
            if (!text || text.trim().length < MIN_TRANSCRIPT_CHARS) {
                await this._saveAnalysis(analysisId, {
                    status: 'COMPLETED',
                    key_points: ['Transcript is too short to extract meaningful insights.'],
                    action_items: [],
                    decisions: [],
                    follow_ups: [],
                    sentiment_label: 'neutral',
                    sentiment_confidence: 0.5,
                    sentiment_rationale: 'Insufficient content for analysis',
                    warnings: ['Transcript content is very short. Results may be incomplete.'],
                    provider: 'rule-based-fallback'
                });
                return;
            }

            // ── Stage 1: Rule-based extraction ──────────────────────────────
            const ruleActionItems = extractActionItems(text);
            const ruleDecisions = extractDecisions(text);
            const ruleFollowUps = extractFollowUps(text);
            const ruleSentiment = analyzeSentiment(text);
            const ruleKeyPoints = extractKeyPointsFallback(text);

            // ── Stage 2: AI enrichment ───────────────────────────────────────
            let aiResult = null;
            if (AI_ENABLED) {
                try {
                    aiResult = await this._runAIAnalysis(text);
                } catch (aiErr) {
                    console.warn(`[Analysis] AI enrichment failed, using rule-based only: ${aiErr.message}`);
                }
            }

            // ── Stage 3: Merge ───────────────────────────────────────────────
            const merged = this._mergeResults(
                { actionItems: ruleActionItems, decisions: ruleDecisions, followUps: ruleFollowUps, sentiment: ruleSentiment, keyPoints: ruleKeyPoints },
                aiResult
            );

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const usedProvider = aiResult ? AI_PROVIDER : 'rule-based';
            console.log(`[Analysis] Completed analysis ${analysisId} in ${elapsed}s (provider: ${usedProvider})`);

            await this._saveAnalysis(analysisId, {
                status: 'COMPLETED',
                ...merged,
                provider: usedProvider,
                warnings: merged.warnings || []
            });

        } catch (err) {
            await this._saveAnalysis(analysisId, {
                status: 'FAILED',
                error_message: err.message || 'Analysis failed'
            }).catch(() => {});

            console.error(`[Analysis] Failed analysis ${analysisId}:`, err.message);
        }
    }

    _mergeResults(ruleResult, aiResult) {
        if (!aiResult) {
            return {
                key_points: ruleResult.keyPoints,
                action_items: ruleResult.actionItems,
                decisions: ruleResult.decisions,
                follow_ups: ruleResult.followUps,
                sentiment_label: ruleResult.sentiment.label,
                sentiment_confidence: ruleResult.sentiment.confidence,
                sentiment_rationale: ruleResult.sentiment.rationale,
                warnings: ['Analysis performed using rule-based extraction only.']
            };
        }

        // AI takes precedence for key_points and action_items
        // Rule-based fills gaps
        const actionItems = aiResult.action_items?.length
            ? aiResult.action_items
            : ruleResult.actionItems;

        const decisions = aiResult.decisions?.length
            ? aiResult.decisions
            : ruleResult.decisions;

        const followUps = aiResult.follow_ups?.length
            ? aiResult.follow_ups
            : ruleResult.followUps;

        const keyPoints = aiResult.key_points?.length
            ? aiResult.key_points
            : ruleResult.keyPoints;

        // Use AI sentiment if available, otherwise rule-based
        const sentiment = aiResult.sentiment || {
            label: ruleResult.sentiment.label,
            confidence: ruleResult.sentiment.confidence,
            rationale: ruleResult.sentiment.rationale
        };

        return {
            key_points: keyPoints,
            action_items: actionItems,
            decisions,
            follow_ups: followUps,
            sentiment_label: sentiment.label,
            sentiment_confidence: sentiment.confidence,
            sentiment_rationale: sentiment.rationale,
            warnings: []
        };
    }

    async _runAIAnalysis(text) {
        switch (AI_PROVIDER) {
            case 'openai':
                return this._runOpenAIAnalysis(text);
            case 'anthropic':
                return this._runAnthropicAnalysis(text);
            case 'mock':
                return this._runMockAIAnalysis(text);
            default:
                throw new Error(`Unknown AI provider: "${AI_PROVIDER}"`);
        }
    }

    async _runOpenAIAnalysis(text) {
        // Uses native fetch (Node 18+)

        const prompt = this._buildPrompt(text);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: 'You are a business call analyst. Extract structured information from call transcripts. Always respond with valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI API error ${response.status}: ${err}`);
        }

        const json = await response.json();
        const content = json.choices?.[0]?.message?.content || '{}';
        return this._parseAIResponse(content);
    }

    async _runAnthropicAnalysis(text) {
        // Uses native fetch (Node 18+)

        const prompt = this._buildPrompt(text);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': AI_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_MODEL || 'claude-haiku-4-5-20251001',
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Anthropic API error ${response.status}: ${err}`);
        }

        const json = await response.json();
        const content = json.content?.[0]?.text || '{}';
        return this._parseAIResponse(content);
    }

    async _runMockAIAnalysis(_text) {
        await new Promise(r => setTimeout(r, 500));
        return {
            key_points: [
                'Project timeline was discussed and confirmed.',
                'Team agreed to move forward with the selected vendor.',
                'Payment deadline needs urgent attention.',
                'Follow-up call scheduled for next week.'
            ],
            action_items: [
                { title: 'Send updated proposal', notes: 'John to send by Friday', due_date_hint: 'this-friday', priority: 'High', source_excerpt: 'John agreed to send the updated proposal by Friday.' },
                { title: 'Review contract and confirm delivery dates', notes: null, due_date_hint: null, priority: 'Medium', source_excerpt: 'Action item: Review the contract and confirm delivery dates.' }
            ],
            decisions: [
                { statement: 'Team decided to go with the new vendor after reviewing the quotes.', source_excerpt: 'The team decided to go with the new vendor after reviewing the quotes.', confidence: 'high' }
            ],
            follow_ups: [
                { action: 'Schedule follow-up call next week', source_excerpt: 'Sarah will schedule a follow-up call next week.' },
                { action: 'Resolve urgent payment deadline by end of month', source_excerpt: 'There is an urgent issue with the payment deadline.' }
            ],
            sentiment: {
                label: 'urgent',
                confidence: 0.78,
                rationale: 'Urgent payment deadline issue detected alongside positive vendor decision outcome.'
            }
        };
    }

    _buildPrompt(text) {
        return `Analyze the following business call transcript and return a JSON object with this exact shape:

{
  "key_points": ["string", ...],           // 3-5 most important factual points
  "action_items": [                        // tasks/actions that were committed to
    {
      "title": "string",
      "notes": "string or null",
      "due_date_hint": "string or null",   // e.g. "this-friday", "next-week", "end-of-month"
      "priority": "High|Medium|Low",
      "source_excerpt": "string"           // verbatim excerpt
    }
  ],
  "decisions": [                           // explicit decisions made
    {
      "statement": "string",
      "source_excerpt": "string",
      "confidence": "high|medium|low"
    }
  ],
  "follow_ups": [                          // next steps / commitments
    {
      "action": "string",
      "source_excerpt": "string"
    }
  ],
  "sentiment": {
    "label": "positive|urgent|critical|neutral",
    "confidence": 0.0-1.0,
    "rationale": "string"
  }
}

Rules:
- Only include items that are clearly present in the transcript
- Do not invent content
- Keep key_points factual and concise (one sentence each)
- For sentiment: "critical" = crisis/emergency/legal; "urgent" = time-pressured; "positive" = successful/agreed/resolved; "neutral" = routine

Transcript:
---
${text.slice(0, 4000)}
---

Respond with JSON only. No explanation, no markdown.`;
    }

    _parseAIResponse(content) {
        try {
            // Strip markdown code blocks if present
            const clean = content.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
            return JSON.parse(clean);
        } catch {
            console.warn('[Analysis] Failed to parse AI JSON response, falling back to rule-based');
            return null;
        }
    }

    async _upsertAnalysis(callLogId, transcriptId, ownerUserId, fields) {
        const existing = await prisma.callAnalysis.findUnique({ where: { call_log_id: callLogId } });
        if (existing) {
            return prisma.callAnalysis.update({
                where: { id: existing.id },
                data: { ...fields, completed_at: null }
            });
        }
        return prisma.callAnalysis.create({
            data: {
                call_log_id: callLogId,
                transcript_id: transcriptId,
                owner_user_id: ownerUserId,
                ...fields
            }
        });
    }

    async _saveAnalysis(analysisId, fields) {
        return prisma.callAnalysis.update({
            where: { id: analysisId },
            data: {
                ...fields,
                completed_at: new Date()
            }
        });
    }
}
