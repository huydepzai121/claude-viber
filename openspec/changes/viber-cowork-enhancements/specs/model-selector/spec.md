## ADDED Requirements

### Requirement: Model dropdown from SDK

The ChatInput SHALL display a dropdown selector showing all models fetched from `querySession.supportedModels()`. Each model shows displayName and description.

#### Scenario: Models loaded after session init

- **WHEN** session initializes and `supportedModels()` returns model list
- **THEN** the model dropdown populates with all available models

#### Scenario: User selects a different model

- **WHEN** user selects a model from the dropdown
- **THEN** `querySession.setModel(modelId)` is called
- **AND** the dropdown reflects the new selection

#### Scenario: Models not yet loaded

- **WHEN** session has not started
- **THEN** dropdown shows a default model or placeholder
