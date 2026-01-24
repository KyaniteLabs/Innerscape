#!/usr/bin/env python3
"""
Agent Scaffold Generator

Creates a new agent project with best-practice structure.

Usage:
    python agent-scaffold.py <agent-name> [--type TYPE]

Types:
    basic       - Minimal agent with essential tools
    research    - Research-focused with web search
    automation  - Task automation with subagents
    full        - Complete setup with all features

Example:
    python agent-scaffold.py my-email-agent --type automation
"""

import argparse
import os
from pathlib import Path

TEMPLATES = {
    "basic": {
        "main.py": '''#!/usr/bin/env python3
"""
{name} Agent
Generated with agent-scaffold
"""

import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "Bash"],
)

async def main():
    prompt = input("Task: ")
    
    async for message in query(prompt=prompt, options=options):
        if hasattr(message, "result"):
            print(message.result)

if __name__ == "__main__":
    asyncio.run(main())
''',
        "requirements.txt": '''claude-agent-sdk>=1.0.0
''',
        ".env.example": '''ANTHROPIC_API_KEY=your-api-key-here
''',
        "README.md": '''# {name}

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set your API key:
   ```bash
   export ANTHROPIC_API_KEY=your-key
   ```

3. Run:
   ```bash
   python main.py
   ```

## Configuration

Edit `main.py` to customize:
- `allowed_tools` - Tools the agent can use
- `permission_mode` - How to handle sensitive operations
''',
    },
    
    "research": {
        "main.py": '''#!/usr/bin/env python3
"""
{name} Research Agent
Generated with agent-scaffold
"""

import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

agents = {{
    "web-researcher": AgentDefinition(
        description="Searches the web for current information.",
        prompt="""You research topics using web search.
1. Form clear search queries
2. Search authoritative sources
3. Cross-reference findings
4. Summarize with citations""",
        tools=["WebSearch", "WebFetch"]
    ),
    "doc-analyzer": AgentDefinition(
        description="Analyzes local documents and code.",
        prompt="""You analyze documents and code.
1. Search for relevant files
2. Read and analyze content
3. Extract key information""",
        tools=["Read", "Glob", "Grep"]
    )
}}

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "WebSearch", "WebFetch", "Task"],
    agents=agents
)

async def research(topic: str):
    prompt = f"""
Research comprehensively: {{topic}}

1. Use web-researcher for current web information
2. Use doc-analyzer for local documents
3. Synthesize findings into clear report
"""
    async for message in query(prompt=prompt, options=options):
        if hasattr(message, "result"):
            return message.result

async def main():
    topic = input("Research topic: ")
    result = await research(topic)
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
''',
        "requirements.txt": '''claude-agent-sdk>=1.0.0
''',
        ".env.example": '''ANTHROPIC_API_KEY=your-api-key-here
''',
        "README.md": '''# {name}

Research agent with web search and document analysis capabilities.

## Features

- Web search via WebSearch tool
- Local document analysis
- Subagent delegation for parallel research

## Setup

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your-key
python main.py
```
''',
    },
    
    "automation": {
        "main.py": '''#!/usr/bin/env python3
"""
{name} Automation Agent
Generated with agent-scaffold
"""

import asyncio
import json
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition, HookMatcher

# Security hook for dangerous operations
async def validate_operation(input_data, tool_use_id, context):
    """Validate potentially dangerous operations."""
    tool = input_data.get("tool_name")
    tool_input = input_data.get("tool_input", {{}})
    
    # Block dangerous Bash commands
    if tool == "Bash":
        cmd = tool_input.get("command", "")
        dangerous = ["rm -rf", "DROP TABLE", "> /etc/", "chmod 777"]
        for pattern in dangerous:
            if pattern in cmd:
                return {{"error": f"Blocked dangerous command: {{pattern}}"}}
    
    return {{}}

# Audit logging
async def audit_log(input_data, tool_use_id, context):
    """Log all tool usage."""
    print(f"[AUDIT] {{input_data.get('tool_name')}}: {{tool_use_id}}")
    return {{}}

# Subagents for specialized tasks
agents = {{
    "code-reviewer": AgentDefinition(
        description="Reviews code for quality and security.",
        prompt="""You review code thoroughly.
Check for: bugs, security issues, style, clarity.
Return specific issues with file:line references.""",
        tools=["Read", "Grep", "Glob"]
    ),
    "test-runner": AgentDefinition(
        description="Runs and reports on tests.",
        prompt="""You run and analyze tests.
1. Detect test framework
2. Run appropriate test command
3. Report results and failures""",
        tools=["Read", "Bash", "Glob"]
    ),
}}

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Task"],
    agents=agents,
    hooks={{
        "PreToolUse": [
            HookMatcher(matcher=".*", hooks=[audit_log]),
            HookMatcher(matcher="Bash|Write|Edit", hooks=[validate_operation])
        ]
    }}
)

async def automate(task: str):
    async for message in query(prompt=task, options=options):
        if hasattr(message, "result"):
            return message.result

async def main():
    task = input("Automation task: ")
    result = await automate(task)
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
''',
        "requirements.txt": '''claude-agent-sdk>=1.0.0
''',
        ".env.example": '''ANTHROPIC_API_KEY=your-api-key-here
''',
        "README.md": '''# {name}

Automation agent with subagents, hooks, and security guardrails.

## Features

- Specialized subagents (code-reviewer, test-runner)
- Security hooks blocking dangerous operations
- Audit logging for all tool usage

## Setup

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your-key
python main.py
```

## Security

The agent includes guardrails:
- Dangerous Bash patterns are blocked
- All tool usage is logged
- Subagents have restricted tool access
''',
    },
    
    "full": {
        "main.py": '''#!/usr/bin/env python3
"""
{name} Full-Featured Agent
Generated with agent-scaffold
"""

import asyncio
import json
import os
from datetime import datetime
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition, HookMatcher

# ============================================================================
# CONFIGURATION
# ============================================================================

DANGEROUS_PATTERNS = [
    "rm -rf /",
    "DROP TABLE",
    "DROP DATABASE",
    "> /etc/",
    "chmod 777",
    "curl | bash",
]

SENSITIVE_PATTERNS = ["API_KEY", "SECRET", "PASSWORD", "TOKEN"]

# ============================================================================
# HOOKS
# ============================================================================

async def validate_bash(input_data, tool_use_id, context):
    """Block dangerous bash commands."""
    cmd = input_data.get("tool_input", {{}}).get("command", "")
    
    for pattern in DANGEROUS_PATTERNS:
        if pattern in cmd:
            return {{"error": f"Blocked: dangerous pattern '{{pattern}}'"}}
    
    for pattern in SENSITIVE_PATTERNS:
        if pattern in cmd and os.environ.get(pattern, "") in cmd:
            return {{"error": "Blocked: actual secret value in command"}}
    
    return {{}}

async def audit_logger(input_data, tool_use_id, context):
    """Log all tool usage for audit."""
    log_entry = {{
        "timestamp": datetime.now().isoformat(),
        "tool": input_data.get("tool_name"),
        "tool_use_id": tool_use_id,
    }}
    
    with open("audit.log", "a") as f:
        f.write(json.dumps(log_entry) + "\\n")
    
    return {{}}

async def require_approval(input_data, tool_use_id, context):
    """Require human approval for sensitive operations."""
    tool = input_data.get("tool_name")
    tool_input = input_data.get("tool_input", {{}})
    
    print(f"\\n⚠️  Approval Required")
    print(f"   Tool: {{tool}}")
    print(f"   Input: {{json.dumps(tool_input, indent=2)[:200]}}")
    
    approval = input("   Approve? (y/n): ")
    if approval.lower() != "y":
        return {{"error": "Operation declined by user"}}
    
    return {{}}

# ============================================================================
# SUBAGENTS
# ============================================================================

agents = {{
    "researcher": AgentDefinition(
        description="Deep research on topics using web and documents.",
        prompt="""You conduct thorough research.
1. Search web for current information
2. Analyze local documents
3. Cross-reference sources
4. Synthesize into clear report with citations""",
        tools=["Read", "Glob", "Grep", "WebSearch", "WebFetch"]
    ),
    
    "code-reviewer": AgentDefinition(
        description="Reviews code for quality, security, and best practices.",
        prompt="""You are a senior code reviewer.
Check for:
- Security vulnerabilities
- Code quality issues
- Missing error handling
- Performance concerns
Return specific issues as: **[SEVERITY]** file:line - description""",
        tools=["Read", "Grep", "Glob"]
    ),
    
    "test-writer": AgentDefinition(
        description="Writes comprehensive tests.",
        prompt="""You write thorough tests.
For each function:
- Happy path test
- Edge cases (null, empty, boundary)
- Error conditions
Follow project's existing test patterns.""",
        tools=["Read", "Write", "Glob", "Bash"]
    ),
    
    "documenter": AgentDefinition(
        description="Writes clear documentation.",
        prompt="""You write excellent documentation.
Include:
- Purpose and overview
- Usage examples
- Configuration options
- Common gotchas
Match existing documentation style.""",
        tools=["Read", "Write", "Glob"]
    ),
}}

# ============================================================================
# AGENT OPTIONS
# ============================================================================

options = ClaudeAgentOptions(
    allowed_tools=[
        "Read", "Write", "Edit", "Bash",
        "Glob", "Grep", "WebSearch", "WebFetch",
        "Task", "AskUserQuestion"
    ],
    agents=agents,
    permission_mode="default",
    hooks={{
        "PreToolUse": [
            HookMatcher(matcher=".*", hooks=[audit_logger]),
            HookMatcher(matcher="Bash", hooks=[validate_bash]),
            HookMatcher(matcher="Write|Edit", hooks=[require_approval]),
        ]
    }}
)

# ============================================================================
# MAIN
# ============================================================================

async def run_agent(task: str):
    """Run the agent with the given task."""
    session_id = None
    
    async for message in query(prompt=task, options=options):
        # Capture session for potential resume
        if hasattr(message, "subtype") and message.subtype == "init":
            session_id = message.session_id
            print(f"Session: {{session_id}}")
        
        # Show tool usage
        if hasattr(message, "tool_use"):
            print(f"Using: {{message.tool_use.name}}")
        
        # Return final result
        if hasattr(message, "result"):
            return message.result
    
    return None

async def main():
    print("=" * 50)
    print("{name} Agent")
    print("=" * 50)
    
    task = input("\\nTask: ")
    result = await run_agent(task)
    
    print("\\n" + "=" * 50)
    print("Result:")
    print("=" * 50)
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
''',
        "requirements.txt": '''claude-agent-sdk>=1.0.0
python-dotenv>=1.0.0
''',
        ".env.example": '''ANTHROPIC_API_KEY=your-api-key-here
''',
        "README.md": '''# {name}

Full-featured agent with comprehensive capabilities.

## Features

- **Subagents**: researcher, code-reviewer, test-writer, documenter
- **Security**: Dangerous command blocking, secret detection
- **Audit**: All tool usage logged to audit.log
- **Human-in-loop**: Approval required for file modifications

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API key
python main.py
```

## Configuration

Customize in main.py:
- `DANGEROUS_PATTERNS` - Commands to block
- `agents` - Add/modify subagents
- `hooks` - Add validation logic

## Security

This agent includes multiple security layers:
1. Dangerous pattern blocking
2. Secret exposure prevention
3. Human approval for writes
4. Full audit logging

Review audit.log for operation history.
''',
        ".gitignore": '''# Environment
.env
*.log
__pycache__/
*.pyc

# IDE
.vscode/
.idea/

# Temp
tmp/
*.tmp
''',
    },
}


