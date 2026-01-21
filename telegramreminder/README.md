# Telegram Checklist Mini App

A Telegram Mini App for managing checklists with scheduled reminders. Built with Node.js/Express backend and React frontend.

## Features

- Interactive checklist with toggle completion
- Admin dashboard for managing users, groups, and schedules
- Scheduled reminders sent via Telegram
- Telegram WebApp authentication
- PostgreSQL database

## Project Structure

```
telegram-checklist-miniapp/
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── middleware/# Auth middleware
│   │   └── utils/     # Helpers
│   ├── prisma/        # Database schema
│   └── scripts/       # Migration scripts
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
└── render.yaml        # Render.com deployment config
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Telegram Bot Token (from @BotFather)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and bot token
npx prisma migrate dev
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
# Create .env with VITE_API_URL
npm run dev
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/checklist
TELEGRAM_BOT_TOKEN=your-bot-token
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000
```

## Deployment to Render.com

1. Push code to GitHub
2. Go to Render Dashboard → "Blueprints"
3. Connect your repository
4. Render will auto-detect `render.yaml`
5. Click "Apply" to create all services
6. Set `TELEGRAM_BOT_TOKEN` manually in dashboard

### Configure Telegram Bot

1. Open @BotFather in Telegram
2. Select your bot → Bot Settings → Menu Button
3. Set Web App URL to your frontend URL
4. Example: `https://checklist-frontend.onrender.com`

## Data Migration

To migrate data from your existing JSON files:

```bash
cd backend
OLD_DATA_PATH=/path/to/json/files npm run migrate:json
```

This will import:
- `admin_users.json` → Users (isAdmin=true)
- `authorized_users.json` → Users
- `checklist.json` → ChecklistItems
- `groups.json` → Groups

## API Endpoints

### Auth
- `POST /api/auth/validate` - Validate Telegram initData

### Checklist
- `GET /api/checklist` - Get all items
- `POST /api/checklist` - Add item (admin)
- `PATCH /api/checklist/:id/toggle` - Toggle completion
- `DELETE /api/checklist/:id` - Remove item (admin)

### Users (Admin)
- `GET /api/users` - List users
- `POST /api/users` - Add user
- `DELETE /api/users/:id` - Remove user
- `POST /api/users/:id/admin` - Promote to admin

### Groups (Admin)
- `GET /api/groups` - List groups
- `POST /api/groups` - Create group
- `PATCH /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Admin
- `GET /api/admin/schedules` - View schedules
- `GET /api/admin/stats` - Get statistics
- `POST /api/admin/send-reminder` - Manual reminder

## Scheduled Reminders

Default schedule (Africa/Addis_Ababa timezone):
- Tuesday-Thursday: 6:10 PM
- Sunday: 8:10 AM, 10:40 AM, 3:40 PM

## License

MIT
