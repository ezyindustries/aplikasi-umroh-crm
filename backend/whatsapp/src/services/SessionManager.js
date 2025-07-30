const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

class SessionManager {
  constructor() {
    this.sessionDir = path.join(__dirname, '../../session-backup');
    this.backupInterval = 5 * 60 * 1000; // 5 minutes
    this.wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
    this.isBackupRunning = false;
    
    this.ensureSessionDir();
    this.startPeriodicBackup();
  }

  async ensureSessionDir() {
    try {
      await fs.mkdir(this.sessionDir, { recursive: true });
      logger.info('Session backup directory created:', this.sessionDir);
    } catch (error) {
      logger.error('Failed to create session directory:', error);
    }
  }

  async backupSession(sessionName = 'default') {
    try {
      // Get session data from WAHA
      const response = await axios.get(`${this.wahaUrl}/api/${sessionName}`);
      const sessionData = response.data;

      if (sessionData && sessionData.status === 'WORKING') {
        const backupData = {
          sessionName,
          status: sessionData.status,
          me: sessionData.me,
          timestamp: new Date().toISOString(),
          backupVersion: '1.0'
        };

        const backupFile = path.join(this.sessionDir, `${sessionName}.json`);
        await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
        
        logger.info(`Session ${sessionName} backed up successfully`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to backup session ${sessionName}:`, error.message);
      return false;
    }
  }

  async restoreSession(sessionName = 'default') {
    try {
      const backupFile = path.join(this.sessionDir, `${sessionName}.json`);
      const backupData = await fs.readFile(backupFile, 'utf8');
      const sessionInfo = JSON.parse(backupData);

      logger.info(`Session backup found for ${sessionName}:`, {
        status: sessionInfo.status,
        backupTime: sessionInfo.timestamp,
        phone: sessionInfo.me?.id || 'Unknown'
      });

      return sessionInfo;
    } catch (error) {
      logger.warn(`No session backup found for ${sessionName}:`, error.message);
      return null;
    }
  }

  async startPeriodicBackup() {
    if (this.isBackupRunning) return;
    
    this.isBackupRunning = true;
    logger.info('Starting periodic session backup every 5 minutes');

    setInterval(async () => {
      try {
        await this.backupSession('default');
      } catch (error) {
        logger.error('Periodic backup failed:', error);
      }
    }, this.backupInterval);
  }

  async getSessionStatus(sessionName = 'default') {
    try {
      const response = await axios.get(`${this.wahaUrl}/api/${sessionName}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get session status:', error);
      return null;
    }
  }

  async waitForSession(sessionName = 'default', maxWaitTime = 60000) {
    const startTime = Date.now();
    logger.info(`Waiting for session ${sessionName} to be ready...`);

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getSessionStatus(sessionName);
      
      if (status && status.status === 'WORKING') {
        logger.info(`Session ${sessionName} is ready!`);
        return true;
      }

      if (status && status.status === 'FAILED') {
        logger.error(`Session ${sessionName} failed to start`);
        return false;
      }

      logger.info(`Session status: ${status?.status || 'Unknown'}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.warn(`Session ${sessionName} not ready after ${maxWaitTime}ms`);
    return false;
  }

  async startSessionWithRestore(sessionName = 'default') {
    try {
      // Check if backup exists
      const backupInfo = await this.restoreSession(sessionName);
      
      // Start session
      logger.info(`Starting WAHA session: ${sessionName}`);
      const startResponse = await axios.post(`${this.wahaUrl}/api/${sessionName}/start`, {
        webhookUrl: process.env.WEBHOOK_URL || 'http://host.docker.internal:3001/api/webhooks/waha'
      });

      if (startResponse.status === 200) {
        logger.info('Session start request sent successfully');
        
        // Wait for session to be ready
        const isReady = await this.waitForSession(sessionName);
        
        if (isReady) {
          logger.info('✅ Session restored and ready!');
          await this.backupSession(sessionName); // Create fresh backup
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Failed to start session with restore:', error);
      return false;
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.sessionDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const backupFile = path.join(this.sessionDir, file);
          const content = await fs.readFile(backupFile, 'utf8');
          const data = JSON.parse(content);
          backups.push({
            sessionName: data.sessionName,
            status: data.status,
            phone: data.me?.id || 'Unknown',
            timestamp: data.timestamp,
            file: file
          });
        }
      }

      return backups;
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }
}

module.exports = new SessionManager();