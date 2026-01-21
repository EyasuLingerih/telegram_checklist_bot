const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const telegramService = require('./telegramService');

const prisma = new PrismaClient();

class ReminderService {
  constructor() {
    this.jobs = new Map();
    this.timezone = 'Africa/Addis_Ababa';
  }

  /**
   * Initializes all scheduled reminder jobs from the database
   */
  async initialize() {
    // Stop all existing jobs first
    this.stopAll();

    try {
      // Load active schedules from database
      const schedules = await prisma.schedule.findMany({
        where: { isActive: true }
      });

      // Create cron jobs for each schedule
      for (const schedule of schedules) {
        this.createJob(schedule);
      }

      console.log(`Reminder service initialized with ${schedules.length} active schedules`);
    } catch (error) {
      console.error('Failed to initialize reminder service:', error);
    }
  }

  /**
   * Creates a cron job for a schedule
   */
  createJob(schedule) {
    const { id, dayOfWeek, hour, minute, description } = schedule;

    // Cron format: minute hour * * dayOfWeek
    const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;

    try {
      const job = cron.schedule(
        cronExpression,
        async () => {
          console.log(`Running scheduled reminder: ${description || cronExpression}`);
          await this.sendReminder();
        },
        {
          timezone: this.timezone,
          scheduled: true
        }
      );

      this.jobs.set(id, {
        job,
        schedule,
        cronExpression
      });

      console.log(`Created reminder job: ${this.getDayName(dayOfWeek)} ${hour}:${String(minute).padStart(2, '0')} (${cronExpression})`);
    } catch (error) {
      console.error(`Failed to create job for schedule ${id}:`, error);
    }
  }

  /**
   * Sends reminders to all authorized users
   */
  async sendReminder() {
    try {
      console.log('=== Sending Scheduled Reminder ===');

      // Reset all checklist items to uncompleted
      await prisma.checklistItem.updateMany({
        data: { completed: false }
      });
      console.log('Checklist items reset');

      // Get all authorized users
      const users = await prisma.user.findMany({
        where: { isAuthorized: true }
      });
      console.log(`Found ${users.length} authorized users`);

      // Get current checklist items
      const items = await prisma.checklistItem.findMany({
        orderBy: { order: 'asc' }
      });

      if (items.length === 0) {
        console.log('No checklist items to send');
        return;
      }

      // Create inline keyboard for the bot message
      const keyboard = items.map(item => [{
        text: `⬜ ${item.text}`,
        callback_data: `toggle_${item.id}`
      }]);

      // Send to all authorized users
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          await telegramService.sendMessage(
            user.telegramId,
            '🔔 መስራታችውን እባክህ አረጋግጥ', // "Please verify our work" in Amharic
            { reply_markup: { inline_keyboard: keyboard } }
          );
          successCount++;
          console.log(`Reminder sent to user ${user.telegramId}`);
        } catch (error) {
          failCount++;
          console.error(`Failed to send reminder to ${user.telegramId}:`, error.message);
        }
      }

      console.log(`Reminder complete: ${successCount} sent, ${failCount} failed`);
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  /**
   * Returns info about all scheduled jobs
   */
  getScheduledJobs() {
    const jobs = [];
    for (const [id, { schedule, cronExpression }] of this.jobs) {
      jobs.push({
        id,
        dayOfWeek: schedule.dayOfWeek,
        dayName: this.getDayName(schedule.dayOfWeek),
        time: `${schedule.hour}:${String(schedule.minute).padStart(2, '0')}`,
        cronExpression,
        description: schedule.description,
        timezone: this.timezone
      });
    }
    return jobs;
  }

  /**
   * Converts day number to day name
   */
  getDayName(day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
  }

  /**
   * Stops all scheduled jobs
   */
  stopAll() {
    for (const [id, { job }] of this.jobs) {
      job.stop();
    }
    this.jobs.clear();
    console.log('All reminder jobs stopped');
  }
}

module.exports = new ReminderService();
