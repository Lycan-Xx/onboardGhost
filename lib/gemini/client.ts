/**
 * Google Gemini AI client for analysis and chat
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryWithBackoff } from '../utils/retry';
import { GeminiAPIError } from '../utils/errors';
import { ProjectPurpose } from '../types';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-pro-latest which is a generally available model
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
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
2. Core Features (3-5 bullet points): What can users do?n
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

      // Clean up response (remove markdown code blocks if present)
      let cleanedResult = result.trim();
      if (cleanedResult.startsWith('```json')) {
        cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResult.startsWith('```')) {
        cleanedResult = cleanedResult.replace(/```\n?/g, '');
      }

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
   * Generate onboarding roadmap from analysis data
   */
  async generateRoadmap(analysisData: {
    tech_stack: any;
    database: any[];
    env_vars: any[];
    purpose: ProjectPurpose;
    setup_instructions?: string;
    security_issues?: any[];
  }): Promise<any> {
    const envVarsList = analysisData.env_vars.map(v => `${v.name}=${v.example_value || 'your_value_here'}`).join('\n');
    
    const prompt = `You are an expert senior developer creating a DETAILED, COMPREHENSIVE onboarding roadmap for a new team member joining this project.

=== REPOSITORY ANALYSIS ===
Tech Stack: ${JSON.stringify(analysisData.tech_stack, null, 2)}
Database: ${JSON.stringify(analysisData.database, null, 2)}
Project Purpose: ${analysisData.purpose.purpose}
Features: ${analysisData.purpose.features.join(', ')}
Environment Variables (${analysisData.env_vars.length} total):
${envVarsList}

${analysisData.setup_instructions ? `Setup Instructions from README:\n${analysisData.setup_instructions}\n` : ''}
${analysisData.security_issues && analysisData.security_issues.length > 0 ? `⚠️ SECURITY ISSUES FOUND: ${analysisData.security_issues.length} secrets detected - MUST be addressed in roadmap!\n` : ''}

=== YOUR TASK ===
Generate a DETAILED onboarding roadmap with 4-6 sections and 4-8 tasks per section. Each task MUST include:
1. Clear, actionable title
2. Detailed description (2-3 sentences explaining WHY this task matters)
3. Step-by-step instructions (array of 3-7 detailed steps)
4. Code snippets (actual commands/code the user needs to run)
5. Practical tips (2-4 helpful hints)
6. Warnings (1-3 common pitfalls to avoid)
7. Difficulty level (easy/medium/hard)
8. Estimated time (e.g., "10 minutes", "30 minutes", "1 hour")

=== EXAMPLE TASK (FOLLOW THIS LEVEL OF DETAIL) ===
{
  "id": "task-1",
  "title": "Clone Repository and Install Dependencies",
  "description": "Get a local copy of the codebase on your machine and install all required packages. This is the foundation for all development work.",
  "instructions": [
    "Open your terminal and navigate to your projects directory",
    "Clone the repository using the git clone command",
    "Navigate into the project directory",
    "Install dependencies using the package manager",
    "Verify installation by checking for node_modules folder"
  ],
  "commands": [
    "git clone https://github.com/username/repo-name.git",
    "cd repo-name",
    "npm install",
    "npm list --depth=0"
  ],
  "code_snippets": [],
  "tips": [
    "Use 'npm ci' instead of 'npm install' for faster, more reliable installs in CI/CD",
    "If you encounter permission errors, avoid using sudo - fix npm permissions instead",
    "Check package.json to understand what dependencies are being installed"
  ],
  "warnings": [
    "Don't commit node_modules to git - it's already in .gitignore",
    "If npm install fails, try deleting node_modules and package-lock.json first"
  ],
  "difficulty": "easy",
  "estimated_time": "5-10 minutes"
}

IMPORTANT: Differentiate between "commands" and "code_snippets":
- "commands": Terminal/shell commands to run (e.g., npm install, git clone, docker-compose up)
- "code_snippets": Actual code to write in files (e.g., JavaScript, TypeScript, configuration files)
- Use "commands" for CLI operations, "code_snippets" for file content

=== REQUIRED SECTIONS (in this order) ===
1. "Environment Setup" - Install tools, clone repo, install dependencies, setup database
2. "Configuration" - Environment variables, API keys, database connections
3. "Running the Application" - Start dev server, verify it works, understand the stack
4. "Understanding the Codebase" - Project structure, key files, architecture patterns
5. "Making Your First Change" - Find a good first issue, make a change, test it

DO NOT include "Advanced Topics", "Deployment", or "Production" sections. Focus ONLY on getting the developer productive locally.

=== CRITICAL REQUIREMENTS ===
- EVERY task MUST have 3-7 detailed instructions (not just 1-2 vague steps)
- EVERY task MUST have either "commands" array (for CLI commands) OR "code_snippets" array (for code to write)
- "commands" = Terminal commands to run (git, npm, docker, etc.)
- "code_snippets" = Actual code/config to write in files (JavaScript, JSON, .env content, etc.)
- EVERY task MUST have 2-4 practical tips
- EVERY task MUST have 1-3 warnings about common mistakes
- Include specific file paths when relevant (e.g., "Edit src/config/database.js")
- For database tasks, include connection strings and migration commands
- For env var tasks, show the actual .env file format with all variables in code_snippets
- If security issues exist, create a HIGH PRIORITY task to remove them
- Keep tasks focused on LOCAL DEVELOPMENT only - no deployment, CI/CD, or production topics

=== OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown, no code blocks, no explanations):
{
  "repository_name": "${analysisData.purpose.project_type}",
  "total_tasks": <count>,
  "estimated_completion_time": "4-6 hours",
  "sections": [
    {
      "id": "section-1",
      "title": "Environment Setup",
      "description": "Get your development environment ready",
      "tasks": [<detailed tasks here>]
    }
  ]
}

Generate the roadmap NOW with maximum detail and practical guidance:`;

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await this.model.generateContent(prompt);
          return response.response.text();
        },
        3,
        2000
      );

      // Clean up response
      let cleanedResult = result.trim();
      if (cleanedResult.startsWith('```json')) {
        cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResult.startsWith('```')) {
        cleanedResult = cleanedResult.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedResult);

      // Validate structure
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('Invalid roadmap structure');
      }

      // Data correction: Ensure task.instructions is always an array
      for (const section of parsed.sections) {
        if (section.tasks && Array.isArray(section.tasks)) {
          for (const task of section.tasks) {
            if (task.instructions && typeof task.instructions === 'string') {
              task.instructions = [task.instructions];
            }
          }
        }
      }

      return parsed;
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      throw new GeminiAPIError('Failed to generate onboarding roadmap', error);
    }
  }

  /**
   * Chat with Ghost Mentor using File Search
   */
  async chat(
    message: string,
    fileUris: string[],
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    const systemPrompt = `You are Ghost Mentor, a friendly AI assistant helping developers understand this codebase.

Guidelines:
- Answer questions using ONLY the uploaded code files
- Include file paths in your answers (e.g., "In src/auth/login.js...")
- Provide code snippets when relevant (max 15 lines)
- Keep answers under 200 words unless explaining complex architecture
- If answer isn't in the codebase, say so honestly
- Offer one follow-up suggestion at the end

Personality:
- Friendly but professional (no "Hey buddy!")
- Encouraging without being condescending
- Technical accuracy over entertainment`;

    try {
      // Build conversation history
      const history = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Understood. I'll help you understand this codebase." }] },
      ];

      // Add previous conversation
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
      console.error('Failed to chat with Ghost Mentor:', error);
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
