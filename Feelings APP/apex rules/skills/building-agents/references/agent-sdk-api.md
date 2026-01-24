# Agent SDK API Reference

> **Last Updated**: 2026-01-24
> 
> **Sources**: OpenAI Agents SDK, Google ADK, Microsoft Agent Framework, A2A Protocol Specification

---

## 2026 SDK Landscape

### Major Frameworks Comparison

| Framework | Language | Best For | Key Feature | Version |
|-----------|----------|----------|-------------|---------|
| **OpenAI Agents SDK** | Python | Multi-agent workflows | Built-in tracing, MCP support | 0.6.x |
| **Google ADK** | Python, TS, Go, Java | Gemini-optimized workflows | Model-agnostic, multi-language | 0.5.0 |
| **Microsoft Agent Framework** | .NET, Python | Enterprise M365/Teams | Unified Semantic Kernel + AutoGen | 1.x |
| **Claude Agent SDK** | Python, TS | Anthropic-native workflows | Session management, hooks | Current |
| **LangGraph** | Python | Complex stateful workflows | Graph-based, 100% accuracy benchmarks | 2026.x |
| **CrewAI** | Python | Team-based orchestration | Role-based crews, fault-tolerance | 2.x |

### Protocol Comparison

| Protocol | Purpose | When to Use |
|----------|---------|-------------|
| **MCP** (Model Context Protocol) | Agent-to-tool communication | Tool/resource sharing |
| **A2A** (Agent-to-Agent Protocol) | Agent-to-agent communication | Multi-vendor agent interoperability |
| **ACP** (Agent Communication Protocol) | Enterprise messaging | Large-scale enterprise deployments |
| **ANP** (Agent Network Protocol) | Cross-network discovery | Cross-organization agent discovery |

---

## OpenAI Agents SDK (2026)

> **Source**: https://openai.github.io/openai-agents-python/release/

### Installation

```bash
pip install openai-agents
```

### Changelog Highlights (v0.4–0.6)

| Version | Key Changes |
|---------|-------------|
| **0.6.0** | Default handoff history packaged into single assistant message with context labeling |
| **0.5.0** | RealtimeRunner support for SIP protocol connections, Python 3.14 compatibility |
| **0.4.0** | Requires OpenAI v2.x (v1.x no longer supported) |
| **0.3.0** | Realtime API migrated to gpt-realtime model |

### Key Features

- Built-in agent loops
- Function tools with automatic schema generation
- MCP server integration
- Guardrails and tracing
- Sessions and realtime agents for voice applications

```python
from openai_agents import Agent, Runner

agent = Agent(
    name="researcher",
    instructions="You research topics thoroughly.",
    tools=[web_search, file_read]
)

runner = Runner(agents=[agent])
result = await runner.run("Research the latest AI agent frameworks")
```

---

## Google Agent Development Kit (ADK) 0.5.0

> **Source**: https://google.github.io/adk-docs/release-notes/

### Installation

```bash
# Python
pip install google-adk

# TypeScript
npm install @google/adk

# Go
go get google.golang.org/adk

# Java (Maven)
<dependency>
  <groupId>com.google.adk</groupId>
  <artifactId>adk-core</artifactId>
  <version>0.5.0</version>
</dependency>
```

### Key Features

- **Model-agnostic**: Optimized for Gemini but works with any LLM
- **Deployment-agnostic**: Local, cloud, or edge deployment
- **Multi-language**: Python, TypeScript, Go, Java SDKs
- **Software-engineer friendly**: Feels like traditional development

### Example (Python)

```python
from google.adk import Agent, Tool

@Tool
def search_web(query: str) -> str:
    """Search the web for information."""
    # Implementation
    pass

agent = Agent(
    model="gemini-2.0-flash",
    tools=[search_web],
    system_prompt="You are a helpful research assistant."
)

response = await agent.run("What are the latest AI agent frameworks?")
```

---

## Microsoft Agent Framework

> **Source**: https://aka.ms/dotnet/agent-framework/docs

Unified foundation combining Semantic Kernel and AutoGen projects.

### Installation

```bash
# .NET
dotnet add package Microsoft.Agent.Framework

# Python
pip install microsoft-agent-framework
```

### Key Features

- Individual agents with LLM capabilities
- Graph-based workflows for multi-step tasks
- Native M365, Teams, Copilot Studio integration
- Built-in observability with Azure AI Foundry

---

## A2A Protocol (Agent-to-Agent)

> **Source**: https://google.github.io/A2A/specification/

Google's open standard for agent interoperability, donated to Linux Foundation (April 2025). Backed by 50+ partners including Microsoft, Salesforce.

