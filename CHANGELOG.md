# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-08-03
### Added
- Case-insensitive multi-layer duplicate protection (`.ilike` queries and batch payload checks) blocking cross-user duplicate RSVPs with HTTP `409 Conflict`.
- Inline error banner system replacing native browser `alert()` popups, complete with a direct **"Search & Edit Your RSVP"** remediation shortcut button.
- Custom-styled theme-matched attendance dropdown (`appearance-none` with custom SVG gold chevron and custom background colors).
- Optional `isOpen` visibility prop handling inside `RsvpSheetModal`.
- Comprehensive `REQUIREMENTS.md` blueprint covering system architecture, edge cases, and QA testing matrices.

### Changed
- Updated compulsory field asterisks to a uniform brand accent color (`#BE185D`).
- Refined conditional dietary requirements logic to auto-clear text when a guest switches to "Declining".
- Enhanced README documentation to highlight system architecture and detailed user input guidelines.

### Fixed
- Resolved multi-user duplicate submission gaps by ensuring Supabase checks evaluate full record length instead of strict single-row modifiers.
- Fixed TypeScript prop definition errors regarding modal visibility states.