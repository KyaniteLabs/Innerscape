# Multi-Agent Orchestration Patterns

> **Last Updated**: 2026-01-24
> 
> **Sources**: OpenAI Practical Guide to Building Agents, Galileo AI Multi-Agent Research, UIUC Agentic Benchmarks

## Overview

As agent systems grow in complexity, single agents hit limitations. Multi-agent orchestration enables:

- **Specialization**: Each agent excels at specific tasks
- **Parallelization**: Multiple agents work simultaneously
- **Context isolation**: Subagents don't pollute main context
- **Scalability**: Add new capabilities as new agents

**2026 Industry Benchmarks**: Organizations using multi-agent orchestration achieve 45% faster problem resolution, 60% more accurate outcomes, and 3x faster decision speed compared to single-agent systems. However, fewer than 10% of enterprises have successfully implemented multi-agent orchestration despite 80% planning to do so.

---

## Pattern 0: Plan-then-Execute (P-t-E) — Recommended for High Accuracy

> **Added 2026-01-24** | The dominant 2026 architectural pattern for production agents.

Separates reasoning (planning) from tool-use (execution). A "planner" agent creates a multi-step execution plan, then an "executor" agent follows it.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌──────────┐    ┌──────────────┐    ┌──────────┐    │
│   │  User    │───>│   Planner    │───>│ Executor │    │
│   │  Request │    │  (Reasoning) │    │ (Tools)  │    │
│   └──────────┘    └──────┬───────┘    └────┬─────┘    │
│                          │                  │          │
│                          ▼                  ▼          │
│                    [Multi-step        [Execute each    │
│                     plan as JSON]      step, report]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### When to Use

- Complex multi-step tasks requiring reasoning
- When predictability is more important than flexibility
- Cost optimization (planning is cheaper than trial-and-error)
- Tasks where reactive patterns (ReAct) produce inconsistent results

### Why P-t-E Outperforms ReAct

| Aspect | ReAct Pattern | Plan-then-Execute |
|--------|---------------|-------------------|
| Reasoning | Interleaved with actions | Separated, upfront |
| Cost | High (many reasoning steps) | Lower (plan once, execute) |
| Predictability | Variable | High |
| Error recovery | Reactive | Proactive (plan includes fallbacks) |
| Prompt injection resistance | Lower | Higher (control-flow integrity) |

### Implementation

```python
agents = {
    "planner": AgentDefinition(
        description="Creates detailed execution plans for complex tasks.",
        prompt="""You are a strategic planner. When given a task:
1. Break it into specific, actionable steps
2. Identify dependencies between steps
3. Define success criteria for each step
4. Return a JSON execution plan

Output format:
{
  "goal": "string",
  "steps": [
    {"id": 1, "action": "string", "tool": "string", "inputs": {}, "success_criteria": "string"},
    ...
  ],
  "rollback_plan": "string"
}""",
        tools=["Read", "Grep"],  # Read-only for planning
        model="o3-mini"  # Use reasoning model for planning
    ),
    "executor": AgentDefinition(
        description="Executes pre-defined plans step by step.",
        prompt="""You execute plans created by the planner.
For each step:
1. Execute the specified action
2. Verify success criteria met
3. Report result before proceeding
4. If step fails, consult rollback_plan""",
        tools=["Read", "Write", "Edit", "Bash", "Grep"],
        model="sonnet"  # Fast model for execution
    )
}

orchestrator_prompt = """
For complex tasks, follow Plan-then-Execute workflow:
1. Delegate to planner to create execution plan
2. Review plan for safety and completeness
3. Delegate to executor to implement each step
4. Verify final result matches goal
"""
```

### Reasoning Model Notes (o1/o3/R1)

When using reasoning models (o1, o3-mini, DeepSeek R1) for the planner:

- **Do NOT add explicit "think step by step"** — these models have built-in chain-of-thought
- **Present problems directly** — the model reasons automatically
- **Structure inputs clearly** — use sections, bullet points, headings
- **Include domain context** — reasoning models have narrower knowledge than GPT-4o
- **Never attempt to extract internal reasoning** — violates acceptable use policies

---

## Pattern 1: Hub-and-Spoke (Recommended Default)

A central orchestrator manages all agent interactions.

