# Example Agent Templates

Ready-to-use templates for common agent types. Adapt to your needs.

---

## 1. Research Agent

Deep research across documents and web.

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

research_agents = {
    "web-researcher": AgentDefinition(
        description="Searches web for current information.",
        prompt="""You research topics using web search.

When invoked:
1. Form clear search queries
2. Search for authoritative sources
3. Cross-reference multiple sources
4. Summarize findings with citations

Return format:
## Findings
- Key fact 1 (source)
- Key fact 2 (source)

## Sources
- [Title](URL)""",
        tools=["WebSearch", "WebFetch"]
    ),
    
    "doc-analyzer": AgentDefinition(
        description="Analyzes local documents and codebases.",
        prompt="""You analyze documents and code.

When invoked:
1. Search for relevant files
2. Read and analyze content
3. Extract key information
4. Note connections between files

Be thorough. Use grep for specific searches.""",
        tools=["Read", "Glob", "Grep"]
    )
}

research_options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "WebSearch", "Task"],
    agents=research_agents
)

async def research(topic: str):
    async for msg in query(
        prompt=f"Research comprehensively: {topic}",
        options=research_options
    ):
        if hasattr(msg, "result"):
            return msg.result
```

---

## 2. Code Review Agent

Automated code review with security focus.

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition, HookMatcher

review_agents = {
    "security-scanner": AgentDefinition(
        description="Scans for security vulnerabilities.",
        prompt="""You are a security expert.

Check for:
- Injection vulnerabilities (SQL, XSS, command)
- Exposed secrets/credentials
- Insecure cryptography
- Missing input validation
- Unsafe deserialization

Format findings as:
**[SEVERITY]** file:line - description""",
        tools=["Read", "Grep", "Glob"]
    ),
    
    "quality-checker": AgentDefinition(
        description="Checks code quality and patterns.",
        prompt="""You ensure code quality.

Check for:
- Code duplication
- Complex functions (high cyclomatic complexity)
- Missing error handling
- Poor naming
- Missing documentation

Suggest specific improvements.""",
        tools=["Read", "Grep", "Glob"]
    )
}

async def log_review(input_data, tool_use_id, context):
    print(f"[Review] Analyzing with {input_data.get('tool_name')}")
    return {}

review_options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "Bash", "Task"],
    permission_mode="bypassPermissions",  # Read-only
    agents=review_agents,
    hooks={
        "PreToolUse": [HookMatcher(matcher=".*", hooks=[log_review])]
    }
)

async def review_code(target: str = "."):
    prompt = f"""
Review code in {target}:

1. Run security-scanner for vulnerabilities
2. Run quality-checker for code quality
3. Check for common issues:
   - Unused imports
   - TODO comments
   - Debug statements

Prioritize issues by severity. Be specific and actionable.
"""
    async for msg in query(prompt=prompt, options=review_options):
        if hasattr(msg, "result"):
            return msg.result
```

---

## 3. Database Analyst Agent

Safe database exploration with guardrails.

```python
from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher

# Safety hook for SQL
async def validate_sql(input_data, tool_use_id, context):
    # Only allow read operations
    sql = input_data.get('tool_input', {}).get('query', '').upper()
    
    dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE']
    for keyword in dangerous:
        if keyword in sql:
            return {"error": f"Blocked: {keyword} not allowed. Read-only access."}
    
    return {}

db_options = ClaudeAgentOptions(
    allowed_tools=["Read", "Bash"],
    mcp_servers={
        "postgres": {
            "command": "uvx",
            "args": ["mcp-server-postgres"],
            "env": {"DATABASE_URL": "postgresql://readonly:pass@localhost/db"}
        }
    },
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="postgres_query", hooks=[validate_sql])
        ]
    }
)

async def analyze_database(question: str):
    prompt = f"""
You are a data analyst. Answer this question using the database:

{question}

Steps:
1. Explore schema to understand tables
2. Form appropriate queries
3. Analyze results
4. Present findings clearly

Use only SELECT queries. Explain your reasoning.
"""
    async for msg in query(prompt=prompt, options=db_options):
        if hasattr(msg, "result"):
            return msg.result
```

---

## 4. Email Assistant Agent

Email drafting with human approval for sending.

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition, HookMatcher

async def approve_send(input_data, tool_use_id, context):
    """Require approval before sending any email."""
    email = input_data.get('tool_input', {})
    
    print("\n" + "="*50)
    print("📧 EMAIL APPROVAL REQUIRED")
    print("="*50)
    print(f"To: {email.get('to')}")
    print(f"Subject: {email.get('subject')}")
    print(f"Body:\n{email.get('body')[:500]}...")
    print("="*50)
    
    approval = input("Send this email? (y/n): ")
    if approval.lower() != 'y':
        return {"error": "Email sending declined by user"}
    return {}

email_agents = {
    "style-analyzer": AgentDefinition(
        description="Analyzes writing style from previous emails.",
        prompt="""Analyze the user's email writing style:
- Tone (formal/casual)
- Greeting style
- Sign-off style
- Common phrases
- Length preference""",
        tools=["Read", "Grep"]
    )
}

