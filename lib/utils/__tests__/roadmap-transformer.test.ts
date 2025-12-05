/**
 * Tests for Roadmap Transformer
 * Run with: npm test roadmap-transformer
 */

import { transformRoadmapForUI } from '../roadmap-transformer';
import type { RawRoadmap } from '../roadmap-transformer';

describe('Roadmap Transformer', () => {
  describe('transformRoadmapForUI', () => {
    it('should handle minimal raw data with defaults', () => {
      const raw: RawRoadmap = {
        repository_name: 'test-repo',
        sections: [
          {
            id: 'section-1',
            title: 'Setup',
            tasks: [
              {
                id: 'task-1',
                title: 'Install Node.js',
              },
            ],
          },
        ],
      };

      const result = transformRoadmapForUI(raw);

      expect(result.repository_name).toBe('test-repo');
      expect(result.total_tasks).toBe(1);
      expect(result.sections[0].tasks[0].tips).toEqual([]);
      expect(result.sections[0].tasks[0].warnings).toEqual([]);
      expect(result.sections[0].tasks[0].difficulty).toBe('beginner');
    });

    it('should normalize string descriptions to objects', () => {
      const raw: RawRoadmap = {
        repository_name: 'test-repo',
        sections: [
          {
            id: 'section-1',
            title: 'Setup',
            tasks: [
              {
                id: 'task-1',
                title: 'Install Node.js',
                description: 'Install Node.js runtime',
              },
            ],
          },
        ],
      };

      const result = transformRoadmapForUI(raw);
      const task = result.sections[0].tasks[0];

      expect(task.description.summary).toBe('Install Node.js runtime');
      expect(task.description.why_needed).toBe('');
      expect(task.description.learning_goal).toBe('');
    });

    it('should normalize string commands to objects', () => {
      const raw: RawRoadmap = {
        repository_name: 'test-repo',
        sections: [
          {
            id: 'section-1',
            title: 'Setup',
            tasks: [
              {
                id: 'task-1',
                title: 'Check Node',
                commands: ['node --version', 'npm --version'],
              },
            ],
          },
        ],
      };

      const result = transformRoadmapForUI(raw);
      const commands = result.sections[0].tasks[0].commands;

      expect(commands).toHaveLength(2);
      expect(commands[0].command).toBe('node --version');
      expect(commands[0].os).toBe('all');
      expect(commands[1].command).toBe('npm --version');
    });

    it('should normalize string tips to objects', () => {
      const raw: RawRoadmap = {
        repository_name: 'test-repo',
        sections: [
          {
            id: 'section-1',
            title: 'Setup',
            tasks: [
              {
                id: 'task-1',
                title: 'Install Node',
                tips: ['Use **nvm** for version management', 'Check with `node --version`'],
              },
            ],
          },
        ],
      };

      const result = transformRoadmapForUI(raw);
      const tips = result.sections[0].tasks[0].tips;

      expect(tips).toHaveLength(2);
      expect(tips[0].text).toBe('Use **nvm** for version management');
      expect(tips[0].type).toBe('pro_tip');
      expect(tips[0].emphasis).toContain('nvm');
      expect(tips[1].emphasis).toContain('node --version');
    });

    it('should filter out null tips and warnings', () => {
      const raw: RawRoadmap = {
        repository_name: 'test-repo',
        sections: [
          {
            id: 'section-1',
            title: 'Setup',
            tasks: [
              {
                id: 'task-1',
                title: 'Install Node',
                tips: ['Valid tip', null as any, 'Another tip'],
                warnings: [null as any, 'Valid warning'],
              },
            ],
          },
        ],
      };

      const result = transformRoadmapForUI(raw);
      const task = result.sections[0].tasks[0];

      expect(task.tips).toHaveLength(2);
      expect(task.warnings).toHaveLength(1);
    });

    it('should calculate total tasks correctly', () => {
      const raw: RawRoadmap = {
        repository_name: 'test-repo',
        sections: [
          {
            id: 'section-1',
            title: 'Setup',
            tasks: [
              { id: 'task-1', title: 'Task 1' },
              { id: 'task-2', title: 'Task 2' },
            ],
          },
          {
            id: 'section-2',
            title: 'Run',
            tasks: [
              { id: 'task-3', title: 'Task 3' },
            ],
          },
        ],
      };

      const result = transformRoadmapForUI(raw);

      expect(result.total_tasks).toBe(3);
    });

    it('should calculate total estimated time', () => {
      const raw: RawRoadmap = {
        repository_name: 'test-repo',
        sections: [
          {
            id: 'section-1',
            title: 'Setup',
            tasks: [
              { id: 'task-1', title: 'Task 1', estimated_time: '30 minutes' },
              { id: 'task-2', title: 'Task 2', estimated_time: '45 minutes' },
            ],
          },
        ],
      };

      const result = transformRoadmapForUI(raw);

      expect(result.estimated_completion_time).toBe('1h 15m');
    });

    it('should preserve existing rich data', () => {
      const raw: RawRoadmap = {
        repository_name: 'test-repo',
        sections: [
          {
            id: 'section-1',
            title: 'Setup',
            tasks: [
              {
                id: 'task-1',
                title: 'Install Node',
                description: {
                  summary: 'Install Node.js runtime',
                  why_needed: 'Required for this project',
                  learning_goal: 'Understand runtime setup',
                },
                commands: [
                  {
                    command: 'node --version',
                    description: 'Check version',
                    expected_output: 'v18.x.x',
                    os: 'all' as const,
                  },
                ],
                tips: [
                  {
                    text: 'Use nvm',
                    type: 'pro_tip' as const,
                    emphasis: ['nvm'],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = transformRoadmapForUI(raw);
      const task = result.sections[0].tasks[0];

      expect(task.description.summary).toBe('Install Node.js runtime');
      expect(task.commands[0].description).toBe('Check version');
      expect(task.tips[0].type).toBe('pro_tip');
    });
  });
});
