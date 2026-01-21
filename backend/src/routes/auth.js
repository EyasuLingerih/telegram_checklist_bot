const express = require('express');
const jwt = require('jsonwebtoken');
const { validateTelegramInitData, parseInitData, isAuthDateValid } = require('../utils/validateInitData');

const router = express.Router();

/**
 * POST /api/auth/validate
 * Validates Telegram initData and returns a JWT token
 */
router.post('/validate', async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }

    // Validate the initData signature
    if (!validateTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN)) {
      return res.status(401).json({ error: 'Invalid initData signature' });
    }

    // Parse the initData
    const parsed = parseInitData(initData);

    if (!parsed.user) {
      return res.status(400).json({ error: 'User data not found in initData' });
    }

    // Check if auth date is valid (within 24 hours)
    if (!isAuthDateValid(parsed.authDate)) {
      return res.status(401).json({ error: 'initData has expired' });
    }

    const telegramId = String(parsed.user.id);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) {
      // Create new user (not authorized by default)
      user = await prisma.user.create({
        data: {
          telegramId,
          firstName: parsed.user.first_name,
          lastName: parsed.user.last_name,
          username: parsed.user.username,
          isAuthorized: false,
          isAdmin: false
        }
      });
    } else {
      // Update user info from Telegram
      user = await prisma.user.update({
        where: { telegramId },
        data: {
          firstName: parsed.user.first_name,
          lastName: parsed.user.last_name,
          username: parsed.user.username
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        telegramId: user.telegramId,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        isAdmin: user.isAdmin,
        isAuthorized: user.isAuthorized
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Returns the current user's info (requires authentication)
 */
router.get('/me', async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { telegramId: decoded.telegramId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        isAdmin: user.isAdmin,
        isAuthorized: user.isAuthorized
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
