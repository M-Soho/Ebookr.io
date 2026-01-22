'use client'

import { useState, useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'

export function AdvancedSearchBar() {
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [results, setResults] = useState<any>({ contacts: [], tasks: [], activities: [] })
  const [searching, setSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    types: ['contacts', 'tasks', 'activities'],
    status: '',
    tags: '',
    priority: ''
  })

  useEffect(() => {
    // Keyboard shortcut: Cmd+K or Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsExpanded(true)
      }
      if (e.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      const debounce = setTimeout(() => {
        performSearch()
      }, 300)
      return () => clearTimeout(debounce)
    } else {
      setResults({ contacts: [], tasks: [], activities: [] })
    }
  }, [query, filters])

  const performSearch = async () => {
    setSearching(true)
    try {
      const types = filters.types.join(',')
      const response = await fetch(
        `http://localhost:8000/api/search/?q=${encodeURIComponent(query)}&types=${types}`
      )
      const data = await response.json()
      setResults(data.results || { contacts: [], tasks: [], activities: [] })
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  const getTotalResults = () => {
    return (results.contacts?.length || 0) + 
           (results.tasks?.length || 0) + 
           (results.activities?.length || 0)
  }

  const highlightText = (text: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  return (
    <>
      {/* Search Bar */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:border-blue-500 transition-colors w-64"
        >
          <Search className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500 text-sm">Search... (⌘K)</span>
        </button>
      </div>

      {/* Expanded Search Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Search Input */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search contacts, tasks, activities..."
                  className="flex-1 outline-none text-lg"
                  autoFocus
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <Filter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search In:
                    </label>
                    <div className="flex gap-4">
                      {['contacts', 'tasks', 'activities'].map(type => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.types.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({...filters, types: [...filters.types, type]})
                              } else {
                                setFilters({...filters, types: filters.types.filter(t => t !== type)})
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {searching && (
                <div className="text-center py-8 text-gray-500">
                  Searching...
                </div>
              )}

              {!searching && query.length < 2 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Type at least 2 characters to search</p>
                  <p className="text-sm mt-2">Search across contacts, tasks, and activities</p>
                </div>
              )}

              {!searching && query.length >= 2 && getTotalResults() === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No results found for "{query}"
                </div>
              )}

              {!searching && getTotalResults() > 0 && (
                <div className="space-y-6">
                  {/* Contacts */}
                  {results.contacts && results.contacts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                        Contacts ({results.contacts.length})
                      </h3>
                      <div className="space-y-2">
                        {results.contacts.map((contact: any) => (
                          <a
                            key={contact.id}
                            href={contact.link}
                            className="block p-3 hover:bg-gray-50 rounded-lg border"
                            onClick={() => setIsExpanded(false)}
                          >
                            <div className="font-medium" dangerouslySetInnerHTML={{ __html: highlightText(contact.title) }} />
                            <div className="text-sm text-gray-500 mt-1">{contact.subtitle}</div>
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {contact.status}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {results.tasks && results.tasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                        Tasks ({results.tasks.length})
                      </h3>
                      <div className="space-y-2">
                        {results.tasks.map((task: any) => (
                          <a
                            key={task.id}
                            href={task.link}
                            className="block p-3 hover:bg-gray-50 rounded-lg border"
                            onClick={() => setIsExpanded(false)}
                          >
                            <div className="font-medium" dangerouslySetInnerHTML={{ __html: highlightText(task.title) }} />
                            <div className="text-sm text-gray-500 mt-1">{task.subtitle}</div>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.priority}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {task.status}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {results.activities && results.activities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                        Activities ({results.activities.length})
                      </h3>
                      <div className="space-y-2">
                        {results.activities.map((activity: any) => (
                          <a
                            key={activity.id}
                            href={activity.link}
                            className="block p-3 hover:bg-gray-50 rounded-lg border"
                            onClick={() => setIsExpanded(false)}
                          >
                            <div className="font-medium" dangerouslySetInnerHTML={{ __html: highlightText(activity.title) }} />
                            <div className="text-sm text-gray-500 mt-1">{activity.contact_name}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <span>Press ESC to close</span>
              {getTotalResults() > 0 && (
                <span>{getTotalResults()} result{getTotalResults() !== 1 ? 's' : ''} found</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
