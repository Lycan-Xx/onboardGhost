/**
 * Repository analysis pipeline orchestrator
 * Executes 8-step analysis process
 */

import { createGitHubClient } from '../github';
import { createGeminiClient } from '../gemini';
import { filterFileTree, getFilteringStats } from '../analysis/file-filter';
import { detectTechStack } from '../analysis/tech-stack';
import { detectDatabaseRequirements, mergeDatabaseRequirements } from '../analysis/database';
import { extractEnvironmentVariables } from '../analysis/env-vars';
import { parseGitHubUrl } from '../utils/url';
import { withTimeout } from '../utils/retry';
import { AnalysisTimeoutError } from '../utils/errors';
import {
  RepositoryMetadata,
  CompleteAnalysis,
  FileTreeItem,
  ProjectPurpose,
} from '../types';

const ANALYSIS_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export interface AnalysisProgress {
  step: number;
  stepName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  message: string;
  details?: any;
}

export type ProgressCallback = (progress: AnalysisProgress) => void;

export class RepositoryAnalyzer {
  private githubToken?: string;
  private onProgress?: ProgressCallback;

  constructor(githubToken?: string, onProgress?: ProgressCallback) {
    this.githubToken = githubToken;
    this.onProgress = onProgress;
  }

  private reportProgress(
    step: number,
    stepName: string,
    status: AnalysisProgress['status'],
    message: string,
    details?: any
  ) {
    // Console logging for terminal visibility
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const statusEmoji = {
      'pending': '⏳',
      'in-progress': '🔄',
      'completed': '✅',
      'failed': '❌'
    }[status];
    
    console.log(`[${timestamp}] ${statusEmoji} Step ${step}/8: ${stepName} - ${message}`);
    if (details) {
      console.log(`         Details:`, JSON.stringify(details, null, 2));
    }
    
    // Call progress callback if provided
    if (this.onProgress) {
      this.onProgress({ step, stepName, status, message, details });
    }
  }

  /**
   * Main analysis pipeline
   */
  async analyze(repoUrl: string): Promise<CompleteAnalysis> {
    const startTime = Date.now();

    try {
      return await withTimeout(
        this.executeAnalysis(repoUrl, startTime),
        ANALYSIS_TIMEOUT,
        'Analysis timeout exceeded'
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'Analysis timeout exceeded') {
        throw new AnalysisTimeoutError();
      }
      throw error;
    }
  }

