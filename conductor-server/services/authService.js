import { OAuth2Client } from 'google-auth-library';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:3000/api/auth/google/callback`
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/conductor',
});

// JWT secret key from environment variable
// ⚠️ Security: In production, JWT_SECRET must be set via environment variable
// Generate a secure secret: openssl rand -base64 32
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('JWT_SECRET must be set in production environment');
      })()
    : 'dev-jwt-secret-change-in-production');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days default

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with id, email, name, role
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token and return decoded user info
 * @param {string} token - JWT token
 * @returns {Object} Decoded user payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const login = async (loginData) => {
  const { email, password } = loginData;
  const query = 'SELECT user_id, name, email, password, role FROM users WHERE email = $1';

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const result = await pool.query(query, [email]);
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  const loginUserData = {
    id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(loginUserData);

  return {
    ...loginUserData,
    token,
  };
};

export const register = async (userData) => {
  const { name, email, password, role } = userData;

  const checkQuery = 'SELECT user_id FROM users WHERE email = $1';
  const checkResult = await pool.query(checkQuery, [email]);
  if (checkResult.rows.length > 0) {
    throw new Error('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `INSERT INTO users (name, email, password, role)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id, name, email, role`;
  const values = [name, email, hashedPassword, role];
  const result = await pool.query(query, values);

  console.log('Registered user:', result.rows[0]);

  const registerUserData = {
    id: result.rows[0].user_id,
    name: result.rows[0].name,
    email: result.rows[0].email,
    role: result.rows[0].role,
  };

  const token = generateToken(registerUserData);

  return {
    ...registerUserData,
    token,
  };
};

export const generateAuthUrl = () => {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
  });
};

export const getUserFromCode = async (code) => {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  console.log('Google user payload:', payload);

  try {
    const res = await pool.query(
      'SELECT user_id, name, email, profile_photo FROM users WHERE email = $1',
      [payload.email]
    );

    // If user already exists:
    if (res.rows.length > 0) {
      console.log('User already exists in database:', res.rows[0]);

      const existingGoogleUserData = {
        id: res.rows[0].user_id,
        name: res.rows[0].name,
        email: res.rows[0].email,
        picture: res.rows[0].profile_photo,
        role: null,
      };

      const token = generateToken(existingGoogleUserData);

      return {
        ...existingGoogleUserData,
        token,
      };
    }

    // Insert new Google user:
    const query = `INSERT INTO users (name, email, profile_photo)
                   VALUES ($1, $2, $3)
                   RETURNING user_id, name, email, profile_photo`;
    const values = [payload.name, payload.email, payload.picture];
    const result = await pool.query(query, values);

    console.log('Inserted user into database:', result.rows[0]);

    const newGoogleUserData = {
      id: result.rows[0].user_id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      picture: result.rows[0].profile_photo,
      role: null,
    };

    const token = generateToken(newGoogleUserData);

    return {
      ...newGoogleUserData,
      token,
    };
  } catch (error) {
    console.error('Error inserting user into database:', error);
  }
};
