# ADR-0003: Use GLM-4.7 Agent Architecture for Capture Classification

## Status

Accepted

## Context

The core feature of NeuroSecond is automatic classification of captured thoughts into appropriate categories (Projects, People, Ideas, Admin Tasks). Requirements:

- Accurate classification based on content and context
- Ability to learn from user corrections
- Tool calling for database operations
- Low latency for good UX
- Streaming support for progress feedback

Options considered:

1. **GLM-4.7 with Tool Calling** - Chinese LLM with strong agent capabilities
2. **OpenAI GPT-4** - Leading proprietary model
3. **Claude** - Anthropic's model
4. **Rule-based Classification** - Deterministic keyword matching

## Decision

Use GLM-4.7 as the AI backbone with a tool-calling agent architecture.

### Key reasons:

1. **Tool Calling** - GLM-4.7 supports structured tool calls for database operations
2. **Thinking Mode** - Deep reasoning capability for complex classification
3. **Cost Effective** - Competitive pricing compared to OpenAI/Anthropic
4. **Streaming** - SSE support for real-time feedback
5. **Context Window** - 128K tokens for comprehensive context

### Agent Architecture:

```
User Input → Agent Orchestrator → Tools → Database
                    ↓
              Classification
                    ↓
              Memory/Context
```

## Consequences

### Positive

- Intelligent classification with context awareness
- Learns from corrections via the corrections table
- Extensible with new tools
- Good streaming UX for capture flow

### Negative

- External API dependency (fallback to rule-based if unavailable)
- Cost per API call (mitigated by local caching/optimization)
- Occasional misclassification requires correction

### Neutral

- Agent code in `src/lib/agent/`
- Tools defined in `src/lib/agent/tools/`
- Prompts in `src/lib/agent/prompts/`

## References

- [GLM-4 API Documentation](https://open.bigmodel.cn/dev/api)
- See `src/lib/agent/index.ts` for orchestrator implementation
