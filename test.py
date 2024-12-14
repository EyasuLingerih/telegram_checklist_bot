import asyncio
import logging
from telegram.ext import ApplicationBuilder, CommandHandler
from telegram import Update

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def start(update: Update, context):
    user = update.effective_user
    logger.info(f"Received /start command from user {user.id}")
    try:
        await update.message.reply_text(f'Hello {user.first_name}! Bot is working!')
        logger.info("Successfully sent response")
    except Exception as e:
        logger.error(f"Error sending message: {e}")

def run_bot():
    TOKEN = "7346858752:AAGaAQUMZTRUOyrurcXO9uWTpDsZx38Fae0"  # Your token
    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    print("Bot started. Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=["message"])

if __name__ == "__main__":
    try:
        run_bot()
    except KeyboardInterrupt:
        print("Bot stopped by user")
    except Exception as e:
        print(f"Error occurred: {e}")