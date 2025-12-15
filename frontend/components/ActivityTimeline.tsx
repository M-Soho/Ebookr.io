"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: number;
  activity_type: string;
  activity_type_display: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  contact?: {
    id: number;
    name: string;
    email: string;
  };
}

interface ActivityTimelineProps {
  contactId?: number;
  limit?: number;
}

export default function ActivityTimeline({ contactId, limit = 50 }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: "note",
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchActivities();
  }, [contactId]);

  const fetchActivities = async () => {
    try {
      const url = contactId 
        ? `/api/activities/?contact_id=${contactId}&limit=${limit}`
        : `/api/activities/?limit=${limit}`;
      
      const response = await fetch(url, {
        credentials: "include",
      });
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactId) {
      alert("Contact ID is required to add an activity");
      return;
    }

    try {
      const response = await fetch("/api/activities/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          contact_id: contactId,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({ activity_type: "note", title: "", description: "" });
        fetchActivities();
      }
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "email_sent":
        return "📧";
      case "email_opened":
        return "👁️";
      case "email_clicked":
        return "🖱️";
      case "sms_sent":
        return "💬";
      case "call_made":
        return "📞";
      case "meeting":
        return "🤝";
      case "note":
        return "📝";
      case "task_completed":
        return "✅";
      case "form_submitted":
        return "📋";
      case "tag_added":
        return "🏷️";
      case "tag_removed":
        return "🗑️";
      case "status_changed":
        return "🔄";
      case "campaign_enrolled":
        return "🚀";
      default:
        return "•";
    }
  };

  const getActivityColor = (type: string) => {
    if (type.includes("email")) return "text-blue-600 bg-blue-50";
    if (type.includes("sms")) return "text-green-600 bg-green-50";
    if (type === "call_made") return "text-purple-600 bg-purple-50";
    if (type === "meeting") return "text-indigo-600 bg-indigo-50";
    if (type === "note") return "text-gray-600 bg-gray-50";
    if (type === "task_completed") return "text-emerald-600 bg-emerald-50";
    return "text-gray-600 bg-gray-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
        {contactId && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Add Activity
          </button>
        )}
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getActivityColor(activity.activity_type)} flex items-center justify-center mr-4`}>
              <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                  <span className="text-sm text-gray-500">{activity.activity_type_display}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </div>
              {activity.description && (
                <p className="text-gray-600 text-sm">{activity.description}</p>
              )}
              {!contactId && activity.contact && (
                <p className="text-sm text-blue-600 mt-2">
                  {activity.contact.name} ({activity.contact.email})
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No activities yet.</p>
        </div>
      )}

      {/* Add Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Add Activity</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type
                </label>
                <select
                  value={formData.activity_type}
                  onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="note">Note</option>
                  <option value="email_sent">Email Sent</option>
                  <option value="sms_sent">SMS Sent</option>
                  <option value="call_made">Call Made</option>
                  <option value="meeting">Meeting</option>
                  <option value="task_completed">Task Completed</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
