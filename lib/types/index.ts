// Core Data Models for OnboardGhost

export interface RepositoryMetadata {
  id: string; // Firebase document ID
  owner: string;
  name: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  default_branch: string;
  created_at: Date;
  updated_at: Date;
  language: string;
  size: number; // KB
  is_private: boolean;
  analyzed_at: Date;
  analysis_duration: number; // seconds
}

export interface TechStack {
  primary_language: string;
  framework: string;
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
  setup_guide: string;
}

export interface EnvironmentVariable {
  name: string;
  description: string;
  required: boolean;
  example_value: string;
  category: 'database' | 'api_key' | 'server' | 'general';
}

export interface SecurityIssue {
  severity: 'high' | 'medium' | 'low';
  type: string; // 'AWS API Key', 'GitHub Token', etc.
  file: string;
  line: number;
  redacted_secret: string;
  recommendation: string;
}

export interface ProjectPurpose {
  purpose: string;
  features: string[];
  target_users: string;
  project_type: string;
}

export interface OnboardingRoadmap {
  repo_id: string;
  generated_at: Date;
  sections: RoadmapSection[];
  total_tasks: number;
}

export interface RoadmapSection {
  id: string;
  title: string;
  goals: string[];
  tasks: RoadmapTask[];
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  instructions: string;
  code_snippet?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completion_criteria: string;
  tips: string[];
  warnings: string[];
}

export interface UserProgress {
  user_id: string;
  repo_id: string;
  completed_tasks: string[]; // task IDs
  overall_progress_percentage: number;
  ghost_solidness: number; // 0-100
  started_at: Date;
  last_activity: Date;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  repo_id: string;
  role: 'user' | 'assistant';
  content: string;
  file_references?: FileReference[];
  timestamp: Date;
}

export interface FileReference {
  path: string;
  line_number?: number;
}

export interface AnalysisLog {
  timestamp: Date;
  step: number;
  message: string;
  details?: any;
}

export interface AnalysisProgress {
  repo_id: string;
  current_step: number;
  step_name: string;
  step_status: 'pending' | 'in-progress' | 'completed' | 'failed';
  logs: AnalysisLog[];
  updated_at: Date;
}

export interface FileTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size: number;
  sha: string;
  url: string;
}

export interface FilteredFileTree {
  total_files: number;
  analyzed_files: number;
  skipped_files: number;
  files: FileTreeItem[];
  critical_files: FileTreeItem[];
  code_files: FileTreeItem[];
}

export interface GeminiFileUpload {
  file_path: string;
  gemini_uri: string;
  gemini_name: string;
}

export interface CompleteAnalysis {
  repository: RepositoryMetadata;
  tech_stack: TechStack;
  database: DatabaseRequirement[];
  environment_variables: EnvironmentVariable[];
  security_issues: SecurityIssue[];
  project_purpose: ProjectPurpose;
  roadmap: OnboardingRoadmap;
  uploaded_files: {
    total: number;
    gemini_uris: string[];
  };
  analysis_metadata: {
    analyzed_at: Date;
    analysis_duration_seconds: number;
    total_files_scanned: number;
    files_analyzed: number;
  };
}

// API Request/Response Types

export interface AnalyzeRepoRequest {
  repoUrl: string;
  userId: string;
  githubToken?: string;
}

export interface AnalyzeRepoResponse {
  success: boolean;
  repoId: string;
  message: string;
}

export interface ChatRequest {
  repoId: string;
  userId: string;
  message: string;
}

export interface UpdateTaskRequest {
  userId: string;
  repoId: string;
  taskId: string;
  completed: boolean;
}

export interface UpdateTaskResponse {
  success: boolean;
  newProgress: number;
  celebrationTriggered: boolean;
}

// Component State Types

export interface DashboardState {
  repoUrl: string;
  isValidUrl: boolean;
  isAnalyzing: boolean;
  error: string | null;
  hasGitHubAuth: boolean;
}

export interface LoadingState {
  currentStep: number;
  stepName: string;
  stepStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
  logs: AnalysisLog[];
  error: string | null;
}

export interface TasksPageState {
  roadmap: OnboardingRoadmap | null;
  progress: UserProgress;
  chatMessages: ChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
  expandedTaskId: string | null;
}

export interface GhostVisualizationProps {
  progressPercentage: number;
  celebrationTrigger: boolean;
}

export interface ChatInterfaceProps {
  repoId: string;
  userId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}
