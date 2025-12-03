/**
 * Environment variables extraction from .env.example files
 */

import { EnvironmentVariable } from '../types';

/**
 * Parse .env.example file and extract environment variables
 */
export function extractEnvironmentVariables(
  envExampleContent: string
): EnvironmentVariable[] {
  if (!envExampleContent || envExampleContent.trim().length === 0) {
    return [];
  }

  const variables: EnvironmentVariable[] = [];
  const lines = envExampleContent.split('\n');
  let currentComment = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      currentComment = '';
      continue;
    }

    // Capture comments
    if (trimmedLine.startsWith('#')) {
      const comment = trimmedLine.substring(1).trim();
      currentComment = currentComment ? `${currentComment} ${comment}` : comment;
      continue;
    }

    // Parse variable line
    const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const name = match[1];
      const value = match[2];

      variables.push({
        name,
        description: currentComment || 'No description provided',
        required: !value || value.trim().length === 0,
        example_value: value || '',
        category: categorizeEnvVar(name),
      });

      currentComment = '';
    }
  }

  return variables;
}

/**
 * Categorize environment variable based on its name
 */
export function categorizeEnvVar(
  name: string
): 'database' | 'api_key' | 'server' | 'general' {
  const upperName = name.toUpperCase();

  // Database category
  if (
    upperName.includes('DATABASE') ||
    upperName.includes('DB_') ||
    upperName.includes('POSTGRES') ||
    upperName.includes('MYSQL') ||
    upperName.includes('MONGO') ||
    upperName.includes('REDIS')
  ) {
    return 'database';
  }

  // API Key category
  if (
    upperName.includes('API_KEY') ||
    upperName.includes('SECRET') ||
    upperName.includes('TOKEN') ||
    upperName.includes('PASSWORD') ||
    upperName.includes('PRIVATE_KEY')
  ) {
    return 'api_key';
  }

  // Server category
  if (
    upperName.includes('PORT') ||
    upperName.includes('HOST') ||
    upperName.includes('URL') ||
    upperName.includes('DOMAIN')
  ) {
    return 'server';
  }

  // General category (default)
  return 'general';
}

/**
 * Extract environment variables from README mentions
 */
export function extractEnvVarsFromReadme(readmeContent: string): string[] {
  const envVars: string[] = [];
  const envVarPattern = /\b([A-Z_][A-Z0-9_]{2,})\b/g;
  
  // Look for sections that mention environment variables
  const envSections = [
    'environment',
    'configuration',
    'setup',
    'installation',
    'getting started',
  ];

  const lines = readmeContent.split('\n');
  let inEnvSection = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if we're entering an environment-related section
    if (envSections.some((section) => lowerLine.includes(section))) {
      inEnvSection = true;
    }

    // Check if we're leaving the section (new heading)
    if (line.startsWith('#') && inEnvSection) {
      if (!envSections.some((section) => lowerLine.includes(section))) {
        inEnvSection = false;
      }
    }

    // Extract environment variables from relevant sections
    if (inEnvSection) {
      let match;
      while ((match = envVarPattern.exec(line)) !== null) {
        const varName = match[1];
        // Filter out common words that aren't env vars
        if (
          varName.length > 3 &&
          !['README', 'LICENSE', 'TODO', 'NOTE', 'WARNING'].includes(varName)
        ) {
          envVars.push(varName);
        }
      }
    }
  }

  return [...new Set(envVars)]; // Remove duplicates
}

/**
 * Parse docker-compose.yml environment section
 */
export function extractEnvVarsFromDockerCompose(
  dockerComposeContent: string
): string[] {
  const envVars: string[] = [];
  const lines = dockerComposeContent.split('\n');
  let inEnvironmentSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if we're in an environment section
    if (trimmedLine === 'environment:') {
      inEnvironmentSection = true;
      continue;
    }

    // Check if we've left the environment section
    if (inEnvironmentSection && trimmedLine && !trimmedLine.startsWith('-') && !trimmedLine.includes(':')) {
      inEnvironmentSection = false;
    }

    // Extract environment variables
    if (inEnvironmentSection) {
      const match = trimmedLine.match(/^-?\s*([A-Z_][A-Z0-9_]*)[:=]/);
      if (match) {
        envVars.push(match[1]);
      }
    }
  }

  return [...new Set(envVars)]; // Remove duplicates
}

/**
 * Generate warning message when no .env.example file exists
 */
export function generateEnvWarning(): {
  has_env_example: false;
  variables: [];
  warning: string;
} {
  return {
    has_env_example: false,
    variables: [],
    warning: 'No .env.example file found - manual configuration required',
  };
}

/**
 * Group environment variables by category
 */
export function groupEnvVarsByCategory(
  variables: EnvironmentVariable[]
): Record<string, EnvironmentVariable[]> {
  const grouped: Record<string, EnvironmentVariable[]> = {
    database: [],
    api_key: [],
    server: [],
    general: [],
  };

  for (const variable of variables) {
    grouped[variable.category].push(variable);
  }

  return grouped;
}

/**
 * Validate environment variable names
 */
export function validateEnvVarName(name: string): boolean {
  // Must start with letter or underscore
  // Can only contain uppercase letters, numbers, and underscores
  const pattern = /^[A-Z_][A-Z0-9_]*$/;
  return pattern.test(name);
}

/**
 * Generate .env.example template from detected variables
 */
export function generateEnvTemplate(variables: EnvironmentVariable[]): string {
  const grouped = groupEnvVarsByCategory(variables);
  let template = '# Environment Variables\n\n';

  const categories = [
    { key: 'database', title: 'Database Configuration' },
    { key: 'api_key', title: 'API Keys and Secrets' },
    { key: 'server', title: 'Server Configuration' },
    { key: 'general', title: 'General Configuration' },
  ];

  for (const category of categories) {
    const vars = grouped[category.key];
    if (vars.length > 0) {
      template += `## ${category.title}\n`;
      for (const variable of vars) {
        if (variable.description && variable.description !== 'No description provided') {
          template += `# ${variable.description}\n`;
        }
        template += `${variable.name}=${variable.example_value}\n\n`;
      }
    }
  }

  return template;
}
