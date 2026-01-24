# Memory Management for AI Agents

> **Last Updated**: 2026-01-24
> 
> **Sources**: Anthropic Claude Code Best Practices, AgentsArcade Cost Optimization, LLM-d KV-Cache Research

---

## 2026 Cost & Memory Landscape

### Token Cost Reality

Token costs scale **linearly** with users but **quadratically** with context accumulation:

| Scale | Daily Cost | Monthly Cost | Primary Driver |
|-------|------------|--------------|----------------|
| 1 user | $0.50 | $15 | Exploration |
| 100 users | $50 | $1,500 | Context accumulation |
| 1,000 users | $500 | $15,000 | Memory bloat |

**Key insight**: The primary driver of token waste is **architectural, not prompt-related**. Long-running agents accumulate context without explicit lifecycle management.

### Cost Optimization Techniques (2026)

| Technique | Savings | Implementation |
|-----------|---------|----------------|
| **Prompt caching** | 90% reduction | Reuse repeated prefixes |
| **Semantic caching** | Eliminates redundant calls | Cache by meaning, not exact match |
| **Model routing** | 63% reduction | 70% simple → cheap, 30% complex → premium |
| **Batching** | 50% reduction | Aggregate multiple requests |
| **Selective summarization** | 40-60% reduction | Preserve decisions, eliminate dead ends |
| **KV-cache aware scheduling** | 57x faster, 2x throughput | Production deployment optimization |

### Reasoning Model Context (o1/o3/R1)

Reasoning models have **larger context windows** but require different management:

| Model | Context Window | Best Practice |
|-------|----------------|---------------|
| OpenAI o1 | 128k tokens | Structure inputs with clear sections |
| OpenAI o3-mini | 200k tokens | Use for Plan-then-Execute planning |
| DeepSeek R1 | 64k tokens | Include domain context (narrower knowledge) |
| Claude Opus | 200k tokens | Use for complex orchestration |

**Key differences from GPT-4o:**
- Built-in chain-of-thought — do NOT add "think step by step"
- Narrower general knowledge — include domain context explicitly
- Internal reasoning not extractable — don't try to access thinking process

---

## Memory Poisoning Defense

> **Added 2026-01-24** | Critical security consideration for shared memory.

**Threat**: Hallucinations in shared memory propagate as verified facts through the agent network.

**Prevention checklist:**
```
□ Validate every write to agent memory with source attribution
□ Timestamp all memory entries
□ Implement memory source confidence scoring
□ Periodically audit memory for inconsistencies
□ Use separate memory namespaces per user/session
□ Never trust memory content for security-critical decisions
```

**Memory write validation pattern:**

```python
class ValidatedMemory:
    def __init__(self):
        self.store = {}
        self.metadata = {}
    
    def write(self, key: str, value: str, source: str, confidence: float):
        """Write to memory with provenance tracking."""
        if confidence < 0.7:
            raise ValueError("Low confidence writes require human review")
        
        self.store[key] = value
        self.metadata[key] = {
            "source": source,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat(),
            "verified": False
        }
    
    def read(self, key: str) -> tuple[str, dict]:
        """Read with metadata for informed use."""
        return self.store.get(key), self.metadata.get(key, {})
    
    def verify(self, key: str, verifier: str):
        """Mark memory as human-verified."""
        if key in self.metadata:
            self.metadata[key]["verified"] = True
            self.metadata[key]["verified_by"] = verifier
            self.metadata[key]["verified_at"] = datetime.now().isoformat()
```

---

## The Memory Problem

AI agents face a fundamental constraint: **limited context window**. As tasks grow longer:

- Important early context gets pushed out
- Agent "forgets" key decisions
- Performance degrades over time
- Cost increases with token usage

Effective memory management is the difference between agents that work for 5 minutes and agents that work for 5 hours.

---

## The Two-Layer Pattern (Recommended)

For autonomous agent loops, use two distinct memory layers with clear purposes:

### Layer Overview

| Layer | File | Scope | Resets | Purpose |
|-------|------|-------|--------|---------|
| **Short-term** | `progress.txt` | Current feature | On new feature | Session context, task log, temp patterns |
| **Long-term** | `AGENTS.md` | Codebase area | Never | Permanent knowledge anyone should know |

### Short-term: progress.txt

**Location**: `scripts/ralph/progress.txt` or project root

**Purpose**: Memory for the current feature/task session. Helps agents pick up context between iterations.

**Contents**:
- Feature being worked on
- Task completion log (what was done, when)
- Patterns discovered THIS session
- Learnings for future iterations
- Thread/session references

**Format**:

