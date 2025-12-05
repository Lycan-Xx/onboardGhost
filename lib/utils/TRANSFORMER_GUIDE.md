# Roadmap Transformer Guide

## Overview

The Roadmap Transformer is a data transformation layer that sits between Gemini's raw JSON output and your UI components. It ensures consistent, UI-ready data regardless of what Gemini returns.

## Architecture

```
┌─────────┐      ┌─────────────┐      ┌──────────┐      ┌────────┐
│ Gemini  │ ───> │ Raw JSON    │ ───> │Transform │ ───> │   UI   │
│  API    │      │ (variable)  │      │  Layer   │      │ Ready  │
└─────────┘      └─────────────┘      └──────────┘      └────────┘
```

## What It Does

### 1. **Adds Defaults**
If Gemini forgets fields, the transformer fills them in:
```typescript
// Gemini returns:
{ id: "task-1", title: "Install Node" }

// Transformer outputs:
{
  id: "task-1",
  title: "Install Node",
  tips: [],           // ← Added
  warnings: [],       // ← Added
  code_blocks: [],    // ← Added
  difficulty: "beginner", // ← Added
  // ... all required fields
}
```

### 2. **Normalizes Data Types**
Handles inconsistent formats from Gemini:
```typescript
// Gemini might return tips as strings:
tips: ["Use nvm", "Check version"]

// Transformer converts to objects:
tips: [
  { text: "Use nvm", type: "pro_tip", emphasis: ["nvm"] },
  { text: "Check version", type: "pro_tip", emphasis: ["version"] }
]
```

### 3. **Filters Invalid Data**
Removes null/undefined values:
```typescript
// Gemini returns:
tips: ["Valid tip", null, "Another tip"]

// Transformer outputs:
tips: [
  { text: "Valid tip", ... },
  { text: "Another tip", ... }
]
```

### 4. **Computes Derived Fields**
Calculates values from existing data:
```typescript
// Computes total tasks
total_tasks: 12  // ← Counted from all sections

// Computes total time
estimated_completion_time: "2h 30m"  // ← Sum of all task times
```

## Usage

### In API Route (Recommended)

Transform data before saving to Firestore:

```typescript
import { transformRoadmapForUI } from '@/lib/utils/roadmap-transformer';

// After getting data from Gemini
const rawRoadmap = await geminiClient.generateRoadmap(analysisData);

// Transform it
const enrichedRoadmap = transformRoadmapForUI(rawRoadmap);

// Save to Firestore
await roadmapRef.set(enrichedRoadmap);
```

**Why here?** 
- Transform once, use everywhere
- Firestore stores clean data
- All clients get consistent data

### In UI Component (Alternative)

Transform when fetching data:

```typescript
import { transformRoadmapForUI } from '@/lib/utils/roadmap-transformer';

const TasksPage = () => {
  const [roadmap, setRoadmap] = useState(null);
  
  useEffect(() => {
    const fetchRoadmap = async () => {
      const raw = await getRoadmap(repoId);
      const enriched = transformRoadmapForUI(raw);
      setRoadmap(enriched);
    };
    fetchRoadmap();
  }, [repoId]);
  
  // ...
};
```

**Why here?**
- Useful if you can't modify API
- Good for client-side only apps
- Allows different transformations per view

## Making UI Changes

### Scenario 1: Change How Data is Displayed

**Example**: Change tips from list to grid

```tsx
// Before
<div className="space-y-3">
  {tips.map(tip => <TipCard tip={tip} />)}
</div>

// After
<div className="grid grid-cols-2 gap-4">
  {tips.map(tip => <TipCard tip={tip} />)}
</div>
```

**Transformer changes needed**: NONE ✅

---

### Scenario 2: Add Computed Fields

**Example**: Show total time per section

```typescript
// In roadmap-transformer.ts
function enrichSection(section: RawSection): RoadmapSection {
  const tasks = section.tasks.map(enrichTask);
  
  return {
    ...section,
    tasks,
    // NEW: Add computed field
    totalMinutes: tasks.reduce(
      (sum, task) => sum + parseEstimatedTime(task.estimated_time),
      0
    ),
  };
}
```

