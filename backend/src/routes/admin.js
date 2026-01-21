const express = require('express');
const { telegramAuth, adminAuth } = require('../middleware/telegramAuth');
const reminderService = require('../services/reminderService');

const router = express.Router();

/**
 * GET /api/admin/schedules
 * Returns all scheduled reminder jobs
 */
router.get('/schedules', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    // Get schedules from database
    const schedules = await prisma.schedule.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { hour: 'asc' },
        { minute: 'asc' }
      ]
    });

    // Get active jobs from reminder service
    const activeJobs = reminderService.getScheduledJobs();

    res.json({
      schedules,
      activeJobs,
      timezone: 'Africa/Addis_Ababa'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/schedules
 * Creates a new schedule (admin only)
 */
router.post('/schedules', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { dayOfWeek, hour, minute, description } = req.body;

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'dayOfWeek must be 0-6 (Sunday=0)' });
    }

    if (hour === undefined || hour < 0 || hour > 23) {
      return res.status(400).json({ error: 'hour must be 0-23' });
    }

    if (minute === undefined || minute < 0 || minute > 59) {
      return res.status(400).json({ error: 'minute must be 0-59' });
    }

    const schedule = await prisma.schedule.create({
      data: {
        dayOfWeek: parseInt(dayOfWeek, 10),
        hour: parseInt(hour, 10),
        minute: parseInt(minute, 10),
        description: description || null,
        isActive: true
      }
    });

    // Reinitialize reminder service to pick up new schedule
    await reminderService.initialize();

    res.status(201).json({ schedule });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/schedules/:id
 * Deletes a schedule (admin only)
 */
router.delete('/schedules/:id', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { id } = req.params;

    await prisma.schedule.delete({
      where: { id }
    });

    // Reinitialize reminder service
    await reminderService.initialize();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/schedules/:id/toggle
 * Toggles a schedule's active status
 */
router.patch('/schedules/:id/toggle', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const { id } = req.params;

    const current = await prisma.schedule.findUnique({
      where: { id }
    });

    if (!current) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: { isActive: !current.isActive }
    });

    // Reinitialize reminder service
    await reminderService.initialize();

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stats
 * Returns system statistics
 */
router.get('/stats', telegramAuth, adminAuth, async (req, res, next) => {
  const prisma = req.app.get('prisma');

  try {
    const [
      totalUsers,
      authorizedUsers,
      adminUsers,
      totalItems,
      completedItems,
      totalGroups,
      activeSchedules
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isAuthorized: true } }),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.checklistItem.count(),
      prisma.checklistItem.count({ where: { completed: true } }),
      prisma.group.count(),
      prisma.schedule.count({ where: { isActive: true } })
    ]);

    res.json({
      users: {
        total: totalUsers,
        authorized: authorizedUsers,
        admins: adminUsers
      },
      checklist: {
        total: totalItems,
        completed: completedItems,
        pending: totalItems - completedItems
      },
      groups: totalGroups,
      schedules: activeSchedules
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/send-reminder
 * Manually triggers a reminder (admin only)
 */
router.post('/send-reminder', telegramAuth, adminAuth, async (req, res, next) => {
  try {
    await reminderService.sendReminder();
    res.json({ success: true, message: 'Reminder sent to all authorized users' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
