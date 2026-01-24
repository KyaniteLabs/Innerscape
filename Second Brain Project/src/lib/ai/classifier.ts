import { CONFIG } from "@/lib/config";

export interface ClassificationResult {
    destination: "people" | "projects" | "ideas" | "admin" | "needs_review";
    confidence: number;
    reasoning?: string;
    data: {
        name?: string;
        status?: string;
        next_action?: string;
        notes?: string;
        one_liner?: string;
        due_date?: string;
        context?: string;
        follow_ups?: string;
        tags?: string[];
        original_text?: string;
        reason?: string;
        error?: string;
        first_step?: string;  // ADHD-friendly: always suggest a tiny first action
    };
}

/**
 * Enhanced classification prompt with few-shot examples
 * Designed to reduce "needs_review" by providing clear examples for edge cases
 */
export const CLASSIFICATION_PROMPT = `
You are classifying a quick capture for a Second Brain system designed for neurodivergent users.

## Categories

- **people**: information about a person, relationship update, something someone said, meeting notes about someone
- **projects**: multi-step work, ongoing tasks, things with phases, creative endeavors, learning goals
- **ideas**: thoughts, insights, concepts to explore, "what if" questions, random musings
- **admin**: simple errands, one-off tasks, appointments, reminders, things with specific due dates

## Few-Shot Examples

### PEOPLE Examples
Input: "Sarah mentioned she's interested in pottery classes"
→ destination: "people", confidence: 0.9
→ data: { name: "Sarah", context: "Interested in pottery", follow_ups: "Share pottery class info", tags: ["friend"] }

Input: "Met Jake at the conference, he works at Stripe on payments"
→ destination: "people", confidence: 0.95
→ data: { name: "Jake", context: "Met at conference, works at Stripe (payments)", follow_ups: "Connect on LinkedIn", tags: ["networking", "tech"] }

### PROJECTS Examples
Input: "need to finish coding the music lyric app"
→ destination: "projects", confidence: 0.9
→ data: { name: "Music lyric app", status: "active", next_action: "Open the code editor", notes: "Coding project", tags: ["coding", "app"] }

Input: "pottery studio work - finish four pots from yesterday"
→ destination: "projects", confidence: 0.85
→ data: { name: "Pottery studio work", status: "active", next_action: "Go to studio", notes: "Finish four pots from yesterday", tags: ["pottery", "creative"] }

Input: "learn Spanish this year"
→ destination: "projects", confidence: 0.8
→ data: { name: "Learn Spanish", status: "active", next_action: "Download Duolingo", notes: "Language learning goal", tags: ["learning", "language"] }

### IDEAS Examples
Input: "what if we used AI to help with task initiation"
→ destination: "ideas", confidence: 0.9
→ data: { name: "AI-assisted task initiation", one_liner: "Use AI to break down overwhelming tasks", notes: null, tags: ["ai", "productivity"] }

Input: "thinking about how music affects focus"
→ destination: "ideas", confidence: 0.85
→ data: { name: "Music and focus connection", one_liner: "Explore how different music affects concentration", notes: null, tags: ["productivity", "music"] }

### ADMIN Examples
Input: "need to buy milk"
→ destination: "admin", confidence: 0.95
→ data: { name: "Buy milk", due_date: null, notes: null }

Input: "dentist appointment next tuesday"
→ destination: "admin", confidence: 0.95
→ data: { name: "Dentist appointment", due_date: "next tuesday", notes: "Appointment" }

Input: "pay electric bill by the 15th"
→ destination: "admin", confidence: 0.95
→ data: { name: "Pay electric bill", due_date: "15th", notes: null }

### EDGE CASES (commonly confused)

Input: "pottery session at 3pm" 
→ destination: "admin", confidence: 0.85 (single scheduled event, not ongoing work)
→ data: { name: "Pottery session", due_date: "3pm today", notes: null }

Input: "working on pottery skills over the next few months"
→ destination: "projects", confidence: 0.85 (ongoing multi-step goal)
→ data: { name: "Improve pottery skills", status: "active", next_action: "Schedule next studio session", notes: "Long-term skill development", tags: ["pottery", "learning"] }

Input: "she said something interesting about remote work"
→ destination: "people", confidence: 0.7 (even without a name, it's about a person)
→ data: { name: "Unknown person", context: "Said something about remote work", follow_ups: "Remember who this was", tags: [] }

Input: "random thought: gravity is weird"
→ destination: "ideas", confidence: 0.9
→ data: { name: "Gravity is weird", one_liner: "Random musing about physics", notes: null, tags: ["random", "science"] }

## Classification Rules

1. **When in doubt between admin and projects**: 
   - Single action with a specific time = admin
   - Multiple steps or ongoing work = projects

2. **When in doubt between ideas and projects**:
   - "What if..." or musing = ideas
   - "I want to..." or "need to..." = projects

3. **When something mentions a person**:
   - If about the person themselves = people
   - If it's a task involving someone else = admin or projects

4. **Confidence thresholds**:
   - 0.9+: Very clear category
   - 0.7-0.9: Fairly confident, proceed
   - 0.6-0.7: Borderline, but make a choice
   - <0.6: Set to "needs_review"

5. **Prefer action over review**: If you're 60-70% confident, make the classification rather than defaulting to needs_review.

## Output Format

Return ONLY valid JSON:
{
  "destination": "people" | "projects" | "ideas" | "admin" | "needs_review",
  "confidence": 0.0-1.0,
  "data": { ... category-specific fields ... },
  "first_step": "One tiny action (max 10 words)"
}
`;

