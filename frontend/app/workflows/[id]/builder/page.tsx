'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface WorkflowNode {
  id: string
  type: 'start' | 'action' | 'decision' | 'wait' | 'ab_test' | 'end'
  label: string
  config: any
  x: number
  y: number
}

interface Workflow {
  id: number
  name: string
  description: string
  is_active: boolean
  workflow_data: {
    nodes: WorkflowNode[]
    edges: Array<{ from: string; to: string; label?: string }>
  }
}

export default function WorkflowBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const workflowId = params?.id as string

  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [showNodeMenu, setShowNodeMenu] = useState(false)

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow()
    }
  }, [workflowId])

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/workflows/${workflowId}/`, {
        credentials: 'include',
      })
      const data = await response.json()
      setWorkflow(data)
    } catch (error) {
      console.error('Failed to fetch workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const addNode = (type: WorkflowNode['type']) => {
    if (!workflow) return

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      label: getNodeLabel(type),
      config: {},
      x: 100,
      y: 100 + (workflow.workflow_data.nodes?.length || 0) * 150,
    }

    const updatedWorkflow = {
      ...workflow,
      workflow_data: {
        ...workflow.workflow_data,
        nodes: [...(workflow.workflow_data.nodes || []), newNode],
      },
    }

    setWorkflow(updatedWorkflow)
    setShowNodeMenu(false)
  }

  const saveWorkflow = async () => {
    if (!workflow) return

    try {
      await fetch(`http://localhost:8000/api/workflows/${workflowId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          workflow_data: workflow.workflow_data,
        }),
      })
      alert('Workflow saved successfully!')
    } catch (error) {
      console.error('Failed to save workflow:', error)
      alert('Failed to save workflow')
    }
  }

  const getNodeLabel = (type: WorkflowNode['type']): string => {
    const labels = {
      start: 'Start',
      action: 'Send Email',
      decision: 'If/Then Branch',
      wait: 'Wait',
      ab_test: 'A/B Test',
      end: 'End',
    }
    return labels[type]
  }

  const getNodeIcon = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'start':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
        )
      case 'action':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        )
      case 'decision':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        )
      case 'wait':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      case 'ab_test':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  const getNodeColor = (type: WorkflowNode['type']): string => {
    const colors = {
      start: 'bg-green-100 border-green-300 text-green-800',
      action: 'bg-blue-100 border-blue-300 text-blue-800',
      decision: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      wait: 'bg-purple-100 border-purple-300 text-purple-800',
      ab_test: 'bg-pink-100 border-pink-300 text-pink-800',
      end: 'bg-gray-100 border-gray-300 text-gray-800',
    }
    return colors[type]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center">Loading workflow...</div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center">Workflow not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/workflows')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold">{workflow.name}</h1>
              <p className="text-sm text-gray-600">{workflow.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNodeMenu(!showNodeMenu)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <span>+ Add Node</span>
            </button>
            <button
              onClick={saveWorkflow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Node Palette */}
        {showNodeMenu && (
          <div className="w-64 bg-white border-r border-gray-200 p-4">
            <h3 className="font-semibold mb-4">Add Node</h3>
            <div className="space-y-2">
              {(['action', 'decision', 'wait', 'ab_test'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 hover:shadow-md transition-all ${getNodeColor(
                    type
                  )}`}
                >
                  {getNodeIcon(type)}
                  <span className="font-medium">{getNodeLabel(type)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 p-8 overflow-auto" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="relative">
            {workflow.workflow_data.nodes?.map((node) => (
              <div
                key={node.id}
                className={`absolute w-48 p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-all ${getNodeColor(
                  node.type
                )}`}
                style={{
                  left: node.x,
                  top: node.y,
                }}
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getNodeIcon(node.type)}
                  <span className="font-semibold text-sm">{node.type.toUpperCase()}</span>
                </div>
                <div className="text-sm">{node.label}</div>
              </div>
            ))}

            {(!workflow.workflow_data.nodes || workflow.workflow_data.nodes.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  Your workflow is empty. Click "Add Node" to get started!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Node Config Panel */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Configure Node</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node Type
                </label>
                <div className="text-sm text-gray-600 capitalize">{selectedNode.type}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => {
                    const updated = { ...selectedNode, label: e.target.value }
                    setSelectedNode(updated)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {selectedNode.type === 'action' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Send Email</option>
                    <option>Send SMS</option>
                    <option>Update Contact</option>
                    <option>Add Tag</option>
                  </select>
                </div>
              )}

              {selectedNode.type === 'wait' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wait Duration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <select className="px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Hours</option>
                      <option>Days</option>
                      <option>Weeks</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'decision' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2">
                    <option>Lead Score</option>
                    <option>Status</option>
                    <option>Tag</option>
                    <option>Custom Field</option>
                  </select>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2">
                    <option>Greater Than</option>
                    <option>Less Than</option>
                    <option>Equals</option>
                    <option>Contains</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
