/**
 * Example Usage of Roadmap Transformer
 * 
 * This file shows real-world examples of how to use the transformer
 * in different scenarios.
 */

import { transformRoadmapForUI, type RawRoadmap } from './roadmap-transformer';

// ============================================================================
// Example 1: Minimal Data from Gemini
// ============================================================================

const minimalGeminiOutput: RawRoadmap = {
  repository_name: 'my-awesome-app',
  sections: [
    {
      id: 'section-1',
      title: 'Getting Started',
      tasks: [
        {
          id: 'task-1',
          title: 'Clone the repository',
          // Only basic fields - transformer will add the rest
        },
        {
          id: 'task-2',
          title: 'Install dependencies',
          commands: ['npm install'], // Simple string array
        },
      ],
    },
  ],
};

// Transform it
const enriched1 = transformRoadmapForUI(minimalGeminiOutput);

console.log('Enriched roadmap:', {
  totalTasks: enriched1.total_tasks, // ← Computed: 2
  estimatedTime: enriched1.estimated_completion_time, // ← Computed: "20 minutes"
  firstTask: {
    tips: enriched1.sections[0].tasks[0].tips, // ← Added: []
    warnings: enriched1.sections[0].tasks[0].warnings, // ← Added: []
    difficulty: enriched1.sections[0].tasks[0].difficulty, // ← Added: "beginner"
  },
});

// ============================================================================
// Example 2: Mixed Format Data (strings and objects)
// ============================================================================

const mixedFormatData: RawRoadmap = {
  repository_name: 'next-app',
  sections: [
    {
      id: 'section-setup',
      title: 'Environment Setup',
      description: 'Set up your development environment',
      tasks: [
        {
          id: 'task-node',
          title: 'Install Node.js',
          description: 'Install Node.js runtime', // ← String format
          commands: [
            'node --version', // ← String format
            'npm --version',
          ],
          tips: [
            'Use **nvm** for version management', // ← String with markdown
            {
              // ← Object format
              text: 'Check official docs',
              type: 'beginner_friendly',
              emphasis: ['docs'],
            },
          ],
        },
      ],
    },
  ],
};

const enriched2 = transformRoadmapForUI(mixedFormatData);

console.log('Normalized data:', {
  description: enriched2.sections[0].tasks[0].description,
  // {
  //   summary: "Install Node.js runtime",
  //   why_needed: "",
  //   learning_goal: ""
  // }

  commands: enriched2.sections[0].tasks[0].commands,
  // [
  //   { command: "node --version", description: "", expected_output: "", os: "all" },
  //   { command: "npm --version", description: "", expected_output: "", os: "all" }
  // ]

  tips: enriched2.sections[0].tasks[0].tips,
  // [
  //   { text: "Use **nvm** for version management", type: "pro_tip", emphasis: ["nvm"] },
  //   { text: "Check official docs", type: "beginner_friendly", emphasis: ["docs"] }
  // ]
});

// ============================================================================
// Example 3: Data with Nulls (Gemini sometimes returns null)
// ============================================================================

const dataWithNulls: RawRoadmap = {
  repository_name: 'buggy-data',
  sections: [
    {
      id: 'section-1',
      title: 'Setup',
      tasks: [
        {
          id: 'task-1',
          title: 'Install tools',
          tips: [
            'Valid tip',
            null as any, // ← Gemini sometimes returns null
            'Another valid tip',
          ],
          warnings: [
            null as any, // ← Will be filtered out
            'Important warning',
          ],
        },
      ],
    },
  ],
};

const enriched3 = transformRoadmapForUI(dataWithNulls);

console.log('Filtered data:', {
  tips: enriched3.sections[0].tasks[0].tips.length, // ← 2 (null removed)
  warnings: enriched3.sections[0].tasks[0].warnings.length, // ← 1 (null removed)
});

// ============================================================================
// Example 4: Rich Data (Already Well-Formatted)
// ============================================================================