```markdown
# Build Progress Log
Started: 2026-01-23
Feature: User Authentication System
Parent Task: task-abc123

## Codebase Patterns
(Patterns discovered during THIS feature - copy important ones to AGENTS.md)

- Auth middleware uses `withAuth()` HOC pattern
- All API routes return `{ success: boolean, data?: T, error?: string }`
- Tests use `vitest` with `@testing-library/react`

---

## 2026-01-23 - Add user table migration
Task ID: task-001
Thread: https://ampcode.com/threads/abc123
- Created `migrations/001_users.sql`
- Added columns: id, email, password_hash, created_at
- **Learnings**: Use `TIMESTAMPTZ` not `TIMESTAMP` for timezone safety

---

## 2026-01-23 - Create auth middleware
Task ID: task-002
- Implemented `src/middleware/auth.ts`
- Uses JWT verification with `jose` library
- **Learnings**: Project uses edge runtime, can't use `jsonwebtoken`
```

**Rules**:
- **APPEND only** — Never overwrite previous entries
- Include task ID and date for each entry
- Note learnings that help future iterations
- **Archive when feature completes** — Move to `scripts/ralph/archive/`
- **Reset on new feature** — Don't carry over stale context

**Lifecycle**:

```
New Feature → Initialize progress.txt
    ↓
Each Iteration → Append task completion + learnings
    ↓
Feature Complete → Archive to scripts/ralph/archive/YYYY-MM-DD-feature-name/
    ↓
New Feature → Fresh progress.txt
```

### Long-term: AGENTS.md

**Location**: In directories where the knowledge applies (e.g., `src/auth/AGENTS.md`)

**Purpose**: Permanent codebase knowledge that ANY agent or developer should know when editing this area.

**Contents**:
- Architectural patterns
- Conventions and gotchas
- Important constraints
- Integration notes

**Format**:

```markdown
# AGENTS.md — src/middleware/

## Patterns
- All middleware follows `(req, res, next) => {}` signature
- Use `withAuth()` HOC for protected routes
- Error responses: `{ success: false, error: "message" }`

## Gotchas
- Edge runtime: Cannot use Node.js-only packages
- JWT: Use `jose` library, not `jsonwebtoken`
- Rate limiting: Applied at gateway, not here

## Dependencies
- `jose` for JWT operations
- `zod` for request validation

## Testing
- Mock `jose` in tests, don't use real tokens
- See `__tests__/middleware.test.ts` for patterns
```

**Rules**:
- **Only PERMANENT knowledge** — Things that won't change next week
- **No task-specific notes** — That's for progress.txt
- **No temporary debugging info** — Remove after issue resolved
- **Update when you discover something important** — Don't wait
- **AI tools auto-read these files** — Keep them accurate

**What TO Add**:
- ✅ "All API routes return `{ success, data, error }` format"
- ✅ "Must use `jose` for JWT, not `jsonwebtoken` (edge runtime)"
- ✅ "Database migrations require backwards compatibility"

**What NOT to Add**:
- ❌ "Currently debugging auth issue in task-123"
- ❌ "TODO: refactor this next sprint"
- ❌ "John said to use this pattern"

### When to Update Each

| Situation | Update | File |
|-----------|--------|------|
| Completed a task | ✅ | progress.txt |
| Discovered pattern for this feature | ✅ | progress.txt |
| Found permanent codebase convention | ✅ | AGENTS.md |
| Hit a gotcha anyone would hit | ✅ | AGENTS.md |
| Debugging temporary issue | ✅ | progress.txt |
| Task-specific context | ✅ | progress.txt |
| How something ALWAYS works here | ✅ | AGENTS.md |

### Archiving progress.txt

When a feature completes:

```bash
# Archive the progress file
DATE=$(date +%Y-%m-%d)
FEATURE="user-authentication"  # kebab-case
mkdir -p scripts/ralph/archive/$DATE-$FEATURE
mv scripts/ralph/progress.txt scripts/ralph/archive/$DATE-$FEATURE/

# Create fresh progress file
cat > scripts/ralph/progress.txt << 'EOF'
# Build Progress Log
(No active feature)

## Codebase Patterns

---
EOF
```

**Before archiving**, review progress.txt and promote any permanent learnings to AGENTS.md.

---

## Memory Hierarchy

### Three-Layer Model

| Layer | Scope | Persistence | Access Speed | Strategy |
|-------|-------|-------------|--------------|----------|
| **Working Memory** | Current context window | Session | Instant | Active management |
| **Short-term Memory** | Session state | Session | Fast | Files, scratchpad |
| **Long-term Memory** | Cross-session | Permanent | Slower | Vector DB, archive |

