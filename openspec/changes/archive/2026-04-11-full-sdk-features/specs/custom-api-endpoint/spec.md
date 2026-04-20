## ADDED Requirements

### Requirement: API Base URL configuration field

The AppConfig interface SHALL include an optional `apiBaseUrl` field. The Settings page SHALL display an input field for configuring the API Base URL.

#### Scenario: User configures custom base URL

- **WHEN** user enters a URL in the API Base URL field and saves
- **THEN** the value is persisted in config.json as `apiBaseUrl`
- **AND** the next SDK session uses this URL via `ANTHROPIC_BASE_URL` env var

#### Scenario: Empty base URL uses default

- **WHEN** `apiBaseUrl` is empty or not set
- **THEN** the SDK CLI uses the default Anthropic API endpoint
- **AND** `ANTHROPIC_BASE_URL` is NOT set in the session environment

### Requirement: Base URL environment injection

The `buildClaudeSessionEnv()` function SHALL inject `ANTHROPIC_BASE_URL` into the session environment when `apiBaseUrl` is configured in AppConfig.

#### Scenario: Base URL is configured

- **WHEN** `apiBaseUrl` is set to `https://openrouter.ai/api/v1`
- **THEN** `env.ANTHROPIC_BASE_URL` equals `https://openrouter.ai/api/v1`

#### Scenario: Base URL is not configured

- **WHEN** `apiBaseUrl` is empty, undefined, or whitespace
- **THEN** `ANTHROPIC_BASE_URL` is NOT present in the env object
