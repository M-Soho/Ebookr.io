"use client";

import { useState, useEffect } from "react";

interface Segment {
  id: number;
  name: string;
  description: string;
  criteria: Record<string, any>;
  contact_count: number;
  is_active: boolean;
  created_at: string;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [viewingSegment, setViewingSegment] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    criteria: {
      status: "",
      tags: [] as string[],
      lead_score_min: "",
      lead_score_max: "",
    },
  });

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const response = await fetch("/api/segments/", {
        credentials: "include",
      });
      const data = await response.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error("Error fetching segments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingSegment 
        ? `/api/segments/${editingSegment.id}/` 
        : "/api/segments/";
      const method = editingSegment ? "PUT" : "POST";

      // Clean up criteria - remove empty values
      const cleanedCriteria: Record<string, any> = {};
      if (formData.criteria.status) {
        cleanedCriteria.status = formData.criteria.status;
      }
      if (formData.criteria.tags.length > 0) {
        cleanedCriteria.tags = formData.criteria.tags;
      }
      if (formData.criteria.lead_score_min) {
        cleanedCriteria.lead_score_min = parseInt(formData.criteria.lead_score_min);
      }
      if (formData.criteria.lead_score_max) {
        cleanedCriteria.lead_score_max = parseInt(formData.criteria.lead_score_max);
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          criteria: cleanedCriteria,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingSegment(null);
        resetForm();
        fetchSegments();
      }
    } catch (error) {
      console.error("Error saving segment:", error);
    }
  };

  const handleDelete = async (segmentId: number) => {
    if (!confirm("Are you sure you want to delete this segment?")) return;

    try {
      const response = await fetch(`/api/segments/${segmentId}/`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchSegments();
      }
    } catch (error) {
      console.error("Error deleting segment:", error);
    }
  };

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description,
      is_active: segment.is_active,
      criteria: {
        status: segment.criteria.status || "",
        tags: segment.criteria.tags || [],
        lead_score_min: segment.criteria.lead_score_min?.toString() || "",
        lead_score_max: segment.criteria.lead_score_max?.toString() || "",
      },
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
      criteria: {
        status: "",
        tags: [],
        lead_score_min: "",
        lead_score_max: "",
      },
    });
  };

  const handleNewSegment = () => {
    setEditingSegment(null);
    resetForm();
    setShowModal(true);
  };

  const handleAddTag = () => {
    const tagName = prompt("Enter tag name:");
    if (tagName && !formData.criteria.tags.includes(tagName)) {
      setFormData({
        ...formData,
        criteria: {
          ...formData.criteria,
          tags: [...formData.criteria.tags, tagName],
        },
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      criteria: {
        ...formData.criteria,
        tags: formData.criteria.tags.filter((t) => t !== tag),
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Segments</h1>
          <p className="text-gray-600 mt-2">Create dynamic contact groups based on criteria</p>
        </div>
        <button
          onClick={handleNewSegment}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Segment
        </button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`bg-white rounded-lg shadow p-6 ${
              !segment.is_active ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {segment.name}
                </h3>
                {!segment.is_active && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(segment)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(segment.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>

            {segment.description && (
              <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
            )}

            {/* Criteria Display */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria:</h4>
              <div className="space-y-1">
                {segment.criteria.status && (
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-medium capitalize">{segment.criteria.status}</span>
                  </div>
                )}
                {segment.criteria.tags && segment.criteria.tags.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Tags: <span className="font-medium">{segment.criteria.tags.join(", ")}</span>
                  </div>
                )}
                {(segment.criteria.lead_score_min || segment.criteria.lead_score_max) && (
                  <div className="text-sm text-gray-600">
                    Lead Score: <span className="font-medium">
                      {segment.criteria.lead_score_min || 0} - {segment.criteria.lead_score_max || 100}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-2xl font-bold text-blue-600">
                {segment.contact_count}
              </div>
              <span className="text-sm text-gray-500">contacts</span>
            </div>
          </div>
        ))}
      </div>

      {segments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No segments yet. Create your first segment to get started!
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingSegment ? "Edit Segment" : "Create Segment"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segment Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Segment Criteria</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Status
                  </label>
                  <select
                    value={formData.criteria.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, status: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="lead">Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.criteria.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-900 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Tag
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Lead Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.criteria.lead_score_min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          criteria: { ...formData.criteria, lead_score_min: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Lead Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.criteria.lead_score_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          criteria: { ...formData.criteria, lead_score_max: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSegment(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSegment ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
