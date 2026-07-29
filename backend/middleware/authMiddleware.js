const jwt = require('jsonwebtoken');
const { sendError } = require('./responseHandler');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access token is missing or invalid', { auth: 'Token required' }, 401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_mini_clinic_2026', (err, user) => {
    if (err) {
      return sendError(res, 'Invalid or expired token', { auth: 'Token invalid or expired' }, 403);
    }
    req.user = user;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        'Forbidden: You do not have permission to access this resource',
        { role: `Role '${req.user?.role}' is not authorized` },
        403
      );
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
