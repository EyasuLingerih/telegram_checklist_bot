import asyncio
import logging
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, CallbackQueryHandler
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from datetime import datetime, time
import pytz
import json
import os
if os.name == 'nt':  # For Windows
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ReminderBot:
    def __init__(self, token):
        self.token = token
        self.admin_users = self.load_data('admin_users.json', default=[])
        self.authorized_users = self.load_data('authorized_users.json', default=[])
        self.checklist = self.load_data('checklist.json', default=[])
        default_groups = {
            "south": {
                "users": [],
                "schedules": [
                    {"day": 1, "hour": 18, "minute": 10},  # Tuesday 6:10 PM
                    {"day": 6, "hour": 8, "minute": 10},   # Sunday 8:10 AM
                ]
            },
            "west": {
                "users": [],
                "schedules": [
                    {"day": 2, "hour": 18, "minute": 10},  # Wednesday 6:10 PM
                    {"day": 6, "hour": 10, "minute": 40},  # Sunday 10:40 AM
                ]
            },
             "east": {
                "users": [],
                "schedules": [
                    {"day": 3, "hour": 18, "minute": 10},  # Turesday 6:10 PM
                    {"day": 6, "hour": 15, "minute": 40},  # Sunday 10:40 AM
                ]
            }
        }
        self.user_groups = self.load_data('user_groups.json', default=default_groups)
        print(f"Initialized user_groups: {self.user_groups}")  # Debug print
    def load_data(self, filename, default):
        try:
            print(f"Loading {filename}...")  # Debug print
            if os.path.exists(filename):
                with open(filename, 'r') as f:
                     data = json.load(f)
                     print(f"Loaded data: {data}")  # Debug print
                     return data
            print(f"File not found, using default: {default}")  # Debug print    
            return default
        except Exception as e:
            logger.error(f"Error loading {filename}: {e}")
            return default

    def save_data(self, filename, data):
        try:
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Saved data to {filename}: {data}")
        except Exception as e:
            print(f"Error saving {filename}: {e}")

    def is_authorized(self, user_id):
        return str(user_id) in self.authorized_users

    def is_admin(self, user_id):
        return str(user_id) in self.admin_users

    def create_checklist_keyboard(self):
        print("Creating new keyboard")
        keyboard = []
        for i, item in enumerate(self.checklist):
            status = item.get('completed', False)
            mark = "✅" if status else "⬜"
            button_text = f"{mark} {item['text']}"
            print(f"Creating button {i}: {button_text} (completed: {status})")
            keyboard.append([
                InlineKeyboardButton(
                    text=button_text,
                    callback_data=f"toggle_{i}"
                )
            ])
        return InlineKeyboardMarkup(keyboard)

    async def schedule_fixed_reminders(self, job_queue, chat_id: int):
        """Schedule reminders for specific days and times."""
        try:
            print(f"\nSetting up fixed schedules for chat_id: {chat_id}")
            now = datetime.now()
            print(f"Current time: {now.strftime('%A %H:%M')}")
            
            # Define all scheduled times
            schedules = [
                # Test schedule - replace 17:45 with your desired test time
                {"day": now.weekday(), "hour": 18, "minute": 56},  # Today at 17:45
                
                # Regular schedules
                {"day": 1, "hour": 18, "minute": 10},  # Tuesday 6:10 PM
                {"day": 2, "hour": 18, "minute": 10},  # Wednesday 6:10 PM
                {"day": 3, "hour": 18, "minute": 10},  # Thursday 6:10 PM
                {"day": 6, "hour": 8, "minute": 10},   # Sunday 8:10 AM
                {"day": 6, "hour": 10, "minute": 40},  # Sunday 10:40 AM
                {"day": 6, "hour": 15, "minute": 40}   # Sunday 3:40 PM
            ]
            
            print(f"Setting up {len(schedules)} schedules")
            
            for schedule in schedules:
                remind_time = time(hour=schedule["hour"], minute=schedule["minute"])
                job = job_queue.run_daily(
                    self.send_checklist_reminder,
                    remind_time,
                    days=(schedule["day"],),
                    chat_id=chat_id,
                    data={"chat_id": chat_id},
                    name=f"reminder_{chat_id}_{schedule['day']}_{remind_time}"
                )
                print(f"Scheduled reminder for day {schedule['day']} at {schedule['hour']}:{schedule['minute']}")
                if job:
                    print(f"Next run time: {job.next_t}")
                    
        except Exception as e:
            print(f"Error in scheduling: {str(e)}")
            import traceback
            traceback.print_exc()

    async def send_checklist_reminder(self, context: ContextTypes.DEFAULT_TYPE):
        """Send checklist reminder at scheduled time."""
        try:
            print("\n=== Sending Reminder ===")
            chat_id = context.job.chat_id
            print(f"Sending reminder to chat_id: {chat_id}")
            
            # Reset checklist items
            for item in self.checklist:
                item['completed'] = False
            self.save_data('checklist.json', self.checklist)
            print("Reset checklist items")
            
            keyboard = self.create_checklist_keyboard()
            await context.bot.send_message(
                chat_id=chat_id,
                text="🔔 መስራታችውን እባክህ አረጋግጥ",
                reply_markup=keyboard
            )
            print("Reminder sent successfully")
            
        except Exception as e:
            print(f"Error sending reminder: {e}")
            import traceback
            traceback.print_exc()

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = str(update.effective_user.id)
        if not self.is_authorized(user_id):
            await update.message.reply_text("You are not authorized to use this bot.")
            return

        user = update.effective_user
        help_text = (
            f"👋 Hello {user.first_name}! I'm your Checklist Reminder Bot!\n\n"
            "Available commands:\n"
            "/start - Show this help message\n"
            "/show_checklist - Show interactive checklist"
        )
                
        if self.is_admin(user_id):
            help_text += "\n\nAdmin commands:\n"
            help_text += "/add_user <user_id> - Authorize a new user\n"
            help_text += "/add_admin <user_id> - Make a user an admin\n"
            help_text += "/add_item <text> - Add new checklist item\n"
            help_text += "/remove_item <number> - Remove checklist item"
                    
        await update.message.reply_text(help_text)
        
        # Schedule test reminder for 1 minute from now
        if context.job_queue:
            now = datetime.now()
            test_time = (now.minute + 1) % 60
            test_hour = now.hour + (1 if test_time < now.minute else 0)
            
            # Schedule immediate test
            job = context.job_queue.run_once(
                self.send_checklist_reminder,
                when=60,  # 60 seconds = 1 minute
                chat_id=update.effective_chat.id,
                data={"chat_id": update.effective_chat.id}
            )
            print(f"Scheduled test reminder for 1 minute from now")
            
            # Also schedule regular reminders
            await self.schedule_fixed_reminders(context.job_queue, update.effective_chat.id)
        else:
            print("Warning: Job queue not available")

    async def show_checklist(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not self.is_authorized(str(update.effective_user.id)):
            await update.message.reply_text("You are not authorized to use this bot.")
            return

        if not self.checklist:
            await update.message.reply_text("Your checklist is empty!")
            return
        
        print("Current checklist:", self.checklist)
        keyboard = self.create_checklist_keyboard()
        await update.message.reply_text(
            "📋 መስራታችውን እባክህ አረጋግጥ",
            reply_markup=keyboard
        )

    async def add_item(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not self.is_admin(str(update.effective_user.id)):
            await update.message.reply_text("Only admins can add items.")
            return

        if not context.args:
            await update.message.reply_text("Please provide an item to add!\nExample: /add_item Check microphone")
            return
        
        new_item_text = " ".join(context.args)
        new_item = {"text": new_item_text, "completed": False}
        self.checklist.append(new_item)
        self.save_data('checklist.json', self.checklist)
        await update.message.reply_text(f"✅ Added: {new_item_text}")
        await self.show_checklist(update, context)

    async def remove_item(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not self.is_admin(str(update.effective_user.id)):
            await update.message.reply_text("Only admins can remove items.")
            return

        try:
            if not context.args:
                await update.message.reply_text("Please provide the item number to remove!\nExample: /remove_item 1")
                return
            
            idx = int(context.args[0]) - 1
            if 0 <= idx < len(self.checklist):
                removed_item = self.checklist.pop(idx)
                self.save_data('checklist.json', self.checklist)
                await update.message.reply_text(f"❌ Removed: {removed_item['text']}")
                await self.show_checklist(update, context)
            else:
                await update.message.reply_text("Invalid item number!")
        except ValueError:
            await update.message.reply_text("Please provide a valid number!")

    async def add_authorized_user(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        admin_id = str(update.effective_user.id)
        if not self.is_admin(admin_id):
            await update.message.reply_text("❌ Only admins can authorize new users.")
            return

        if not context.args:
            await update.message.reply_text("Please provide user ID to authorize")
            return
        
        user_id = context.args[0]
        if user_id not in self.authorized_users:
            self.authorized_users.append(user_id)
            self.save_data('authorized_users.json', self.authorized_users)
            await update.message.reply_text(f"✅ User {user_id} authorized")
        else:
            await update.message.reply_text("User already authorized")

    async def add_admin(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        admin_id = str(update.effective_user.id)
        if not self.is_admin(admin_id):
            await update.message.reply_text("❌ Only existing admins can add new admins.")
            return

        if not context.args:
            await update.message.reply_text("Please provide user ID to make admin")
            return
        
        new_admin_id = context.args[0]
        if new_admin_id not in self.admin_users:
            self.admin_users.append(new_admin_id)
            self.save_data('admin_users.json', self.admin_users)
            if new_admin_id not in self.authorized_users:
                self.authorized_users.append(new_admin_id)
                self.save_data('authorized_users.json', self.authorized_users)
            await update.message.reply_text(f"✅ User {new_admin_id} is now an admin")
        else:
            await update.message.reply_text("User is already an admin")
    async def add_user_to_group(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not self.is_admin(str(update.effective_user.id)):
            await update.message.reply_text("Only admins can add users to groups.")
            return

        if len(context.args) != 2:
            await update.message.reply_text("Usage: /add_to_group <user_id> <group_name>")
            return

        user_id, group_name = context.args

        if group_name not in self.user_groups:
            await update.message.reply_text(f"Group {group_name} does not exist.")
            return

        if user_id not in self.authorized_users:
            await update.message.reply_text("User must be authorized first.")
            return

        if user_id not in self.user_groups[group_name]["users"]:
            self.user_groups[group_name]["users"].append(user_id)
            self.save_data('user_groups.json', self.user_groups)
            await update.message.reply_text(f"Added user {user_id} to group {group_name}")
        else:
            await update.message.reply_text("User already in group")
        async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
            query = update.callback_query
            try:
                await query.answer()
                index = int(query.data.split("_")[1])
                
                current_state = self.checklist[index].get('completed', False)
                self.checklist[index]['completed'] = not current_state
                self.save_data('checklist.json', self.checklist)
                
                await query.message.edit_reply_markup(
                    reply_markup=self.create_checklist_keyboard()
                )
            except Exception as e:
                print(f"Error in button callback: {e}")
                await query.answer("Failed to update checklist")
    
async def show_groups(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show all groups and their members"""
    if not self.is_admin(str(update.effective_user.id)):
        await update.message.reply_text("Only admins can view groups.")
        return

    message = "📋 Group Information:\n\n"
    for group_name, group_data in self.user_groups.items():
        message += f"🔸 Group: {group_name}\n"
        message += f"👥 Users: {', '.join(group_data['users']) if group_data['users'] else 'No users'}\n"
        message += "⏰ Schedules:\n"
        for schedule in group_data['schedules']:
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            day_name = day_names[schedule['day']]
            message += f"   • {day_name} at {schedule['hour']:02d}:{schedule['minute']:02d}\n"
        message += "\n"
    
    await update.message.reply_text(message)

async def add_to_group(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Add a user to a specific group"""
    if not self.is_admin(str(update.effective_user.id)):
        await update.message.reply_text("Only admins can add users to groups.")
        return

    if len(context.args) != 2:
        await update.message.reply_text("Usage: /add_to_group <user_id> <group_name>")
        return

    user_id, group_name = context.args
    print(f"Attempting to add user {user_id} to group {group_name}")  # Debug print

    if group_name not in self.user_groups:
        await update.message.reply_text(f"Group {group_name} does not exist. Available groups: {', '.join(self.user_groups.keys())}")
        return

    if user_id not in self.authorized_users:
        await update.message.reply_text("User must be authorized first.")
        return

    if user_id not in self.user_groups[group_name]["users"]:
        self.user_groups[group_name]["users"].append(user_id)
        self.save_data('user_groups.json', self.user_groups)
        print(f"Updated user_groups: {self.user_groups}")  # Debug print
        await update.message.reply_text(f"✅ Added user {user_id} to group {group_name}")
    else:
        await update.message.reply_text("User already in group")



    def run(self):
        try:
            print("Starting bot...")
            application = ApplicationBuilder().token(self.token).build()
            
            # Register handlers
            application.add_handler(CallbackQueryHandler(self.button_callback))
            application.add_handler(CommandHandler("start", self.start))
            application.add_handler(CommandHandler("add_item", self.add_item))
            application.add_handler(CommandHandler("remove_item", self.remove_item))
            application.add_handler(CommandHandler("show_checklist", self.show_checklist))
            application.add_handler(CommandHandler("add_user", self.add_authorized_user))
            application.add_handler(CommandHandler("add_admin", self.add_admin))
            application.add_handler(CommandHandler("show_jobs", self.show_jobs))
            application.add_handler(CommandHandler("show_groups", self.show_groups))
            application.add_handler(CommandHandler("add_to_group", self.add_to_group))

            # Schedule for each group
            for group_name, group_data in self.user_groups.items():
                print(f"Setting up schedules for group: {group_name}")
                for user_id in group_data["users"]:
                    for schedule in group_data["schedules"]:
                        remind_time = time(hour=schedule["hour"], minute=schedule["minute"])
                        application.job_queue.run_daily(
                            self.send_checklist_reminder,
                            remind_time,
                            days=(schedule["day"],),
                            chat_id=int(user_id),
                            data={"chat_id": int(user_id)},
                            name=f"reminder_{group_name}_{user_id}_{schedule['day']}_{schedule['hour']}:{schedule['minute']}"
                        )
                        print(f"Scheduled for group {group_name}, user {user_id}, day {schedule['day']} at {schedule['hour']}:{schedule['minute']}")

            # Add test reminder (2 minutes from now)
            print("Setting up test reminder...")
            for user_id in self.authorized_users:
                application.job_queue.run_once(
                    self.send_checklist_reminder,
                    when=120,  # 2 minutes
                    chat_id=int(user_id),
                    data={"chat_id": int(user_id)},
                    name=f"test_reminder_{user_id}"
                )
                print(f"Test reminder scheduled for user {user_id}")

            print("Bot running with automatic schedules.")
            application.run_polling()

        except KeyboardInterrupt:
            print("\nBot stopped by user")
        except Exception as e:
            print(f"\nError running bot: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    TOKEN = "7346858752:AAGaAQUMZTRUOyrurcXO9uWTpDsZx38Fae0"
    INITIAL_ADMIN_ID = "1798818441"
    
    bot = ReminderBot(TOKEN)
    
    # Ensure there's at least one admin
    if not bot.admin_users:
        bot.admin_users.append(INITIAL_ADMIN_ID)
        bot.save_data('admin_users.json', bot.admin_users)
        print(f"Added initial admin: {INITIAL_ADMIN_ID}")
    
    bot.run()
        