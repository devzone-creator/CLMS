import { expect } from 'chai';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { sequelize } from '../config/db.js';

describe('User Model', () => {
  // Setup test database
  before(async () => {
    await sequelize.sync({ force: true });
  });

  // Clean up after each test
  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  // Close database connection after tests
  after(async () => {
    await sequelize.close();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'STAFF',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = await User.create(userData);

      expect(user.id).to.exist;
      expect(user.email).to.equal('test@example.com');
      expect(user.role).to.equal('STAFF');
      expect(user.firstName).to.equal('John');
      expect(user.lastName).to.equal('Doe');
      expect(user.password).to.not.equal('password123'); // Should be hashed
    });

    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = await User.create(userData);
      const isHashed = await bcrypt.compare('password123', user.password);
      
      expect(isHashed).to.be.true;
      expect(user.password).to.not.equal('password123');
    });

    it('should set default role to STAFF', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = await User.create(userData);
      expect(user.role).to.equal('STAFF');
    });
  });

  describe('User Validation', () => {
    it('should require email', async () => {
      const userData = {
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].message).to.include('Email is required');
      }
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].message).to.include('valid email address');
      }
    });

    it('should require unique email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      await User.create(userData);

      try {
        await User.create(userData);
        expect.fail('Should have thrown unique constraint error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeUniqueConstraintError');
      }
    });

    it('should require password', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].message).to.include('Password is required');
      }
    });

    it('should validate password length', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].message).to.include('between 6 and 100 characters');
      }
    });

    it('should validate role enum', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'INVALID_ROLE',
        firstName: 'John',
        lastName: 'Doe'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].message).to.include('ADMIN, STAFF, or AUDITOR');
      }
    });

    it('should require firstName', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        lastName: 'Doe'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].message).to.include('First name is required');
      }
    });

    it('should require lastName', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].message).to.include('Last name is required');
      }
    });

    it('should validate firstName length', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'J',
        lastName: 'Doe'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].message).to.include('between 2 and 50 characters');
      }
    });
  });

  describe('User Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      });
    });

    it('should check password correctly', async () => {
      const isValid = await user.checkPassword('password123');
      const isInvalid = await user.checkPassword('wrongpassword');

      expect(isValid).to.be.true;
      expect(isInvalid).to.be.false;
    });

    it('should return full name', () => {
      const fullName = user.getFullName();
      expect(fullName).to.equal('John Doe');
    });
  });

  describe('User Class Methods', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      });
    });

    it('should find user by email', async () => {
      const user = await User.findByEmail('test@example.com');
      expect(user).to.exist;
      expect(user.email).to.equal('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await User.findByEmail('nonexistent@example.com');
      expect(user).to.be.null;
    });
  });

  describe('Password Update', () => {
    it('should hash password when updated', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      });

      const originalPassword = user.password;
      
      await user.update({ password: 'newpassword123' });
      
      expect(user.password).to.not.equal(originalPassword);
      expect(user.password).to.not.equal('newpassword123');
      
      const isValid = await user.checkPassword('newpassword123');
      expect(isValid).to.be.true;
    });
  });

  describe('Role Management', () => {
    it('should create ADMIN user', async () => {
      const user = await User.create({
        email: 'admin@example.com',
        password: 'password123',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User'
      });

      expect(user.role).to.equal('ADMIN');
    });

    it('should create AUDITOR user', async () => {
      const user = await User.create({
        email: 'auditor@example.com',
        password: 'password123',
        role: 'AUDITOR',
        firstName: 'Auditor',
        lastName: 'User'
      });

      expect(user.role).to.equal('AUDITOR');
    });
  });
});