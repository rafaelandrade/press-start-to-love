# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CONFIDENTIAL**: This is a birthday present game for Gabitcha, made by Rafitcho. The final player should NOT see the design documents before the birthday.

This is a Phaser 3 + TypeScript 2D adventure game with multiple phases, each with unique mechanics (dodge, time rush, collection, narrative). The game tells the real story of a couple from their first match to the final "I love you."

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (opens at http://localhost:5173)
pnpm dev

# Build for production (with TypeScript type checking)
pnpm build

# Preview production build
pnpm preview
```

## Architecture

### Scene Flow
The game consists of 8 Phaser scenes executed in sequence:
1. `Boot` - Initial setup and character texture generation
2. `Prologo` - Two cities intro (tutorial)
3. `Fase1Match` - Dodge game (collect the right profile)
4. `Fase2Shopping` - Time rush serving customers
5. `Fase3Upgrade` - CV builder and idea collection
6. `Fase4Viagem` - Contemplative travel phase
7. `Fase5Encomenda` - Yuumitcha chaos (most humorous)
8. `Fase6Tempestade` - Emotional support during crisis
9. `FinalCarta` - Final love letter

All scenes are registered in `src/main.ts` and transition using `fadeToScene()` from `src/ui/transitions.ts`.

### BaseFase Pattern
Most game phases extend `BaseFase` (`src/scenes/BaseFase.ts`), which provides:
- Standard fade-in transition
- Title display at top
- "touch/space to continue" prompt at bottom
- Automatic progression to next scene
- Abstract `montar()` method for phase-specific content

Phases override `montar()` to implement their unique mechanics.

### Procedural Sprites
Character sprites (Gabitcha, Rafitcho, Yuumitcha) are generated procedurally from pixel grids defined in `src/sprites/data.ts`. Each sprite is a matrix where characters map to colors in a palette (`.` = transparent).

Textures are created via `createCharacterTextures()` in `src/sprites/factory.ts`, called once during `Boot` scene.

### Centralized Dialog System
**ALL** game text lives in `src/dialogos.ts` as a single source of truth. This includes:
- Phase titles and instructions
- Character dialogue
- UI labels
- Final letter content
- TODO placeholders for internal jokes (section 7 of GAME_DESIGN.md)

Never hardcode strings in scenes - always reference `DIALOGOS`.

### UI Components
- `DialogBox` (`src/ui/DialogBox.ts`) - Fixed dialog box at screen bottom with typewriter-like display
- `TouchControls` (`src/ui/TouchControls.ts`) - Mobile touch input handling
- `constants.ts` - Game dimensions (160x144) and color palette
- `transitions.ts` - `fadeIn()` and `fadeToScene()` for scene transitions

### Physics Configuration
Arcade Physics with gravity `{x: 0, y: 600}` configured in `src/main.ts`. Most sprites disable gravity individually via `setAllowGravity(false)`.

### Render Settings
- `pixelArt: true` disables antialiasing
- `scale.zoom: 4` for proper pixel art display
- `scale.mode: FIT` with `autoCenter: CENTER_BOTH` for responsive layout

## Key Design Principles

1. **Scope Control**: Completed > ambitious. Core untouchable phases: Prólogo, Fase1, Fase5, Fase6, Final (see GAME_DESIGN.md section 5)
2. **Jokes > Mechanics**: Better simple phase with perfect dialogue than complex generic gameplay
3. **Mobile Testing**: Primary target is mobile (test on actual device)
4. **Emotional Arc**: Match → struggle → achievement → joy → crisis → overcoming → love declaration

## File Structure

```
src/
├── main.ts              # Phaser config (pixelArt: true, physics, scenes)
├── scenes/              # 8 game phases + Boot
│   ├── BaseFase.ts     # Abstract base class for phases
│   └── [Fase*.ts]      # Individual phase implementations
├── sprites/
│   ├── data.ts         # Pixel grids for GABITCHA, RAFITCHO, YUUMITCHA
│   └── factory.ts      # Texture generation from grids
├── ui/
│   ├── constants.ts    # GAME_WIDTH, GAME_HEIGHT, color palette
│   ├── DialogBox.ts    # Bottom-screen dialog component
│   ├── TouchControls.ts # Mobile input
│   └── transitions.ts  # fadeIn, fadeToScene
└── dialogos.ts         # ALL game text (single source of truth)
```

## Color Palette (UI Constants)

- Background: `#101223` (fundoNoite)
- Panel: `#1d2140`
- Lines: `#2c3160`
- Text: `#e8e6f2`
- Gabitcha pink: `#ff7aa2` (rosaGabitcha)
- Rafitcho teal: `#4fd6c4` (tealRafitcho)
- Yuumitcha gold: `#e9b44c`

## Important Notes

- **Never commit sensitive information** about the surprise nature of the gift
- See `GAME_DESIGN.md` for complete design document (character descriptions, phase mechanics, emotional arc)
- TODO placeholders in code reference section 7 of GAME_DESIGN.md (internal jokes - pending)
- Font: Press Start 2P (loaded via Google Fonts in index.html)
- Target duration: 10-20 minutes of gameplay
