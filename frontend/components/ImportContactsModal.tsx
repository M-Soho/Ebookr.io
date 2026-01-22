'use client'

import { useState } from 'react'
import { Upload, X, CheckCircle, AlertCircle, Download } from 'lucide-react'

interface ImportContactsModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: () => void
}

export function ImportContactsModal({ isOpen, onClose, onImportComplete }: ImportContactsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/contacts/import/template/')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'contacts_template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Failed to download template')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/contacts/bulk-import/', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
        onImportComplete?.()
      } else {
        alert(`Import failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setResult(null)
    setDragActive(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Import Contacts from CSV</h2>
          <button onClick={() => { resetModal(); onClose(); }} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Need a template?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download our CSV template with the correct format and example data.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Download CSV Template →
                </button>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {!result && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <Upload className={`h-12 w-12 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              
              {file ? (
                <div>
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="mt-3 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your CSV file here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Choose File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-3">
                    Supported format: CSV (Comma Separated Values)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900">Import Complete!</h3>
                    <div className="mt-2 space-y-1 text-sm text-green-800">
                      <p>✓ {result.created} contacts created</p>
                      <p>✓ {result.updated} contacts updated</p>
                      {result.errors > 0 && (
                        <p className="text-orange-700">⚠ {result.errors} errors occurred</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {result.error_details && result.error_details.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-orange-900">Errors ({result.errors})</h3>
                      <div className="mt-2 text-sm text-orange-800 space-y-1 max-h-40 overflow-y-auto">
                        {result.error_details.map((error: string, idx: number) => (
                          <p key={idx}>• {error}</p>
                        ))}
                        {result.errors > result.error_details.length && (
                          <p className="italic">
                            ... and {result.errors - result.error_details.length} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={resetModal}
                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Import Another File
              </button>
            </div>
          )}

          {/* CSV Format Info */}
          {!result && (
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Required columns: first_name, last_name, email</li>
                <li>Optional: company, status, source, notes, tags</li>
                <li>Tags: comma-separated (e.g., "vip,enterprise")</li>
                <li>Existing contacts (by email) will be updated</li>
              </ul>
            </div>
          )}
        </div>

        {!result && (
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={() => { resetModal(); onClose(); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Importing...' : 'Import Contacts'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
