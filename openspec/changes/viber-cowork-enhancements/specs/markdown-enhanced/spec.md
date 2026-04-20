## ADDED Requirements

### Requirement: Syntax highlighting for code blocks

Markdown code blocks in chat messages SHALL render with syntax highlighting based on the language specified.

#### Scenario: Fenced code block with language

- **WHEN** a message contains a fenced code block with language (e.g., \`\`\`typescript)
- **THEN** the code renders with syntax-highlighted colors

#### Scenario: Fenced code block without language

- **WHEN** a message contains a fenced code block without language spec
- **THEN** the code renders in monospace with basic styling (no highlighting)

### Requirement: Styled markdown elements

Tables, headings, lists, blockquotes, and horizontal rules SHALL render with proper visual styling in chat messages.

#### Scenario: Table rendering

- **WHEN** a message contains a markdown table
- **THEN** it renders with borders, header styling, and alternating row colors

#### Scenario: Heading rendering

- **WHEN** a message contains markdown headings (h1-h6)
- **THEN** they render with appropriate font sizes and weights
