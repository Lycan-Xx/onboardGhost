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
    // Use gemini-pro instead of gemini-1.5-pro for v1beta API
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
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
    const prompt = `You are an expert developer creating an onboarding roadmap for a new team member.

Repository Analysis:
- Tech Stack: ${JSON.stringify(analysisData.tech_stack)}
- Database: ${JSON.stringify(analysisData.database)}
- Required Env Vars: ${analysisData.env_vars.length} variables
- Project Purpose: ${analysisData.purpose.purpose}

${analysisData.setup_instructions ? `Setup Instructions from README:\n${analysisData.setup_instructions}` : ''}

${analysisData.security_issues && analysisData.security_issues.length > 0 ? `Security Warnings:\n${analysisData.security_issues.length} issues found` : ''}

Generate an onboarding roadmap in JSON format with this structure:
{
  "sections": [
    {
      "id": "section-1",
      "title": "Environment Setup",
      "goals": ["Get the app running locally"],
      "tasks": [
        {
          "id": "task-1",
          "title": "Install Node.js v18+",
          "description": "Download and install Node.js from nodejs.org",
          "instructions": "Detailed step-by-step instructions here",
          "code_snippet": "node --version",
          "difficulty": "easy",
          "completion_criteria": "Running 'node --version' shows v18 or higher",
          "tips": ["Use nvm for version management"],
          "warnings": ["M1 Mac users may need Rosetta"]
        }
      ]
    }
  ]
}

Requirements:
- Structure sections logically: Setup → Architecture Understanding → First Contribution
- Order tasks by dependency (can't run migrations before DB setup)
- No time estimates - users progress at their own pace
- Add tips and warnings from known issues
- If security issues exist, prioritize fixing them early
- Include difficulty levels (easy/medium/hard) for user guidance
- Generate 3-5 sections with 3-7 tasks each

Return ONLY valid JSON (no markdown, no code blocks).`;

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