### Core Concepts

| Component | Description |
|-----------|-------------|
| **Agent Card** | JSON metadata describing identity, capabilities, authentication |
| **Task** | Fundamental unit of work with unique ID and lifecycle |
| **Message** | Communication turn with role ("user" or "agent") and Parts |
| **Part** | Content unit: TextPart, FilePart, or DataPart |

### Technical Foundation

- Built on HTTP, JSON-RPC 2.0, Server-Sent Events
- Async-first design for long-running tasks
- Human-in-the-loop support built in

### Agent Card Schema

```json
{
  "name": "research-agent",
  "description": "Specialized research agent for deep topic analysis",
  "version": "1.0.0",
  "capabilities": [
    {
      "name": "web_research",
      "description": "Search and analyze web content",
      "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}},
      "output_schema": {"type": "object", "properties": {"findings": {"type": "array"}}}
    }
  ],
  "authentication": {
    "type": "oauth2",
    "scopes": ["read", "execute"]
  },
  "endpoint": "https://api.example.com/agents/research"
}
```

### A2A Task Lifecycle

```
PENDING → RUNNING → COMPLETED
                  ↘ FAILED
                  ↘ CANCELLED
```

### SDKs Available

- Python: `pip install a2a-protocol`
- JavaScript: `npm install @a2a/sdk`
- Java: Maven `com.google.a2a:a2a-sdk`
- C#/.NET: NuGet `Google.A2A.SDK`
- Golang: `go get github.com/google/a2a-go`

### Relationship to MCP

| Aspect | MCP | A2A |
|--------|-----|-----|
| Purpose | Agent-to-tool | Agent-to-agent |
| Scope | Single agent accessing tools | Multiple agents collaborating |
| Use case | Tool invocation, resource access | Task delegation, capability negotiation |
| Complementary | Yes — use both together |

---

## Claude Agent SDK

## ClaudeAgentOptions

Complete options for configuring an agent.

### Core Options

```python
ClaudeAgentOptions(
    # Tool access
    allowed_tools: list[str] = None,      # Tools agent can use
    
    # Permission handling
    permission_mode: str = "default",      # default|acceptEdits|bypassPermissions|plan
    
    # Subagents
    agents: dict[str, AgentDefinition] = None,
    
    # External systems
    mcp_servers: dict[str, MCPServerConfig] = None,
    
    # Lifecycle hooks
    hooks: dict[str, list[HookMatcher]] = None,
    
    # Session management
    resume: str = None,                    # Session ID to resume
    
    # Context configuration
    setting_sources: list[str] = None,     # ["project"] to load .claude/ config
    
    # Model selection (for subagents)
    model: str = None,                     # sonnet|opus|haiku|inherit
)
```

### TypeScript Equivalent

```typescript
interface ClaudeAgentOptions {
  allowedTools?: string[];
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan";
  agents?: Record<string, AgentDefinition>;
  mcpServers?: Record<string, MCPServerConfig>;
  hooks?: HooksConfig;
  resume?: string;
  settingSources?: string[];
  model?: string;
}
```

---

## AgentDefinition

Define a subagent that can be delegated to.

```python
AgentDefinition(
    description: str,       # When to delegate (include trigger keywords)
    prompt: str,            # System prompt for the subagent
    tools: list[str],       # Tools available to subagent
    model: str = "inherit", # Model override (sonnet|opus|haiku|inherit)
    permission_mode: str = "default",
    skills: list[str] = None,  # Skills to preload
    hooks: dict = None,        # Subagent-specific hooks
)
```

### Example

```python
AgentDefinition(
    description="Security auditor for finding vulnerabilities in code.",
    prompt="""You are a security expert. When invoked:
1. Search for common vulnerability patterns
2. Check for exposed secrets
3. Review input validation
4. Report findings with severity levels""",
    tools=["Read", "Grep", "Glob"],
    model="sonnet"
)
```

---

## MCPServerConfig

Configure an MCP server connection.

```python
{
    "command": str,           # Executable command
    "args": list[str],        # Command arguments
    "env": dict[str, str],    # Environment variables
    "cwd": str,               # Working directory
}
```

### Example

```python
mcp_servers={
    "postgres": {
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
            "DATABASE_URL": "postgresql://user:pass@localhost/db"
        }
    }
}
```

---

## HookMatcher

Match tools for hook execution.

```python
HookMatcher(
    matcher: str,             # Regex pattern for tool names
    hooks: list[Callable],    # Hook functions to run
)
```

### Hook Function Signature

