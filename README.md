# Telegram Checklist Reminder Bot

This project is a **Telegram Bot** that acts as a checklist reminder system. It helps users ensure that tasks are completed on time with interactive reminders and checklists. Admins can manage users and tasks, while authorized users can interact with the checklist.

---

## Features
- **Interactive Checklist**: Mark tasks as complete or incomplete with inline buttons.
- **Scheduled Reminders**: Fixed reminders for specific times and days.
- **User Authorization**: Admins can add or remove authorized users.
- **Task Management**: Admins can add or remove checklist items dynamically.
- **Custom Scheduling**: Admins can view scheduled jobs.
- **Data Persistence**: Checklist, users, and admin data are saved in JSON files.

---

## Requirements
- Python 3.8+
- Telegram Bot Token (from [BotFather](https://core.telegram.org/bots#botfather))
- `python-telegram-bot` library (v20+)
- Libraries:
  - `asyncio`
  - `pytz`

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/telegram-reminder-bot.git
   cd telegram-reminder-bot
   ```

2. **Install Dependencies**:
   ```bash
   pip install python-telegram-bot==20.3 pytz
   ```

3. **Configure the Bot**:
   - Create a file named `config.py` in the root directory with the following content:
     ```python
     BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
     INITIAL_ADMIN_ID = "YOUR_TELEGRAM_USER_ID"
     ```
     Replace `YOUR_TELEGRAM_BOT_TOKEN` with the token provided by BotFather and `YOUR_TELEGRAM_USER_ID` with your Telegram user ID.

4. **Run the Bot**:
   ```bash
   python Reminder.py
   ```

---

## Usage

### Commands
- `/start` - Display the help message.
- `/show_checklist` - Display the interactive checklist.
- `/add_item <task>` - Add a new task to the checklist (admin only).
- `/remove_item <number>` - Remove a task by its number (admin only).
- `/add_user <user_id>` - Authorize a new user (admin only).
- `/add_admin <user_id>` - Make a user an admin (admin only).
- `/show_jobs` - Display scheduled reminder jobs (admin only).

### Checklist Interaction
Once the checklist is displayed, use the **inline buttons** to toggle task completion.

---

## Data Storage
The bot saves data in the following JSON files:
- `admin_users.json` - List of admin user IDs.
- `authorized_users.json` - List of authorized user IDs.
- `checklist.json` - Checklist items and their status.

---

## Scheduled Reminders
The bot automatically sends reminders at the following times:
- **Tuesday to Thursday**: 6:10 PM
- **Sunday**: 8:10 AM, 10:40 AM, and 3:40 PM
- **Custom Time**: Admins can add test reminders dynamically.

---

## Example Checklist Interaction
- Task 1: ✅ Completed
- Task 2: ⬜ Incomplete

Click the buttons to toggle the task's status.

---

## Author
Eyasu Lingerih

---

## License
This project is licensed under the MIT License.
