const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_super_secret_jwt_key_2026';

// Verify User Token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

// Enforce Role Permissions
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles.` 
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, JWT_SECRET };