```
                    ┌─────────────┐
                    │ Orchestrator│
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Researcher │ │   Writer    │ │  Reviewer   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### When to Use

- Compliance-heavy domains (audit trail needed)
- Predictable, step-by-step workflows
- When debugging is priority
- New agent systems (start simple)

### Implementation

```python
agents = {
    "researcher": AgentDefinition(
        description="Gathers comprehensive information.",
        prompt="Research the topic thoroughly. Return structured findings.",
        tools=["Read", "Grep", "WebSearch"]
    ),
    "writer": AgentDefinition(
        description="Creates well-structured content.",
        prompt="Write clear documentation based on research.",
        tools=["Read", "Write"]
    ),
    "reviewer": AgentDefinition(
        description="Reviews for quality and accuracy.",
        prompt="Review content for accuracy, clarity, completeness.",
        tools=["Read"]
    )
}

# Orchestrator controls flow explicitly
orchestrator_prompt = """
For documentation tasks, follow this workflow:
1. Delegate to researcher for information gathering
2. Pass findings to writer for content creation
3. Have reviewer check the result
4. Iterate if issues found
"""
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Easy to debug | Single point of failure |
| Clear audit trail | Orchestrator bottleneck |
| Predictable behavior | Less flexible |

---

## Pattern 2: Orchestrator-Workers

Main agent delegates to stateless specialist workers.

```
          ┌─────────────┐
          │ Orchestrator│
          └──────┬──────┘
                 │ dispatches
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│Worker 1│  │Worker 2│  │Worker 3│
└────────┘  └────────┘  └────────┘
    │            │            │
    └────────────┴────────────┘
              returns
```

### When to Use

- Parallel independent tasks
- Workers don't need to communicate
- Each task is self-contained
- High-volume processing

### Implementation

```python
agents = {
    "code-analyzer": AgentDefinition(
        description="Analyzes code structure and patterns.",
        prompt="Analyze code. Return: complexity score, patterns found, issues.",
        tools=["Read", "Grep"]
    ),
    "security-scanner": AgentDefinition(
        description="Scans for security vulnerabilities.",
        prompt="Scan for: injection, XSS, exposed secrets, weak crypto.",
        tools=["Read", "Grep"]
    ),
    "test-analyzer": AgentDefinition(
        description="Analyzes test coverage and quality.",
        prompt="Assess: coverage %, test quality, missing tests.",
        tools=["Read", "Bash"]
    )
}

# Workers run in parallel, orchestrator aggregates
prompt = """
Analyze this codebase:
1. Run code-analyzer, security-scanner, test-analyzer in parallel
2. Aggregate findings into unified report
3. Prioritize issues by severity
"""
```

---

## Pattern 3: Sequential Chain

Each agent's output becomes the next agent's input.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Research │ -> │ Outline  │ -> │  Write   │ -> │ Critique │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### When to Use

- Content pipelines (research → write → edit)
- Data transformation (extract → transform → validate)
- Dependent stages where order matters

### Implementation

```python
agents = {
    "extractor": AgentDefinition(
        description="Extracts structured data from documents.",
        prompt="Extract: entities, relationships, key facts. Return JSON.",
        tools=["Read"]
    ),
    "transformer": AgentDefinition(
        description="Transforms data into target format.",
        prompt="Transform input to match target schema.",
        tools=["Read"]
    ),
    "validator": AgentDefinition(
        description="Validates data quality and completeness.",
        prompt="Check: required fields, data types, constraints.",
        tools=["Read"]
    )
}

prompt = """
Process data pipeline:
1. extractor: Parse raw documents
2. transformer: Convert to target format
3. validator: Verify output quality
Pass each stage's output to the next.
"""
```

---

## Pattern 4: Parallel Fan-Out

Multiple agents work on related but independent tasks simultaneously.

```
                    ┌─────────────┐
                    │ Orchestrator│
                    └──────┬──────┘
                           │ fan-out
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│Research Auth │   │Research DB   │   │Research API  │
└──────────────┘   └──────────────┘   └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │ aggregate
                    ┌──────▼──────┐
                    │   Summary   │
                    └─────────────┘
```

### When to Use

- Research across multiple topics
- Code analysis across multiple modules
- Any task that can be parallelized

### Implementation

```python
agents = {
    "module-researcher": AgentDefinition(
        description="Researches a specific module.",
        prompt="Deeply analyze the assigned module. Document: purpose, dependencies, patterns.",
        tools=["Read", "Grep", "Glob"]
    )
}

prompt = """
Research codebase architecture:
1. Spawn module-researcher for: auth/, database/, api/
2. Run in parallel
3. Aggregate findings into architecture overview
"""
```