### Working Memory (Context Window)

The ~200K token window where active reasoning happens.

**Management strategies:**

1. **Prioritize**: Keep high-value information in context
2. **Compress**: Summarize verbose information
3. **Reference**: Store details externally, keep pointers
4. **Prune**: Remove information no longer needed

### Short-term Memory (Session State)

Information needed within a session but too large for context.

**Implementation:**

```python
# Create scratchpad file
write_to_file(".claude/scratchpad.md", """
## Session State

### Files Analyzed
- src/auth.ts (JWT implementation)
- src/middleware.ts (Auth middleware)

### Key Findings
- Uses RS256 algorithm
- Token expiry: 1 hour
- Refresh token in httpOnly cookie

### Open Questions
- Where is token revocation handled?
""")

# Reference in context
"See .claude/scratchpad.md for session state"
```

### Long-term Memory (Persistent)

Knowledge that persists across sessions.

**Options:**
- Vector databases (Pinecone, Weaviate, ChromaDB)
- Structured storage (SQLite, JSON files)
- CLAUDE.md / memory files
- External knowledge bases

---

## Compaction

### How It Works

When context approaches ~95% capacity, the SDK automatically compacts:

1. Recent messages preserved verbatim
2. Older messages summarized
3. Key information extracted and retained
4. Verbose content compressed

### Influencing Compaction

While automatic, you can influence what's preserved:

```markdown
## IMPORTANT - PRESERVE IN COMPACTION
- Project: E-commerce authentication refactor
- Key files: src/auth/*.ts, src/middleware/*.ts
- Decision: Using RS256 for JWT signing
- Constraint: Must maintain backward compatibility
```

### Manual Compaction

Force compaction when context is getting long:

```python
# In Claude Code CLI
/compact

# In SDK - handled automatically, but you can
# structure prompts to make compaction more effective
```

---

## Memory Blocks Pattern

Structure context into discrete, functional units that survive compaction.

### Block Structure

```markdown
## Current Task
[One-line description of active task]

## Research State
[Accumulated findings - agent updates this]

## Key Decisions
[Important choices made - preserved through compaction]
- Decision 1: reason
- Decision 2: reason

## Constraints
[Boundaries that must be respected]
- Must not modify production database
- Keep backward compatibility
- Max 1000ms response time

## Next Steps
[What to do next - helps recovery if compacted]
1. Implement token refresh
2. Add tests
3. Update documentation
```

### Benefits

- Clear structure helps compaction preserve important info
- Agent can update specific blocks
- Easy to scan for relevant information
- Survives context limits

---

## File Buffering

For large outputs that would flood context.

### Pattern

```python
# Problem: SQL query returns 50,000 rows
result = execute_sql("SELECT * FROM users")  # Huge!

# Solution: Buffer to file, keep summary in context
write_to_file("tmp/query_results.csv", result)

context_summary = """
Query results: tmp/query_results.csv
- 50,234 rows
- Columns: id, email, created_at, last_login
- Date range: 2023-01-01 to 2024-01-15
- Notable: 12% have NULL last_login
"""

# Agent can grep/tail the file as needed
grep("tmp/query_results.csv", "pattern")
```

### When to Use

- Large query results
- Log file analysis
- Bulk data processing
- Any output > 5,000 tokens

---

## Subagent Context Isolation

Subagents have isolated context windows. Only their summary returns.

### Good Pattern

```python
# Orchestrator delegates
"Use the researcher agent to analyze all 50 TypeScript files"

# Researcher (in isolated context):
# - Reads all 50 files
# - Analyzes patterns
# - Accumulates findings

# Returns to orchestrator:
"""
Analysis of 50 TypeScript files:
- Authentication: JWT-based, found in src/auth/
- Database: Prisma ORM, 15 models
- API: 42 endpoints, REST style
- Issues: 3 files with any type, 2 missing error handling
"""
# Only summary pollutes orchestrator context
```

### Bad Pattern

```python
# Researcher returns full file contents
"""
File: src/auth/jwt.ts
[500 lines of code]

File: src/auth/middleware.ts
[300 lines of code]
...
"""
# Floods orchestrator context!
```

---

## Long-Running Agent Memory (MemGPT Pattern)

For agents that run across multiple sessions and need to remember.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Runtime                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              Working Memory                      │   │
│  │         (Current Context Window)                 │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                    tools/APIs                           │
│                          │                              │
│  ┌───────────────────────┴───────────────────────┐     │
│  │                External Memory                 │     │
│  ├───────────────────────┬───────────────────────┤     │
│  │   Archival Memory     │    Recall Memory      │     │
│  │   (Long-term facts)   │   (Conversation log)  │     │
│  │   Vector DB / File    │   Searchable history  │     │
│  └───────────────────────┴───────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Memory Lifecycle

