const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dataService = require('./dataService');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    // JWT secret - in production, this should be in environment variables
    this.jwtSecret = process.env.JWT_SECRET || 'graphic-walker-secret-key-2024';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.saltRounds = 12;
  }

  // Hash password
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      logger.error('Failed to hash password', { error: error.message });
      throw new Error('Password hashing failed');
    }
  }

  // Verify password
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Failed to verify password', { error: error.message });
      throw new Error('Password verification failed');
    }
  }

  // Generate JWT token
  generateToken(user) {
    try {
      const payload = {
        userId: user.id,
        email: user.email,
        name: user.name
      };

      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
        issuer: 'graphic-walker-app',
        subject: user.id
      });
    } catch (error) {
      logger.error('Failed to generate JWT token', { userId: user.id, error: error.message });
      throw new Error('Token generation failed');
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.error('Failed to verify JWT token', { error: error.message });
      throw new Error('Invalid token');
    }
  }

  // Register new user
  async register(userData) {
    const { email, password, name } = userData;
    
    logger.info('Attempting user registration', { email, name });

    try {
      // Validate input
      if (!email || !password || !name) {
        throw new Error('Email, password, and name are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if user already exists
      const existingUser = await dataService.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const user = await dataService.createUser({
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim()
      });

      // Generate token
      const token = this.generateToken(user);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        token
      };
    } catch (error) {
      logger.error('User registration failed', { email, error: error.message });
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    const { email, password } = credentials;
    
    logger.info('Attempting user login', { email });

    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Get user by email
      const user = await dataService.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await dataService.updateUserLastLogin(user.id);

      // Generate token
      const token = this.generateToken(user);

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastLoginAt: new Date().toISOString()
        },
        token
      };
    } catch (error) {
      logger.error('User login failed', { email, error: error.message });
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId) {
    logger.debug('Fetching user profile', { userId });

    try {
      const user = await dataService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      logger.error('Failed to fetch user profile', { userId, error: error.message });
      throw error;
    }
  }

  // Validate token and get user
  async validateTokenAndGetUser(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await this.getProfile(decoded.userId);
      return user;
    } catch (error) {
      logger.error('Token validation failed', { error: error.message });
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
