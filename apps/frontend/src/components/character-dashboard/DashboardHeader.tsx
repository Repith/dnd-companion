"use client";

import React from "react";

interface CharacterStatsMeta {
  totalUpdates: number;
  lastModified: Date | null;
  version: number;
}

interface DashboardHeaderStateSlice {
  hasUnsavedChanges: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  characterStats: CharacterStatsMeta;
  editMode: boolean;
  comparisonMode: boolean;
}

interface DashboardHeaderProps {
  state: DashboardHeaderStateSlice;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleEditMode: () => void;
  onToggleComparisonMode: () => void;
  onExport: () => void;
  stats: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: any[];
  };
  recentEvents: string[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  state,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggleEditMode,
  onToggleComparisonMode,
  onExport,
  stats,
  recentEvents,
}) => {
  const {
    hasUnsavedChanges,
    validationErrors,
    validationWarnings,
    characterStats,
    editMode,
    comparisonMode,
  } = state;

  return (
    <div className="p-4 bg-white border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <div className="px-2 py-1 text-sm text-yellow-800 bg-yellow-100 rounded">
              Unsaved changes
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="px-2 py-1 text-sm text-red-800 bg-red-100 rounded">
              Validation errors: {validationErrors.length}
            </div>
          )}

          {validationWarnings.length > 0 && (
            <div className="px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded">
              Warnings: {validationWarnings.length}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded border ${
              canUndo ? "hover:bg-gray-100" : "opacity-50 cursor-not-allowed"
            }`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            ↶
          </button>

          <button
            className={`px-3 py-1 rounded border ${
              canRedo ? "hover:bg-gray-100" : "opacity-50 cursor-not-allowed"
            }`}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            ↷
          </button>

          <button
            className={`px-3 py-1 rounded ${
              editMode ? "bg-green-600 text-white" : "border"
            }`}
            onClick={onToggleEditMode}
          >
            {editMode ? "Save" : "Edit"}
          </button>

          <button
            className={`px-3 py-1 rounded ${
              comparisonMode ? "bg-purple-600 text-white" : "border"
            }`}
            onClick={onToggleComparisonMode}
          >
            Compare
          </button>

          <button className="px-3 py-1 border rounded" onClick={onExport}>
            Export
          </button>
        </div>
      </div>

      <div className="p-3 mt-4 rounded bg-gray-50">
        <div className="text-sm text-gray-600">
          <strong>Recent Events:</strong> {stats.recentEvents.length} |
          <strong> Total:</strong> {stats.totalEvents} |
          <strong> Character Events:</strong>{" "}
          {stats.eventsByType.CHARACTER_UPDATED || 0} |
          <strong> Updates:</strong> {characterStats.totalUpdates} |
          <strong> Last Modified:</strong>{" "}
          {characterStats.lastModified
            ? characterStats.lastModified.toLocaleTimeString()
            : "Never"}
        </div>
        {recentEvents.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <strong>Last events:</strong> {recentEvents.slice(0, 3).join(" • ")}
          </div>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="p-3 mt-4 rounded bg-red-50">
          <h4 className="text-sm font-medium text-red-800">
            Validation Errors:
          </h4>
          <ul className="mt-1 text-sm text-red-700">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {validationWarnings.length > 0 && (
        <div className="p-3 mt-4 rounded bg-blue-50">
          <h4 className="text-sm font-medium text-blue-800">Warnings:</h4>
          <ul className="mt-1 text-sm text-blue-700">
            {validationWarnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
