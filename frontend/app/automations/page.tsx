'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Play, 
  Pause, 
  CheckCircle, 
  Mail, 
  MessageSquare, 
  Webhook,
  ListTodo
} from 'lucide-react';
import NewCampaignModal from '@/components/NewCampaignModal';

interface AutomationTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  is_system_template: boolean;
  created_at: string;
}

interface Contact {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface AutomationCampaign {
  id: number;
  name: string;
  status: string;
  template: { id: number; name: string } | null;
  contact: Contact;
  started_at: string | null;
  completed_at: string | null;
  steps_count: number;
  steps_executed: number;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  type: string;
  title: string;
  message_type?: string;
  date: string;
  is_executed?: boolean;
  status?: string;
  campaign?: { id: number; name: string };
  contact: Contact;
}

type ViewMode = 'week' | 'month' | 'year';

export default function AutomationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [campaigns, setCampaigns] = useState<AutomationCampaign[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [stats, setStats] = useState({
    total_campaigns: 0,
    active_campaigns: 0,
    paused_campaigns: 0,
    completed_campaigns: 0,
    total_steps: 0,
    executed_steps: 0,
    pending_followups: 0,
  });

  useEffect(() => {
    fetchTemplates();
    fetchCampaigns();
    fetchStats();
    fetchCalendarEvents();
  }, [currentDate, viewMode]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/automation/templates/');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/automation/campaigns/');
      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/automation/stats/');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const { start, end } = getDateRange();
      const response = await fetch(
        `http://localhost:8000/api/automation/calendar/?start_date=${start.toISOString()}&end_date=${end.toISOString()}`
      );
      const data = await response.json();
      setCalendarEvents(data.events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'week') {
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 7);
    } else if (viewMode === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (viewMode === 'year') {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const getMessageTypeIcon = (messageType?: string) => {
    switch (messageType) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'webhook':
        return <Webhook className="w-4 h-4" />;
      case 'task':
        return <ListTodo className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCalendar = () => {
    if (viewMode === 'year') {
      return renderYearView();
    } else if (viewMode === 'month') {
      return renderMonthView();
    } else {
      return renderWeekView();
    }
  };

  const renderWeekView = () => {
    const { start } = getDateRange();
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const dayEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === day.toDateString();
      });

      days.push(
        <div key={i} className="border-r last:border-r-0 min-h-[400px] p-2">
          <div className="font-semibold text-sm mb-2">
            {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="space-y-1">
            {dayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`p-2 rounded text-xs cursor-pointer hover:shadow-md transition-shadow ${
                  event.is_executed ? 'bg-gray-100' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {getMessageTypeIcon(event.message_type)}
                  <span className="font-medium truncate">{event.title}</span>
                </div>
                <div className="text-gray-600 truncate">{event.contact.email}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-7 border">{days}</div>;
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="border p-2 min-h-[100px] bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const currentDay = new Date(year, month, day);
      const dayEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === currentDay.toDateString();
      });

      days.push(
        <div key={day} className="border p-2 min-h-[100px]">
          <div className="font-semibold text-sm mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`p-1 rounded text-xs cursor-pointer hover:shadow-md transition-shadow flex items-center gap-1 ${
                  event.is_executed ? 'bg-gray-100' : 'bg-blue-50'
                }`}
              >
                {getMessageTypeIcon(event.message_type)}
                <span className="truncate flex-1">{event.title}</span>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-7 bg-gray-100 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{days}</div>
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      const monthEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === month && eventDate.getFullYear() === year;
      });

      months.push(
        <div key={month} className="border rounded p-3">
          <div className="font-semibold mb-2">
            {new Date(year, month).toLocaleDateString('en-US', { month: 'long' })}
          </div>
          <div className="text-sm text-gray-600">
            {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
          </div>
          <div className="mt-2 space-y-1">
            {monthEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                className="text-xs p-1 bg-blue-50 rounded truncate flex items-center gap-1 cursor-pointer hover:shadow-md"
                onClick={() => setSelectedEvent(event)}
              >
                {getMessageTypeIcon(event.message_type)}
                <span className="truncate">{event.title}</span>
              </div>
            ))}
            {monthEvents.length > 3 && (
              <div className="text-xs text-gray-500">+{monthEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-3 gap-4">{months}</div>;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Automations</h1>
        <button
          onClick={() => setShowNewCampaignModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.active_campaigns}</div>
          <div className="text-sm text-gray-600">Active Campaigns</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.executed_steps}</div>
          <div className="text-sm text-gray-600">Steps Executed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending_followups}</div>
          <div className="text-sm text-gray-600">Pending Follow-ups</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{templates.length}</div>
          <div className="text-sm text-gray-600">Templates</div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold">
              {viewMode === 'year' && currentDate.getFullYear()}
              {viewMode === 'month' &&
                currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {viewMode === 'week' &&
                `Week of ${getDateRange().start.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              →
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
            >
              Today
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded ${
                viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded ${
                viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1 rounded ${
                viewMode === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow mb-6">{renderCalendar()}</div>

      {/* Active Campaigns List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Active Campaigns</h2>
        <div className="space-y-3">
          {campaigns
            .filter(c => c.status === 'active')
            .map(campaign => (
              <div
                key={campaign.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <p className="text-sm text-gray-600">
                      {campaign.contact.first_name} {campaign.contact.last_name} (
                      {campaign.contact.email})
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      campaign.status
                    )}`}
                  >
                    {campaign.status}
                  </span>
                </div>
                {campaign.template && (
                  <div className="text-sm text-gray-600 mb-2">
                    Template: {campaign.template.name}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          campaign.steps_count > 0
                            ? (campaign.steps_executed / campaign.steps_count) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-gray-600">
                    {campaign.steps_executed}/{campaign.steps_count} steps
                  </span>
                </div>
              </div>
            ))}
          {campaigns.filter(c => c.status === 'active').length === 0 && (
            <p className="text-gray-500 text-center py-4">No active campaigns</p>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">{selectedEvent.title}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {getMessageTypeIcon(selectedEvent.message_type)}
                <span className="capitalize">{selectedEvent.message_type || 'Unknown'}</span>
              </div>
              <div>
                <strong>Contact:</strong> {selectedEvent.contact.first_name}{' '}
                {selectedEvent.contact.last_name} ({selectedEvent.contact.email})
              </div>
              <div>
                <strong>Scheduled:</strong>{' '}
                {new Date(selectedEvent.date).toLocaleString()}
              </div>
              {selectedEvent.campaign && (
                <div>
                  <strong>Campaign:</strong> {selectedEvent.campaign.name}
                </div>
              )}
              {selectedEvent.is_executed !== undefined && (
                <div>
                  <strong>Status:</strong>{' '}
                  {selectedEvent.is_executed ? 'Executed' : 'Pending'}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-4 w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        onSave={() => {
          fetchCampaigns();
          fetchStats();
          fetchCalendarEvents();
        }}
      />
    </div>
  );
}
