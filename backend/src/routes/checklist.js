const express = require('express');
const { telegramAuth, adminAuth } = require('../middleware/telegramAuth');

const router = express.Router();

/**
 * GET /api/checklist
 * Returns all checklist items
 */
router.get('/', telegramAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const items = await prisma.checklistItem.findMany({
      orderBy: { order: 'asc' }
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checklist
 * Creates a new checklist item (admin only)
 */
router.post('/', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get the highest order number
    const lastItem = await prisma.checklistItem.findFirst({
      orderBy: { order: 'desc' }
    });

    const newOrder = (lastItem?.order ?? -1) + 1;

    const item = await prisma.checklistItem.create({
      data: {
        text: text.trim(),
        completed: false,
        order: newOrder
      }
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/checklist/:id/toggle
 * Toggles the completion status of a checklist item
 */
router.patch('/:id/toggle', telegramAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Get current item
    const current = await prisma.checklistItem.findUnique({
      where: { id }
    });

    if (!current) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Toggle completion
    const item = await prisma.checklistItem.update({
      where: { id },
      data: { completed: !current.completed }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/checklist/:id
 * Deletes a checklist item (admin only)
 */
router.delete('/:id', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    await prisma.checklistItem.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/checklist/reset
 * Resets all items to uncompleted (admin only or scheduler)
 */
router.post('/reset', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    await prisma.checklistItem.updateMany({
      data: { completed: false }
    });

    res.json({ success: true, message: 'All items reset to uncompleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/checklist/:id
 * Updates a checklist item text (admin only)
 */
router.patch('/:id', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const id = parseInt(req.params.id, 10);
    const { text } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const item = await prisma.checklistItem.update({
      where: { id },
      data: { text: text.trim() }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
