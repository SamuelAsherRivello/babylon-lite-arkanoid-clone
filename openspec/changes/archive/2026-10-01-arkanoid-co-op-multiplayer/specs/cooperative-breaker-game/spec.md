# Spec Delta

## Purpose

Deliver a complete portrait, two-player online cooperative brick breaker with shared authoritative progression, clear session lifecycle, and replayable matches.

## ADDED Requirements

### Requirement: Shared cooperative match progression
The game MUST maintain one authoritative board, score, three shared lives, and three authored waves for both players. Normal bricks award 10 points and reinforced bricks award 25 points. Clearing a wave MUST advance the shared board. Losing the last active ball MUST consume one shared life and wait for a player launch; reaching zero lives MUST end in defeat. Clearing wave three MUST end in victory. Restart MUST reset score, lives, wave, bricks, balls, powerups, and outcome.

#### Scenario: Both players score against shared progression
- **WHEN** either player causes a normal or reinforced brick to break
- **THEN** the shared score increases by 10 or 25 respectively and both players observe the same updated board

#### Scenario: Last active ball is lost
- **WHEN** all active balls leave the defense line
- **THEN** one shared life is removed and play waits for an explicit launch unless the match has ended

#### Scenario: Match completes and restarts
- **WHEN** the last brick in wave three is cleared or the shared lives reach zero
- **THEN** all clients see victory or defeat, and an explicit restart begins a clean match with three lives and zero score

### Requirement: Two-seat cooperative paddle control
A match MUST admit at most two connected human players, assign one distinct fixed half-lane paddle to each, and accept only bounded input from that paddle's owner. Either paddle MUST be able to return a ball. Clients MUST NOT choose shared outcomes, scoring, collisions, brick damage, powerup effects, or match transitions.

#### Scenario: Players control their assigned lanes
- **WHEN** both seats are occupied and either player moves their paddle
- **THEN** only that player's bounded lane position changes and both clients observe the authoritative position

#### Scenario: Third player attempts to join
- **WHEN** both seats are occupied
- **THEN** the additional client receives a full-session state with a retry path and cannot alter the match

### Requirement: Shared powerups
The game MUST award a falling powerup on a one-in-eight chance when a destructible brick breaks. A wide-paddle powerup MUST widen both paddles for eight seconds. A multiball powerup MUST split an active ball while keeping no more than three active balls.

#### Scenario: Wide paddle pickup
- **WHEN** a ball collects a wide-paddle powerup
- **THEN** both paddles widen for eight seconds of authoritative match time and then return to normal width

#### Scenario: Multiball cap
- **WHEN** a ball collects multiball while three balls are already active
- **THEN** the game retains three balls and does not create additional balls

### Requirement: Shared online session lifecycle
Online play MUST use the public `neon-breaker-duo` game session without room codes and expose connecting, connected, full, retry, and disconnected states. A late joiner MUST receive a full current snapshot. When a player leaves, their vacant paddle MUST center while the match continues. Local pause or focus loss MUST neutralize only that local player's input and MUST NOT pause or reset shared play. Identities and sessions MUST be described as ephemeral, with reset risks when all players leave or the host deployment restarts.

#### Scenario: Late player joins an active match
- **WHEN** a second player joins after bricks or score have changed
- **THEN** that player receives the current board, balls, score, lives, wave, powerups, and outcome

#### Scenario: Local focus is lost
- **WHEN** one client loses focus or is locally paused
- **THEN** its paddle input becomes neutral while the other player and authoritative match continue

#### Scenario: Player disconnects
- **WHEN** a player disconnects
- **THEN** their paddle centers, the remaining player continues, and the vacant seat can be filled by a fresh anonymous identity

### Requirement: Playable input and recovery
The game MUST provide keyboard A/D or left/right movement and pointer/touch drag within each assigned lane, a visible launch control, local pause/resume, and shared restart controls after match completion. Input MUST be released on blur, pointer cancellation, and teardown. The README MUST give exact install, launch, control, player-capacity, reconnect, and hosting-limit instructions.

#### Scenario: Player launches and moves
- **WHEN** a player presses Space or activates the visible launch control, then moves with keyboard or pointer
- **THEN** the server launches a ball when eligible and applies only bounded input to that player's lane

#### Scenario: Rendering cannot initialize
- **WHEN** WebGPU is unavailable or initialization fails
- **THEN** the page displays a useful recovery message instead of a blank play surface
