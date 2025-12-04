/**
 * Enhanced Roadmap Type Definitions
 * Provides rich, structured data for personalized setup guides
 */

export interface RoadmapTask {
  id: string;
  title: string;
  description: TaskDescription;
  steps: TaskStep[];
  commands: CommandBlock[];
  code_blocks: CodeBlock[];
  references: Reference[];
  tips: Tip[];
  warnings: Warning[];
  verification: Verification;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: string;
  depends_on: string[]; // Task IDs this depends on
}

export interface TaskDescription {
  summary: string; // One sentence overview
  why_needed: string; // Why this project needs this step
  learning_goal: string; // What the user will learn
}

export interface TaskStep {
  order: number;
  action: string; // Clear action verb
  details: string; // Can contain **bold** and `code` markdown
  os_specific: OSSpecific | null;
}

export interface OSSpecific {
  mac?: string;
  windows?: string;
  linux?: string;
}

export interface CommandBlock {
  command: string;
  description: string;
  expected_output: string;
  os: 'all' | 'mac' | 'windows' | 'linux';
}

export interface CodeBlock {
  type: 'file_content' | 'snippet' | 'configuration';
  file_path?: string; // e.g., ".env" or "src/config.js"
  language: string; // e.g., "bash", "javascript", "python"
  content: string; // The actual code
  explanation: string; // What this code does
  highlights?: CodeHighlight[]; // Optional line-by-line annotations
}

export interface CodeHighlight {
  line: number; // 1-indexed line number
  text: string; // Explanation for this line
  type: 'info' | 'warning' | 'error';
}

export interface Reference {
  text: string; // Link text
  url: string; // Full URL
  type: 'documentation' | 'tutorial' | 'tool' | 'external';
  relevance: string; // Why this link matters for THIS project
}

export interface Tip {
  text: string; // Tip content (can contain **bold** markdown)
  type: 'pro_tip' | 'beginner_friendly' | 'time_saver';
  emphasis: string[]; // Phrases to bold (extracted from text)
}

export interface Warning {
  text: string; // Warning content (can contain **bold** markdown)
  severity: 'critical' | 'important' | 'minor';
  os_specific: boolean; // Is this OS-specific?
  emphasis: string[]; // Phrases to bold
}

export interface Verification {
  how_to_verify: string; // How to check if the task succeeded
  expected_result: string; // What success looks like
  troubleshooting: Troubleshooting[];
}

export interface Troubleshooting {
  problem: string; // Common error message
  solution: string; // How to fix it
  command: string | null; // Fix command if applicable
}

export interface RoadmapSection {
  id: string;
  title: string;
  description: string;
  tasks: RoadmapTask[];
}

export interface Roadmap {
  repository_name: string;
  total_tasks: number;
  estimated_completion_time: string;
  sections: RoadmapSection[];
}

// Analysis Data Types
export interface ProjectPurpose {
  purpose: string;
  features: string[];
  target_users: string;
  project_type: string;
}

export interface TechStack {
  primary_language: string;
  framework: string | null;
  runtime_version: string;
  package_manager: string;
  dependencies: {
    production: string[];
    development: string[];
  };
  testing_framework: string | null;
  database: string | null;
  ui_library: string | null;
}

export interface DatabaseRequirement {
  type: 'PostgreSQL' | 'MySQL' | 'MongoDB' | 'SQLite' | 'Redis';
  required: boolean;
  version_requirement?: string;
  migrations_path?: string;
  requires_migration: boolean;
  seed_data_available: boolean;
}

export interface EnvironmentVariable {
  name: string;
  description?: string;
  required: boolean;
  example_value: string;
  category: 'database' | 'api_key' | 'server' | 'general';
}

export interface SecurityIssue {
  severity: 'high' | 'medium' | 'low';
  type: string;
  file: string;
  line: number;
  redacted_secret: string;
}

export interface RepositoryMetadata {
  owner: string;
  name: string;
  description?: string;
  language: string;
  size_kb: number;
  stars?: number;
  default_branch?: string;
}
