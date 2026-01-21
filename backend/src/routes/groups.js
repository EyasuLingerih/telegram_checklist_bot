const express = require('express');
const { telegramAuth, adminAuth } = require('../middleware/telegramAuth');

const router = express.Router();

/**
 * GET /api/groups
 * Returns all groups
 */
router.get('/', telegramAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const groups = await prisma.group.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ groups });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups
 * Creates a new group (admin only)
 */
router.post('/', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { name, contactName, phone, telegramId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (!contactName || typeof contactName !== 'string') {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        telegramId: telegramId?.trim() || null
      }
    });

    res.status(201).json({ group });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/:id
 * Returns a single group
 */
router.get('/:id', telegramAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/groups/:id
 * Updates a group (admin only)
 */
router.patch('/:id', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { id } = req.params;
    const { name, contactName, phone, telegramId } = req.body;

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid group name' });
      }
      updateData.name = name.trim();
    }

    if (contactName !== undefined) {
      if (typeof contactName !== 'string') {
        return res.status(400).json({ error: 'Invalid contact name' });
      }
      updateData.contactName = contactName.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ error: 'Invalid phone number' });
      }
      updateData.phone = phone.trim();
    }

    if (telegramId !== undefined) {
      updateData.telegramId = telegramId?.trim() || null;
    }

    const group = await prisma.group.update({
      where: { id },
      data: updateData
    });

    res.json({ group });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/groups/:id
 * Deletes a group (admin only)
 */
router.delete('/:id', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { id } = req.params;

    await prisma.group.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
