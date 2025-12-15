'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Mail, MessageSquare, Webhook, ListTodo } from 'lucide-react';

interface AutomationTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  is_system_template: boolean;
}

interface Contact {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface CampaignStep {
  order: number;
  name: string;
  message_type: 'email' | 'sms' | 'task' | 'webhook';
  delay_days: number;
  delay_hours: number;
  subject: string;
  body: string;
}

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function NewCampaignModal({ isOpen, onClose, onSave }: NewCampaignModalProps) {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [steps, setSteps] = useState<CampaignStep[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchContacts();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/automation/templates/');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/contacts/');
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const addStep = () => {
    const newStep: CampaignStep = {
      order: steps.length,
      name: `Step ${steps.length + 1}`,
      message_type: 'email',
      delay_days: 0,
      delay_hours: 0,
      subject: '',
      body: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder steps
    newSteps.forEach((step, i) => {
      step.order = i;
    });
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof CampaignStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!campaignName || !selectedContact) {
      alert('Please enter a campaign name and select a contact');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/automation/campaigns/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignName,
          contact_id: selectedContact,
          template_id: selectedTemplate,
          steps: steps,
        }),
      });

      if (response.ok) {
        onSave();
        resetForm();
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign');
    }
  };

  const resetForm = () => {
    setCampaignName('');
    setSelectedTemplate(null);
    setSelectedContact(null);
    setSteps([]);
    setCategoryFilter('all');
  };

  const getMessageTypeIcon = (messageType: string) => {
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

  const filteredTemplates = templates.filter(
    t => categoryFilter === 'all' || t.category === categoryFilter
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Campaign</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Campaign Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Campaign Name</label>
          <input
            type="text"
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter campaign name..."
          />
        </div>

        {/* Contact Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Contact</label>
          <select
            value={selectedContact || ''}
            onChange={e => setSelectedContact(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Choose a contact...</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name} ({contact.email})
              </option>
            ))}
          </select>
        </div>

        {/* Template Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Choose Template (Optional)</label>
          
          {/* Category Filter */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCategoryFilter('nurture')}
              className={`px-3 py-1 rounded text-sm ${
                categoryFilter === 'nurture' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Lead Nurture
            </button>
            <button
              onClick={() => setCategoryFilter('onboarding')}
              className={`px-3 py-1 rounded text-sm ${
                categoryFilter === 'onboarding' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Onboarding
            </button>
            <button
              onClick={() => setCategoryFilter('engagement')}
              className={`px-3 py-1 rounded text-sm ${
                categoryFilter === 'engagement' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Engagement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {template.category}
                  </span>
                  {template.is_system_template && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      System
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Steps */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium">Campaign Steps</label>
            <button
              onClick={addStep}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {steps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={e => updateStep(index, 'name', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Step name..."
                    />
                  </div>
                  <button
                    onClick={() => removeStep(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Message Type</label>
                    <select
                      value={step.message_type}
                      onChange={e =>
                        updateStep(index, 'message_type', e.target.value as CampaignStep['message_type'])
                      }
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="task">Task</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Delay</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={step.delay_days}
                        onChange={e => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Days"
                        min="0"
                      />
                      <input
                        type="number"
                        value={step.delay_hours}
                        onChange={e =>
                          updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Hours"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {(step.message_type === 'email' || step.message_type === 'sms') && (
                  <>
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">Subject</label>
                      <input
                        type="text"
                        value={step.subject}
                        onChange={e => updateStep(index, 'subject', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Subject line..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Message Body</label>
                      <textarea
                        value={step.body}
                        onChange={e => updateStep(index, 'body', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Message content..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}

            {steps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No steps added yet. Click "Add Step" to create your first step.
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