```python
async def hook_function(
    input_data: dict,         # Tool input including tool_name, tool_input
    tool_use_id: str,         # Unique ID for this tool invocation
    context: dict             # Session context
) -> dict:
    # Return {} to allow, {"error": "msg"} to block
    return {}
```

### Available Hook Points

| Hook | When | Use Case |
|------|------|----------|
| `PreToolUse` | Before tool executes | Validation, blocking |
| `PostToolUse` | After tool executes | Logging, auditing |
| `Stop` | Agent completes | Cleanup, final validation |
| `SessionStart` | Session begins | Initialization |
| `SessionEnd` | Session ends | Cleanup |
| `UserPromptSubmit` | User sends prompt | Input preprocessing |

---

## Message Types

Messages yielded by `query()`:

### System Messages

```python
# Init message (contains session ID)
if hasattr(message, 'subtype') and message.subtype == 'init':
    session_id = message.session_id

# Status messages
if hasattr(message, 'subtype') and message.subtype == 'status':
    print(f"Status: {message.content}")
```

### Tool Use Messages

```python
if hasattr(message, 'tool_use'):
    tool_name = message.tool_use.name
    tool_input = message.tool_use.input
    tool_id = message.tool_use.id
```

### Result Messages

```python
if hasattr(message, 'result'):
    final_output = message.result
```

### Subagent Messages

```python
# Messages from within subagent execution
if hasattr(message, 'parent_tool_use_id'):
    # This message is from a subagent
    parent_id = message.parent_tool_use_id
```

---

## Session Management

### Capture Session ID

```python
session_id = None
async for message in query(prompt="...", options=options):
    if hasattr(message, 'subtype') and message.subtype == 'init':
        session_id = message.session_id
```

### Resume Session

```python
# Continue with full context from previous session
async for message in query(
    prompt="Now analyze those files",
    options=ClaudeAgentOptions(resume=session_id)
):
    pass
```

### Fork Session

```python
# Create new session branching from a point
# (Not directly supported — resume creates continuation)
```

---

## Error Handling

```python
from claude_agent_sdk import AgentError, ToolError, PermissionError

try:
    async for message in query(prompt="...", options=options):
        pass
except PermissionError as e:
    print(f"Permission denied: {e}")
except ToolError as e:
    print(f"Tool failed: {e.tool_name} - {e.message}")
except AgentError as e:
    print(f"Agent error: {e}")
```

---

## Third-Party Authentication

### Amazon Bedrock

```bash
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1
```

### Google Vertex AI

```bash
export CLAUDE_CODE_USE_VERTEX=1
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
export GOOGLE_CLOUD_PROJECT=your-project-id
```

### Microsoft Foundry

```bash
export CLAUDE_CODE_USE_FOUNDRY=1
export AZURE_CLIENT_ID=...
export AZURE_CLIENT_SECRET=...
export AZURE_TENANT_ID=...
```

---

## Full Example

```python
import asyncio
import os
from claude_agent_sdk import (
    query, 
    ClaudeAgentOptions, 
    AgentDefinition, 
    HookMatcher
)

async def log_tool_use(input_data, tool_use_id, context):
    print(f"[LOG] Tool: {input_data.get('tool_name')}")
    return {}

async def block_dangerous(input_data, tool_use_id, context):
    cmd = input_data.get('tool_input', {}).get('command', '')
    if 'rm -rf' in cmd:
        return {"error": "Blocked dangerous command"}
    return {}

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "Bash", "Task"],
    permission_mode="default",
    mcp_servers={
        "github": {
            "command": "npx",
            "args": ["@modelcontextprotocol/server-github"],
            "env": {"GITHUB_TOKEN": os.environ.get("GITHUB_TOKEN", "")}
        }
    },
    agents={
        "researcher": AgentDefinition(
            description="Research specialist for deep dives.",
            prompt="Thoroughly research the given topic.",
            tools=["Read", "Glob", "Grep", "WebSearch"]
        )
    },
    hooks={
        "PreToolUse": [
            HookMatcher(matcher=".*", hooks=[log_tool_use]),
            HookMatcher(matcher="Bash", hooks=[block_dangerous])
        ]
    }
)

async def main():
    session_id = None
    
    async for message in query(
        prompt="Analyze the authentication system in this codebase",
        options=options
    ):
        if hasattr(message, 'subtype') and message.subtype == 'init':
            session_id = message.session_id
            print(f"Session: {session_id}")
        
        if hasattr(message, 'tool_use'):
            print(f"Using: {message.tool_use.name}")
        
        if hasattr(message, 'result'):
            print(f"\nResult:\n{message.result}")

asyncio.run(main())
```
