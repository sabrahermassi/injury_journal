Find every Markdown file in this project (README.md, CLAUDE.md, any files in 
.claude/commands/, docs/, or elsewhere) and review them specifically for token 
efficiency — not correctness or style, token cost.

For each file, report:
1. Current approximate token count
2. Specific bloat sources: redundant explanations, verbose phrasing that could 
   be tightened, repeated information that appears in more than one file, 
   examples that are longer than needed to make the point, and any content 
   that's more decorative than functional (excessive headers, ASCII art, 
   over-formatted tables where plain text would work)
3. Content that could be removed entirely because it's stale, obvious from 
   context, or duplicated elsewhere
4. Content that could be moved out of always-loaded files (like CLAUDE.md) into 
   a reference doc that's only pulled in on demand, if applicable

Do NOT edit any files yet. Give me a report per file with concrete before/after 
suggestions (short excerpt of the bloated version and a tightened rewrite), plus 
an estimated token savings per file and in total. I'll review and tell you which 
changes to apply.