/**
 * Legacy classifier using GLM-4.7
 * Use CONFIG.AGENT.USE_LEGACY_CLASSIFIER to enable this path
 * Otherwise, the new agent system handles classification with tools
 */
export async function classifyWithGLM(text: string): Promise<ClassificationResult> {
    const apiKey = process.env.GLM_API_KEY;
    if (!apiKey) {
        console.error("[APEX] [Classifier] Missing GLM_API_KEY");
        return { destination: "needs_review", confidence: 0, data: { original_text: text, reason: "Missing API Key" } };
    }

    const baseUrl = CONFIG.AI.API_BASE_URL;
    let lastError: unknown;

    for (let attempt = 0; attempt <= CONFIG.AI.MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.AI.TIMEOUT_MS);

        try {
            if (attempt > 0) {
                console.info(`[APEX] [Classifier] Retrying classification (attempt ${attempt}/${CONFIG.AI.MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.AI.RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
            }

            const response = await fetch(`${baseUrl}chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: CONFIG.AI.FAST_MODEL, // Use fast model for simple classification
                    messages: [
                        { role: "system", content: CLASSIFICATION_PROMPT },
                        { role: "user", content: text }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.3, // Slightly higher for better first_step suggestions
                    max_tokens: CONFIG.AI.MAX_TOKENS,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "");
                throw new Error(`AI API Error: ${response.status} - ${errorBody}`);
            }

            const result = await response.json();
            let content = result.choices?.[0]?.message?.content;
            const reasoning = result.choices?.[0]?.message?.reasoning_content;

            if (!content) throw new Error("Empty AI response");

            // Clean markdown if AI ignored response_format (happens sometimes)
            content = content.replace(/```json/g, "").replace(/```/g, "").trim();

            const parsed = JSON.parse(content);
            const confidence = parsed.confidence ?? 0;
            const destination = confidence < CONFIG.AI.CONFIDENCE_THRESHOLD ? "needs_review" : (parsed.destination || "needs_review");

            return {
                destination,
                confidence,
                reasoning,
                data: parsed.data || { original_text: text },
            };
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            lastError = error;
            
            const isAbort = error instanceof Error && error.name === "AbortError";
            const isTransient = isAbort || (error instanceof Error && (error.message.includes("429") || error.message.includes("500") || error.message.includes("502") || error.message.includes("503") || error.message.includes("504")));

            if (!isTransient || attempt >= CONFIG.AI.MAX_RETRIES) {
                break;
            }
            
            console.warn(`[APEX] [Classifier] Transient error on attempt ${attempt}:`, error instanceof Error ? error.message : "Unknown error");
        }
    }

    console.error("[APEX] [Classifier] Classification failed after retries:", lastError instanceof Error ? lastError.message : "Unknown error");
    const errorMessage = lastError instanceof Error ? lastError.message : "Unknown error";
    return {
        destination: "needs_review",
        confidence: 0,
        data: { original_text: text, error: errorMessage },
    };
}