---

## Pattern 5: Evaluator-Optimizer Loop

Agent generates, evaluator critiques, agent improves.

```
┌───────────────────────────────────────┐
│                                       │
▼                                       │
┌──────────┐    ┌──────────┐    ┌───────┴────┐
│ Generate │ -> │ Evaluate │ -> │  Improve   │
└──────────┘    └──────────┘    └────────────┘
                     │
                     ▼
                  [Ship if approved]
```

### When to Use

- Quality-critical outputs
- Code generation with testing
- Content that needs refinement
- When you can define "good enough"

### Implementation

```python
agents = {
    "generator": AgentDefinition(
        description="Creates initial solution.",
        prompt="Generate a complete solution. Include all edge cases.",
        tools=["Read", "Write", "Bash"]
    ),
    "evaluator": AgentDefinition(
        description="Critiques solutions rigorously.",
        prompt="""Evaluate the solution:
- Does it meet requirements?
- Are there bugs or edge cases missed?
- Is it maintainable?
Return: APPROVED or list of specific issues.""",
        tools=["Read", "Bash"]  # Can run tests
    )
}

prompt = """
Create and refine solution:
1. generator: Create initial implementation
2. evaluator: Check quality
3. If issues found: generator fixes them
4. Repeat until evaluator returns APPROVED
Max 3 iterations.
"""
```

---

## Pattern 6: Group Chat / Debate

Agents collaborate through shared conversation, managed by moderator.

```
        ┌─────────────────────────────────────┐
        │           Chat Manager              │
        └─────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Engineer   │ │   Designer   │ │   Product    │
└──────────────┘ └──────────────┘ └──────────────┘
        │                │                │
        └────────────────┴────────────────┘
                    shared thread
```

### When to Use

- Design discussions needing multiple perspectives
- Brainstorming sessions
- Complex decisions with trade-offs
- When disagreement is valuable

### Implementation

```python
agents = {
    "engineer": AgentDefinition(
        description="Engineering perspective on feasibility.",
        prompt="Evaluate from engineering lens: feasibility, complexity, tech debt.",
        tools=["Read", "Grep"]
    ),
    "designer": AgentDefinition(
        description="Design and UX perspective.",
        prompt="Evaluate from design lens: usability, accessibility, aesthetics.",
        tools=["Read"]
    ),
    "product": AgentDefinition(
        description="Product and business perspective.",
        prompt="Evaluate from product lens: user value, business impact, timeline.",
        tools=["Read"]
    )
}

prompt = """
Facilitate design review:
1. Present the proposal to all agents
2. Each agent provides perspective
3. Identify points of agreement and disagreement
4. Synthesize into recommendation with trade-offs
"""
```

---

## Pattern 7: Hierarchical / Tree

Multi-level delegation with sub-orchestrators.

```
                    ┌─────────────┐
                    │  Executive  │
                    └──────┬──────┘
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ Frontend │  │ Backend  │  │   QA     │
       │ Lead     │  │ Lead     │  │  Lead    │
       └────┬─────┘  └────┬─────┘  └────┬─────┘
            │             │             │
     ┌──────┴──────┐    workers      workers
     ▼             ▼
  workers       workers
```

### When to Use

- Large-scale projects
- Natural team/domain boundaries
- When single orchestrator is bottleneck

---

## Context Handoff Schema

Standardize how agents pass information:

```json
{
  "handoff_id": "uuid",
  "from_agent": "researcher",
  "to_agent": "writer",
  "task": {
    "type": "write_documentation",
    "target": "authentication_system"
  },
  "context": {
    "files_analyzed": ["src/auth/*.ts"],
    "key_findings": ["Uses JWT", "Session timeout 1hr"],
    "dependencies": ["jsonwebtoken", "express-session"]
  },
  "constraints": {
    "max_length": 2000,
    "audience": "developers",
    "format": "markdown"
  },
  "expected_output": {
    "type": "documentation",
    "sections": ["overview", "usage", "configuration"]
  }
}
```

---

## Error Recovery Patterns

### Retry with Backoff

```python
async def run_with_retry(agent_task, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await agent_task()
            return result
        except ToolError:
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
    raise MaxRetriesExceeded()
```

### Fallback Agent

