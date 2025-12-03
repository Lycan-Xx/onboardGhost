/**
 * Database requirements detection
 */

import { DatabaseRequirement, FileTreeItem } from '../types';

/**
 * Detect database requirements from dependencies and project structure
 */
export function detectDatabaseRequirements(
  dependencies: string[],
  files: FileTreeItem[]
): DatabaseRequirement[] {
  const databases: DatabaseRequirement[] = [];

  // Detect PostgreSQL
  if (
    dependencies.includes('pg') ||
    dependencies.includes('psycopg2') ||
    dependencies.includes('psycopg2-binary')
  ) {
    databases.push(createDatabaseRequirement('PostgreSQL', files));
  }

  // Detect MySQL
  if (
    dependencies.includes('mysql2') ||
    dependencies.includes('pymysql') ||
    dependencies.includes('mysqlclient')
  ) {
    databases.push(createDatabaseRequirement('MySQL', files));
  }

  // Detect MongoDB
  if (
    dependencies.includes('mongodb') ||
    dependencies.includes('pymongo') ||
    dependencies.includes('mongoose')
  ) {
    databases.push(createDatabaseRequirement('MongoDB', files));
  }

  // Detect SQLite
  if (
    dependencies.includes('sqlite3') ||
    dependencies.includes('better-sqlite3')
  ) {
    databases.push(createDatabaseRequirement('SQLite', files));
  }

  // Detect Redis
  if (dependencies.includes('redis') || dependencies.includes('ioredis')) {
    databases.push(createDatabaseRequirement('Redis', files));
  }

  return databases;
}

/**
 * Create a database requirement object
 */
function createDatabaseRequirement(
  type: DatabaseRequirement['type'],
  files: FileTreeItem[]
): DatabaseRequirement {
  const migrationsPath = findMigrationsPath(files);
  const hasMigrations = migrationsPath !== null;

  return {
    type,
    required: true,
    requires_migration: hasMigrations,
    migrations_path: migrationsPath || undefined,
    seed_data_available: checkForSeedData(files),
    setup_guide: generateSetupGuide(type),
  };
}

/**
 * Find migrations directory in file tree
 */
function findMigrationsPath(files: FileTreeItem[]): string | null {
  const migrationPatterns = [
    '/migrations/',
    '/migrate/',
    '/db/migrate/',
    '/database/migrations/',
    '/prisma/migrations/',
    '/alembic/',
  ];

  for (const file of files) {
    for (const pattern of migrationPatterns) {
      if (file.path.includes(pattern)) {
        // Extract the migrations directory path
        const index = file.path.indexOf(pattern);
        return file.path.substring(0, index + pattern.length);
      }
    }
  }

  return null;
}

/**
 * Check if seed data files exist
 */
function checkForSeedData(files: FileTreeItem[]): boolean {
  const seedPatterns = [
    '/seeds/',
    '/seed/',
    '/db/seeds/',
    '/database/seeds/',
    'seed.sql',
    'seed.js',
    'seed.ts',
    'seed.py',
  ];

  return files.some((file) =>
    seedPatterns.some((pattern) => file.path.includes(pattern))
  );
}

/**
 * Generate setup guide for database
 */
function generateSetupGuide(type: DatabaseRequirement['type']): string {
  const guides: Record<DatabaseRequirement['type'], string> = {
    PostgreSQL: `Install PostgreSQL:
- macOS: brew install postgresql
- Ubuntu: sudo apt-get install postgresql
- Windows: Download from postgresql.org

Create database:
createdb your_database_name

Update .env with connection string:
DATABASE_URL=postgresql://user:password@localhost:5432/your_database_name`,

    MySQL: `Install MySQL:
- macOS: brew install mysql
- Ubuntu: sudo apt-get install mysql-server
- Windows: Download from mysql.com

Create database:
mysql -u root -p
CREATE DATABASE your_database_name;

Update .env with connection string:
DATABASE_URL=mysql://user:password@localhost:3306/your_database_name`,

    MongoDB: `Install MongoDB:
- macOS: brew install mongodb-community
- Ubuntu: Follow instructions at mongodb.com/docs/manual/installation
- Windows: Download from mongodb.com

Start MongoDB:
mongod

Update .env with connection string:
MONGODB_URI=mongodb://localhost:27017/your_database_name`,

    SQLite: `SQLite is file-based and requires no installation.

The database file will be created automatically when the application runs.

Update .env with database file path:
DATABASE_URL=sqlite:./database.db`,

    Redis: `Install Redis:
- macOS: brew install redis
- Ubuntu: sudo apt-get install redis-server
- Windows: Download from redis.io

Start Redis:
redis-server

Update .env with connection string:
REDIS_URL=redis://localhost:6379`,
  };

  return guides[type];
}

/**
 * Parse docker-compose.yml to detect database services
 */
export function detectDatabaseFromDockerCompose(
  dockerComposeContent: string
): DatabaseRequirement[] {
  const databases: DatabaseRequirement[] = [];

  // Simple pattern matching for common database services
  if (dockerComposeContent.includes('image: postgres')) {
    databases.push({
      type: 'PostgreSQL',
      required: true,
      requires_migration: false,
      seed_data_available: false,
      setup_guide: 'Database is configured in docker-compose.yml. Run: docker-compose up -d',
    });
  }

  if (dockerComposeContent.includes('image: mysql')) {
    databases.push({
      type: 'MySQL',
      required: true,
      requires_migration: false,
      seed_data_available: false,
      setup_guide: 'Database is configured in docker-compose.yml. Run: docker-compose up -d',
    });
  }

  if (dockerComposeContent.includes('image: mongo')) {
    databases.push({
      type: 'MongoDB',
      required: true,
      requires_migration: false,
      seed_data_available: false,
      setup_guide: 'Database is configured in docker-compose.yml. Run: docker-compose up -d',
    });
  }

  if (dockerComposeContent.includes('image: redis')) {
    databases.push({
      type: 'Redis',
      required: true,
      requires_migration: false,
      seed_data_available: false,
      setup_guide: 'Database is configured in docker-compose.yml. Run: docker-compose up -d',
    });
  }

  return databases;
}

/**
 * Merge database requirements from multiple sources
 */
export function mergeDatabaseRequirements(
  ...sources: DatabaseRequirement[][]
): DatabaseRequirement[] {
  const merged = new Map<string, DatabaseRequirement>();

  for (const source of sources) {
    for (const db of source) {
      const existing = merged.get(db.type);
      if (existing) {
        // Merge properties, preferring more detailed information
        merged.set(db.type, {
          ...existing,
          requires_migration: existing.requires_migration || db.requires_migration,
          migrations_path: existing.migrations_path || db.migrations_path,
          seed_data_available: existing.seed_data_available || db.seed_data_available,
        });
      } else {
        merged.set(db.type, db);
      }
    }
  }

  return Array.from(merged.values());
}
