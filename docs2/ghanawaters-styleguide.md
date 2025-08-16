# Ghana Waters Style Guide

⚠️ **Note**: Keep updates concise - this guide must remain short and focused.

**PRECEDENCE**: This document overrides all other style documentation in the codebase.

## Feature Organization

### Folder Structure (Angular Style Guide Based)
```
features/[feature-name]/
├── [sub-feature]/              # Feature-based folders
│   ├── component.ts           # Related components  
│   ├── service.ts             # Feature service
│   └── other-feature-files.ts
└── [feature-name].component.ts # Main wrapper
```

**Rules:**
- ❌ No generic `components/`, `services/`, `models/` folders
- ✅ Organize by feature areas, not file types
- ✅ Group related files together
- ✅ Use feature-based subfolders when needed

## File Naming

- **Hyphenated names**: `vessel-type-list.component.ts`
- **Descriptive**: `list` not `settings` for list components
- **Match class names**: `UserProfile` → `user-profile.ts`

## Shared Code

### Models and DTOs
- **All shared interfaces**: `libs/shared-models`
- **Import**: `@ghanawaters/shared-models`
- **No local DTOs**: Move to shared-models if used by API + Admin

### Components
- **Reusable UI**: `libs/shared`
- **Import**: `@ghanawaters/shared`

## Component Patterns

### Page Headers
```typescript
template: `
  <div class="[feature]-container">
    <div class="page-header">
      <h2>[Page Title]</h2>
    </div>
    <!-- content -->
  </div>
`,
styles: [`
  .[feature]-container { padding: 0 20px 20px 20px; }
`]
```

### Services
- **Single responsibility** per service
- **Co-located** with feature, not in generic services folder
- **Use `inject()`** over constructor injection

## Current Features Reference

**Well-organized**: `landing-sites/`, `vessels/`
**Follow these patterns** for consistency