```python
agents = {
    "primary": AgentDefinition(...),
    "fallback": AgentDefinition(
        description="Fallback for when primary fails.",
        prompt="Handle task with conservative approach.",
        tools=["Read"]  # Minimal tools, safer
    )
}
```

### Circuit Breaker

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, reset_timeout=60):
        self.failures = 0
        self.last_failure = None
        self.threshold = failure_threshold
        self.timeout = reset_timeout
    
    def should_allow(self):
        if self.failures >= self.threshold:
            if time.time() - self.last_failure > self.timeout:
                self.failures = 0  # Reset
                return True
            return False  # Circuit open
        return True
    
    def record_failure(self):
        self.failures += 1
        self.last_failure = time.time()
```

---

## Choosing a Pattern

| Scenario | Recommended Pattern | 2026 Notes |
|----------|---------------------|------------|
| **Complex reasoning tasks** | **Plan-then-Execute** | Highest accuracy, best for production |
| Starting out | Hub-and-Spoke | Simple, debuggable, good audit trail |
| Independent parallel tasks | Fan-Out | Use with caution — coordination overhead |
| Content pipeline | Sequential Chain | Low failure rate (~3-5% with orchestration) |
| Quality-critical output | Evaluator-Optimizer | Add evaluation gates |
| Design decisions | Group Chat | Good for exploration, not production |
| Large complex projects | Hierarchical | Keeps coordination overhead flat |
| Simple delegation | Orchestrator-Workers | Stateless workers scale well |
| High-scale (100k+ req/sec) | Mesh with Supervisor | Only if Hub-and-Spoke bottlenecks |

### Pattern Selection Decision Tree

```
Is the task complex with multiple steps?
├── YES → Does it require high accuracy?
│         ├── YES → Plan-then-Execute (P-t-E)
│         └── NO → Hub-and-Spoke
└── NO → Are subtasks independent?
          ├── YES → Parallel Fan-Out
          └── NO → Sequential Chain
```

### Evaluation Notes

When citing performance metrics for patterns:

- **SWE-Bench-Verified/Pro**: Standard for coding agent evaluation (1,865 tasks, 41 repos)
- **GAIA**: Standard for general agent evaluation
- **Task validity**: Ensure benchmark tasks are solvable iff agent has target capability
- **Outcome validity**: Verify evaluation methods correctly indicate completion

**Known pitfall**: SWE-Bench insufficient test coverage causes ~24% leaderboard misattribution. Always validate with multiple benchmarks.

---

## Agent Communication Protocols (2025-2026)

As multi-agent systems scale, standardized communication protocols are emerging:

| Protocol | Purpose | Backing |
|----------|---------|---------|
| **MCP** (Model Context Protocol) | Tool/resource sharing | Anthropic, standard |
| **A2A** (Agent-to-Agent Protocol) | Direct agent communication | Google, 50+ companies |
| **ACP** (Agent Communication Protocol) | Enterprise agent messaging | Industry consortium |
| **ANP** (Agent Network Protocol) | Cross-network agent discovery | Emerging |

### A2A Protocol (Google)

Agent-to-Agent Protocol enables agents to:
- Discover other agents' capabilities
- Negotiate task delegation
- Exchange structured results
- Maintain conversation context across handoffs

```python
# A2A-style structured handoff
handoff_message = {
    "protocol": "a2a/1.0",
    "from_agent": "orchestrator",
    "to_agent": "specialist",
    "task": {
        "type": "code_review",
        "context": {"files": ["src/auth.ts"], "focus": "security"},
        "constraints": ["read_only", "no_external_calls"]
    },
    "expected_response": {
        "schema": "review_result/1.0",
        "fields": ["issues", "severity", "recommendations"]
    }
}
```

### When to Use Which Protocol

| Need | Protocol |
|------|----------|
| Tool access for single agent | MCP |
| Agent-to-agent delegation | A2A |
| Enterprise-scale messaging | ACP |
| Cross-organization discovery | ANP |

**Best Practice**: Start with MCP for tools. Add A2A patterns when you need structured multi-agent communication beyond simple Task tool delegation.

---

## Pattern 8: Mesh Architecture

Agents communicate directly without central orchestrator.

```
┌──────────┐     ┌──────────┐
│ Agent A  │◄───►│ Agent B  │
└────┬─────┘     └────┬─────┘
     │                │
     │   ┌────────┐   │
     └──►│Agent C │◄──┘
         └────────┘
