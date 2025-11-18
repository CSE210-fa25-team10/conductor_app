import { OAuth2Client } from 'google-auth-library';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
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
  return {
    id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export const register = async (userData) => {
  const { name, email, password, role } = userData;
  // check to see if the email exists, if so, throw an error
  const checkQuery = 'SELECT user_id FROM users WHERE email = $1';
  const checkResult = await pool.query(checkQuery, [email]);
  if (checkResult.rows.length > 0) {
    throw new Error('Email already exists');
  }
  // hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10);
  // Insert user into the database
  const query = `INSERT INTO users (name, email, password, role)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id, name, email, role`;
  const values = [name, email, hashedPassword, role];
  const result = await pool.query(query, values);
  console.log('Registered user:', result.rows[0]);
  return {
    id: result.rows[0].user_id,
    name: result.rows[0].name,
    email: result.rows[0].email,
    role: result.rows[0].role,
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
    // make sure it is not already in the database
    const res = await pool.query(
      'SELECT user_id, name, email, profile_photo FROM users WHERE email = $1',
      [payload.email]
    );
    if (res.rows.length > 0) {
      console.log('User already exists in database:', res.rows[0]);
      return {
        id: res.rows[0].user_id,
        name: res.rows[0].name,
        email: res.rows[0].email,
        picture: res.rows[0].profile_photo,
      };
    }
    // insert the name, email, and profile photo into the users table
    const query = `INSERT INTO users (name, email, profile_photo)
                   VALUES ($1, $2, $3)
                   RETURNING user_id, name, email, profile_photo`;
    const values = [payload.name, payload.email, payload.picture];
    const result = await pool.query(query, values);
    console.log('Inserted user into database:', result.rows[0]);
    return {
      id: result.rows[0].user_id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      picture: result.rows[0].profile_photo,
    };
  } catch (error) {
    console.error('Error inserting user into database:', error);
  }
};
