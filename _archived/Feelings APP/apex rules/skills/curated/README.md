# Curated Community Skills

A collection of recommended skills from the community to extend your APEX system.

---

## Official Anthropic Skills

**Repository**: [github.com/anthropics/skills](https://github.com/anthropics/skills) (50k+ stars)

| Skill | Purpose | Install |
|-------|---------|---------|
| **mcp-builder** | Build Model Context Protocol servers | `git clone` |
| **webapp-testing** | Web application testing automation | `git clone` |
| **skill-creator** | Meta-skill for creating new skills | `git clone` |
| **brand-guidelines** | Brand consistency enforcement | `git clone` |
| **frontend-design** | Frontend design patterns | `git clone` |

### Installation

```bash
# Clone specific skill
cd apex/skills/curated
git clone https://github.com/anthropics/skills/tree/main/mcp-builder

# Or clone entire collection
git clone https://github.com/anthropics/skills anthropic-skills
```

---

## SkillRegistry.io (Top Downloads)

**Website**: [skillregistry.io](https://skillregistry.io) (60+ community skills)

| Skill | Purpose | Source |
|-------|---------|--------|
| **github** | GitHub CLI integration (gh commands) | skillregistry.io/github |
| **agent-browser** | Browser automation for testing | skillregistry.io/agent-browser |
| **brave-search** | Web search integration | skillregistry.io/brave-search |
| **skill-finder** | Automatically find relevant skills | skillregistry.io/skill-finder |

### Installation

```bash
# Download from registry
curl -o github.md https://skillregistry.io/skills/github/SKILL.md
```

---

## Awesome Agent Skills

**Repository**: [github.com/skillmatic-ai/awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills)

| Skill | Purpose |
|-------|---------|
| **obsidian-plugin-skill** | Obsidian plugin development |
| **dev-browser** | Browser capability for agents |
| **sheets-cli** | Google Sheets automation |

---

## Adding Custom Skills

### From URL

```bash
cd apex/skills/curated
mkdir my-skill && cd my-skill
curl -o SKILL.md https://example.com/skill.md
```

### From Local File

```bash
cp /path/to/SKILL.md apex/skills/curated/my-skill/SKILL.md
```

### Requirements

Every skill must have:
1. `SKILL.md` file with YAML frontmatter
2. Required fields: `name`, `description`
3. Optional: `scripts/`, `templates/`, `references/`

---

## Skill Verification

Before using a community skill:

```
□ Check source reputation (stars, maintainer)
□ Review SKILL.md content for safety
□ Test in isolated environment first
□ Check allowed-tools are appropriate
□ Verify no external API calls without consent
```

---

## Resources

- **Official Spec**: [agentskills.io/specification](https://agentskills.io/specification)
- **Skill Registry**: [skillregistry.io](https://skillregistry.io)
- **Awesome List**: [github.com/skillmatic-ai/awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills)
- **Anthropic Skills**: [github.com/anthropics/skills](https://github.com/anthropics/skills)
