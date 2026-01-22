'use client'

import { useState } from 'react'
import { Trash2, Tag, Calendar, UserCheck, X } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  selectedIds: number[]
  onClearSelection: () => void
  onRefresh: () => void
  type?: 'contacts' | 'tasks'
}

export function BulkActionsBar({ 
  selectedCount, 
  selectedIds, 
  onClearSelection, 
  onRefresh,
  type = 'contacts'
}: BulkActionsBarProps) {
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showCadenceModal, setShowCadenceModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])

  const loadTags = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tags/')
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} ${type}?`)) return

    setLoading(true)
    try {
      const endpoint = type === 'contacts' 
        ? 'http://localhost:8000/api/contacts/bulk-delete/'
        : 'http://localhost:8000/api/tasks/bulk-delete/'
      
      const payload = type === 'contacts' 
        ? { contact_ids: selectedIds }
        : { task_ids: selectedIds }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully deleted ${data.deleted} ${type}`)
        onClearSelection()
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Failed to delete: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to delete. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdateStatus = async (status: string) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/contacts/bulk-update-status/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedIds,
          status
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully updated ${data.updated} contacts`)
        setShowStatusModal(false)
        onClearSelection()
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Failed to update: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to update status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const bulkAddTags = async () => {
    if (selectedTags.length === 0) {
      alert('Please select at least one tag')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/contacts/bulk-add-tags/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedIds,
          tag_ids: selectedTags
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully added tags to ${data.contacts_affected} contacts`)
        setShowTagModal(false)
        setSelectedTags([])
        onClearSelection()
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Failed to add tags: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to add tags. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdateCadence = async (cadence: string) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/contacts/bulk-update-cadence/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedIds,
          cadence
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully updated cadence for ${data.updated} contacts`)
        setShowCadenceModal(false)
        onClearSelection()
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Failed to update cadence: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to update cadence. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const bulkCompleteTasks = async () => {
    if (!confirm(`Mark ${selectedCount} tasks as completed?`)) return

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/tasks/bulk-complete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_ids: selectedIds })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully completed ${data.updated} tasks`)
        onClearSelection()
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Failed to complete tasks: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to complete tasks. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 z-40 animate-slide-up">
        <span className="font-medium">{selectedCount} selected</span>
        
        <div className="h-6 w-px bg-gray-600" />

        {type === 'contacts' && (
          <>
            <button
              onClick={() => {
                setShowStatusModal(true)
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded"
              disabled={loading}
            >
              <UserCheck className="h-4 w-4" />
              Update Status
            </button>

            <button
              onClick={() => {
                loadTags()
                setShowTagModal(true)
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded"
              disabled={loading}
            >
              <Tag className="h-4 w-4" />
              Add Tags
            </button>

            <button
              onClick={() => setShowCadenceModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded"
              disabled={loading}
            >
              <Calendar className="h-4 w-4" />
              Set Cadence
            </button>
          </>
        )}

        {type === 'tasks' && (
          <button
            onClick={bulkCompleteTasks}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded"
            disabled={loading}
          >
            <UserCheck className="h-4 w-4" />
            Mark Complete
          </button>
        )}

        <button
          onClick={bulkDelete}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded"
          disabled={loading}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>

        <div className="h-6 w-px bg-gray-600" />

        <button
          onClick={onClearSelection}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Contact Status</h3>
            <div className="space-y-2">
              {['lead', 'active', 'inactive', 'lost'].map((status) => (
                <button
                  key={status}
                  onClick={() => bulkUpdateStatus(status)}
                  className="w-full text-left px-4 py-2 border rounded hover:bg-gray-50 capitalize"
                  disabled={loading}
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="mt-4 w-full py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Tags to Contacts</h3>
            <div className="space-y-2 mb-4">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id])
                      } else {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id))
                      }
                    }}
                    className="rounded"
                  />
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={bulkAddTags}
                disabled={loading || selectedTags.length === 0}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Add Tags
              </button>
              <button
                onClick={() => {
                  setShowTagModal(false)
                  setSelectedTags([])
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cadence Modal */}
      {showCadenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Set Contact Cadence</h3>
            <div className="space-y-2">
              {['none', 'daily', 'weekly', 'monthly', 'quarterly', 'annual'].map((cadence) => (
                <button
                  key={cadence}
                  onClick={() => bulkUpdateCadence(cadence)}
                  className="w-full text-left px-4 py-2 border rounded hover:bg-gray-50 capitalize"
                  disabled={loading}
                >
                  {cadence}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCadenceModal(false)}
              className="mt-4 w-full py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
