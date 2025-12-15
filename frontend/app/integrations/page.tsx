'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Phone,
  FileText,
  Facebook,
  Plus,
  CheckCircle,
  AlertCircle,
  Settings,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import IntegrationConfigModal from '@/components/IntegrationConfigModal';

interface Integration {
  id: number;
  name: string;
  integration_type: string;
  provider: string;
  status: string;
  is_active: boolean;
  last_sync_at: string | null;
  error_count: number;
  created_at: string;
}

interface IntegrationStats {
  total: number;
  active: number;
  inactive: number;
  error: number;
  by_type: {
    email: number;
    whatsapp: number;
    sms: number;
    signup_page: number;
    facebook: number;
  };
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats>({
    total: 0,
    active: 0,
    inactive: 0,
    error: 0,
    by_type: { email: 0, whatsapp: 0, sms: 0, signup_page: 0, facebook: 0 },
  });
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
    fetchStats();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/integrations/');
      const data = await response.json();
      setIntegrations(data.integrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/integrations/stats/');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateIntegration = (type: string) => {
    setSelectedType(type);
    setSelectedIntegration(null);
    setShowConfigModal(true);
  };

  const handleEditIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setSelectedType(integration.integration_type);
    setShowConfigModal(true);
  };

  const handleDeleteIntegration = async (id: number) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/integrations/${id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchIntegrations();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
    }
  };

  const handleTestIntegration = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/integrations/${id}/test/`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        alert('✓ Connection test successful!');
        fetchIntegrations();
      } else {
        alert(`✗ Connection test failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      alert('Error testing integration');
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-6 h-6" />;
      case 'whatsapp':
        return <MessageSquare className="w-6 h-6" />;
      case 'sms':
        return <Phone className="w-6 h-6" />;
      case 'signup_page':
        return <FileText className="w-6 h-6" />;
      case 'facebook':
        return <Facebook className="w-6 h-6" />;
      default:
        return <Settings className="w-6 h-6" />;
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <span className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">Inactive</span>;
    }

    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Active</span>;
      case 'error':
        return <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Error</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">{status}</span>;
    }
  };

  const integrationCards = [
    {
      type: 'email',
      title: 'Email Service',
      description: 'Connect your email provider (SendGrid, Mailgun, SMTP)',
      icon: <Mail className="w-8 h-8" />,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      type: 'whatsapp',
      title: 'WhatsApp Business',
      description: 'Send messages via WhatsApp Business API',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      type: 'sms',
      title: 'SMS Service',
      description: 'Send SMS via Twilio, Vonage, or AWS SNS',
      icon: <Phone className="w-8 h-8" />,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      type: 'signup_page',
      title: 'Sign Up Pages',
      description: 'Capture leads from sign-up forms and landing pages',
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      type: 'facebook',
      title: 'Facebook',
      description: 'Connect Facebook Lead Ads and Messenger',
      icon: <Facebook className="w-8 h-8" />,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Integrations</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Integrations</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>

      {/* Available Integrations */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationCards.map(card => {
            const count = stats.by_type[card.type as keyof typeof stats.by_type] || 0;
            return (
              <div
                key={card.type}
                className={`border-2 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer ${card.color}`}
                onClick={() => handleCreateIntegration(card.type)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-white rounded-lg">{card.icon}</div>
                  <button className="p-2 hover:bg-white rounded-full transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm opacity-80 mb-3">{card.description}</p>
                <div className="text-sm font-medium">
                  {count > 0 ? `${count} configured` : 'Not configured'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Integrations List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Your Integrations</h2>
        </div>
        <div className="p-6">
          {integrations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No integrations configured yet.</p>
              <p className="text-sm">Click on a card above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map(integration => (
                <div
                  key={integration.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getIntegrationIcon(integration.integration_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="capitalize">
                            {integration.integration_type.replace('_', ' ')}
                          </span>
                          {integration.provider && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{integration.provider}</span>
                            </>
                          )}
                          {integration.last_sync_at && (
                            <>
                              <span>•</span>
                              <span>
                                Last synced:{' '}
                                {new Date(integration.last_sync_at).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                        {integration.error_count > 0 && (
                          <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{integration.error_count} errors</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(integration.status, integration.is_active)}
                      <button
                        onClick={() => handleTestIntegration(integration.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Test connection"
                      >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleEditIntegration(integration)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Configure"
                      >
                        <Settings className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteIntegration(integration.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedType && (
        <IntegrationConfigModal
          isOpen={showConfigModal}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedIntegration(null);
            setSelectedType(null);
          }}
          onSave={() => {
            fetchIntegrations();
            fetchStats();
            setShowConfigModal(false);
            setSelectedIntegration(null);
            setSelectedType(null);
          }}
          integrationType={selectedType}
          existingIntegration={selectedIntegration}
        />
      )}
    </div>
  );
}
