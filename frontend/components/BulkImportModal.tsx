"use client";

import { useState, useRef } from "react";

interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  errors: number;
  error_details: string[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/contacts/bulk-import/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => {
          onImportComplete();
          handleClose();
        }, 3000);
      }
    } catch (error) {
      console.error("Error importing contacts:", error);
      setResult({
        success: false,
        created: 0,
        updated: 0,
        errors: 1,
        error_details: ["Failed to import contacts. Please try again."],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/contacts/import/template/", {
        credentials: "include",
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "import_template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading template:", error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Import Contacts</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {!result && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Download the CSV template below</li>
                <li>Fill in your contact information</li>
                <li>Upload the completed CSV file</li>
                <li>Review the import results</li>
              </ol>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">CSV Format</h4>
              <p className="text-sm text-blue-800 mb-3">
                Required columns: <strong>email</strong>
              </p>
              <p className="text-sm text-blue-800 mb-3">
                Optional columns: first_name, last_name, company, status, source, tags, notes
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                📥 Download CSV Template
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                disabled={importing}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </span>
                ) : (
                  "Import Contacts"
                )}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div>
            <div className={`p-6 rounded-lg mb-6 ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <h3 className={`text-xl font-semibold mb-4 ${result.success ? "text-green-900" : "text-red-900"}`}>
                {result.success ? "✓ Import Complete" : "⚠ Import Failed"}
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{result.created}</div>
                  <div className="text-sm text-gray-600">Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.updated}</div>
                  <div className="text-sm text-gray-600">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{result.errors}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>

              {result.error_details && result.error_details.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                    {result.error_details.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  {result.errors > result.error_details.length && (
                    <p className="text-sm text-red-700 mt-2">
                      ... and {result.errors - result.error_details.length} more errors
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
