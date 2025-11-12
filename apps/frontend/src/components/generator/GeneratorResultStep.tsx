"use client";

import { useState } from "react";
import {
  GeneratorRequest,
  GeneratedEntity,
  GeneratedNPC,
  GeneratedLocation,
  GeneratedQuest,
} from "@/types/generator";

interface GeneratorResultStepProps {
  request: GeneratorRequest | null;
  result: GeneratedEntity | null;
  onApprove: () => void;
  onEdit: () => void;
}

export default function GeneratorResultStep({
  request,
  result,
  onApprove,
  onEdit,
}: GeneratorResultStepProps) {
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          setUploadedData(jsonData);
        } catch (error) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const currentData = uploadedData || result?.data;

  if (!request || !result) {
    return (
      <div className="py-8 text-center">
        <div className="w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-600">Generating content...</p>
      </div>
    );
  }

  const renderResult = () => {
    switch (result.entityType) {
      case "NPC":
        const npc = currentData as GeneratedNPC;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {npc.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {npc.race} {npc.class} (Level {npc.level})
                </p>
                <p className="text-sm text-gray-600">
                  Alignment: {npc.alignment}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Background</h4>
                <p className="text-sm text-gray-600">{npc.background}</p>
              </div>
            </div>
            {npc.personalityTraits && npc.personalityTraits.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900">
                  Personality Traits
                </h4>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {npc.personalityTraits.map((trait, index) => (
                    <li key={index}>{trait}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "LOCATION":
        const location = currentData as GeneratedLocation;
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {location.name}
              </h3>
              <p className="text-sm text-gray-600">Type: {location.type}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Description</h4>
              <p className="text-sm text-gray-600">{location.description}</p>
            </div>
          </div>
        );

      case "CAMPAIGN":
        const quest = currentData as GeneratedQuest;
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {quest.name}
              </h3>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Description</h4>
              <p className="text-sm text-gray-600">{quest.description}</p>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h4 className="font-medium text-gray-900">Generated Content</h4>
            <pre className="p-4 overflow-auto text-sm text-gray-600 rounded-md bg-gray-50">
              {JSON.stringify(currentData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Generated {result.entityType}
          </h2>
          <p className="text-sm text-gray-600">
            Status: {request.status} • Created:{" "}
            {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {isEditing ? "Cancel Edit" : "Edit"}
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
          >
            Approve & Add to Campaign
          </button>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-gray-50">{renderResult()}</div>

      {isEditing && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <h4 className="mb-2 font-medium text-gray-900">Upload Custom JSON</h4>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-1 text-xs text-gray-600">
            Upload a JSON file to replace the generated content
          </p>
          {uploadedData && (
            <p className="mt-2 text-sm text-green-600">
              ✓ JSON file uploaded successfully
            </p>
          )}
        </div>
      )}

      {request.tags && request.tags.length > 0 && (
        <div>
          <h4 className="mb-2 font-medium text-gray-900">Tags Used</h4>
          <div className="flex flex-wrap gap-2">
            {request.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {request.prompt && (
        <div>
          <h4 className="mb-2 font-medium text-gray-900">Prompt Used</h4>
          <p className="p-3 text-sm text-gray-600 rounded-md bg-gray-50">
            {request.prompt}
          </p>
        </div>
      )}
    </div>
  );
}
