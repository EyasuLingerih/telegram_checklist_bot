import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { User, Group, Schedule } from '../types';

type Tab = 'users' | 'groups' | 'schedules' | 'stats';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const { hapticFeedback, showConfirm, showAlert } = useTelegram();

  return (
    <div className="min-h-screen bg-tg-bg">
      {/* Header */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-tg-secondary-bg">
        <h1 className="text-xl font-bold text-tg-text">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {(['users', 'groups', 'schedules', 'stats'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              hapticFeedback('light');
              setActiveTab(tab);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-tg-button text-tg-button-text'
                : 'bg-tg-secondary-bg text-tg-text'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        {activeTab === 'users' && <UsersTab hapticFeedback={hapticFeedback} showConfirm={showConfirm} showAlert={showAlert} />}
        {activeTab === 'groups' && <GroupsTab hapticFeedback={hapticFeedback} showConfirm={showConfirm} showAlert={showAlert} />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'stats' && <StatsTab hapticFeedback={hapticFeedback} showAlert={showAlert} />}
      </div>
    </div>
  );
}

interface TabProps {
  hapticFeedback: (type: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy') => void;
  showConfirm: (message: string) => Promise<boolean>;
  showAlert: (message: string) => void;
}

function UsersTab({ hapticFeedback, showConfirm, showAlert }: TabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUserId, setNewUserId] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.users);
    } catch {
      showAlert('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;

    try {
      await api.addUser(newUserId.trim());
      hapticFeedback('success');
      setNewUserId('');
      loadUsers();
    } catch {
      hapticFeedback('error');
      showAlert('Failed to add user');
    }
  };

  const handleRemoveUser = async (telegramId: string) => {
    const confirmed = await showConfirm('Remove this user?');
    if (confirmed) {
      try {
        await api.removeUser(telegramId);
        hapticFeedback('medium');
        loadUsers();
      } catch {
        hapticFeedback('error');
        showAlert('Failed to remove user');
      }
    }
  };

  const handleToggleAdmin = async (user: User) => {
    const action = user.isAdmin ? 'demote' : 'promote';
    const confirmed = await showConfirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user to/from admin?`);
    if (confirmed) {
      try {
        if (user.isAdmin) {
          await api.demoteFromAdmin(user.telegramId);
        } else {
          await api.promoteToAdmin(user.telegramId);
        }
        hapticFeedback('success');
        loadUsers();
      } catch {
        hapticFeedback('error');
        showAlert('Failed to update user role');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-12" />;
  }

  return (
    <div>
      {/* Add User Form */}
      <form onSubmit={handleAddUser} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          placeholder="Telegram User ID"
          className="flex-1 px-4 py-3 bg-tg-secondary-bg rounded-xl text-tg-text placeholder-tg-hint outline-none"
        />
        <button
          type="submit"
          className="px-4 py-3 bg-tg-button text-tg-button-text rounded-xl font-medium"
        >
          Add
        </button>
      </form>

      {/* Users List */}
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-4 bg-tg-secondary-bg rounded-xl"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-tg-text">
                  {user.firstName || user.username || user.telegramId}
                </span>
                {user.isAdmin && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-sm text-tg-hint">ID: {user.telegramId}</span>
            </div>

            <button
              onClick={() => handleToggleAdmin(user)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                user.isAdmin
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {user.isAdmin ? 'Demote' : 'Promote'}
            </button>

            <button
              onClick={() => handleRemoveUser(user.telegramId)}
              className="p-2 text-red-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupsTab({ hapticFeedback, showConfirm, showAlert }: TabProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', contactName: '', phone: '' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await api.getGroups();
      setGroups(response.groups);
    } catch {
      showAlert('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim() || !newGroup.contactName.trim() || !newGroup.phone.trim()) return;

    try {
      await api.addGroup(newGroup);
      hapticFeedback('success');
      setNewGroup({ name: '', contactName: '', phone: '' });
      setIsAddingGroup(false);
      loadGroups();
    } catch {
      hapticFeedback('error');
      showAlert('Failed to add group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const confirmed = await showConfirm('Delete this group?');
    if (confirmed) {
      try {
        await api.deleteGroup(id);
        hapticFeedback('medium');
        loadGroups();
      } catch {
        hapticFeedback('error');
        showAlert('Failed to delete group');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-12" />;
  }

  return (
    <div>
      {/* Add Group Button/Form */}
      {isAddingGroup ? (
        <form onSubmit={handleAddGroup} className="bg-tg-secondary-bg rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            placeholder="Group Name"
            className="w-full px-4 py-3 bg-tg-bg rounded-xl text-tg-text placeholder-tg-hint outline-none"
          />
          <input
            type="text"
            value={newGroup.contactName}
            onChange={(e) => setNewGroup({ ...newGroup, contactName: e.target.value })}
            placeholder="Contact Name"
            className="w-full px-4 py-3 bg-tg-bg rounded-xl text-tg-text placeholder-tg-hint outline-none"
          />
          <input
            type="text"
            value={newGroup.phone}
            onChange={(e) => setNewGroup({ ...newGroup, phone: e.target.value })}
            placeholder="Phone Number"
            className="w-full px-4 py-3 bg-tg-bg rounded-xl text-tg-text placeholder-tg-hint outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddingGroup(false)}
              className="flex-1 py-3 rounded-xl bg-tg-bg text-tg-text font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-tg-button text-tg-button-text font-medium"
            >
              Add Group
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingGroup(true)}
          className="w-full py-3 mb-4 bg-tg-button text-tg-button-text rounded-xl font-medium"
        >
          + Add Group
        </button>
      )}

      {/* Groups List */}
      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex items-center gap-3 p-4 bg-tg-secondary-bg rounded-xl"
          >
            <div className="flex-1">
              <div className="font-medium text-tg-text">{group.name}</div>
              <div className="text-sm text-tg-hint">
                {group.contactName} - {group.phone}
              </div>
            </div>

            <button
              onClick={() => handleDeleteGroup(group.id)}
              className="p-2 text-red-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-8 text-tg-hint">
            No groups yet
          </div>
        )}
      </div>
    </div>
  );
}

function SchedulesTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await api.getSchedules();
      setSchedules(response.schedules);
      setTimezone(response.timezone);
    } catch {
      console.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}:${m} ${ampm}`;
  };

  if (isLoading) {
    return <LoadingSpinner className="py-12" />;
  }

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 rounded-xl">
        <span className="text-sm text-blue-700">Timezone: {timezone}</span>
      </div>

      <div className="space-y-2">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center gap-3 p-4 bg-tg-secondary-bg rounded-xl"
          >
            <div className={`w-3 h-3 rounded-full ${schedule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className="flex-1">
              <div className="font-medium text-tg-text">
                {getDayName(schedule.dayOfWeek)}
              </div>
              <div className="text-sm text-tg-hint">
                {formatTime(schedule.hour, schedule.minute)}
              </div>
            </div>
            {schedule.description && (
              <span className="text-sm text-tg-hint">{schedule.description}</span>
            )}
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="text-center py-8 text-tg-hint">
            No schedules configured
          </div>
        )}
      </div>
    </div>
  );
}

function StatsTab({ hapticFeedback, showAlert }: Omit<TabProps, 'showConfirm'>) {
  const [stats, setStats] = useState<{
    users: { total: number; authorized: number; admins: number };
    checklist: { total: number; completed: number; pending: number };
    groups: number;
    schedules: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.getStats();
      setStats(response);
    } catch {
      console.error('Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    setIsSendingReminder(true);
    try {
      await api.sendReminder();
      hapticFeedback('success');
      showAlert('Reminder sent to all users!');
    } catch {
      hapticFeedback('error');
      showAlert('Failed to send reminder');
    } finally {
      setIsSendingReminder(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-12" />;
  }

  if (!stats) {
    return <div className="text-center py-8 text-tg-hint">Failed to load stats</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Users"
          value={stats.users.authorized}
          subtitle={`${stats.users.admins} admins`}
          icon="👥"
        />
        <StatCard
          title="Tasks"
          value={stats.checklist.total}
          subtitle={`${stats.checklist.completed} done`}
          icon="✅"
        />
        <StatCard
          title="Groups"
          value={stats.groups}
          icon="📁"
        />
        <StatCard
          title="Schedules"
          value={stats.schedules}
          subtitle="active"
          icon="⏰"
        />
      </div>

      {/* Send Reminder Button */}
      <button
        onClick={handleSendReminder}
        disabled={isSendingReminder}
        className="w-full py-4 bg-tg-button text-tg-button-text rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSendingReminder ? (
          <>
            <LoadingSpinner size="small" />
            Sending...
          </>
        ) : (
          <>
            <span>🔔</span>
            Send Reminder Now
          </>
        )}
      </button>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: {
  title: string;
  value: number;
  subtitle?: string;
  icon: string;
}) {
  return (
    <div className="bg-tg-secondary-bg rounded-xl p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-tg-text">{value}</div>
      <div className="text-sm text-tg-hint">{title}</div>
      {subtitle && <div className="text-xs text-tg-hint">{subtitle}</div>}
    </div>
  );
}