  private async executeAnalysis(
    repoUrl: string,
    startTime: number
  ): Promise<CompleteAnalysis> {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 STARTING REPOSITORY ANALYSIS');
    console.log('='.repeat(80));
    console.log(`📦 Repository: ${repoUrl}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(80) + '\n');
    
    // Parse URL
    const { owner, repo } = parseGitHubUrl(repoUrl);
    console.log(`[Parser] Owner: ${owner}, Repo: ${repo}`);
    
    const githubClient = createGitHubClient(this.githubToken);
    const geminiClient = createGeminiClient();

    // Step 1: Repository Access
    this.reportProgress(1, 'Repository Access', 'in-progress', 'Fetching repository metadata...');
    const metadata = await githubClient.getRepositoryMetadata(owner, repo);
    this.reportProgress(1, 'Repository Access', 'completed', `Repository: ${metadata.name}`, {
      stars: metadata.stars,
      language: metadata.language,
    });

    // Step 2: File Tree Filtering
    this.reportProgress(2, 'File Tree Filtering', 'in-progress', 'Fetching file tree...');
    const fileTreeData = await githubClient.getFileTree(owner, repo, metadata.default_branch);
    const allFiles: FileTreeItem[] = fileTreeData.tree.map((item: any) => ({
      path: item.path,
      type: item.type,
      size: item.size || 0,
      sha: item.sha,
      url: item.url,
    }));

    const filteredFiles = filterFileTree(allFiles);
    const stats = getFilteringStats(filteredFiles);
    this.reportProgress(2, 'File Tree Filtering', 'completed', 
      `Filtered ${filteredFiles.total_files} files → ${filteredFiles.analyzed_files} relevant files (${stats.reductionPercentage}% reduction)`,
      stats
    );

    // Step 3: Static Analysis
    this.reportProgress(3, 'Static Analysis', 'in-progress', 'Analyzing tech stack...');
    
    // Fetch critical files content
    const criticalFilesContent = new Map<string, string>();
    for (const file of filteredFiles.critical_files.slice(0, 10)) { // Limit to first 10
      try {
        const content = await githubClient.getFileContent(owner, repo, file.path, metadata.default_branch);
        criticalFilesContent.set(file.path.split('/').pop() || file.path, content);
      } catch (error) {
        console.error(`Failed to fetch ${file.path}:`, error);
      }
    }

    // Detect tech stack
    const techStack = await detectTechStack(criticalFilesContent, metadata.language);
    
    // Detect database requirements
    const allDeps = [
      ...techStack.dependencies.production,
      ...techStack.dependencies.development,
    ];
    const databaseRequirements = detectDatabaseRequirements(allDeps, filteredFiles.files);

    // Extract environment variables
    const envExampleContent = criticalFilesContent.get('.env.example') || criticalFilesContent.get('.env.sample') || '';
    const environmentVariables = extractEnvironmentVariables(envExampleContent);

    this.reportProgress(3, 'Static Analysis', 'completed', 
      `Detected: ${techStack.framework}, ${databaseRequirements.length} databases, ${environmentVariables.length} env vars`
    );

    // Step 4: Project Purpose Extraction
    this.reportProgress(4, 'Project Purpose', 'in-progress', 'Analyzing project purpose...');
    const readmeContent = criticalFilesContent.get('README.md') || '';
    const packageJson = criticalFilesContent.get('package.json');
    let packageJsonData;
    try {
      packageJsonData = packageJson ? JSON.parse(packageJson) : undefined;
    } catch (e) {
      packageJsonData = undefined;
    }

    let projectPurpose: ProjectPurpose;
    if (readmeContent) {
      projectPurpose = await geminiClient.extractProjectPurpose(
        readmeContent,
        packageJsonData?.description,
        metadata.description
      );
    } else {
      // Fallback if no README
      projectPurpose = {
        purpose: metadata.description || 'No description available',
        features: ['Feature analysis requires README.md'],
        target_users: 'Developers',
        project_type: techStack.framework || 'Unknown',
      };
    }
    this.reportProgress(4, 'Project Purpose', 'completed', projectPurpose.purpose);

    // Step 5: Skip Security Scan (optional, requires Docker)
    this.reportProgress(5, 'Security Scan', 'completed', 'Skipped (optional feature)');

    // Step 6: Skip File Upload (will implement later)
    this.reportProgress(6, 'File Upload', 'completed', 'Skipped (will be implemented for chat)');

    // Step 7: AI Roadmap Generation
    this.reportProgress(7, 'Roadmap Generation', 'in-progress', 'Generating onboarding roadmap...');
    const roadmapData = await geminiClient.generateRoadmap({
      tech_stack: techStack,
      database: databaseRequirements,
      env_vars: environmentVariables,
      purpose: projectPurpose,
      setup_instructions: readmeContent.slice(0, 1000),
      security_issues: [],
    });

    const roadmap = {
      repo_id: metadata.id,
      generated_at: new Date(),
      sections: roadmapData.sections,
      total_tasks: roadmapData.sections.reduce(
        (sum: number, section: any) => sum + section.tasks.length,
        0
      ),
    };
    this.reportProgress(7, 'Roadmap Generation', 'completed', 
      `Generated ${roadmap.sections.length} sections with ${roadmap.total_tasks} tasks`
    );

    // Step 8: Complete
    const duration = Math.round((Date.now() - startTime) / 1000);
    metadata.analysis_duration = duration;
    this.reportProgress(8, 'Complete', 'completed', `Analysis completed in ${duration}s`);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 ANALYSIS COMPLETE!');
    console.log('='.repeat(80));
    console.log(`⏱️  Total Duration: ${duration}s`);
    console.log(`📊 Files Scanned: ${filteredFiles.total_files}`);
    console.log(`📝 Files Analyzed: ${filteredFiles.analyzed_files}`);
    console.log(`📚 Sections Generated: ${roadmap.sections.length}`);
    console.log(`✅ Tasks Created: ${roadmap.total_tasks}`);
    console.log('='.repeat(80) + '\n');

    return {
      repository: metadata,
      tech_stack: techStack,
      database: databaseRequirements,
      environment_variables: environmentVariables,
      security_issues: [],
      project_purpose: projectPurpose,
      roadmap,
      uploaded_files: {
        total: 0,
        gemini_uris: [],
      },
      analysis_metadata: {
        analyzed_at: new Date(),
        analysis_duration_seconds: duration,
        total_files_scanned: filteredFiles.total_files,
        files_analyzed: filteredFiles.analyzed_files,
      },
    };
  }
}

/**
 * Create analyzer instance
 */
export function createAnalyzer(
  githubToken?: string,
  onProgress?: ProgressCallback
): RepositoryAnalyzer {
  return new RepositoryAnalyzer(githubToken, onProgress);
}