```

### When to Use

- High-scale systems (100k+ requests/sec)
- Fault tolerance critical (no single point of failure)
- Dynamic agent addition/removal
- Geographic distribution

### When NOT to Use

- Need audit trail (hard to trace)
- Compliance requirements (unpredictable flow)
- Debugging priority (complex to trace)
- Small teams (overhead not worth it)

### Implementation

```python
import asyncio
from dataclasses import dataclass
from typing import Dict, List, Optional, Callable
import uuid

@dataclass
class AgentCapability:
    name: str
    description: str
    handler: Callable

class MeshAgent:
    def __init__(self, agent_id: str, capabilities: List[AgentCapability]):
        self.id = agent_id
        self.capabilities = {c.name: c for c in capabilities}
        self.peers: Dict[str, 'MeshAgent'] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue()
    
    async def register_with_network(self, registry: 'AgentRegistry'):
        """Register self and discover peers."""
        await registry.register(self)
        self.peers = await registry.discover_peers(
            exclude=self.id,
            required_capabilities=self._get_required_peer_capabilities()
        )
    
    async def delegate(self, task: str, capability: str) -> str:
        """Delegate task to peer with required capability."""
        peer = self._find_peer_with_capability(capability)
        if not peer:
            raise NoPeerFound(f"No peer found with capability: {capability}")
        
        message = {
            "id": str(uuid.uuid4()),
            "from": self.id,
            "to": peer.id,
            "task": task,
            "capability_required": capability,
        }
        return await peer.handle_request(message)
    
    async def handle_request(self, message: dict) -> str:
        """Handle incoming request from peer."""
        capability_name = message.get("capability_required")
        if capability_name not in self.capabilities:
            return f"Error: Capability {capability_name} not available"
        
        capability = self.capabilities[capability_name]
        return await capability.handler(message["task"])
    
    def _find_peer_with_capability(self, capability: str) -> Optional['MeshAgent']:
        for peer in self.peers.values():
            if capability in peer.capabilities:
                return peer
        return None
```

### Mesh Trade-offs

| Pros | Cons |
|------|------|
| No single point of failure | Complex debugging |
| Scales horizontally | Harder audit trail |
| Low latency (direct communication) | Network overhead |
| Fault tolerant | Eventual consistency |

### Hybrid: Mesh with Supervisor

Combine mesh flexibility with oversight:

```
┌─────────────────────────────────────────┐
│            Supervisor (Monitoring)       │
│         (Read-only, no orchestration)    │
└─────────────────────────────────────────┘
                     │ observes
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Agent A  │◄─►│ Agent B  │◄─►│ Agent C  │
└──────────┘   └──────────┘   └──────────┘
```

Supervisor provides audit logging, anomaly detection, and human escalation—but does NOT route messages or make decisions.

---

## Multi-Agent Failure Modes (2026)

> **Added 2026-01-24** | Critical production insights from Galileo AI research.
> 
> **Source**: https://galileo.ai/blog/multi-agent-ai-failures-prevention

**Critical insight**: Systems without orchestration experience failure rates exceeding 40% in production.

### Common Failure Types

| Failure Mode | Frequency | Description | Mitigation |
|--------------|-----------|-------------|------------|
| **Specification failures** | ~42% | Ambiguous success criteria cascade through downstream agents | Define explicit success criteria in handoff schema |
| **Coordination deadlocks** | ~37% | Agents await mutual confirmations or acquire shared resources in conflicting orders | Use timeouts, implement deadlock detection |
| **Memory poisoning** | Common | Hallucinations in shared memory propagate as verified facts | Validate memory writes, source attribution |
| **Emergent interaction failures** | Common | Failures only appear across agent boundaries, not in isolated testing | Integration testing with realistic multi-agent scenarios |

### Failure Rate by Architecture

| Architecture | Unorchestrated Failure Rate | With Formal Orchestration |
|--------------|----------------------------|---------------------------|
| Hub-and-Spoke | 15-20% | 5-8% |
| Mesh | 40-50% | 15-20% |
| Sequential Chain | 10-15% | 3-5% |
| Evaluator-Optimizer | 20-25% | 8-12% |

**Key finding**: Formal orchestration frameworks reduce failure rates by **3.2x** versus unorchestrated systems.

### Coordination Overhead

Coordination overhead grows **quadratically** with agent count:

| Agent Count | Coordination Latency |
|-------------|---------------------|
| 2 agents | ~200ms |
| 4 agents | ~800ms |
| 8 agents | ~2.5s |
| 16 agents | ~4s+ |

**Recommendation**: Keep agent count minimal. Use hierarchical patterns for >4 agents to flatten coordination overhead.

### Prevention Checklist

```
□ Define explicit success criteria for every agent handoff
□ Implement timeouts for all inter-agent communication
□ Add deadlock detection (circular wait detection)
□ Validate shared memory writes with source attribution
□ Use layered guardrails with validation at each handoff
□ Integration test with realistic multi-agent scenarios
□ Monitor coordination latency in production
□ Implement circuit breakers for failing agents
```

---

## Observability & Debugging

> **Added 2026-01-24** | Production-grade observability patterns.
> 
> **Source**: https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/observability-for-multi-agent-systems

Traditional debugging is **inadequate** for multi-agent systems. You need specialized observability.

### The Five Pillars of Agent Observability

| Pillar | What to Capture | Why It Matters |
|--------|-----------------|----------------|
| **Traces** | Complete interaction graphs across all agents | Understand execution flow |
| **Metrics** | Latency, token usage, success rates per agent | Performance optimization |
| **Prompts** | System prompts, user inputs, agent responses | Debug reasoning issues |
| **Tool Calls** | Every tool invocation with inputs/outputs | Trace side effects |
| **Evals** | Quality scores, human feedback | Continuous improvement |

### OpenTelemetry Integration

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Initialize tracer
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="localhost:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("agent-orchestrator")

async def traced_agent_call(agent_name: str, task: str, context: dict):
    """Wrap agent calls with OpenTelemetry tracing."""
    with tracer.start_as_current_span(f"agent.{agent_name}") as span:
        span.set_attribute("agent.name", agent_name)
        span.set_attribute("agent.task", task[:200])  # Truncate for storage
        span.set_attribute("agent.context_tokens", len(str(context)) // 4)
        
        try:
            result = await call_agent(agent_name, task, context)
            span.set_attribute("agent.success", True)
            span.set_attribute("agent.result_length", len(result))
            return result
        except Exception as e:
            span.set_attribute("agent.success", False)
            span.set_attribute("agent.error", str(e))
            span.record_exception(e)
            raise
```

