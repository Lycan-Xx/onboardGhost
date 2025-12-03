/**
 * Tech stack detection from repository files
 */

import { TechStack } from '../types';

/**
 * Detect JavaScript/TypeScript stack from package.json
 */
export function detectJavaScriptStack(packageJson: any): Partial<TechStack> {
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const depKeys = Object.keys(dependencies);

  return {
    primary_language: 'JavaScript/TypeScript',
    framework: detectFramework(depKeys),
    runtime_version: packageJson.engines?.node || 'Node.js (version unspecified)',
    package_manager: detectPackageManager(),
    dependencies: {
      production: Object.keys(packageJson.dependencies || {}),
      development: Object.keys(packageJson.devDependencies || {}),
    },
    testing_framework: detectTestingFramework(depKeys),
    database: detectDatabase(depKeys),
    ui_library: detectUILibrary(depKeys),
  };
}

/**
 * Detect framework from dependencies
 */
function detectFramework(deps: string[]): string {
  if (deps.includes('next')) return 'Next.js';
  if (deps.includes('react')) return 'React';
  if (deps.includes('vue')) return 'Vue.js';
  if (deps.includes('@angular/core')) return 'Angular';
  if (deps.includes('express')) return 'Express.js';
  if (deps.includes('fastify')) return 'Fastify';
  if (deps.includes('nestjs')) return 'NestJS';
  if (deps.includes('svelte')) return 'Svelte';
  if (deps.includes('solid-js')) return 'Solid.js';
  return 'Vanilla JavaScript';
}

/**
 * Detect package manager (check for lockfiles)
 */
function detectPackageManager(): string {
  // This would need to check for lockfiles in the actual implementation
  // For now, return npm as default
  return 'npm';
}

/**
 * Detect testing framework
 */
function detectTestingFramework(deps: string[]): string | null {
  if (deps.includes('jest')) return 'Jest';
  if (deps.includes('vitest')) return 'Vitest';
  if (deps.includes('mocha')) return 'Mocha';
  if (deps.includes('jasmine')) return 'Jasmine';
  if (deps.includes('@playwright/test')) return 'Playwright';
  if (deps.includes('cypress')) return 'Cypress';
  return null;
}

/**
 * Detect database from dependencies
 */
function detectDatabase(deps: string[]): string | null {
  if (deps.includes('pg') || deps.includes('postgres')) return 'PostgreSQL';
  if (deps.includes('mysql') || deps.includes('mysql2')) return 'MySQL';
  if (deps.includes('mongodb') || deps.includes('mongoose')) return 'MongoDB';
  if (deps.includes('sqlite3') || deps.includes('better-sqlite3')) return 'SQLite';
  if (deps.includes('redis')) return 'Redis';
  if (deps.includes('prisma')) return 'Prisma (ORM)';
  return null;
}

/**
 * Detect UI library
 */
function detectUILibrary(deps: string[]): string | null {
  if (deps.includes('tailwindcss')) return 'Tailwind CSS';
  if (deps.includes('@mui/material')) return 'Material-UI';
  if (deps.includes('bootstrap')) return 'Bootstrap';
  if (deps.includes('antd')) return 'Ant Design';
  if (deps.includes('chakra-ui')) return 'Chakra UI';
  if (deps.includes('styled-components')) return 'Styled Components';
  return null;
}

/**
 * Detect Python stack from requirements.txt or pyproject.toml
 */
export function detectPythonStack(
  requirementsTxt?: string,
  pyprojectToml?: any
): Partial<TechStack> {
  const dependencies = requirementsTxt
    ? parseRequirementsTxt(requirementsTxt)
    : [];

  return {
    primary_language: 'Python',
    framework: detectPythonFramework(dependencies),
    runtime_version:
      pyprojectToml?.tool?.poetry?.dependencies?.python || 'Python 3.x',
    package_manager: pyprojectToml ? 'Poetry' : 'pip',
    dependencies: {
      production: dependencies,
      development: [],
    },
    testing_framework: detectPythonTesting(dependencies),
    database: detectPythonDatabase(dependencies),
    ui_library: null,
  };
}

/**
 * Parse requirements.txt file
 */
function parseRequirementsTxt(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
}

/**
 * Detect Python framework
 */
function detectPythonFramework(deps: string[]): string {
  if (deps.includes('django')) return 'Django';
  if (deps.includes('fastapi')) return 'FastAPI';
  if (deps.includes('flask')) return 'Flask';
  if (deps.includes('tornado')) return 'Tornado';
  if (deps.includes('pyramid')) return 'Pyramid';
  return 'Python Script';
}