def create_agent(name: str, agent_type: str, output_dir: str = "."):
    """Create agent project with given name and type."""
    
    # Validate type
    if agent_type not in TEMPLATES:
        print(f"Error: Unknown type '{agent_type}'")
        print(f"Available types: {', '.join(TEMPLATES.keys())}")
        return False
    
    # Create directory
    project_dir = Path(output_dir) / name
    project_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate files
    template = TEMPLATES[agent_type]
    for filename, content in template.items():
        file_path = project_dir / filename
        file_content = content.format(name=name)
        file_path.write_text(file_content)
        print(f"  Created: {filename}")
    
    # Make main.py executable
    main_path = project_dir / "main.py"
    if main_path.exists():
        os.chmod(main_path, 0o755)
    
    print(f"\n✓ Agent created: {project_dir}")
    print(f"\nNext steps:")
    print(f"  cd {name}")
    print(f"  pip install -r requirements.txt")
    print(f"  export ANTHROPIC_API_KEY=your-key")
    print(f"  python main.py")
    
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Generate agent project scaffold"
    )
    parser.add_argument("name", help="Agent name (used for directory)")
    parser.add_argument(
        "--type", "-t",
        default="basic",
        choices=TEMPLATES.keys(),
        help="Agent template type"
    )
    parser.add_argument(
        "--output", "-o",
        default=".",
        help="Output directory"
    )
    
    args = parser.parse_args()
    create_agent(args.name, args.type, args.output)


if __name__ == "__main__":
    main()