#### 1. Distillation (During Session)

Capture high-signal memories:

```python
# Agent has a tool to save memories
async def save_memory(key: str, value: str, importance: str = "medium"):
    """Save important information for future sessions."""
    memory_entry = {
        "key": key,
        "value": value,
        "importance": importance,
        "timestamp": datetime.now().isoformat(),
        "session_id": current_session_id
    }
    append_to_file(".claude/memories.jsonl", json.dumps(memory_entry))
```

#### 2. Consolidation (End of Session)

Merge session memories into long-term storage:

```python
async def consolidate_memories():
    """Run at session end to organize memories."""
    session_memories = read_session_memories()
    global_memories = read_global_memories()
    
    # Deduplicate
    merged = deduplicate(session_memories, global_memories)
    
    # Resolve conflicts (newer wins for same key)
    resolved = resolve_conflicts(merged)
    
    # Prune stale (importance decay over time)
    pruned = prune_stale(resolved, max_age_days=30)
    
    write_global_memories(pruned)
```

#### 3. Injection (Start of Session)

Load relevant memories into context:

```python
async def inject_memories(task_description: str):
    """Load relevant memories at session start."""
    all_memories = read_global_memories()
    
    # Semantic search for relevant memories
    relevant = semantic_search(all_memories, task_description, top_k=10)
    
    # Format for injection
    memory_block = format_memory_block(relevant)
    
    return f"""
## Retrieved Memories
{memory_block}

## Current Task
{task_description}
"""
```

### Memory Tools for Agent

```python
agent_tools = {
    "save_memory": {
        "description": "Save important information for future sessions",
        "parameters": {
            "key": "string - what this memory is about",
            "value": "string - the information to remember",
            "importance": "high|medium|low"
        }
    },
    "search_memories": {
        "description": "Search past memories for relevant information",
        "parameters": {
            "query": "string - what to search for"
        }
    },
    "forget_memory": {
        "description": "Remove outdated or incorrect memory",
        "parameters": {
            "key": "string - memory key to forget"
        }
    }
}
```

---

## CLAUDE.md as Memory

The `CLAUDE.md` file serves as persistent project memory.

### Structure

```markdown
# Project: Authentication Service

## Overview
JWT-based authentication for microservices.

## Key Decisions
- **2024-01-15**: Chose RS256 over HS256 for token signing (security)
- **2024-01-20**: Added refresh token rotation (compliance)

## Architecture
- Gateway handles auth, services trust internal tokens
- Token TTL: 1 hour, Refresh TTL: 7 days

## Gotchas
- Don't modify TokenService without updating gateway
- Rate limiting is per-user, not per-token

## Commands
- `npm run test:auth` - Run auth tests
- `npm run generate:keys` - Rotate signing keys
```

### Benefits

- Persists across sessions automatically
- Human-readable and editable
- Version controlled with project
- Agent reads on startup

---

## Token Budgeting

Monitor and manage token usage.

### Budget Tracking

```python
class TokenBudget:
    def __init__(self, max_tokens: int = 150000):
        self.max = max_tokens
        self.used = 0
        self.warning_threshold = 0.8
    
    def add(self, tokens: int):
        self.used += tokens
        if self.used / self.max > self.warning_threshold:
            self.trigger_compaction()
    
    def trigger_compaction(self):
        # Summarize old context
        # Clear non-essential history
        pass
```

### Cost-Aware Decisions

```python
# Expensive: Read entire large file
read_file("huge_log.txt")  # 50K tokens

# Cheap: Targeted search
grep("huge_log.txt", "ERROR")  # Returns only matches

# Decision: Use cheap operations first
# Only load full content when necessary
```

---

## Advanced Context Compression (2025-2026)

Modern compression techniques enable significantly longer effective context.

### Technique Comparison

| Technique | Compression | Quality Loss | Retraining | Use Case |
|-----------|-------------|--------------|------------|----------|
| **Semantic summarization** | 5-10× | Low | No | Long conversations |
| **Hierarchical aggregation** | 10-20× | Medium | No | Document analysis |
| **KV cache compression** | 20:1 | Minimal | No | Long inference |
| **Learned compression** | 20-50× | Variable | Yes | Specialized domains |

### Proactive Compression Strategy

Don't wait for context limits — compress proactively:

