const express = require('express');
const { telegramAuth, adminAuth } = require('../middleware/telegramAuth');

const router = express.Router();

/**
 * GET /api/users
 * Returns all users (admin only)
 */
router.get('/', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        username: true,
        isAuthorized: true,
        isAdmin: true,
        createdAt: true
      }
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Adds a new authorized user (admin only)
 */
router.post('/', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { telegramId } = req.body;

    if (!telegramId || typeof telegramId !== 'string') {
      return res.status(400).json({ error: 'telegramId is required' });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (user) {
      // Update existing user to authorized
      user = await prisma.user.update({
        where: { telegramId },
        data: { isAuthorized: true }
      });
    } else {
      // Create new authorized user
      user = await prisma.user.create({
        data: {
          telegramId,
          isAuthorized: true,
          isAdmin: false
        }
      });
    }

    res.status(201).json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        isAuthorized: user.isAuthorized,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:telegramId
 * Removes user authorization (admin only)
 */
router.delete('/:telegramId', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { telegramId } = req.params;

    // Prevent self-removal
    if (telegramId === req.user.telegramId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove authorization (don't delete the user record)
    await prisma.user.update({
      where: { telegramId },
      data: {
        isAuthorized: false,
        isAdmin: false
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/:telegramId/admin
 * Promotes user to admin (admin only)
 */
router.post('/:telegramId/admin', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { telegramId } = req.params;

    const user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isAuthorized) {
      return res.status(400).json({ error: 'User must be authorized first' });
    }

    const updated = await prisma.user.update({
      where: { telegramId },
      data: { isAdmin: true }
    });

    res.json({
      user: {
        id: updated.id,
        telegramId: updated.telegramId,
        firstName: updated.firstName,
        lastName: updated.lastName,
        username: updated.username,
        isAuthorized: updated.isAuthorized,
        isAdmin: updated.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:telegramId/admin
 * Demotes admin to regular user (admin only)
 */
router.delete('/:telegramId/admin', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { telegramId } = req.params;

    // Prevent self-demotion
    if (telegramId === req.user.telegramId) {
      return res.status(400).json({ error: 'Cannot demote yourself' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { telegramId },
      data: { isAdmin: false }
    });

    res.json({
      user: {
        id: updated.id,
        telegramId: updated.telegramId,
        firstName: updated.firstName,
        lastName: updated.lastName,
        username: updated.username,
        isAuthorized: updated.isAuthorized,
        isAdmin: updated.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
