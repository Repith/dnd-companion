"use client";

import React, { useState, useEffect } from "react";
import { locationApi } from "@/lib/api/dm-zone";
import {
  LocationResponseDto,
  CreateLocationDto,
  UpdateLocationDto,
  LocationType,
} from "@/types/dm-zone";

interface LocationManagerProps {
  campaignId: string;
}

interface LocationNode extends LocationResponseDto {
  children: LocationNode[];
}

export default function LocationManager({ campaignId }: LocationManagerProps) {
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [creatingLocation, setCreatingLocation] = useState<string | null>(null);
  const [formData, setFormData] = useState<
    Partial<CreateLocationDto & UpdateLocationDto>
  >({
    name: "",
    type: LocationType.TOWN,
    description: "",
    mapUrl: "",
    parentId: "",
  });

  useEffect(() => {
    loadLocations();
  }, [campaignId]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const hierarchy = await locationApi.getHierarchy(campaignId);
      const locationMap = new Map<string, LocationNode>();

      // First pass: create nodes
      hierarchy.forEach((loc) => {
        locationMap.set(loc.id, { ...loc, children: [] });
      });

      // Second pass: build hierarchy
      const rootLocations: LocationNode[] = [];
      hierarchy.forEach((loc) => {
        const node = locationMap.get(loc.id)!;
        if (loc.parentId) {
          const parent = locationMap.get(loc.parentId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          rootLocations.push(node);
        }
      });

      setLocations(rootLocations);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (parentId?: string) => {
    try {
      const locationData: CreateLocationDto = {
        name: formData.name!,
        type: formData.type!,
        ...(formData.description && { description: formData.description }),
        ...(formData.mapUrl && { mapUrl: formData.mapUrl }),
        ...((parentId || formData.parentId) && {
          parentId: parentId || formData.parentId,
        }),
      };

      await locationApi.create(campaignId, locationData);
      await loadLocations();
      setCreatingLocation(null);
      resetForm();
    } catch (error) {
      console.error("Error creating location:", error);
      alert("Failed to create location");
    }
  };

  const handleUpdate = async (locationId: string) => {
    try {
      const updateData: UpdateLocationDto = {
        ...(formData.name !== undefined && { name: formData.name }),
        ...(formData.type !== undefined && { type: formData.type }),
        ...(formData.description !== undefined && {
          description: formData.description,
        }),
        ...(formData.mapUrl !== undefined && { mapUrl: formData.mapUrl }),
        ...(formData.parentId !== undefined && { parentId: formData.parentId }),
      };

      await locationApi.update(campaignId, locationId, updateData);
      await loadLocations();
      setEditingLocation(null);
      resetForm();
    } catch (error) {
      console.error("Error updating location:", error);
      alert("Failed to update location");
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      await locationApi.delete(campaignId, locationId);
      await loadLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Failed to delete location");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: LocationType.TOWN,
      description: "",
      mapUrl: "",
      parentId: "",
    });
  };

  const startEditing = (location: LocationResponseDto) => {
    setEditingLocation(location.id);
    setFormData({
      name: location.name,
      type: location.type,
      description: location.description || "",
      mapUrl: location.mapUrl || "",
      parentId: location.parentId || "",
    });
  };

  const startCreating = (parentId?: string) => {
    setCreatingLocation(parentId || "root");
    resetForm();
    if (parentId) {
      setFormData((prev) => ({ ...prev, parentId }));
    }
  };

  const renderLocationNode = (
    location: LocationNode,
    depth = 0,
  ): React.ReactNode => {
    const isEditing = editingLocation === location.id;
    const isCreatingChild = creatingLocation === location.id;

    return (
      <div key={location.id} className="mb-2">
        <div
          className={`flex items-center p-3 bg-white border rounded-lg shadow-sm ${
            depth > 0 ? "ml-6" : ""
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {isEditing ? (
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Location name"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as LocationType,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(LocationType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description"
                rows={2}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(location.id)}
                  className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingLocation(null)}
                  className="px-3 py-1 text-white bg-gray-600 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{location.name}</h3>
                <p className="text-sm text-gray-600">{location.type}</p>
                {location.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {location.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startCreating(location.id)}
                  className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Add Child
                </button>
                <button
                  onClick={() => startEditing(location)}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {isCreatingChild && (
          <div
            className="p-3 mt-2 border rounded-lg bg-gray-50"
            style={{ marginLeft: `${(depth + 1) * 24}px` }}
          >
            <h4 className="mb-2 font-medium text-gray-700">
              Create New Location
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Location name"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as LocationType,
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(LocationType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description"
                rows={2}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleCreate(location.id)}
                  className="px-3 py-1 text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setCreatingLocation(null)}
                  className="px-3 py-1 text-white bg-gray-600 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {location.children.map((child) => renderLocationNode(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading locations...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Location Hierarchy</h2>
        <button
          onClick={() => startCreating()}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Add Root Location
        </button>
      </div>

      {creatingLocation === "root" && (
        <div className="p-4 mb-6 border rounded-lg bg-gray-50">
          <h3 className="mb-3 font-medium text-gray-700">
            Create Root Location
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Location name"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as LocationType,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.values(LocationType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Description"
              rows={2}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleCreate()}
                className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
              >
                Create
              </button>
              <button
                onClick={() => setCreatingLocation(null)}
                className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {locations.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No locations yet. Create your first location!
          </p>
        ) : (
          locations.map((location) => renderLocationNode(location))
        )}
      </div>
    </div>
  );
}