email_options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "Task"],
    mcp_servers={
        "gmail": {"command": "npx", "args": ["@anthropic/mcp-gmail"]}
    },
    agents=email_agents,
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="send_email", hooks=[approve_send])
        ]
    }
)

async def email_assistant(instruction: str):
    prompt = f"""
You are an email assistant.

Task: {instruction}

Process:
1. Check inbox for relevant context
2. Use style-analyzer to match user's tone
3. Draft response
4. Present draft for approval

Never send without explicit approval.
"""
    async for msg in query(prompt=prompt, options=email_options):
        if hasattr(msg, "result"):
            return msg.result
```

---

## 5. Test Writer Agent

Generates comprehensive tests for code.

```python
from claude_agent_sdk import query, ClaudeAgentOptions

test_options = ClaudeAgentOptions(
    allowed_tools=["Read", "Write", "Glob", "Grep", "Bash"]
)

async def generate_tests(file_path: str):
    prompt = f"""
Generate comprehensive tests for: {file_path}

Process:
1. Read and understand the code
2. Identify all functions/methods
3. For each function:
   - Test happy path
   - Test edge cases (null, empty, boundary)
   - Test error conditions
4. Write tests using existing test framework (detect from project)
5. Run tests to verify they work

Output tests to appropriate location following project conventions.
Explain your test strategy.
"""
    async for msg in query(prompt=prompt, options=test_options):
        if hasattr(msg, "result"):
            return msg.result
```

---

## 6. Documentation Agent

Generates and maintains documentation.

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

doc_agents = {
    "api-documenter": AgentDefinition(
        description="Documents API endpoints.",
        prompt="""Document API endpoints with:
- HTTP method and path
- Request parameters
- Request body schema
- Response schema
- Example request/response
- Error codes""",
        tools=["Read", "Grep"]
    ),
    
    "readme-generator": AgentDefinition(
        description="Generates README files.",
        prompt="""Create README with:
- Project description
- Installation instructions
- Usage examples
- Configuration options
- Contributing guidelines""",
        tools=["Read", "Glob", "Write"]
    )
}

doc_options = ClaudeAgentOptions(
    allowed_tools=["Read", "Write", "Glob", "Grep", "Task"],
    agents=doc_agents
)

async def generate_docs(scope: str = "full"):
    prompt = f"""
Generate documentation for this project.

Scope: {scope}

Tasks:
1. Analyze project structure
2. Generate/update README.md
3. Document all public APIs
4. Create usage examples
5. Note any undocumented areas

Follow existing documentation style if present.
"""
    async for msg in query(prompt=prompt, options=doc_options):
        if hasattr(msg, "result"):
            return msg.result
```

---

## 7. Debugging Agent

Systematic debugging for errors.

```python
from claude_agent_sdk import query, ClaudeAgentOptions

debug_options = ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Bash", "Glob", "Grep"]
)

async def debug_error(error_message: str, context: str = ""):
    prompt = f"""
Debug this error:

```
{error_message}
```

Additional context: {context}

Systematic approach:
1. Parse error message and stack trace
2. Locate relevant code
3. Understand the code flow
4. Form hypothesis about root cause
5. Add debugging (logs/breakpoints) if needed
6. Verify fix with test

Think step-by-step. Don't guess — investigate.
"""
    async for msg in query(prompt=prompt, options=debug_options):
        if hasattr(msg, "result"):
            return msg.result
```

---

## 8. Deployment Agent

Safe deployment automation.

```python
from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher

async def approve_deploy(input_data, tool_use_id, context):
    """Require approval for deployment commands."""
    cmd = input_data.get('tool_input', {}).get('command', '')
    
    deploy_commands = ['deploy', 'push', 'release', 'publish']
    if any(dc in cmd for dc in deploy_commands):
        print(f"\n🚀 DEPLOYMENT APPROVAL: {cmd}")
        approval = input("Proceed? (y/n): ")
        if approval.lower() != 'y':
            return {"error": "Deployment cancelled by user"}
    return {}

deploy_options = ClaudeAgentOptions(
    allowed_tools=["Read", "Bash", "Glob", "Grep"],
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="Bash", hooks=[approve_deploy])
        ]
    }
)

async def deploy(environment: str, version: str):
    prompt = f"""
Deploy version {version} to {environment}.

Pre-deployment checklist:
1. Verify all tests pass
2. Check for pending migrations
3. Review environment variables
4. Confirm version tag exists

Deployment steps:
1. Create backup/snapshot
2. Run deployment command
3. Verify health checks
4. Report status

Require approval before executing deployment.
"""
    async for msg in query(prompt=prompt, options=deploy_options):
        if hasattr(msg, "result"):
            return msg.result
```

---

## Quick Template

Minimal agent for custom use:

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep"],  # Adjust as needed
)

async def my_agent(task: str):
    async for msg in query(prompt=task, options=options):
        if hasattr(msg, "result"):
            print(msg.result)

# Run
asyncio.run(my_agent("Analyze the codebase structure"))
```
