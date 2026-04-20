import { inngest } from "./client";
import { adminDb } from '@/lib/firebase/admin';
import { createGitHubClient } from '@/lib/github';
import { createGeminiClient } from '@/lib/gemini';
import { filterFileTree, getFilteringStats } from '@/lib/analysis/file-filter';
import { detectTechStack } from '@/lib/analysis/tech-stack';
import { detectDatabaseRequirements } from '@/lib/analysis/database';
import { extractEnvironmentVariables } from '@/lib/analysis/env-vars';
import { parseGitHubUrl } from '@/lib/utils/url';
import { transformRoadmapForUI } from '@/lib/utils/roadmap-transformer';

// Helper function to remove undefined values
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      const value = removeUndefined(obj[key]);
      if (value !== undefined) cleaned[key] = value;
    }
    return cleaned;
  }
  return obj;
}

export const analyzeRepositoryFunction = inngest.createFunction(
  { 
    id: "analyze-repository",
    name: "Analyze Repository",
    triggers: [{ event: "repo/analyze" }] 
  },
  async ({ event, step }) => {
    const { repoUrl, userId, githubToken, saveProgress = true, repoId } = event.data;
    const startTime = Date.now();

    const { owner, repo } = parseGitHubUrl(repoUrl);
    const githubClient = createGitHubClient(githubToken);
    const geminiClient = createGeminiClient();

    // Utility to update progress in Firebase
    const updateProgress = async (stepNum: number, stepName: string, status: string, message: string) => {
      await step.run(`update-progress-${stepNum}-${status}`, async () => {
        const progressRef = adminDb.collection('analysis_progress').doc(repoId);
        const logEntry = { timestamp: new Date(), step: stepNum, message };
        const currentDoc = await progressRef.get();
        const currentLogs = currentDoc.exists ? (currentDoc.data()?.logs || []) : [];
        await progressRef.set({
          current_step: stepNum,
          step_name: stepName,
          step_status: status,
          logs: [...currentLogs, logEntry],
          updated_at: new Date(),
        });
      });
    };

    // Step 1: Repository Access
    await updateProgress(1, 'Repository Access', 'in-progress', 'Fetching repository metadata...');
    const metadata = await step.run("fetch-metadata", async () => {
      return await githubClient.getRepositoryMetadata(owner, repo);
    });
    await updateProgress(1, 'Repository Access', 'completed', `Repository: ${metadata.name}`);

    // Step 2: File Tree Filtering
    await updateProgress(2, 'File Tree Filtering', 'in-progress', 'Fetching file tree...');
    const fileData = await step.run("filter-files", async () => {
      const fileTreeData = await githubClient.getFileTree(owner, repo, metadata.default_branch);
      const allFiles = fileTreeData.tree.map((item: any) => ({
        path: item.path, type: item.type, size: item.size || 0, sha: item.sha, url: item.url,
      }));
      const filteredFiles = filterFileTree(allFiles);
      const stats = getFilteringStats(filteredFiles);
      return { filteredFiles, stats };
    });
    await updateProgress(2, 'File Tree Filtering', 'completed', `Filtered ${fileData.filteredFiles.total_files} files`);

    // Step 3: Static Analysis
    await updateProgress(3, 'Static Analysis', 'in-progress', 'Analyzing tech stack...');
    const staticAnalysis = await step.run("static-analysis", async () => {
      const criticalFilesContent = new Map<string, string>();
      for (const file of fileData.filteredFiles.critical_files.slice(0, 10)) {
        try {
          const content = await githubClient.getFileContent(owner, repo, file.path, metadata.default_branch);
          criticalFilesContent.set(file.path.split('/').pop() || file.path, content);
        } catch (error) {}
      }
      const techStack = await detectTechStack(criticalFilesContent, metadata.language);
      const allDeps = [...techStack.dependencies.production, ...techStack.dependencies.development];
      const databaseRequirements = detectDatabaseRequirements(allDeps, fileData.filteredFiles.files);
      const envExampleContent = criticalFilesContent.get('.env.example') || criticalFilesContent.get('.env.sample') || '';
      const environmentVariables = extractEnvironmentVariables(envExampleContent);
      return {
        techStack,
        databaseRequirements,
        environmentVariables,
        readmeContent: criticalFilesContent.get('README.md') || '',
        packageJsonData: criticalFilesContent.has('package.json') ? JSON.parse(criticalFilesContent.get('package.json')!) : undefined
      };
    });
    await updateProgress(3, 'Static Analysis', 'completed', 'Static Analysis complete');

    // Step 4: Project Purpose Extraction
    await updateProgress(4, 'Project Purpose', 'in-progress', 'Analyzing project purpose...');
    const projectPurpose = await step.run("project-purpose", async () => {
      if (staticAnalysis.readmeContent) {
        return await geminiClient.extractProjectPurpose(
          staticAnalysis.readmeContent,
          staticAnalysis.packageJsonData?.description,
          metadata.description
        );
      } else {
        return {
          purpose: metadata.description || 'No description available',
          features: ['Feature analysis requires README.md'],
          target_users: 'Developers',
          project_type: staticAnalysis.techStack.framework || 'Unknown',
        };
      }
    });
    await updateProgress(4, 'Project Purpose', 'completed', 'Project purpose analyzed');

    // Step 5: Skip Security Scan
    await updateProgress(5, 'Security Scan', 'completed', 'Skipped');
    
    // Step 6: RAG Embedding Upload
    await updateProgress(6, 'RAG Indexing', 'in-progress', 'Embedding repository codebase for QA...');
    await step.run("rag-indexing", async () => {
      try {
        const { vectorIndex } = await import('@/lib/upstash/client');
        
        // Ensure env variables are set (don't break analysis if they aren't configured yet)
        if (!process.env.UPSTASH_VECTOR_REST_URL) {
          console.warn('Upstash Vector not configured, skipping RAG indexing');
          return;
        }

        const MAX_FILES = 15; // Limit to protect free tier
        const chunksToUpload = [];

        // Focus on critical source files for RAG
        const ragFiles = fileData.filteredFiles.critical_files.slice(0, MAX_FILES);
        
        for (const file of ragFiles) {
          try {
            const content = await githubClient.getFileContent(owner, repo, file.path, metadata.default_branch);
            if (!content) continue;
            
            // Simple chunking strategy (grouping by roughly 80 lines)
            const lines = content.split('\n');
            let currentChunk = '';
            for(let i=0; i<lines.length; i++) {
               currentChunk += lines[i] + '\n';
               
               // When chunk is full or we hit end of file
               if ((i > 0 && i % 80 === 0) || i === lines.length - 1) { 
                  const text = `File: ${file.path}\n\n${currentChunk}`;
                  const embedding = await geminiClient.generateEmbedding(text);
                  
                  if (embedding && embedding.length > 0) {
                    chunksToUpload.push({
                       id: `${repoId}-${file.path.replace(/[^a-zA-Z0-9-]/g, '-')}-chunk-${i}`,
                       vector: embedding,
                       metadata: { repoId, filePath: file.path, text: text.slice(0, 8000) } // keep metadata size reasonable
                    });
                  }
                  currentChunk = '';
               }
            }
          } catch (e) {
            console.warn(`Failed to process and embed ${file.path}`);
          }
        }

        // Upsert to Upstash in batches of 10 to avoid payload limits
        if (chunksToUpload.length > 0) {
          for (let i = 0; i < chunksToUpload.length; i += 10) {
            const batch = chunksToUpload.slice(i, i + 10);
            await vectorIndex.upsert(batch);
          }
        }
      } catch (error) {
        console.error('RAG Indexing failed entirely:', error);
      }
    });
    await updateProgress(6, 'RAG Indexing', 'completed', 'Codebase indexed for Ghost Mentor');

    // Step 7: AI Roadmap Generation
    await updateProgress(7, 'Roadmap Generation', 'in-progress', 'Generating onboarding roadmap...');
    const generatedRoadmap = await step.run("generate-roadmap", async () => {
      const geminiMetadata = {
        owner: metadata.owner,
        name: metadata.name,
        description: metadata.description,
        language: metadata.language,
        size_kb: metadata.size,
        stars: metadata.stars,
        default_branch: metadata.default_branch,
      };

      const roadmapData = await geminiClient.generateRoadmap({
        tech_stack: staticAnalysis.techStack,
        database: staticAnalysis.databaseRequirements,
        env_vars: staticAnalysis.environmentVariables,
        purpose: projectPurpose,
        setup_instructions: staticAnalysis.readmeContent.slice(0, 1000),
        security_issues: [],
        repository_metadata: geminiMetadata,
      });

      const transformedSections = roadmapData.sections.map((section: any) => ({
        ...section,
        goals: [],
        tasks: section.tasks.map((task: any) => ({
          ...task,
          instructions: task.instructions || '',
          code_snippet: task.code_blocks?.[0]?.content || null,
          difficulty: task.difficulty === 'beginner' ? 'easy' : task.difficulty === 'intermediate' ? 'medium' : 'hard',
          completion_criteria: task.verification?.how_to_verify || '',
        })),
      }));

      return {
        repo_id: metadata.id,
        repository_name: metadata.name,
        sections: transformedSections,
        total_tasks: roadmapData.sections.reduce((sum: number, section: any) => sum + section.tasks.length, 0),
      };
    });
    await updateProgress(7, 'Roadmap Generation', 'completed', `Generated ${generatedRoadmap.total_tasks} tasks`);

    // Step 8: Complete & Store Results
    await step.run("finalize-storage", async () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      const repoRef = adminDb.collection('repositories').doc(repoId);
      const repoData = removeUndefined({
        ...metadata,
        tech_stack: staticAnalysis.techStack,
        database_requirements: staticAnalysis.databaseRequirements,
        environment_variables: staticAnalysis.environmentVariables,
        security_issues: [],
        project_purpose: projectPurpose,
        gemini_file_uris: [],
        analysis_duration: duration,
        analyzed_at: new Date(),
      });
      await repoRef.set(repoData);

      const roadmapRef = adminDb.collection('roadmaps').doc(repoId);
      const enrichedRoadmap = transformRoadmapForUI(generatedRoadmap as any);
      
      const roadmapData = removeUndefined({
        ...enrichedRoadmap,
        generated_at: new Date(),
      });
      await roadmapRef.set(roadmapData);

      if (saveProgress && userId) {
        const progressRef = adminDb.collection('user_progress').doc(userId).collection('repos').doc(repoId);
        await progressRef.set({
          user_id: userId,
          repo_id: repoId,
          completed_tasks: [],
          overall_progress_percentage: 0,
          ghost_solidness: 0,
          started_at: new Date(),
          last_activity: new Date(),
        }, { merge: true });
      }
    });

    await updateProgress(8, 'Complete', 'completed', `Analysis completed successfully`);
    return { success: true, repoId };
  }
);
