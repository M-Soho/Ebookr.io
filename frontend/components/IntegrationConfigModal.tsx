'use client';

import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, Phone, FileText, Facebook } from 'lucide-react';

interface Integration {
  id: number;
  name: string;
  integration_type: string;
  provider: string;
  status: string;
  is_active: boolean;
  config?: any;
  specific_config?: any;
}

interface IntegrationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  integrationType: string;
  existingIntegration?: Integration | null;
}

export default function IntegrationConfigModal({
  isOpen,
  onClose,
  onSave,
  integrationType,
  existingIntegration,
}: IntegrationConfigModalProps) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingIntegration) {
      setName(existingIntegration.name);
      setProvider(existingIntegration.provider);
      setConfig(existingIntegration.specific_config || {});
    } else {
      // Set defaults for new integrations
      resetForm();
    }
  }, [existingIntegration, integrationType]);

  const resetForm = () => {
    setName('');
    setProvider('');
    setConfig({});
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let integrationId = existingIntegration?.id;

      // Step 1: Create or update the base integration
      if (!integrationId) {
        const response = await fetch('http://localhost:8000/api/integrations/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            integration_type: integrationType,
            name: name || `${integrationType} Integration`,
            provider: provider,
          }),
        });

        if (!response.ok) throw new Error('Failed to create integration');
        const data = await response.json();
        integrationId = data.id;
      }

      // Step 2: Configure specific integration settings
      const configEndpoint = getConfigEndpoint(integrationType, integrationId!);
      const configResponse = await fetch(configEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!configResponse.ok) {
        const error = await configResponse.json();
        throw new Error(error.error || 'Failed to configure integration');
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving integration:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getConfigEndpoint = (type: string, id: number) => {
    return `http://localhost:8000/api/integrations/${id}/configure/${type}/`;
  };

  const updateConfig = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const renderEmailConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Provider</label>
        <select
          value={config.provider || 'smtp'}
          onChange={e => updateConfig('provider', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="sendgrid">SendGrid</option>
          <option value="mailgun">Mailgun</option>
          <option value="aws_ses">AWS SES</option>
          <option value="smtp">SMTP</option>
          <option value="mailchimp">Mailchimp</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">From Email *</label>
        <input
          type="email"
          value={config.from_email || ''}
          onChange={e => updateConfig('from_email', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="noreply@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">From Name</label>
        <input
          type="text"
          value={config.from_name || ''}
          onChange={e => updateConfig('from_name', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Your Company"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Reply To Email</label>
        <input
          type="email"
          value={config.reply_to_email || ''}
          onChange={e => updateConfig('reply_to_email', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="reply@example.com"
        />
      </div>

      {(config.provider === 'sendgrid' || config.provider === 'mailgun' || config.provider === 'mailchimp') && (
        <div>
          <label className="block text-sm font-medium mb-2">API Key *</label>
          <input
            type="password"
            value={config.api_key || ''}
            onChange={e => updateConfig('api_key', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter your API key"
            required
          />
        </div>
      )}

      {config.provider === 'smtp' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">SMTP Host *</label>
            <input
              type="text"
              value={config.smtp_host || ''}
              onChange={e => updateConfig('smtp_host', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="smtp.example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">SMTP Port *</label>
            <input
              type="number"
              value={config.smtp_port || '587'}
              onChange={e => updateConfig('smtp_port', parseInt(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="587"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">SMTP Username</label>
            <input
              type="text"
              value={config.smtp_username || ''}
              onChange={e => updateConfig('smtp_username', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">SMTP Password</label>
            <input
              type="password"
              value={config.smtp_password || ''}
              onChange={e => updateConfig('smtp_password', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={config.smtp_use_tls !== false}
              onChange={e => updateConfig('smtp_use_tls', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm">Use TLS/SSL</label>
          </div>
        </>
      )}

      {config.provider === 'aws_ses' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">AWS Region *</label>
            <input
              type="text"
              value={config.aws_region || 'us-east-1'}
              onChange={e => updateConfig('aws_region', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="us-east-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">AWS Access Key ID *</label>
            <input
              type="text"
              value={config.aws_access_key_id || ''}
              onChange={e => updateConfig('aws_access_key_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">AWS Secret Access Key *</label>
            <input
              type="password"
              value={config.aws_secret_access_key || ''}
              onChange={e => updateConfig('aws_secret_access_key', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </>
      )}
    </div>
  );

  const renderWhatsAppConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Phone Number ID *</label>
        <input
          type="text"
          value={config.phone_number_id || ''}
          onChange={e => updateConfig('phone_number_id', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="1234567890"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Business Account ID *</label>
        <input
          type="text"
          value={config.business_account_id || ''}
          onChange={e => updateConfig('business_account_id', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Access Token *</label>
        <input
          type="password"
          value={config.access_token || ''}
          onChange={e => updateConfig('access_token', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Webhook URL</label>
        <input
          type="url"
          value={config.webhook_url || ''}
          onChange={e => updateConfig('webhook_url', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="https://yourapp.com/webhooks/whatsapp"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Webhook Verify Token</label>
        <input
          type="text"
          value={config.webhook_verify_token || ''}
          onChange={e => updateConfig('webhook_verify_token', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>
    </div>
  );

  const renderSMSConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Provider</label>
        <select
          value={config.provider || 'twilio'}
          onChange={e => updateConfig('provider', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="twilio">Twilio</option>
          <option value="vonage">Vonage (Nexmo)</option>
          <option value="aws_sns">AWS SNS</option>
          <option value="plivo">Plivo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">From Phone Number *</label>
        <input
          type="tel"
          value={config.from_phone_number || ''}
          onChange={e => updateConfig('from_phone_number', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="+1234567890"
          required
        />
      </div>

      {(config.provider === 'twilio' || config.provider === 'plivo') && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Account SID *</label>
            <input
              type="text"
              value={config.account_sid || ''}
              onChange={e => updateConfig('account_sid', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Auth Token *</label>
            <input
              type="password"
              value={config.auth_token || ''}
              onChange={e => updateConfig('auth_token', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </>
      )}

      {config.provider === 'vonage' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">API Key *</label>
            <input
              type="text"
              value={config.api_key || ''}
              onChange={e => updateConfig('api_key', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">API Secret *</label>
            <input
              type="password"
              value={config.api_secret || ''}
              onChange={e => updateConfig('api_secret', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </>
      )}

      {config.provider === 'aws_sns' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">AWS Region *</label>
            <input
              type="text"
              value={config.aws_region || 'us-east-1'}
              onChange={e => updateConfig('aws_region', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="us-east-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">AWS Access Key ID *</label>
            <input
              type="text"
              value={config.aws_access_key_id || ''}
              onChange={e => updateConfig('aws_access_key_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">AWS Secret Access Key *</label>
            <input
              type="password"
              value={config.aws_secret_access_key || ''}
              onChange={e => updateConfig('aws_secret_access_key', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </>
      )}
    </div>
  );

  const renderSignUpPageConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Page URL</label>
        <input
          type="url"
          value={config.page_url || ''}
          onChange={e => updateConfig('page_url', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="https://yoursite.com/signup"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">API Endpoint</label>
        <input
          type="url"
          value={config.api_endpoint || ''}
          onChange={e => updateConfig('api_endpoint', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="https://api.yoursite.com/signups"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">API Key</label>
        <input
          type="password"
          value={config.api_key || ''}
          onChange={e => updateConfig('api_key', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Redirect URL (after sign-up)</label>
        <input
          type="url"
          value={config.redirect_url || ''}
          onChange={e => updateConfig('redirect_url', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="https://yoursite.com/thank-you"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.auto_create_contact !== false}
          onChange={e => updateConfig('auto_create_contact', e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm">Automatically create contact on sign-up</label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Apply Tag (optional)</label>
        <input
          type="text"
          value={config.apply_tag || ''}
          onChange={e => updateConfig('apply_tag', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="e.g., Newsletter Subscriber"
        />
      </div>
    </div>
  );

  const renderFacebookConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">App ID *</label>
        <input
          type="text"
          value={config.app_id || ''}
          onChange={e => updateConfig('app_id', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">App Secret *</label>
        <input
          type="password"
          value={config.app_secret || ''}
          onChange={e => updateConfig('app_secret', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Access Token *</label>
        <input
          type="password"
          value={config.access_token || ''}
          onChange={e => updateConfig('access_token', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Page ID</label>
        <input
          type="text"
          value={config.page_id || ''}
          onChange={e => updateConfig('page_id', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Page Access Token</label>
        <input
          type="password"
          value={config.page_access_token || ''}
          onChange={e => updateConfig('page_access_token', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.enable_lead_ads || false}
          onChange={e => updateConfig('enable_lead_ads', e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm">Enable Lead Ads</label>
      </div>

      {config.enable_lead_ads && (
        <div>
          <label className="block text-sm font-medium mb-2">Lead Form ID</label>
          <input
            type="text"
            value={config.lead_form_id || ''}
            onChange={e => updateConfig('lead_form_id', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.enable_messenger || false}
          onChange={e => updateConfig('enable_messenger', e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm">Enable Messenger</label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Webhook URL</label>
        <input
          type="url"
          value={config.webhook_url || ''}
          onChange={e => updateConfig('webhook_url', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="https://yourapp.com/webhooks/facebook"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.auto_create_contact_from_leads !== false}
          onChange={e => updateConfig('auto_create_contact_from_leads', e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm">Auto-create contacts from leads</label>
      </div>
    </div>
  );

  const getIcon = () => {
    switch (integrationType) {
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
        return null;
    }
  };

  const getTitle = () => {
    const titles: { [key: string]: string } = {
      email: 'Email Service',
      whatsapp: 'WhatsApp Business',
      sms: 'SMS Service',
      signup_page: 'Sign Up Page',
      facebook: 'Facebook',
    };
    return titles[integrationType] || 'Integration';
  };

  const renderConfig = () => {
    switch (integrationType) {
      case 'email':
        return renderEmailConfig();
      case 'whatsapp':
        return renderWhatsAppConfig();
      case 'sms':
        return renderSMSConfig();
      case 'signup_page':
        return renderSignUpPageConfig();
      case 'facebook':
        return renderFacebookConfig();
      default:
        return <div>Configuration not available for this integration type.</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-2xl font-bold">
              {existingIntegration ? 'Edit' : 'Configure'} {getTitle()}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Integration Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder={`My ${getTitle()}`}
            required
          />
        </div>

        {renderConfig()}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : existingIntegration ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
