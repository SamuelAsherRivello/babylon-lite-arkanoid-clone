# Spec Delta

## MODIFIED Requirements

### Requirement: Developer-selectable content mode
The application MUST initialize the playable Neon Breaker Duo game by default using Babylon Lite's WebGPU 2D Pixel Perfect content pipeline. The game content MUST use nearest-sampled artwork, disable texture mipmaps and antialiasing for pixel art, and preserve crisp integer scaling whenever it fits the viewport, with documented fractional fit when it does not. There MUST NOT be a runtime mode picker. Developers MAY select another content implementation through source configuration; unsupported content MUST produce an actionable initialization message.

#### Scenario: Default content mode
- **WHEN** the application loads in a supported WebGPU browser
- **THEN** it initializes the portrait Neon Breaker Duo board without first showing a showcase or mode picker

#### Scenario: 3D content style selected
- **WHEN** a developer selects 3D content
- **THEN** the content does not inherit the Pixel Perfect 2D policy and uses the separately documented 3D rendering policy

#### Scenario: Unsupported renderer reports recovery steps
- **WHEN** WebGPU or the configured renderer is unavailable
- **THEN** the application displays a visible message describing the limitation and how to try a supported browser or device

## REMOVED Requirements

### Requirement: Pixel-art showcase scene
**Reason**: The generated sample scene is replaced by the complete requested game.
**Migration**: The default content renders the game using the retained Babylon Lite pixel-perfect pipeline.

### Requirement: Native-size showcase sprite
**Reason**: The starter showcase artwork is unrelated to the requested game.
**Migration**: Use original game-specific sprites and retain the existing pixel-perfect rendering guarantees.
