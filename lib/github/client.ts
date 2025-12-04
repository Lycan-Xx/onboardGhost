/**
 * GitHub API client for repository operations
 */

import { retryWithBackoff } from '../utils/retry';
import { GitHubAPIError } from '../utils/errors';
import { validateRepositorySize } from '../utils/validation';
import { RepositoryMetadata } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubClientOptions {
  token?: string;
}

export class GitHubClient {
  private token?: string;

  constructor(options?: GitHubClientOptions) {
    this.token = options?.token;
  }

  /**
   * Get headers for GitHub API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'OnboardGhost',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make a request to GitHub API with error handling
   */
  private async request<T>(url: string): Promise<T> {
    console.log(`[GitHub API] GET ${url.replace(GITHUB_API_BASE, '')}`);
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      
      if (response.status === 404) {
        throw new GitHubAPIError(
          'Repository not found or private. Connect GitHub to access private repos.',
          404,
          { url, body: errorBody }
        );
      }

      if (response.status === 403) {
        // Rate limit or forbidden
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        
        throw new GitHubAPIError(
          'GitHub API rate limit exceeded or insufficient permissions',
          403,
          { rateLimitRemaining, rateLimitReset, body: errorBody }
        );
      }

      throw new GitHubAPIError(
        `GitHub API error: ${response.statusText}`,
        response.status,
        { body: errorBody }
      );
    }

    return response.json();
  }

  /**
   * Fetch repository metadata
   * Retries up to 3 times on 403 errors (rate limiting)
   */
  async getRepositoryMetadata(
    owner: string,
    repo: string
  ): Promise<RepositoryMetadata> {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

    const data = await retryWithBackoff(
      () => this.request<any>(url),
      3,
      1000
    );

    // Validate repository size
    validateRepositorySize(data.size);

    // Transform GitHub API response to our RepositoryMetadata format
    const metadata: RepositoryMetadata = {
      id: `${owner}/${repo}`,
      owner: data.owner.login,
      name: data.name,
      url: data.html_url,
      description: data.description || '',
      stars: data.stargazers_count,
      forks: data.forks_count,
      default_branch: data.default_branch,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      language: data.language || 'Unknown',
      size: data.size,
      is_private: data.private,
      analyzed_at: new Date(),
      analysis_duration: 0, // Will be updated after analysis
    };

    return metadata;
  }

  /**
   * Fetch file tree recursively
   */
  async getFileTree(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<any> {
    // Try 'main' first, fallback to 'master'
    try {
      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
      return await this.request<any>(url);
    } catch (error) {
      if (error instanceof GitHubAPIError && error.statusCode === 404 && branch === 'main') {
        // Try 'master' branch
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/master?recursive=1`;
        return await this.request<any>(url);
      }
      throw error;
    }
  }

  /**
   * Fetch file content
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<string> {
    const url = branch
      ? `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      : `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

    const data = await this.request<any>(url);

    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    return data.content;
  }

  /**
   * Search GitHub issues
   */
  async searchIssues(
    owner: string,
    repo: string,
    query: string
  ): Promise<any[]> {
    const searchQuery = `repo:${owner}/${repo} ${query}`;
    const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(searchQuery)}&sort=reactions-+1&per_page=3`;

    const data = await this.request<any>(url);
    return data.items || [];
  }

  /**
   * Validate OAuth token
   */
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const url = `${GITHUB_API_BASE}/user`;
      await this.request<any>(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create a GitHub client instance
 */
export function createGitHubClient(token?: string): GitHubClient {
  return new GitHubClient({ token });
}
