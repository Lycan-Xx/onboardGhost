/**
 * URL validation and parsing utilities for GitHub repositories
 */

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  url: string;
}

/**
 * Validates if a string is a valid GitHub repository URL
 * Pattern: https://github.com/{owner}/{repo}
 */
export function validateGitHubUrl(url: string): boolean {
  const pattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/;
  return pattern.test(url);
}

/**
 * Parses a GitHub URL and extracts owner and repo name
 * @throws Error if URL is invalid
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  if (!validateGitHubUrl(url)) {
    throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
  }

  const parts = url.replace('https://github.com/', '').split('/');
  const owner = parts[0];
  const repo = parts[1];

  return { owner, repo, url };
}

/**
 * Reconstructs a GitHub URL from owner and repo name
 */
export function constructGitHubUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}
