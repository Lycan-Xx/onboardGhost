/**
 * Roadmap Data Transformer
 * Converts raw Gemini JSON into enriched, UI-ready format
 * 
 * This layer sits between Gemini's output and your UI components,
 * allowing you to:
 * - Add defaults for missing fields
 * - Normalize data structures
 * - Compute derived fields
 * - Handle backward compatibility
 */

import type {
  Roadmap,
  RoadmapSection,
  RoadmapTask,
  TaskDescription,
  TaskStep,
  CommandBlock,
  CodeBlock,
  Reference,
  Tip,
  Warning,
  Verification,
  Troubleshooting,
  OSSpecific,
} from '../types/roadmap';

// ============================================================================
// RAW TYPES (What Gemini Returns)
// ============================================================================

/**
 * Raw data from Gemini - may have missing fields, inconsistent types
 */
export interface RawRoadmap {
  repository_name: string;
  total_tasks?: number;
  estimated_completion_time?: string;
  sections: RawSection[];
}

export interface RawSection {
  id: string;
  title: string;
  description?: string;
  tasks: RawTask[];
}

export interface RawTask {
  id: string;
  title: string;
  description?: string | TaskDescription; // Could be string or object
  steps?: TaskStep[];
  commands?: (string | CommandBlock)[]; // Could be strings or objects
  code_blocks?: CodeBlock[];
  references?: Reference[];
  tips?: (string | Tip)[]; // Could be strings or objects
  warnings?: (string | Warning)[]; // Could be strings or objects
  verification?: Verification;
  difficulty?: string;
  estimated_time?: string;
  depends_on?: string[];
}

// ============================================================================
// TRANSFORMER FUNCTIONS
// ============================================================================

/**
 * Main transformer: Converts raw Gemini output to UI-ready format
 * Accepts both raw Gemini output and existing Roadmap objects
 */
export function transformRoadmapForUI(raw: RawRoadmap | Roadmap): Roadmap {
  // Log what we receive
  console.log('[Transformer] Received data sample:', JSON.stringify({
    sections: raw.sections?.length || 0,
    firstTask: raw.sections?.[0]?.tasks?.[0] ? {
      id: raw.sections[0].tasks[0].id,
      hasSteps: !!raw.sections[0].tasks[0].steps,
      stepsCount: raw.sections[0].tasks[0].steps?.length || 0,
      hasCommands: !!raw.sections[0].tasks[0].commands,
      commandsCount: raw.sections[0].tasks[0].commands?.length || 0,
    } : 'no tasks'
  }, null, 2));
  
  const sections = raw.sections.map(enrichSection);
  
  // Log what we're returning
  console.log('[Transformer] Returning data sample:', JSON.stringify({
    sections: sections.length,
    firstTask: sections[0]?.tasks?.[0] ? {
      id: sections[0].tasks[0].id,
      stepsCount: sections[0].tasks[0].steps?.length || 0,
      commandsCount: sections[0].tasks[0].commands?.length || 0,
    } : 'no tasks'
  }, null, 2));
  
  return {
    repository_name: raw.repository_name || 'Unknown Project',
    total_tasks: raw.total_tasks || countTotalTasks(sections),
    estimated_completion_time: raw.estimated_completion_time || calculateTotalTime(sections),
    sections,
  };
}

/**
 * Enrich a section with computed fields and defaults
 */
function enrichSection(section: RawSection): RoadmapSection {
  return {
    id: section.id,
    title: section.title,
    description: section.description || '',
    tasks: section.tasks.map(enrichTask),
  };
}

/**
 * Enrich a task - this is where most transformation happens
 */
function enrichTask(task: RawTask): RoadmapTask {
  return {
    id: task.id,
    title: task.title,
    description: normalizeDescription(task.description),
    steps: task.steps || [],
    commands: normalizeCommands(task.commands),
    code_blocks: task.code_blocks || [],
    references: task.references || [], // Transformer adds empty array
    tips: normalizeTips(task.tips),
    warnings: normalizeWarnings(task.warnings),
    verification: normalizeVerification(task.verification), // Transformer adds default
    difficulty: normalizeDifficulty(task.difficulty),
    estimated_time: task.estimated_time || estimateTimeFromSteps(task.steps), // Smart estimation
    depends_on: task.depends_on || [], // Transformer adds empty array
  };
}