```tsx
// In UI
<p>Section time: {section.totalMinutes} minutes</p>
```

**Transformer changes needed**: Add computation ✅

---

### Scenario 3: Add New Data from Gemini

**Example**: Add "prerequisites" field

1. **Update Gemini prompt** to request prerequisites
2. **Update transformer** to handle it:

```typescript
function enrichTask(task: RawTask): RoadmapTask {
  return {
    ...task,
    // NEW: Handle new field with default
    prerequisites: task.prerequisites || [],
  };
}
```

3. **Update UI** to display it:

```tsx
{task.prerequisites.length > 0 && (
  <div>
    <h4>Prerequisites</h4>
    <ul>
      {task.prerequisites.map(p => <li>{p}</li>)}
    </ul>
  </div>
)}
```

**Transformer changes needed**: Add field handling with default ✅

---

### Scenario 4: Multiple View Modes

**Example**: Add timeline view

```typescript
// In roadmap-transformer.ts
export function transformToTimelineView(roadmap: Roadmap) {
  return {
    events: roadmap.sections.flatMap(section =>
      section.tasks.map((task, i) => ({
        id: task.id,
        order: i + 1,
        title: task.title,
        section: section.title,
      }))
    ),
  };
}
```

```tsx
// In UI
const viewMode = useViewMode(); // 'sections' | 'timeline'

const data = useMemo(() => {
  if (viewMode === 'timeline') {
    return transformToTimelineView(roadmap);
  }
  return roadmap; // Already transformed
}, [roadmap, viewMode]);
```

**Transformer changes needed**: Add new transformer function ✅

## Advanced Features

### Extract Emphasis

Automatically finds words to highlight:

```typescript
const text = "Use **nvm** to manage `node` versions";
const emphasis = extractEmphasis(text);
// Returns: ["nvm", "node"]
```

### Parse Time Strings

Handles various time formats:

```typescript
parseEstimatedTime("30 minutes")  // → 30
parseEstimatedTime("1h 30m")      // → 90
parseEstimatedTime("2 hours")     // → 120
parseEstimatedTime("45m")         // → 45
```

### Calculate Totals

```typescript
calculateTotalTime(sections)  // → "2h 30m"
countTotalTasks(sections)     // → 12
```

## Testing

Run tests:
```bash
npm test roadmap-transformer
```

Test your own data:
```typescript
import { transformRoadmapForUI } from '@/lib/utils/roadmap-transformer';

const testData = {
  repository_name: "my-repo",
  sections: [/* ... */]
};

const result = transformRoadmapForUI(testData);
console.log(result);
```

## Future Enhancements

The transformer includes placeholder functions for future features:

- `enrichSectionWithMetrics()` - Add difficulty breakdown, time totals
- `transformToTimelineView()` - Convert to timeline format
- `transformToDependencyGraph()` - Build task dependency graph

These are ready to use when you need them!

## Best Practices

1. **Transform early**: Do it in the API route, not in every component
2. **Store enriched data**: Save the transformed version to Firestore
3. **Add defaults**: Always provide fallback values
4. **Test edge cases**: Test with minimal data, missing fields, null values
5. **Version your data**: Add a `version` field if you make breaking changes

## Troubleshooting

### "Property X is undefined"
- Check if transformer adds default for that field
- Add default in `enrichTask()` or `enrichSection()`

### "Type mismatch"
- Check if field can be string OR object
- Add normalization function (like `normalizeDescription`)

### "Old data doesn't work"
- Transformer should handle old data automatically
- Add more defaults if needed
- Consider adding version field

## Summary

The transformer is your **flexibility layer**:
- Gemini can return simple JSON
- UI gets rich, consistent data
- You can change either without breaking the other

It's the secret to maintainable, scalable data architecture! 🚀
