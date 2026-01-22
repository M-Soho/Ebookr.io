'use client'

import { useState, useEffect } from 'react'
import { User, Search, X } from 'lucide-react'

interface TeamMember {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
}

interface TaskAssignmentDropdownProps {
  value: number | null
  onChange: (userId: number | null) => void
  teamId?: number
}

export function TaskAssignmentDropdown({ value, onChange, teamId }: TaskAssignmentDropdownProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers()
    }
  }, [isOpen, teamId])

  const fetchTeamMembers = async () => {
    setLoading(true)
    try {
      const url = teamId 
        ? `http://localhost:8000/api/teams/${teamId}/members/`
        : 'http://localhost:8000/api/users/'
      
      const response = await fetch(url)
      const data = await response.json()
      setMembers(data.members || data.users || [])
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedMember = members.find(m => m.id === value)

  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase()
    return (
      member.username.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      fullName.includes(query)
    )
  })

  const getMemberDisplayName = (member: TeamMember) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`
    }
    return member.username
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-lg hover:border-gray-400 bg-white"
      >
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          {selectedMember ? (
            <span>{getMemberDisplayName(selectedMember)}</span>
          ) : (
            <span className="text-gray-400">Unassigned</span>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Members List */}
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Loading members...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No members found
                </div>
              ) : (
                <>
                  {/* Unassigned Option */}
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null)
                      setIsOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                      value === null ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <X className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Unassigned</div>
                      <div className="text-xs text-gray-500">No one assigned</div>
                    </div>
                  </button>

                  {/* Member Options */}
                  {filteredMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        onChange(member.id)
                        setIsOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                        value === member.id ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {getMemberDisplayName(member).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {getMemberDisplayName(member)}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {member.email}
                        </div>
                      </div>
                      {value === member.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