/**
 * Estimate time based on number of steps
 */
function estimateTimeFromSteps(steps: any[] | undefined): string {
  if (!steps || steps.length === 0) return '10 minutes';
  
  const stepCount = steps.length;
  if (stepCount <= 2) return '10 minutes';
  if (stepCount <= 4) return '15 minutes';
  if (stepCount <= 6) return '20 minutes';
  return '30 minutes';
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize description - handle both string and object formats
 */
function normalizeDescription(desc: string | TaskDescription | undefined): TaskDescription {
  if (!desc) {
    return {
      summary: '',
      why_needed: '',
      learning_goal: '',
    };
  }

  if (typeof desc === 'string') {
    return {
      summary: desc,
      why_needed: '',
      learning_goal: '',
    };
  }

  return {
    summary: desc.summary || '',
    why_needed: desc.why_needed || '',
    learning_goal: desc.learning_goal || '',
  };
}

/**
 * Normalize commands - handle both string and object formats
 */
function normalizeCommands(commands: (string | CommandBlock)[] | undefined): CommandBlock[] {
  if (!commands) return [];

  return commands.map((cmd, index) => {
    if (typeof cmd === 'string') {
      return {
        command: cmd,
        description: '',
        expected_output: '',
        os: 'all' as const,
      };
    }
    return {
      command: cmd.command || '',
      description: cmd.description || '',
      expected_output: cmd.expected_output || '',
      os: cmd.os || 'all',
    };
  });
}

/**
 * Normalize tips - handle both string and object formats
 */
function normalizeTips(tips: (string | Tip)[] | undefined): Tip[] {
  if (!tips) return [];

  return tips
    .filter(tip => tip != null) // Remove null/undefined
    .map((tip) => {
      if (typeof tip === 'string') {
        return {
          text: tip,
          type: 'pro_tip' as const,
          emphasis: extractEmphasis(tip),
        };
      }
      return {
        text: tip.text || '',
        type: tip.type || 'pro_tip',
        emphasis: tip.emphasis || extractEmphasis(tip.text),
      };
    });
}

/**
 * Normalize warnings - handle both string and object formats
 */
function normalizeWarnings(warnings: (string | Warning)[] | undefined): Warning[] {
  if (!warnings) return [];

  return warnings
    .filter(warning => warning != null) // Remove null/undefined
    .map((warning) => {
      if (typeof warning === 'string') {
        return {
          text: warning,
          severity: 'important' as const,
          os_specific: false,
          emphasis: extractEmphasis(warning),
        };
      }
      return {
        text: warning.text || '',
        severity: warning.severity || 'important',
        os_specific: warning.os_specific || false,
        emphasis: warning.emphasis || extractEmphasis(warning.text),
      };
    });
}

/**
 * Normalize verification - ensure all fields exist
 */
function normalizeVerification(verification: Verification | undefined): Verification {
  if (!verification) {
    return {
      how_to_verify: '',
      expected_result: '',
      troubleshooting: [],
    };
  }

  return {
    how_to_verify: verification.how_to_verify || '',
    expected_result: verification.expected_result || '',
    troubleshooting: verification.troubleshooting || [],
  };
}

/**
 * Normalize difficulty - ensure valid value
 */
function normalizeDifficulty(difficulty: string | undefined): 'beginner' | 'intermediate' | 'advanced' {
  const normalized = difficulty?.toLowerCase();
  
  if (normalized === 'intermediate' || normalized === 'advanced') {
    return normalized;
  }
  
  return 'beginner';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract words to emphasize from text (words in **bold** or `code`)
 */
function extractEmphasis(text: string): string[] {
  const emphasis: string[] = [];
  
  // Extract **bold** text
  const boldMatches = text.match(/\*\*(.*?)\*\*/g);
  if (boldMatches) {
    boldMatches.forEach(match => {
      emphasis.push(match.replace(/\*\*/g, ''));
    });
  }
  
  // Extract `code` text
  const codeMatches = text.match(/`(.*?)`/g);
  if (codeMatches) {
    codeMatches.forEach(match => {
      emphasis.push(match.replace(/`/g, ''));
    });
  }
  
  return emphasis;
}

/**
 * Count total tasks across all sections
 */
function countTotalTasks(sections: RoadmapSection[]): number {
  return sections.reduce((sum, section) => sum + section.tasks.length, 0);
}

/**
 * Calculate total estimated time from all tasks
 */
function calculateTotalTime(sections: RoadmapSection[]): string {
  let totalMinutes = 0;
  
  sections.forEach(section => {
    section.tasks.forEach(task => {
      totalMinutes += parseEstimatedTime(task.estimated_time);
    });
  });
  
  // Convert to hours if > 60 minutes
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${minutes}m`;
  }
  
  return `${totalMinutes} minutes`;
}

/**
 * Parse estimated time string to minutes
 */
function parseEstimatedTime(timeStr: string): number {
  const hourMatch = timeStr.match(/(\d+)\s*h/i);
  const minuteMatch = timeStr.match(/(\d+)\s*m/i);
  
  let minutes = 0;
  
  if (hourMatch) {
    minutes += parseInt(hourMatch[1]) * 60;
  }
  
  if (minuteMatch) {
    minutes += parseInt(minuteMatch[1]);
  }
  
  // If no match, try to extract any number and assume minutes
  if (minutes === 0) {
    const numberMatch = timeStr.match(/(\d+)/);
    if (numberMatch) {
      minutes = parseInt(numberMatch[1]);
    }
  }
  
  return minutes || 10; // Default to 10 minutes
}

// ============================================================================
// ADVANCED TRANSFORMERS (For Future Use)
// ============================================================================

/**
 * Add computed fields to sections
 */
export function enrichSectionWithMetrics(section: RoadmapSection) {
  return {
    ...section,
    // Computed fields
    taskCount: section.tasks.length,
    totalEstimatedMinutes: section.tasks.reduce(
      (sum, task) => sum + parseEstimatedTime(task.estimated_time),
      0
    ),
    difficultyBreakdown: {
      beginner: section.tasks.filter(t => t.difficulty === 'beginner').length,
      intermediate: section.tasks.filter(t => t.difficulty === 'intermediate').length,
      advanced: section.tasks.filter(t => t.difficulty === 'advanced').length,
    },
    hasCode: section.tasks.some(t => t.code_blocks.length > 0),
    hasTips: section.tasks.some(t => t.tips.length > 0),
    hasWarnings: section.tasks.some(t => t.warnings.length > 0),
  };
}

/**
 * Transform roadmap for timeline view (future feature)
 */
export function transformToTimelineView(roadmap: Roadmap) {
  const allTasks = roadmap.sections.flatMap(section => 
    section.tasks.map(task => ({
      ...task,
      sectionTitle: section.title,
      sectionId: section.id,
    }))
  );
  
  return {
    repository_name: roadmap.repository_name,
    events: allTasks.map((task, index) => ({
      id: task.id,
      order: index + 1,
      title: task.title,
      section: task.sectionTitle,
      difficulty: task.difficulty,
      estimatedTime: task.estimated_time,
      dependencies: task.depends_on,
    })),
  };
}

/**
 * Transform roadmap for dependency graph view (future feature)
 */
export function transformToDependencyGraph(roadmap: Roadmap) {
  const allTasks = roadmap.sections.flatMap(section => section.tasks);
  
  const nodes = allTasks.map(task => ({
    id: task.id,
    label: task.title,
    difficulty: task.difficulty,
  }));
  
  const edges = allTasks.flatMap(task =>
    task.depends_on.map(depId => ({
      from: depId,
      to: task.id,
    }))
  );
  
  return { nodes, edges };
}
