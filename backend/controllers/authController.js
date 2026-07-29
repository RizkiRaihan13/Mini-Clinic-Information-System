const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../middleware/responseHandler');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 'Username and password are required', {
        username: !username ? 'Username is required' : undefined,
        password: !password ? 'Password is required' : undefined,
      });
    }

    const userResult = await pool.query(
      'SELECT id, username, password_hash, full_name, role FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rowCount === 0) {
      return sendError(res, 'Invalid username or password', { auth: 'Invalid credentials' }, 401);
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return sendError(res, 'Invalid username or password', { auth: 'Invalid credentials' }, 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_mini_clinic_2026',
      { expiresIn: '24h' }
    );

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Internal server error', { server: error.message }, 500);
  }
};

const logout = async (req, res) => {
  try {
    return sendSuccess(res, 'Logout successful', {});
  } catch (error) {
    return sendError(res, 'Error during logout', { server: error.message }, 500);
  }
};

module.exports = {
  login,
  logout,
};
