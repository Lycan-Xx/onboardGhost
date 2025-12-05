# Transformer Quick Reference

## Import
```typescript
import { transformRoadmapForUI } from '@/lib/utils/roadmap-transformer';
```

## Basic Usage
```typescript
const enriched = transformRoadmapForUI(rawData);
```

## What Gets Added/Fixed

| Input | Output |
|-------|--------|
| `tips: undefined` | `tips: []` |
| `tips: ["string"]` | `tips: [{ text: "string", type: "pro_tip", emphasis: [] }]` |
| `tips: [null, "valid"]` | `tips: [{ text: "valid", ... }]` |
| `commands: ["cmd"]` | `commands: [{ command: "cmd", description: "", os: "all" }]` |
| `description: "text"` | `description: { summary: "text", why_needed: "", learning_goal: "" }` |
| `difficulty: undefined` | `difficulty: "beginner"` |
| `total_tasks: undefined` | `total_tasks: <computed>` |

## Common Patterns

### In API Route
```typescript
const raw = await gemini.generateRoadmap(data);
const enriched = transformRoadmapForUI(raw);
await firestore.set(enriched);
```

### In Component
```typescript
const [roadmap, setRoadmap] = useState(null);

useEffect(() => {
  const raw = await fetchRoadmap();
  const enriched = transformRoadmapForUI(raw);
  setRoadmap(enriched);
}, []);
```

### Add Metrics
```typescript
import { enrichSectionWithMetrics } from '@/lib/utils/roadmap-transformer';

const withMetrics = enrichSectionWithMetrics(section);
// Adds: taskCount, totalEstimatedMinutes, difficultyBreakdown
```

### Timeline View
```typescript
import { transformToTimelineView } from '@/lib/utils/roadmap-transformer';

const timeline = transformToTimelineView(roadmap);
```

## When to Update Transformer

✅ **Update transformer when:**
- Adding computed fields
- Handling new Gemini fields
- Creating new view modes
- Normalizing new data types

❌ **Don't update transformer for:**
- UI styling changes
- Component layout changes
- Display logic changes
- Conditional rendering

## Troubleshooting

**"Property X is undefined"**
→ Add default in `enrichTask()` or `enrichSection()`

**"Type mismatch"**
→ Add normalization function (like `normalizeDescription`)

**"Null values breaking UI"**
→ Transformer already filters nulls, check if field is in filter list

## Files
- Main: `lib/utils/roadmap-transformer.ts`
- Guide: `lib/utils/TRANSFORMER_GUIDE.md`
- Examples: `lib/utils/roadmap-transformer.example.ts`
- Tests: `lib/utils/__tests__/roadmap-transformer.test.ts`
