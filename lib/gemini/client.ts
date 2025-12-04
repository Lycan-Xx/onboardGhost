/**
 * Google Gemini AI client for analysis and chat
 * Enhanced version with project-specific roadmap generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryWithBackoff } from '../utils/retry';
import { GeminiAPIError } from '../utils/errors';
import {
  ProjectPurpose,
  TechStack,
  DatabaseRequirement,
  EnvironmentVariable,
  SecurityIssue,
  RepositoryMetadata,
  Roadmap,
} from '../types/roadmap';

interface AnalysisData {
  tech_stack: TechStack;
  database: DatabaseRequirement[];
  env_vars: EnvironmentVariable[];
  purpose: ProjectPurpose;
  setup_instructions?: string;
  security_issues?: SecurityIssue[];
  repository_metadata: RepositoryMetadata;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.7, // Balance creativity with consistency
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
  }

  /**
   * Extract project purpose from README and package.json
   */
  async extractProjectPurpose(
    readmeContent: string,
    packageJsonDescription?: string,
    repoDescription?: string
  ): Promise<ProjectPurpose> {
    const prompt = `Analyze this project and extract:
1. Project Purpose (1-2 sentences): What problem does this solve?
2. Core Features (3-5 bullet points): What can users do?
3. Target Users: Who is this for?
4. Project Type: (e.g., "REST API", "React Component Library", "CLI Tool", "Web Application")

README excerpt:
${readmeContent.slice(0, 2000)}

Package description: ${packageJsonDescription || 'N/A'}
Repository description: ${repoDescription || 'N/A'}

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "purpose": "...",
  "features": ["...", "...", "..."],
  "target_users": "...",
  "project_type": "..."
}`;

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await this.model.generateContent(prompt);
          return response.response.text();
        },
        3,
        2000
      );

      const cleanedResult = this.cleanJsonResponse(result);
      const parsed = JSON.parse(cleanedResult);

      // Validate required fields
      if (!parsed.purpose || !parsed.features || !parsed.target_users || !parsed.project_type) {
        throw new Error('Missing required fields in Gemini response');
      }

      return {
        purpose: parsed.purpose,
        features: Array.isArray(parsed.features) ? parsed.features : [parsed.features],
        target_users: parsed.target_users,
        project_type: parsed.project_type,
      };
    } catch (error) {
      console.error('Failed to extract project purpose:', error);
      throw new GeminiAPIError('Failed to extract project purpose from README', error);
    }
  }

  /**
   * Generate personalized local setup roadmap from analysis data
   */
  async generateRoadmap(analysisData: AnalysisData): Promise<Roadmap> {
    // Build project-specific context
    const projectContext = this.buildProjectContext(analysisData);
    const sectionGuidance = this.buildSectionGuidance(analysisData);
    const exampleTask = this.buildExampleTask(analysisData);

    const prompt = `You are creating a PERSONALIZED local setup guide for THIS SPECIFIC PROJECT.

=== CRITICAL: PROJECT-SPECIFIC REQUIREMENTS ===
Repository: ${analysisData.repository_metadata?.owner || 'unknown'}/${analysisData.repository_metadata?.name || 'unknown'}
Primary Language: ${analysisData.repository_metadata?.language || 'Unknown'}
Framework: ${analysisData.tech_stack?.framework || 'None'}
Database: ${analysisData.database && analysisData.database.length > 0 ? analysisData.database[0].type : 'None'}
Project Type: ${analysisData.purpose?.project_type || 'Unknown'}
Project Purpose: ${analysisData.purpose?.purpose || 'Not specified'}

${projectContext}

=== YOUR MISSION ===
This is NOT a generic tutorial. This is a guide for THIS EXACT PROJECT: ${analysisData.repository_metadata.name}

Requirements:
- Reference ACTUAL file paths from THIS project (e.g., "prisma/schema.prisma", "src/config/database.ts")
- Use ACTUAL dependency names from THIS project's package.json/requirements.txt
- Include ACTUAL configuration from THIS project's .env.example
- Mention THIS project's specific quirks and setup needs
- If THIS project uses Docker, emphasize Docker setup
- If THIS project needs external services (Stripe, AWS), explain those specifically
- Use the ACTUAL tech stack: ${analysisData.tech_stack?.framework || 'Unknown'} + ${analysisData.tech_stack?.primary_language || analysisData.repository_metadata?.language || 'Unknown'}

${sectionGuidance}

=== PROJECT-SPECIFIC EXAMPLE TASK ===
${exampleTask}

=== OUTPUT STRUCTURE ===
Return ONLY valid JSON (no markdown, no code blocks, no preamble):
{
  "repository_name": "${analysisData.repository_metadata?.name || 'Unknown Project'}",
  "total_tasks": <count all tasks across all sections>,
  "estimated_completion_time": "2-4 hours",
  "sections": [
    {
      "id": "section-1",
      "title": "Understanding ${analysisData.repository_metadata?.name || 'the Project'}",
      "description": "Learn what this ${analysisData.purpose?.project_type || 'project'} does before setup",
      "tasks": [<task objects>]
    }
  ]
}`;

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await this.model.generateContent(prompt);
          return response.response.text();
        },
        3,
        3000
      );

      const cleanedResult = this.cleanJsonResponse(result);
      const parsed = JSON.parse(cleanedResult);

      // Validate and normalize structure
      this.validateAndNormalizeRoadmap(parsed);

      return parsed as Roadmap;
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      throw new GeminiAPIError('Failed to generate setup roadmap', error);
    }
  }

  /**
   * Build project-specific context for the prompt
   */
  private buildProjectContext(analysisData: AnalysisData): string {
    const contexts: string[] = [];

    // Framework-specific context
    if (analysisData.tech_stack?.framework) {
      const framework = analysisData.tech_stack.framework;
      
      if (framework.includes('Next.js')) {
        contexts.push(`
⚡ Next.js Project Specifics:
- Uses Next.js (requires Node.js 18+)
- Development server runs on port 3000 by default
- Uses file-based routing in the /app or /pages directory
- Environment variables must start with NEXT_PUBLIC_ to be client-accessible
- Build output goes to .next/ directory`);
      } else if (framework.includes('Django')) {
        contexts.push(`
🐍 Django Project Specifics:
- Uses Django framework for Python
- Requires virtual environment (venv) for dependencies
- Uses Django ORM for database operations
- Settings in settings.py control configuration
- Manage.py is the main CLI tool for commands`);
      }
      // Add more frameworks as needed
    }

    // Database-specific context
    if (analysisData.database && analysisData.database.length > 0) {
      const db = analysisData.database[0];
      const connectionExample = this.getDatabaseConnectionExample(db.type);
      
      contexts.push(`
🗄️ Database: ${db.type}
- Type: ${db.type} ${db.version_requirement || '(latest recommended)'}
- Migrations: ${db.migrations_path || 'Not detected'}
- Connection format: ${connectionExample}
- Migration required: ${db.requires_migration ? 'Yes' : 'No'}
- Seed data: ${db.seed_data_available ? 'Available' : 'Not available'}`);
    }

    // Environment variables context
    if (analysisData.env_vars && analysisData.env_vars.length > 0) {
      const categories = this.categorizeEnvVars(analysisData.env_vars);
      const criticalVars = this.getCriticalVars(analysisData.env_vars);
      
      contexts.push(`
🔐 Configuration:
- Total environment variables: ${analysisData.env_vars.length}
- Categories: ${categories.join(', ')}
- Critical variables: ${criticalVars.join(', ')}
- Configuration file: .env (create from .env.example)`);
    }

    return contexts.join('\n\n');
  }

  /**
   * Build section-specific guidance
   */
  private buildSectionGuidance(analysisData: AnalysisData): string {
    const sections: string[] = [
      'Understanding the Project',
      'Environment Setup',
      'Getting the Code',
    ];

    if (analysisData.database && analysisData.database.length > 0) {
      sections.push('Database Setup');
    }

    if (analysisData.env_vars && analysisData.env_vars.length > 0) {
      sections.push('Configuration');
    }

    sections.push('Running the Application');

    let guidance = `
=== REQUIRED SECTIONS (in this exact order) ===
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;

    return guidance;
  }

  /**
   * Build a project-specific example task
   */
  private buildExampleTask(analysisData: AnalysisData): string {
    const framework = analysisData.tech_stack?.framework || '';
    const repoName = analysisData.repository_metadata?.name || 'this project';
    const language = analysisData.repository_metadata?.language || 'Unknown';
    const runtimeVersion = analysisData.tech_stack?.runtime_version || 'latest';

    // Next.js example
    if (framework.includes('Next.js')) {
      return `
{
  "id": "task-install-nodejs",
  "title": "Install Node.js ${runtimeVersion} for ${repoName}",
  "description": {
    "summary": "Set up Node.js runtime required for this Next.js application",
    "why_needed": "${repoName} uses Next.js which requires Node.js 18 or higher",
    "learning_goal": "Understand why runtime versions matter"
  },
  "steps": [
    {
      "order": 1,
      "action": "Check existing Node.js installation",
      "details": "Run node --version to check if Node.js is installed",
      "os_specific": null
    }
  ],
  "commands": [
    {
      "command": "node --version",
      "description": "Check installed Node.js version",
      "expected_output": "v18.x.x or higher",
      "os": "all"
    }
  ],
  "difficulty": "beginner",
  "estimated_time": "10-15 minutes"
}`;
    }

    // PHP/Laravel example
    if (language === 'PHP' || framework.includes('Laravel')) {
      return `
{
  "id": "task-install-php",
  "title": "Install PHP and Composer for ${repoName}",
  "description": {
    "summary": "Set up PHP runtime and Composer package manager",
    "why_needed": "${repoName} is a PHP project that requires PHP 8.0+ and Composer",
    "learning_goal": "Understand PHP development environment setup"
  },
  "steps": [
    {
      "order": 1,
      "action": "Check existing PHP installation",
      "details": "Run php --version to check if PHP is installed",
      "os_specific": {
        "mac": "Install via Homebrew: brew install php",
        "windows": "Download from php.net or use XAMPP",
        "linux": "Install via package manager: sudo apt install php"
      }
    }
  ],
  "commands": [
    {
      "command": "php --version",
      "description": "Check installed PHP version",
      "expected_output": "PHP 8.0 or higher",
      "os": "all"
    }
  ],
  "difficulty": "beginner",
  "estimated_time": "15-20 minutes"
}`;
    }

    // Python example
    if (language === 'Python' || framework.includes('Django') || framework.includes('Flask')) {
      return `
{
  "id": "task-install-python",
  "title": "Install Python for ${repoName}",
  "description": {
    "summary": "Set up Python runtime environment",
    "why_needed": "${repoName} is a Python project",
    "learning_goal": "Understand Python virtual environments"
  },
  "steps": [
    {
      "order": 1,
      "action": "Check existing Python installation",
      "details": "Run python --version to check if Python is installed",
      "os_specific": null
    }
  ],
  "commands": [
    {
      "command": "python --version",
      "description": "Check installed Python version",
      "expected_output": "Python 3.8 or higher",
      "os": "all"
    }
  ],
  "difficulty": "beginner",
  "estimated_time": "10-15 minutes"
}`;
    }

    // Generic example for unknown languages
    return `
{
  "id": "task-clone-repo",
  "title": "Clone ${repoName} Repository",
  "description": {
    "summary": "Get the project code on your local machine",
    "why_needed": "You need the source code to work with ${repoName}",
    "learning_goal": "Understand Git cloning and repository structure"
  },
  "steps": [
    {
      "order": 1,
      "action": "Clone the repository",
      "details": "Use git clone to download the project",
      "os_specific": null
    }
  ],
  "commands": [
    {
      "command": "git clone https://github.com/${analysisData.repository_metadata?.owner || 'owner'}/${repoName}.git",
      "description": "Clone the repository",
      "expected_output": "Repository cloned successfully",
      "os": "all"
    }
  ],
  "difficulty": "beginner",
  "estimated_time": "5 minutes"
}`;
  }

  /**
   * Validate and normalize roadmap structure
   */
  private validateAndNormalizeRoadmap(roadmap: any): void {
    if (!roadmap.sections || !Array.isArray(roadmap.sections)) {
      throw new Error('Invalid roadmap structure: missing sections array');
    }

    for (const section of roadmap.sections) {
      if (!section.tasks || !Array.isArray(section.tasks)) {
        section.tasks = [];
      }

      for (const task of section.tasks) {
        // Ensure all required arrays exist
        task.steps = task.steps || [];
        task.commands = task.commands || [];
        task.code_blocks = task.code_blocks || [];
        task.references = task.references || [];
        task.tips = task.tips || [];
        task.warnings = task.warnings || [];
        task.depends_on = task.depends_on || [];

        // Ensure description is an object
        if (typeof task.description === 'string') {
          task.description = {
            summary: task.description,
            why_needed: '',
            learning_goal: '',
          };
        }

        // Ensure verification exists
        if (!task.verification) {
          task.verification = {
            how_to_verify: '',
            expected_result: '',
            troubleshooting: [],
          };
        }
      }
    }
  }

  /**
   * Clean JSON response from Gemini (remove markdown code blocks)
   */
  private cleanJsonResponse(text: string): string {
    let cleaned = text.trim();

    // Remove markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    return cleaned.trim();
  }

  /**
   * Get database connection string example
   */
  private getDatabaseConnectionExample(dbType: string): string {
    const examples: Record<string, string> = {
      PostgreSQL: 'postgresql://username:password@localhost:5432/database_name',
      MySQL: 'mysql://username:password@localhost:3306/database_name',
      MongoDB: 'mongodb://localhost:27017/database_name',
      SQLite: 'sqlite:///path/to/database.db',
      Redis: 'redis://localhost:6379',
    };
    return examples[dbType] || 'Connection string varies';
  }

  /**
   * Categorize environment variables
   */
  private categorizeEnvVars(envVars: EnvironmentVariable[]): string[] {
    const categories = new Set<string>();
    for (const v of envVars) {
      categories.add(v.category);
    }
    return Array.from(categories);
  }

  /**
   * Get critical environment variables
   */
  private getCriticalVars(envVars: EnvironmentVariable[]): string[] {
    return envVars
      .filter(v => v.required)
      .slice(0, 5)
      .map(v => v.name);
  }

  /**
   * Chat with Ghost Mentor - focused on helping with local setup
   */
  async chat(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    const systemPrompt = `You are Ghost Mentor, a friendly AI assistant helping developers SET UP this project locally.

Your PRIMARY GOAL: Help them get the project running on their machine and LEARN the setup process.

Guidelines:
- Focus on LOCAL SETUP questions (installation, configuration, running locally)
- Provide code snippets when relevant (max 15 lines)
- Explain WHY things work, not just HOW (educational approach)
- Keep answers under 200 words unless explaining complex setup
- Offer troubleshooting tips for common setup issues`;

    try {
      const history = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "I'll help you set up this project!" }] },
      ];

      for (const msg of conversationHistory) {
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }

      const chat = this.model.startChat({ history });
      const result = await retryWithBackoff(
        async () => {
          const response = await chat.sendMessage(message);
          return response.response.text();
        },
        3,
        2000
      );

      return result;
    } catch (error) {
      console.error('Failed to chat:', error);
      throw new GeminiAPIError('Failed to generate chat response', error);
    }
  }
}

/**
 * Create a Gemini client instance
 */
export function createGeminiClient(apiKey?: string): GeminiClient {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is required');
  }
  return new GeminiClient(key);
}