const richData: RawRoadmap = {
  repository_name: 'production-app',
  total_tasks: 5,
  estimated_completion_time: '2 hours',
  sections: [
    {
      id: 'section-understanding',
      title: 'Understanding the Project',
      description: 'Learn what this app does',
      tasks: [
        {
          id: 'task-overview',
          title: 'Project Overview',
          description: {
            summary: 'This is a Next.js e-commerce application',
            why_needed: 'Understanding the architecture helps with setup',
            learning_goal: 'Know the tech stack and project structure',
          },
          steps: [
            {
              order: 1,
              action: 'Read the README',
              details: 'Open README.md and read the project description',
              os_specific: null,
            },
          ],
          commands: [
            {
              command: 'cat README.md',
              description: 'View the README file',
              expected_output: 'Project documentation',
              os: 'all',
            },
          ],
          code_blocks: [
            {
              type: 'file_content',
              file_path: '.env.example',
              language: 'bash',
              content: 'DATABASE_URL=postgresql://...\nNEXT_PUBLIC_API_URL=...',
              explanation: 'Required environment variables',
            },
          ],
          references: [
            {
              text: 'Next.js Documentation',
              url: 'https://nextjs.org/docs',
              type: 'documentation',
              relevance: 'Learn about Next.js features used in this project',
            },
          ],
          tips: [
            {
              text: 'Use the **App Router** for new features',
              type: 'pro_tip',
              emphasis: ['App Router'],
            },
          ],
          warnings: [
            {
              text: 'Do not commit `.env` files',
              severity: 'critical',
              os_specific: false,
              emphasis: ['.env'],
            },
          ],
          verification: {
            how_to_verify: 'Check that you understand the project structure',
            expected_result: 'You can explain what the app does',
            troubleshooting: [],
          },
          difficulty: 'beginner',
          estimated_time: '15 minutes',
          depends_on: [],
        },
      ],
    },
  ],
};

const enriched4 = transformRoadmapForUI(richData);

console.log('Rich data preserved:', {
  // All existing data is preserved
  hasDescription: !!enriched4.sections[0].tasks[0].description.summary,
  hasSteps: enriched4.sections[0].tasks[0].steps.length > 0,
  hasCodeBlocks: enriched4.sections[0].tasks[0].code_blocks.length > 0,
  hasReferences: enriched4.sections[0].tasks[0].references.length > 0,
});

// ============================================================================
// Example 5: Using in React Component
// ============================================================================

/*
import { transformRoadmapForUI } from '@/lib/utils/roadmap-transformer';

function TasksPage() {
  const [roadmap, setRoadmap] = useState(null);
  
  useEffect(() => {
    async function fetchRoadmap() {
      const response = await fetch(`/api/roadmap/${repoId}`);
      const raw = await response.json();
      
      // Transform before using
      const enriched = transformRoadmapForUI(raw);
      setRoadmap(enriched);
    }
    
    fetchRoadmap();
  }, [repoId]);
  
  if (!roadmap) return <Loading />;
  
  return (
    <div>
      <h1>{roadmap.repository_name}</h1>
      <p>Total tasks: {roadmap.total_tasks}</p>
      <p>Estimated time: {roadmap.estimated_completion_time}</p>
      
      {roadmap.sections.map(section => (
        <Section key={section.id} section={section} />
      ))}
    </div>
  );
}
*/

// ============================================================================
// Example 6: Computing Additional Metrics
// ============================================================================

import { enrichSectionWithMetrics } from './roadmap-transformer';

const sectionWithMetrics = enrichSectionWithMetrics(enriched4.sections[0]);

console.log('Section metrics:', {
  taskCount: sectionWithMetrics.taskCount, // ← 1
  totalMinutes: sectionWithMetrics.totalEstimatedMinutes, // ← 15
  difficultyBreakdown: sectionWithMetrics.difficultyBreakdown,
  // { beginner: 1, intermediate: 0, advanced: 0 }
  hasCode: sectionWithMetrics.hasCode, // ← true
  hasTips: sectionWithMetrics.hasTips, // ← true
});

// ============================================================================
// Example 7: Alternative View Transformations
// ============================================================================

import { transformToTimelineView, transformToDependencyGraph } from './roadmap-transformer';

// Timeline view (for Gantt chart, etc.)
const timelineData = transformToTimelineView(enriched4);
console.log('Timeline events:', timelineData.events);
// [
//   {
//     id: "task-overview",
//     order: 1,
//     title: "Project Overview",
//     section: "Understanding the Project",
//     difficulty: "beginner",
//     estimatedTime: "15 minutes",
//     dependencies: []
//   }
// ]

// Dependency graph (for visualization)
const graphData = transformToDependencyGraph(enriched4);
console.log('Graph:', {
  nodes: graphData.nodes, // [{ id, label, difficulty }]
  edges: graphData.edges, // [{ from, to }]
});

// ============================================================================
// Summary
// ============================================================================

/*
The transformer handles:
✅ Missing fields → Adds defaults
✅ Inconsistent types → Normalizes to objects
✅ Null values → Filters them out
✅ Computed fields → Calculates totals
✅ Rich data → Preserves everything
✅ Multiple views → Provides alternative transformers

Use it in your API route to transform once, or in your components
to transform on-demand. Either way, your UI always gets clean,
consistent data!
*/
