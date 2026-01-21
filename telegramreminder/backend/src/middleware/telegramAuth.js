const jwt = require('jsonwebtoken');
const { validateTelegramInitData, parseInitData, isAuthDateValid } = require('../utils/validateInitData');

/**
 * Middleware to authenticate requests using JWT or Telegram initData
 */
async function telegramAuth(req, res, next) {
  const prisma = req.app.get('prisma');

  try {
    // Check for JWT token first (for subsequent requests)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from database to ensure they still exist and are authorized
        const user = await prisma.user.findUnique({
          where: { telegramId: decoded.telegramId }
        });

        if (!user || !user.isAuthorized) {
          return res.status(401).json({ error: 'User not authorized' });
        }

        req.user = {
          id: user.id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          isAdmin: user.isAdmin,
          isAuthorized: user.isAuthorized
        };
        return next();
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // No auth provided
    return res.status(401).json({ error: 'No authentication provided' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to check if user is admin
 */
function adminAuth(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { telegramAuth, adminAuth };
