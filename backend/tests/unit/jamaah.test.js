// Unit tests for jamaah operations
const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup');

describe('Jamaah API', () => {
  let server;
  let authToken;
  
  beforeAll(async () => {
    await setupTestDatabase();
    server = app.listen(0);
    
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testadmin',
        password: 'testpass123'
      });
    
    authToken = loginResponse.body.token;
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
    if (server) {
      server.close();
    }
  });

  describe('GET /api/jamaah', () => {
    test('should get jamaah list with valid token', async () => {
      const response = await request(app)
        .get('/api/jamaah')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.jamaah)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/jamaah');

      expect(response.status).toBe(401);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/jamaah?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.offset).toBe(0);
    });

    test('should support search', async () => {
      const response = await request(app)
        .get('/api/jamaah?search=Test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/jamaah', () => {
    const validJamaahData = {
      full_name: 'New Test Jamaah',
      nik: '9876543210123456',
      passport_number: 'B987654321',
      birth_date: '1985-06-15',
      gender: 'Perempuan',
      phone: '081987654321',
      email: 'newjamaah@test.com',
      address: 'Test Address 123',
      package_id: 1
    };

    test('should create jamaah with valid data', async () => {
      const response = await request(app)
        .post('/api/jamaah')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validJamaahData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.jamaah).toBeDefined();
      expect(response.body.jamaah.full_name).toBe(validJamaahData.full_name);
    });

    test('should reject duplicate NIK', async () => {
      const duplicateData = {
        ...validJamaahData,
        nik: '1234567890123456', // Existing NIK from test data
        passport_number: 'C123456789'
      };

      const response = await request(app)
        .post('/api/jamaah')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('NIK');
    });

    test('should reject invalid NIK format', async () => {
      const invalidData = {
        ...validJamaahData,
        nik: '123', // Invalid NIK
        passport_number: 'D123456789'
      };

      const response = await request(app)
        .post('/api/jamaah')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject missing required fields', async () => {
      const incompleteData = {
        full_name: 'Incomplete Jamaah'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/jamaah')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid email format', async () => {
      const invalidEmailData = {
        ...validJamaahData,
        email: 'invalid-email-format',
        nik: '5555555555555555',
        passport_number: 'E123456789'
      };

      const response = await request(app)
        .post('/api/jamaah')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEmailData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/jamaah/:id', () => {
    test('should get jamaah by valid ID', async () => {
      const response = await request(app)
        .get('/api/jamaah/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.jamaah).toBeDefined();
      expect(response.body.jamaah.id).toBe(1);
    });

    test('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/api/jamaah/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid ID format', async () => {
      const response = await request(app)
        .get('/api/jamaah/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/jamaah/:id', () => {
    const updateData = {
      full_name: 'Updated Test Jamaah',
      phone: '081999888777',
      address: 'Updated Address 456'
    };

    test('should update jamaah with valid data', async () => {
      const response = await request(app)
        .put('/api/jamaah/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.jamaah.full_name).toBe(updateData.full_name);
    });

    test('should return 404 for non-existent jamaah', async () => {
      const response = await request(app)
        .put('/api/jamaah/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });

    test('should reject invalid update data', async () => {
      const invalidData = {
        nik: '123' // Invalid NIK format
      };

      const response = await request(app)
        .put('/api/jamaah/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/jamaah/:id', () => {
    test('should delete jamaah (soft delete)', async () => {
      // First create a jamaah to delete
      const createResponse = await request(app)
        .post('/api/jamaah')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          full_name: 'To Be Deleted',
          nik: '7777777777777777',
          passport_number: 'F123456789',
          birth_date: '1990-01-01',
          gender: 'Laki-laki',
          phone: '081777777777',
          email: 'delete@test.com',
          package_id: 1
        });

      const jamaahId = createResponse.body.jamaah.id;

      const deleteResponse = await request(app)
        .delete(`/api/jamaah/${jamaahId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify jamaah is soft deleted (still exists but marked as deleted)
      const getResponse = await request(app)
        .get(`/api/jamaah/${jamaahId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404); // Should not be found in normal queries
    });

    test('should return 404 for non-existent jamaah', async () => {
      const response = await request(app)
        .delete('/api/jamaah/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});