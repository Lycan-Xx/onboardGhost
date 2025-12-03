/**
 * Smart file filtering for repository analysis
 * Reduces file count by ~95% by excluding irrelevant files
 */

import { FileTreeItem, FilteredFileTree } from '../types';

// Stage 1: Directory Exclusions (ALWAYS SKIP)
export const EXCLUDED_DIRECTORIES = [
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  '.vercel/',
  'coverage/',
  '__pycache__/',
  '.pytest_cache/',
  'venv/',
  'env/',
  'vendor/',
  'target/',
  'out/',
  'bin/',
  'obj/',
  '.git/',
  '.github/workflows/',
  '.idea/',
  '.vscode/',
  'public/images/',
  'public/assets/',
  'static/media/',
];

// Stage 2: File Extension Exclusions (Binary/Media Files)
export const EXCLUDED_EXTENSIONS = [
  // Images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  // Videos
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  // Archives
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  // Documents
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  // Binaries
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  // Fonts
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  // Lockfiles (parse separately, don't include in embeddings)
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'poetry.lock',
  'Gemfile.lock',
  'Cargo.lock',
];

// Stage 3: Prioritized File Inclusions (ALWAYS ANALYZE)
export const CRITICAL_FILES = [
  // Documentation
  'README.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  // Configuration
  'package.json',
  'requirements.txt',
  'Pipfile',
  'pyproject.toml',
  'Gemfile',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  '.env.example',
  '.env.sample',
  'config.example.js',
  'docker-compose.yml',
  'Dockerfile',
  '.dockerignore',
  // Build/Deploy
  'tsconfig.json',
  'webpack.config.js',
  'vite.config.js',
  'next.config.js',
  'next.config.ts',
  'tailwind.config.js',
  'tailwind.config.ts',
  // Testing
  'jest.config.js',
  'jest.config.ts',
  'pytest.ini',
  'phpunit.xml',
  'vitest.config.ts',
  'vitest.config.js',
];

// Stage 4: Code File Inclusions (Source Code Only)
export const CODE_EXTENSIONS = [
  // JavaScript/TypeScript
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  // Python
  '.py',
  '.pyx',
  // Ruby
  '.rb',
  '.rake',
  // Go
  '.go',
  // Rust
  '.rs',
  // PHP
  '.php',
  // Java/Kotlin
  '.java',
  '.kt',
  '.kts',
  // C-family
  '.c',
  '.cpp',
  '.h',
  '.hpp',
  // Other
  '.vue',
  '.svelte',
  '.astro',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.xml',
  '.sql',
  '.sh',
  '.bash',
];

// Stage 5: Size Filtering
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

/**
 * Determines if a file should be analyzed based on filtering rules
 */
export function shouldAnalyzeFile(filePath: string, fileSize: number): boolean {
  // Stage 1: Skip if in excluded directory
  if (EXCLUDED_DIRECTORIES.some((dir) => filePath.includes(dir))) {
    return false;
  }

  // Stage 3: Always include critical files (even if large)
  const fileName = filePath.split('/').pop() || '';
  if (CRITICAL_FILES.some((file) => fileName === file || filePath.endsWith(file))) {
    return true;
  }

  // Stage 2: Skip if excluded extension
  if (EXCLUDED_EXTENSIONS.some((ext) => filePath.endsWith(ext))) {
    return false;
  }

  // Stage 5: Skip if too large
  if (fileSize > MAX_FILE_SIZE) {
    return false;
  }

  // Stage 4: Include if code file
  if (CODE_EXTENSIONS.some((ext) => filePath.endsWith(ext))) {
    return true;
  }

  // Default: skip
  return false;
}

/**
 * Filters a file tree to only include relevant files
 */
export function filterFileTree(files: FileTreeItem[]): FilteredFileTree {
  const criticalFiles: FileTreeItem[] = [];
  const codeFiles: FileTreeItem[] = [];
  const analyzedFiles: FileTreeItem[] = [];

  for (const file of files) {
    // Only process blob files (not directories)
    if (file.type !== 'blob') {
      continue;
    }

    if (shouldAnalyzeFile(file.path, file.size)) {
      analyzedFiles.push(file);

      // Categorize
      const fileName = file.path.split('/').pop() || '';
      if (CRITICAL_FILES.some((f) => fileName === f || file.path.endsWith(f))) {
        criticalFiles.push(file);
      } else {
        codeFiles.push(file);
      }
    }
  }

  return {
    total_files: files.length,
    analyzed_files: analyzedFiles.length,
    skipped_files: files.length - analyzedFiles.length,
    files: analyzedFiles,
    critical_files: criticalFiles,
    code_files: codeFiles,
  };
}

/**
 * Calculate filtering statistics
 */
export function getFilteringStats(filtered: FilteredFileTree): {
  reductionPercentage: number;
  criticalFilesCount: number;
  codeFilesCount: number;
} {
  const reductionPercentage =
    filtered.total_files > 0
      ? Math.round((filtered.skipped_files / filtered.total_files) * 100)
      : 0;

  return {
    reductionPercentage,
    criticalFilesCount: filtered.critical_files.length,
    codeFilesCount: filtered.code_files.length,
  };
}
