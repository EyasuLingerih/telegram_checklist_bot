/**
 * Migration script to migrate data from JSON files to PostgreSQL database
 *
 * Usage: OLD_DATA_PATH=./path/to/json/files node scripts/migrate-json.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Path to existing JSON files
const DATA_PATH = process.env.OLD_DATA_PATH || path.join(__dirname, '../../..');

function readJsonFile(filename) {
  const filePath = path.join(DATA_PATH, filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }
  return null;
}

async function migrateData() {
  console.log('========================================');
  console.log('Starting migration from JSON to PostgreSQL');
  console.log(`Data path: ${DATA_PATH}`);
  console.log('========================================\n');

  try {
    // 1. Migrate Admin Users
    console.log('1. Migrating admin users...');
    const adminUsers = readJsonFile('admin_users.json');

    if (adminUsers && Array.isArray(adminUsers)) {
      for (const telegramId of adminUsers) {
        await prisma.user.upsert({
          where: { telegramId: String(telegramId) },
          update: { isAdmin: true, isAuthorized: true },
          create: {
            telegramId: String(telegramId),
            isAdmin: true,
            isAuthorized: true
          }
        });
        console.log(`   + Admin user ${telegramId} migrated`);
      }
    } else {
      console.log('   - No admin_users.json found or invalid format');
    }

    // 2. Migrate Authorized Users
    console.log('\n2. Migrating authorized users...');
    const authorizedUsers = readJsonFile('authorized_users.json');

    if (authorizedUsers && Array.isArray(authorizedUsers)) {
      for (const telegramId of authorizedUsers) {
        const isAdmin = adminUsers?.includes(telegramId) || adminUsers?.includes(String(telegramId));
        await prisma.user.upsert({
          where: { telegramId: String(telegramId) },
          update: { isAuthorized: true },
          create: {
            telegramId: String(telegramId),
            isAuthorized: true,
            isAdmin
          }
        });
        console.log(`   + User ${telegramId} migrated`);
      }
    } else {
      console.log('   - No authorized_users.json found or invalid format');
    }

    // 3. Migrate Checklist Items
    console.log('\n3. Migrating checklist items...');
    const checklist = readJsonFile('checklist.json');

    if (checklist && Array.isArray(checklist)) {
      // Clear existing items
      await prisma.checklistItem.deleteMany({});

      for (let i = 0; i < checklist.length; i++) {
        const item = checklist[i];
        await prisma.checklistItem.create({
          data: {
            text: item.text,
            completed: item.completed || false,
            order: i
          }
        });
        console.log(`   + Item "${item.text}" migrated`);
      }
    } else {
      console.log('   - No checklist.json found or invalid format');
    }

    // 4. Migrate Groups
    console.log('\n4. Migrating groups...');
    const groups = readJsonFile('groups.json');

    if (groups && typeof groups === 'object') {
      for (const [groupName, details] of Object.entries(groups)) {
        await prisma.group.upsert({
          where: { name: groupName },
          update: {
            contactName: details.name || '',
            phone: details.phone || '',
            telegramId: details.telegram_id || null
          },
          create: {
            name: groupName,
            contactName: details.name || '',
            phone: details.phone || '',
            telegramId: details.telegram_id || null
          }
        });
        console.log(`   + Group "${groupName}" migrated`);
      }
    } else {
      console.log('   - No groups.json found or invalid format');
    }

    // 5. Seed Default Schedules (matching the original bot)
    console.log('\n5. Seeding default schedules...');
    const defaultSchedules = [
      { dayOfWeek: 2, hour: 18, minute: 10, description: 'Tuesday 6:10 PM' },
      { dayOfWeek: 3, hour: 18, minute: 10, description: 'Wednesday 6:10 PM' },
      { dayOfWeek: 4, hour: 18, minute: 10, description: 'Thursday 6:10 PM' },
      { dayOfWeek: 0, hour: 8, minute: 10, description: 'Sunday 8:10 AM' },
      { dayOfWeek: 0, hour: 10, minute: 40, description: 'Sunday 10:40 AM' },
      { dayOfWeek: 0, hour: 15, minute: 40, description: 'Sunday 3:40 PM' },
    ];

    for (const schedule of defaultSchedules) {
      await prisma.schedule.upsert({
        where: {
          dayOfWeek_hour_minute: {
            dayOfWeek: schedule.dayOfWeek,
            hour: schedule.hour,
            minute: schedule.minute
          }
        },
        update: {},
        create: schedule
      });
      console.log(`   + Schedule "${schedule.description}" created`);
    }

    // 6. Create App Config
    console.log('\n6. Creating app configuration...');
    await prisma.appConfig.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        timezone: 'Africa/Addis_Ababa',
        settings: {}
      }
    });
    console.log('   + App config created');

    // Print summary
    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================\n');

    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    const itemCount = await prisma.checklistItem.count();
    const groupCount = await prisma.group.count();
    const scheduleCount = await prisma.schedule.count();

    console.log('Summary:');
    console.log(`   Users: ${userCount} (${adminCount} admins)`);
    console.log(`   Checklist Items: ${itemCount}`);
    console.log(`   Groups: ${groupCount}`);
    console.log(`   Schedules: ${scheduleCount}`);

  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
