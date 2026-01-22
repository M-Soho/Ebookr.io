'use client'

import { useState } from 'react'
import { X, Send, Upload, FileText } from 'lucide-react'

interface EmailComposeModalProps {
  isOpen: boolean
  onClose: () => void
  selectedContacts: any[]
  onEmailSent?: () => void
}

export function EmailComposeModal({ isOpen, onClose, selectedContacts, onEmailSent }: EmailComposeModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [useTemplate, setUseTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [sending, setSending] = useState(false)

  const loadTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/contacts/email-templates/')
      const data = await response.json()
      setTemplates(data.data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === parseInt(templateId))
    if (template) {
      setSubject(template.subject)
      setMessage(template.body)
      setSelectedTemplate(templateId)
    }
  }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Subject and message are required')
      return
    }

    setSending(true)
    try {
      const response = await fetch('http://localhost:8000/api/contacts/send-email/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedContacts.map(c => c.id),
          subject,
          message
        })
      })

      if (response.ok) {
        alert(`Email sent to ${selectedContacts.length} contact(s)`)
        setSubject('')
        setMessage('')
        onEmailSent?.()
        onClose()
      } else {
        const error = await response.json()
        alert(`Failed to send email: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to send email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Compose Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To: {selectedContacts.length} contact(s)
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedContacts.slice(0, 5).map(contact => (
                <span key={contact.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {contact.first_name} {contact.last_name}
                </span>
              ))}
              {selectedContacts.length > 5 && (
                <span className="text-gray-500 text-sm">+{selectedContacts.length - 5} more</span>
              )}
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={(e) => {
                  setUseTemplate(e.target.checked)
                  if (e.target.checked && templates.length === 0) {
                    loadTemplates()
                  }
                }}
              />
              <span className="text-sm font-medium text-gray-700">Use Email Template</span>
            </label>
            
            {useTemplate && (
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Email subject..."
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full p-3 border rounded-lg font-mono text-sm"
              placeholder="Email body... You can use {{first_name}}, {{last_name}}, {{company}}, {{email}} as variables."
            />
            <p className="text-xs text-gray-500 mt-1">
              Available variables: {'{{'} first_name {'}}'},  {'{{'} last_name {'}}'},  {'{{'} company {'}}'},  {'{{'} email {'}}'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {sending ? 'Sending...' : `Send to ${selectedContacts.length}`}
          </button>
        </div>
      </div>
    </div>
  )
}
