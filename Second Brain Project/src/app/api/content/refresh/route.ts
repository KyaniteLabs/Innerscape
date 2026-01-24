/**
 * Content Refresh API
 * 
 * POST /api/content/refresh - Fetch latest techniques from the web
 * GET /api/content/refresh - Get cached techniques
 * 
 * Query params:
 *   - type: "regulation" | "winddown" | "all" (default: "all")
 * 
 * Uses AI to search and parse latest ADHD/neurodivergent techniques
 * Results are cached in the agentMemory table
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentMemory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatErrorResponse } from "@/lib/errors";
import { CONFIG } from "@/lib/config";

// ===== Types =====

interface DynamicTechnique {
    name: string;
    duration: string;
    instructions: string[];
    tip?: string;
    source: "base" | "web";
    fetchedAt: string;
    sourceUrl?: string;
    category?: string;
}

interface ContentCache {
    techniques: DynamicTechnique[];
    lastRefresh: string;
    version: number;
}

// ===== Constants =====

const CACHE_KEYS = {
    regulation: "regulation_techniques_cache",
    winddown: "winddown_techniques_cache",
    lastRefresh: "content_last_refresh",
};

const CACHE_TTL_HOURS = 24; // Refresh every 24 hours

// ===== Search Queries =====

const SEARCH_QUERIES = {
    regulation: [
        "ADHD focus techniques 2026 neurodivergent",
        "executive function hacks ADHD adults",
        "dopamine regulation activities ADHD",
        "sensory regulation techniques neurodivergent",
    ],
    winddown: [
        "ADHD wind down routine evening 2026",
        "neurodivergent sleep hygiene techniques",
        "ADHD bedtime ritual transition",
        "executive function evening shutdown routine",
    ],
};

// ===== AI Processing =====

async function processSearchResults(
    searchContent: string,
    type: "regulation" | "winddown"
): Promise<DynamicTechnique[]> {
    const systemPrompt = `You are an expert in ADHD and neurodivergent-friendly techniques. 
Extract practical, actionable techniques from the provided content.

For each technique, provide:
- name: Short, memorable name (2-5 words)
- duration: Time estimate (e.g., "2-5 min", "10-15 min", "Ongoing")
- instructions: Array of 3-5 clear, numbered steps
- tip: One helpful tip or adaptation
- category: For regulation: "warmup" | "deepwork" | "support" | "rest"
           For winddown: "transition" | "review" | "prepare" | "relax"

Focus on techniques that are:
1. Evidence-based or widely recommended
2. Low-barrier to start (minimal setup)
3. Adaptable to different needs
4. Neurodivergent-friendly (not relying on willpower alone)

Return a JSON array of techniques. Maximum 4 techniques per search.`;

    const userPrompt = `Extract ${type} techniques from this content:\n\n${searchContent}\n\nReturn ONLY a valid JSON array of techniques.`;

    try {
        const response = await fetch(`${CONFIG.AI.API_BASE_URL}chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.AI.API_KEY}`,
            },
            body: JSON.stringify({
                model: CONFIG.AI.FAST_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "[]";
        
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn("[Content Refresh] No JSON array found in response");
            return [];
        }

        const techniques = JSON.parse(jsonMatch[0]) as DynamicTechnique[];
        
        // Add metadata
        return techniques.map(t => ({
            ...t,
            source: "web" as const,
            fetchedAt: new Date().toISOString(),
        }));

    } catch (error) {
        console.error("[Content Refresh] AI processing error:", error);
        return [];
    }
}

// ===== Web Search =====

async function searchWeb(query: string): Promise<string> {
    // Use a simple approach: fetch from a curated list of reliable sources
    // In production, this would use Exa API or similar
    
    try {
        // Construct a search-friendly query for reliable ADHD resources
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}&num=3`;
        
        // If no Google API key, use fallback content generation
        if (!process.env.GOOGLE_API_KEY) {
            return await generateFallbackContent(query);
        }

        const response = await fetch(searchUrl);
        if (!response.ok) {
            return await generateFallbackContent(query);
        }

        const data = await response.json();
        const snippets = data.items?.map((item: { title: string; snippet: string }) => 
            `${item.title}: ${item.snippet}`
        ).join("\n\n") || "";

        return snippets || await generateFallbackContent(query);

    } catch (error) {
        console.error("[Content Refresh] Search error:", error);
        return await generateFallbackContent(query);
    }
}

async function generateFallbackContent(query: string): Promise<string> {
    // Use AI to generate content based on the query (knowledge cutoff aware)
    try {
        const response = await fetch(`${CONFIG.AI.API_BASE_URL}chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.AI.API_KEY}`,
            },
            body: JSON.stringify({
                model: CONFIG.AI.FAST_MODEL,
                messages: [
                    { 
                        role: "system", 
                        content: "You are an expert in ADHD management and neurodivergent-friendly techniques. Provide current, evidence-based information about techniques and strategies. Focus on practical, actionable advice." 
                    },
                    { 
                        role: "user", 
                        content: `Provide detailed information about: ${query}. Include specific techniques, steps, and tips. Format as informative paragraphs.` 
                    },
                ],
                temperature: 0.7,
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            return "";
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";

    } catch (error) {
        console.error("[Content Refresh] Fallback generation error:", error);
        return "";
    }
}

// ===== Cache Operations =====

async function getCachedContent(type: string): Promise<ContentCache | null> {
    const key = type === "winddown" ? CACHE_KEYS.winddown : CACHE_KEYS.regulation;
    
    const cached = await db
        .select()
        .from(agentMemory)
        .where(and(
            eq(agentMemory.userId, CONFIG.SINGLE_USER_ID),
            eq(agentMemory.key, key)
        ))
        .limit(1);

    if (cached.length === 0) return null;

    try {
        return JSON.parse(cached[0].value) as ContentCache;
    } catch {
        return null;
    }
}

async function setCachedContent(type: string, content: ContentCache): Promise<void> {
    const key = type === "winddown" ? CACHE_KEYS.winddown : CACHE_KEYS.regulation;
    const value = JSON.stringify(content);

    // Upsert
    const existing = await db
        .select()
        .from(agentMemory)
        .where(and(
            eq(agentMemory.userId, CONFIG.SINGLE_USER_ID),
            eq(agentMemory.key, key)
        ))
        .limit(1);

    if (existing.length > 0) {
        await db
            .update(agentMemory)
            .set({ value, updatedAt: new Date().toISOString() })
            .where(eq(agentMemory.id, existing[0].id));
    } else {
        await db.insert(agentMemory).values({
            userId: CONFIG.SINGLE_USER_ID,
            key,
            value,
        });
    }
}

function isCacheStale(cache: ContentCache | null): boolean {
    if (!cache) return true;
    
    const lastRefresh = new Date(cache.lastRefresh);
    const now = new Date();
    const hoursSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceRefresh > CACHE_TTL_HOURS;
}

// ===== API Handlers =====

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "all";

        const response: Record<string, unknown> = {
            success: true,
        };

        if (type === "all" || type === "regulation") {
            const cache = await getCachedContent("regulation");
            response.regulation = {
                techniques: cache?.techniques || [],
                lastRefresh: cache?.lastRefresh || null,
                isStale: isCacheStale(cache),
            };
        }

        if (type === "all" || type === "winddown") {
            const cache = await getCachedContent("winddown");
            response.winddown = {
                techniques: cache?.techniques || [],
                lastRefresh: cache?.lastRefresh || null,
                isStale: isCacheStale(cache),
            };
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error("[APEX] [Content Refresh API] GET Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "all";
        const force = searchParams.get("force") === "true";

        const results: Record<string, unknown> = {
            success: true,
            refreshed: [],
        };

        // Process regulation content
        if (type === "all" || type === "regulation") {
            const existingCache = await getCachedContent("regulation");
            
            if (force || isCacheStale(existingCache)) {
                console.log("[Content Refresh] Refreshing regulation techniques...");
                
                const allTechniques: DynamicTechnique[] = [];
                
                for (const query of SEARCH_QUERIES.regulation) {
                    const searchContent = await searchWeb(query);
                    if (searchContent) {
                        const techniques = await processSearchResults(searchContent, "regulation");
                        allTechniques.push(...techniques);
                    }
                }

                // Deduplicate by name
                const uniqueTechniques = allTechniques.reduce((acc, t) => {
                    if (!acc.find(existing => existing.name.toLowerCase() === t.name.toLowerCase())) {
                        acc.push(t);
                    }
                    return acc;
                }, [] as DynamicTechnique[]);

                const cache: ContentCache = {
                    techniques: uniqueTechniques.slice(0, 12), // Max 12 techniques
                    lastRefresh: new Date().toISOString(),
                    version: (existingCache?.version || 0) + 1,
                };

                await setCachedContent("regulation", cache);
                results.regulation = cache;
                (results.refreshed as string[]).push("regulation");
            } else {
                results.regulation = existingCache;
                results.regulationSkipped = "Cache still fresh";
            }
        }

        // Process winddown content
        if (type === "all" || type === "winddown") {
            const existingCache = await getCachedContent("winddown");
            
            if (force || isCacheStale(existingCache)) {
                console.log("[Content Refresh] Refreshing winddown techniques...");
                
                const allTechniques: DynamicTechnique[] = [];
                
                for (const query of SEARCH_QUERIES.winddown) {
                    const searchContent = await searchWeb(query);
                    if (searchContent) {
                        const techniques = await processSearchResults(searchContent, "winddown");
                        allTechniques.push(...techniques);
                    }
                }

                // Deduplicate by name
                const uniqueTechniques = allTechniques.reduce((acc, t) => {
                    if (!acc.find(existing => existing.name.toLowerCase() === t.name.toLowerCase())) {
                        acc.push(t);
                    }
                    return acc;
                }, [] as DynamicTechnique[]);

                const cache: ContentCache = {
                    techniques: uniqueTechniques.slice(0, 8), // Max 8 techniques
                    lastRefresh: new Date().toISOString(),
                    version: (existingCache?.version || 0) + 1,
                };

                await setCachedContent("winddown", cache);
                results.winddown = cache;
                (results.refreshed as string[]).push("winddown");
            } else {
                results.winddown = existingCache;
                results.winddownSkipped = "Cache still fresh";
            }
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error("[APEX] [Content Refresh API] POST Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
