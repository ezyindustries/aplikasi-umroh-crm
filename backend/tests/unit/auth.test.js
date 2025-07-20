// Unit tests for authentication
const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup');

describe('Authentication API', () => {
  let server;
  
  beforeAll(async () => {
    await setupTestDatabase();
    server = app.listen(0); // Use random available port
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
    if (server) {
      server.close();
    }
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testadmin');
      expect(response.body.user.role).toBe('Admin');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    test('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin'
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'testpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });
      
      authToken = loginResponse.body.token;
    });

    test('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    test('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Token validation', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });
      
      authToken = loginResponse.body.token;
    });

    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/jamaah')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).not.toBe(401);
    });

    test('should reject protected route without token', async () => {
      const response = await request(app)
        .get('/api/jamaah');

      expect(response.status).toBe(401);
    });

    test('should reject protected route with malformed token', async () => {
      const response = await request(app)
        .get('/api/jamaah')
        .set('Authorization', 'InvalidToken');

      expect(response.status).toBe(401);
    });
  });
});