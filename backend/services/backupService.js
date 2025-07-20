const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const { query } = require('../config/database');
const { setupLogging } = require('../config/logging');
const logger = setupLogging();

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    this.maxBackups = parseInt(process.env.MAX_BACKUPS) || 30; // Keep 30 days of backups
    this.uploadsDir = path.join(__dirname, '../../uploads');
    
    this.initializeBackupDirectory();
    this.scheduleBackups();
  }

  async initializeBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info('Backup directory created:', this.backupDir);
    }
  }

  // Schedule automated backups
  scheduleBackups() {
    // Daily database backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.createDatabaseBackup();
        logger.info('Scheduled database backup completed');
      } catch (error) {
        logger.error('Scheduled database backup failed:', error);
      }
    });

    // Weekly full backup (database + files) on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      try {
        await this.createFullBackup();
        logger.info('Scheduled full backup completed');
      } catch (error) {
        logger.error('Scheduled full backup failed:', error);
      }
    });

    // Daily cleanup of old backups at 4 AM
    cron.schedule('0 4 * * *', async () => {
      try {
        await this.cleanupOldBackups();
        logger.info('Backup cleanup completed');
      } catch (error) {
        logger.error('Backup cleanup failed:', error);
      }
    });

    logger.info('Backup scheduler initialized');
  }

  // Create database backup using pg_dump
  async createDatabaseBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
      const backupFileName = `db_backup_${timestamp}.sql`;
      const backupFilePath = path.join(this.backupDir, backupFileName);

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'umroh_db',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
      };

      return new Promise((resolve, reject) => {
        const pg_dump = spawn('pg_dump', [
          '-h', dbConfig.host,
          '-p', dbConfig.port,
          '-U', dbConfig.username,
          '-d', dbConfig.database,
          '--no-password',
          '--clean',
          '--create',
          '--if-exists',
          '-f', backupFilePath
        ], {
          env: {
            ...process.env,
            PGPASSWORD: dbConfig.password
          }
        });

        pg_dump.on('error', (error) => {
          logger.error('pg_dump error:', error);
          reject(error);
        });

        pg_dump.on('close', (code) => {
          if (code === 0) {
            logger.info(`Database backup created: ${backupFileName}`);
            resolve(backupFilePath);
          } else {
            reject(new Error(`pg_dump exited with code ${code}`));
          }
        });
      });
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw error;
    }
  }

  // Create backup of uploaded files
  async createFilesBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
      const backupFileName = `files_backup_${timestamp}.tar.gz`;
      const backupFilePath = path.join(this.backupDir, backupFileName);

      return new Promise((resolve, reject) => {
        const tar = spawn('tar', [
          '-czf',
          backupFilePath,
          '-C', path.dirname(this.uploadsDir),
          path.basename(this.uploadsDir)
        ]);

        tar.on('error', (error) => {
          logger.error('tar error:', error);
          reject(error);
        });

        tar.on('close', (code) => {
          if (code === 0) {
            logger.info(`Files backup created: ${backupFileName}`);
            resolve(backupFilePath);
          } else {
            reject(new Error(`tar exited with code ${code}`));
          }
        });
      });
    } catch (error) {
      logger.error('Files backup failed:', error);
      throw error;
    }
  }

  // Create full backup (database + files)
  async createFullBackup() {
    try {
      const [dbBackupPath, filesBackupPath] = await Promise.all([
        this.createDatabaseBackup(),
        this.createFilesBackup()
      ]);

      // Log backup statistics
      await this.logBackupStatistics();

      return {
        database: dbBackupPath,
        files: filesBackupPath,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Full backup failed:', error);
      throw error;
    }
  }

  // Log backup statistics to database
  async logBackupStatistics() {
    try {
      const stats = await this.getBackupStatistics();
      
      await query(`
        INSERT INTO backup_logs (
          backup_type, 
          file_count, 
          total_size_mb, 
          duration_seconds,
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [
        'automated',
        stats.fileCount,
        Math.round(stats.totalSizeMB * 100) / 100,
        stats.durationSeconds,
        'completed'
      ]);
    } catch (error) {
      logger.error('Failed to log backup statistics:', error);
    }
  }

  // Get backup directory statistics
  async getBackupStatistics() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => 
        file.endsWith('.sql') || file.endsWith('.tar.gz')
      );

      let totalSize = 0;
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return {
        fileCount: backupFiles.length,
        totalSizeMB: totalSize / (1024 * 1024),
        durationSeconds: 0 // This would be calculated during actual backup
      };
    } catch (error) {
      logger.error('Failed to get backup statistics:', error);
      return { fileCount: 0, totalSizeMB: 0, durationSeconds: 0 };
    }
  }

  // Cleanup old backup files
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.endsWith('.sql') || file.endsWith('.tar.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file)
        }));

      // Sort by creation time (newest first)
      const fileStats = await Promise.all(
        backupFiles.map(async (file) => {
          const stats = await fs.stat(file.path);
          return { ...file, mtime: stats.mtime };
        })
      );

      fileStats.sort((a, b) => b.mtime - a.mtime);

      // Remove files beyond maxBackups limit
      if (fileStats.length > this.maxBackups) {
        const filesToDelete = fileStats.slice(this.maxBackups);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          logger.info(`Deleted old backup: ${file.name}`);
        }

        logger.info(`Cleaned up ${filesToDelete.length} old backup files`);
      }
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
      throw error;
    }
  }

  // Manual backup creation
  async createManualBackup(userId, backupType = 'full') {
    try {
      const startTime = Date.now();
      let result;

      switch (backupType) {
        case 'database':
          result = { database: await this.createDatabaseBackup() };
          break;
        case 'files':
          result = { files: await this.createFilesBackup() };
          break;
        case 'full':
        default:
          result = await this.createFullBackup();
          break;
      }

      const duration = (Date.now() - startTime) / 1000;

      // Log manual backup
      await query(`
        INSERT INTO backup_logs (
          backup_type, 
          duration_seconds,
          status,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [
        `manual_${backupType}`,
        duration,
        'completed',
        userId
      ]);

      logger.info(`Manual backup created by user ${userId}, duration: ${duration}s`);
      return result;
    } catch (error) {
      // Log failed backup
      await query(`
        INSERT INTO backup_logs (
          backup_type, 
          status,
          error_message,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [
        `manual_${backupType}`,
        'failed',
        error.message,
        userId
      ]);

      logger.error('Manual backup failed:', error);
      throw error;
    }
  }

  // Restore database from backup
  async restoreDatabase(backupFilePath, userId) {
    try {
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'umroh_db',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
      };

      return new Promise((resolve, reject) => {
        const psql = spawn('psql', [
          '-h', dbConfig.host,
          '-p', dbConfig.port,
          '-U', dbConfig.username,
          '-d', dbConfig.database,
          '--no-password',
          '-f', backupFilePath
        ], {
          env: {
            ...process.env,
            PGPASSWORD: dbConfig.password
          }
        });

        psql.on('error', (error) => {
          logger.error('psql restore error:', error);
          reject(error);
        });

        psql.on('close', (code) => {
          if (code === 0) {
            logger.info(`Database restored from: ${backupFilePath} by user ${userId}`);
            resolve();
          } else {
            reject(new Error(`psql exited with code ${code}`));
          }
        });
      });
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw error;
    }
  }

  // Get backup history
  async getBackupHistory(limit = 50) {
    try {
      const result = await query(`
        SELECT 
          id,
          backup_type,
          file_count,
          total_size_mb,
          duration_seconds,
          status,
          error_message,
          created_by,
          created_at
        FROM backup_logs
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      logger.error('Failed to get backup history:', error);
      throw error;
    }
  }

  // Get available backup files
  async getAvailableBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.endsWith('.sql') || file.endsWith('.tar.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          type: file.endsWith('.sql') ? 'database' : 'files'
        }));

      const fileStats = await Promise.all(
        backupFiles.map(async (file) => {
          const stats = await fs.stat(file.path);
          return {
            ...file,
            size: stats.size,
            sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100,
            mtime: stats.mtime
          };
        })
      );

      fileStats.sort((a, b) => b.mtime - a.mtime);
      return fileStats;
    } catch (error) {
      logger.error('Failed to get available backups:', error);
      throw error;
    }
  }
}

module.exports = new BackupService();