```python
from dataclasses import dataclass
from typing import List

@dataclass
class Message:
    role: str
    content: str
    tokens: int
    importance: float  # 0.0 to 1.0

class ProactiveCompressor:
    def __init__(self, max_tokens: int = 100_000, target_utilization: float = 0.7):
        self.max_tokens = max_tokens
        self.target = int(max_tokens * target_utilization)
        self.importance_threshold = 0.6
    
    def should_compress(self, messages: List[Message]) -> bool:
        total = sum(m.tokens for m in messages)
        return total > self.target
    
    def compress(self, messages: List[Message]) -> List[Message]:
        """Compress context while preserving high-importance content."""
        if not self.should_compress(messages):
            return messages
        
        result = []
        low_importance_buffer = []
        
        for msg in messages:
            if msg.importance >= self.importance_threshold:
                # High importance: keep verbatim
                if low_importance_buffer:
                    # Summarize accumulated low-importance first
                    result.append(self._summarize_batch(low_importance_buffer))
                    low_importance_buffer = []
                result.append(msg)
            else:
                # Low importance: buffer for summarization
                low_importance_buffer.append(msg)
        
        # Handle remaining buffer
        if low_importance_buffer:
            result.append(self._summarize_batch(low_importance_buffer))
        
        return result
    
    def _summarize_batch(self, messages: List[Message]) -> Message:
        """Summarize a batch of low-importance messages."""
        combined_content = "\n".join(m.content for m in messages)
        summary = self._generate_summary(combined_content)
        return Message(
            role="system",
            content=f"[Summary of {len(messages)} messages]: {summary}",
            tokens=len(summary) // 4,  # Rough estimate
            importance=0.5
        )
    
    def _generate_summary(self, content: str) -> str:
        # In practice, use LLM to summarize
        # This is a placeholder
        return content[:500] + "..." if len(content) > 500 else content
```

### Importance Scoring

Score messages for compression priority:

```python
class ImportanceScorer:
    HIGH_IMPORTANCE_SIGNALS = [
        r'decision:', r'important:', r'constraint:',
        r'error:', r'bug:', r'security:',
        r'must ', r'never ', r'always ',
    ]
    
    LOW_IMPORTANCE_SIGNALS = [
        r'thinking about', r'let me check',
        r'i see that', r'looking at',
    ]
    
    def score(self, message: Message) -> float:
        content_lower = message.content.lower()
        
        # Check for high-importance signals
        high_matches = sum(
            1 for p in self.HIGH_IMPORTANCE_SIGNALS 
            if re.search(p, content_lower)
        )
        
        # Check for low-importance signals
        low_matches = sum(
            1 for p in self.LOW_IMPORTANCE_SIGNALS 
            if re.search(p, content_lower)
        )
        
        # Recent messages more important
        recency_boost = 0.2 if message.is_recent else 0
        
        # Calculate score
        base_score = 0.5
        score = base_score + (high_matches * 0.15) - (low_matches * 0.1) + recency_boost
        
        return max(0.0, min(1.0, score))
```

### Hierarchical Semantic Aggregation

For document-heavy workloads:

```python
class HierarchicalCompressor:
    """Compress by building semantic hierarchy."""
    
    def compress_documents(self, documents: List[str]) -> str:
        """
        Level 1: Paragraph summaries
        Level 2: Section summaries  
        Level 3: Document summary
        Level 4: Corpus overview
        """
        # Level 1: Summarize each paragraph
        paragraph_summaries = []
        for doc in documents:
            paragraphs = doc.split('\n\n')
            summaries = [self._summarize(p, max_tokens=50) for p in paragraphs]
            paragraph_summaries.append(summaries)
        
        # Level 2: Group paragraphs into sections
        section_summaries = []
        for doc_paragraphs in paragraph_summaries:
            # Group every 5 paragraphs
            for i in range(0, len(doc_paragraphs), 5):
                chunk = doc_paragraphs[i:i+5]
                section_summaries.append(self._summarize('\n'.join(chunk), max_tokens=100))
        
        # Level 3: Document-level summary
        doc_summary = self._summarize('\n'.join(section_summaries), max_tokens=500)
        
        return doc_summary
```

---

## Best Practices Summary

| Practice | Description |
|----------|-------------|
| **Structure context** | Use memory blocks for organization |
| **Buffer large outputs** | Write to files, keep summaries |
| **Isolate subagents** | Let them process, return only summaries |
| **Preserve decisions** | Mark important info for compaction survival |
| **Use CLAUDE.md** | Persistent project memory |
| **Search before load** | grep/semantic search before reading full files |
| **Prune aggressively** | Remove information no longer needed |
| **Monitor tokens** | Stay aware of context usage |
| **Compress proactively** | Don't wait for limits, compress at 70% |
| **Score importance** | Prioritize what to keep vs. summarize |