/**
 * Detect Python testing framework
 */
function detectPythonTesting(deps: string[]): string | null {
  if (deps.includes('pytest')) return 'pytest';
  if (deps.includes('unittest')) return 'unittest';
  if (deps.includes('nose')) return 'nose';
  return null;
}

/**
 * Detect Python database
 */
function detectPythonDatabase(deps: string[]): string | null {
  if (deps.includes('psycopg2') || deps.includes('psycopg2-binary'))
    return 'PostgreSQL';
  if (deps.includes('pymysql') || deps.includes('mysqlclient')) return 'MySQL';
  if (deps.includes('pymongo')) return 'MongoDB';
  if (deps.includes('redis')) return 'Redis';
  if (deps.includes('sqlalchemy')) return 'SQLAlchemy (ORM)';
  return null;
}

/**
 * Detect Ruby stack from Gemfile
 */
export function detectRubyStack(gemfileContent: string): Partial<TechStack> {
  const gems = parseGemfile(gemfileContent);

  return {
    primary_language: 'Ruby',
    framework: gems.includes('rails') ? 'Ruby on Rails' : 'Ruby',
    runtime_version: extractRubyVersion(gemfileContent),
    package_manager: 'Bundler',
    dependencies: {
      production: gems,
      development: [],
    },
    testing_framework: detectRubyTesting(gems),
    database: detectRubyDatabase(gems),
    ui_library: null,
  };
}

/**
 * Parse Gemfile
 */
function parseGemfile(content: string): string[] {
  const gemPattern = /gem\s+['"]([^'"]+)['"]/g;
  const gems: string[] = [];
  let match;

  while ((match = gemPattern.exec(content)) !== null) {
    gems.push(match[1]);
  }

  return gems;
}

/**
 * Extract Ruby version from Gemfile
 */
function extractRubyVersion(content: string): string {
  const versionMatch = content.match(/ruby\s+['"]([^'"]+)['"]/);
  return versionMatch ? `Ruby ${versionMatch[1]}` : 'Ruby (version unspecified)';
}

/**
 * Detect Ruby testing framework
 */
function detectRubyTesting(gems: string[]): string | null {
  if (gems.includes('rspec')) return 'RSpec';
  if (gems.includes('minitest')) return 'Minitest';
  if (gems.includes('test-unit')) return 'Test::Unit';
  return null;
}

/**
 * Detect Ruby database
 */
function detectRubyDatabase(gems: string[]): string | null {
  if (gems.includes('pg')) return 'PostgreSQL';
  if (gems.includes('mysql2')) return 'MySQL';
  if (gems.includes('sqlite3')) return 'SQLite';
  if (gems.includes('mongoid')) return 'MongoDB';
  return null;
}

/**
 * Main tech stack detection function
 */
export async function detectTechStack(
  files: Map<string, string>,
  primaryLanguage: string
): Promise<TechStack> {
  let partialStack: Partial<TechStack> = {};

  // Detect based on primary language
  if (primaryLanguage === 'JavaScript' || primaryLanguage === 'TypeScript') {
    const packageJsonContent = files.get('package.json');
    if (packageJsonContent) {
      try {
        const packageJson = JSON.parse(packageJsonContent);
        partialStack = detectJavaScriptStack(packageJson);
      } catch (error) {
        console.error('Failed to parse package.json:', error);
      }
    }
  } else if (primaryLanguage === 'Python') {
    const requirementsTxt = files.get('requirements.txt');
    const pyprojectToml = files.get('pyproject.toml');
    let pyprojectData;

    if (pyprojectToml) {
      try {
        // Would need a TOML parser here
        // For now, just pass undefined
        pyprojectData = undefined;
      } catch (error) {
        console.error('Failed to parse pyproject.toml:', error);
      }
    }

    partialStack = detectPythonStack(requirementsTxt, pyprojectData);
  } else if (primaryLanguage === 'Ruby') {
    const gemfile = files.get('Gemfile');
    if (gemfile) {
      partialStack = detectRubyStack(gemfile);
    }
  }

  // Fill in defaults for missing fields
  return {
    primary_language: partialStack.primary_language || primaryLanguage,
    framework: partialStack.framework || 'Unknown',
    runtime_version: partialStack.runtime_version || 'Unknown',
    package_manager: partialStack.package_manager || 'Unknown',
    dependencies: partialStack.dependencies || { production: [], development: [] },
    testing_framework: partialStack.testing_framework || null,
    database: partialStack.database || null,
    ui_library: partialStack.ui_library || null,
  };
}
