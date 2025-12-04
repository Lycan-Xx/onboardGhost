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

      // Clean up response
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
   * Generate local setup roadmap from analysis data
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
    
    const prompt = `You are creating a DETAILED LOCAL SETUP GUIDE to help a developer get this project running on their machine.

=== PRIMARY GOAL ===
Help the developer:
1. UNDERSTAND what this project does and how it works
2. SET UP the project locally step-by-step  
3. LEARN the setup process so they can do it independently
4. VERIFY everything is working correctly

This is about LOCAL SETUP and LEARNING, not contributing code or deployment.

=== REPOSITORY ANALYSIS ===
Tech Stack: ${JSON.stringify(analysisData.tech_stack, null, 2)}
Database: ${JSON.stringify(analysisData.database, null, 2)}
Project Purpose: ${analysisData.purpose.purpose}
Features: ${analysisData.purpose.features.join(', ')}
Environment Variables (${analysisData.env_vars.length} total):
${envVarsList}

${analysisData.setup_instructions ? `Setup Instructions from README:\n${analysisData.setup_instructions}\n` : ''}
${analysisData.security_issues && analysisData.security_issues.length > 0 ? `⚠️ SECURITY: ${analysisData.security_issues.length} secrets detected!\n` : ''}

=== TASK STRUCTURE ===
Each task MUST include:
- title: Clear, actionable
- description: 2-3 sentences explaining WHAT and WHY
- instructions: Array of 4-8 detailed steps with explanations
- commands: Array of CLI commands to run (git, npm, docker, etc.)
- code_snippets: Array of code/config to write in files (.env, config files, etc.)
- tips: 2-4 helpful learning hints
- warnings: 1-3 common mistakes to avoid
- difficulty: easy/medium/hard
- estimated_time: e.g., "10 minutes"

=== EXAMPLE TASK ===
{
  "id": "task-1",
  "title": "Install Node.js v18+ and Verify",
  "description": "Node.js is the JavaScript runtime that powers this application. Version 18+ is required for compatibility. This sets up the foundation for running the project.",
  "instructions": [
    "Visit nodejs.org and download the LTS version for your OS",
    "Run the installer and follow the wizard (accept defaults)",
    "Open a NEW terminal window to load Node.js into PATH",
    "Verify Node.js by running: node --version",
    "Verify npm by running: npm --version",
    "You should see v18.x.x or higher"
  ],
  "commands": [
    "node --version",
    "npm --version"
  ],
  "code_snippets": [],
  "tips": [
    "Use nvm (Node Version Manager) to switch between Node versions easily",
    "LTS version is more stable than 'Current' - always choose LTS",
    "Check your version first - you might already have it installed"
  ],
  "warnings": [
    "Don't use sudo for npm packages - causes permission issues",
    "Windows: Restart computer after install for PATH changes",
    "M1/M2 Mac: Download ARM64 version, not x64"
  ],
  "difficulty": "easy",
  "estimated_time": "10 minutes"
}

=== REQUIRED SECTIONS (EXACT ORDER) ===
1. "Understanding the Project" - What it does, tech stack, architecture
   - Overview of project purpose and features
   - Tech stack explanation (what each tool does)
   - High-level architecture (how components connect)
   
2. "Environment Setup" - Install required tools
   - Install Node.js/Python/Ruby (with version)
   - Install Docker (if needed)
   - Install database tools (if needed)
   - Verify all installations
   
3. "Getting the Code" - Clone and install dependencies
   - Clone repository with git
   - Install project dependencies
   - Understand dependency files (package.json, etc.)
   
4. "Database Setup" (if database detected) - Setup database
   - Install database (PostgreSQL/MySQL/MongoDB)
   - Create database
   - Run migrations
   - Seed test data (if available)
   
5. "Configuration" - Environment variables and config
   - Create .env file with ALL ${analysisData.env_vars.length} variables
   - Explain what each variable does
   - Get API keys (if needed)
   - Configure database connection
   
6. "Running the Application" - Start and verify
   - Start the development server
   - Access application in browser
   - Verify all features work
   - Understand the dev workflow

=== CRITICAL REQUIREMENTS ===
- START with "Understanding the Project" - context FIRST
- Focus on LOCAL SETUP only (no deployment/CI/CD)
- 4-8 detailed instructions per task (not 1-2 vague steps)
- Separate "commands" (CLI) from "code_snippets" (file content)
- For .env: show COMPLETE file with all ${analysisData.env_vars.length} variables in code_snippets
- Include verification steps (how to know it worked)
- Explain WHY each step is needed (educational)
- Use beginner-friendly language
- Include expected output for commands
- Add troubleshooting tips

=== OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown, no code blocks):
{
  "repository_name": "${analysisData.purpose.project_type}",
  "total_tasks": <count>,
  "estimated_completion_time": "2-4 hours",
  "sections": [
    {
      "id": "section-1",
      "title": "Understanding the Project",
      "description": "Learn what this project does before setup",
      "tasks": [...]
    }
  ]
}

Generate the LOCAL SETUP GUIDE with maximum educational detail:`;

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

      // Ensure instructions is always an array
      for (const section of parsed.sections) {
        if (section.tasks && Array.isArray(section.tasks)) {
          for (const task of section.tasks) {
            if (task.instructions && typeof task.instructions === 'string') {
              task.instructions = [task.instructions];
            }
            // Ensure code_snippets exists
            if (!task.code_snippets) {
              task.code_snippets = [];
            }
            // Ensure commands exists
            if (!task.commands) {
              task.commands = [];
            }
          }
        }
      }

      return parsed;
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      throw new GeminiAPIError('Failed to generate setup roadmap', error);
    }
  }

  /**
   * Chat with Ghost Mentor - focused on helping with local setup
   */
  async chat(
    message: string,
    fileUris: string[],
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    const systemPrompt = `You are Ghost Mentor, a friendly AI assistant helping developers SET UP this project locally.

Your PRIMARY GOAL: Help them get the project running on their machine and LEARN the setup process.

Guidelines:
- Focus on LOCAL SETUP questions (installation, configuration, running locally)
- Answer using ONLY the uploaded code files
- Include file paths (e.g., "In src/config/database.js...")
- Provide code snippets when relevant (max 15 lines)
- Explain WHY things work, not just HOW (educational approach)
- Keep answers under 200 words unless explaining complex setup
- If answer isn't in the codebase, say so honestly
- Offer troubleshooting tips for common setup issues

Personality:
- Friendly and encouraging (like a helpful senior developer)
- Patient with beginners
- Focus on teaching, not just answering
- Technical accuracy over entertainment

Example good responses:
- "To configure the database, you need to edit .env and set DATABASE_URL. This tells the app where to find your database..."
- "The error you're seeing usually means the port is already in use. Try running 'lsof -i :3000' to see what's using it..."
- "In package.json, you'll see the 'dev' script runs 'next dev'. This starts the Next.js development server on port 3000..."`;

    try {
      const history = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "I'll help you set up this project locally and learn the process!" }] },
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