### Debugging Multi-Agent Failures

When an agent system fails:

1. **Capture the full trace** — Which agent failed? What was the input?
2. **Check handoff schema** — Was context properly passed?
3. **Review tool calls** — Did tools return unexpected results?
4. **Examine coordination** — Was there a deadlock or timeout?
5. **Validate memory state** — Was shared state corrupted?

### Structured Logging Pattern

```python
import structlog

logger = structlog.get_logger()

async def orchestrate_with_logging(task: str):
    correlation_id = str(uuid.uuid4())
    
    log = logger.bind(
        correlation_id=correlation_id,
        task_type="orchestration"
    )
    
    log.info("orchestration_started", task=task[:100])
    
    for step in execution_plan:
        step_log = log.bind(step_id=step["id"], agent=step["agent"])
        step_log.info("step_started")
        
        try:
            result = await execute_step(step)
            step_log.info("step_completed", 
                          success=True, 
                          result_summary=result[:100])
        except Exception as e:
            step_log.error("step_failed", 
                          error=str(e), 
                          error_type=type(e).__name__)
            raise
    
    log.info("orchestration_completed")
```

### Evaluation-Gated Deployment

> **Best Practice (AWS DevOps Agent pattern)**: No agent version reaches users without passing quality gates.

```python
class EvaluationGate:
    def __init__(self, golden_dataset_path: str, min_pass_rate: float = 0.95):
        self.golden_dataset = load_golden_dataset(golden_dataset_path)
        self.min_pass_rate = min_pass_rate
    
    async def evaluate(self, agent_version: str) -> bool:
        """Run golden dataset evaluation before deployment."""
        results = []
        
        for test_case in self.golden_dataset:
            result = await run_agent(
                agent_version, 
                test_case["input"],
                test_case["expected_output"]
            )
            results.append(result["passed"])
        
        pass_rate = sum(results) / len(results)
        
        if pass_rate < self.min_pass_rate:
            log.warning("evaluation_gate_failed",
                       agent_version=agent_version,
                       pass_rate=pass_rate,
                       min_required=self.min_pass_rate)
            return False
        
        log.info("evaluation_gate_passed",
                agent_version=agent_version,
                pass_rate=pass_rate)
        return True
```
