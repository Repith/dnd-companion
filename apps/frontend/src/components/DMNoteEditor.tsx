"use client";

import React, { useState, useEffect, useRef } from "react";
import { dmNoteApi, locationApi } from "@/lib/api/dm-zone";
import { characterApi } from "@/lib/api/character";
import { questApi } from "@/lib/api/quest";
import { itemApi } from "@/lib/api/item";
import { spellApi } from "@/lib/api/spell";
import {
  DMNoteResponseDto,
  LinkResponseDto,
  CreateLinkDto,
} from "@/types/dm-zone";
import { CharacterResponseDto } from "@/types/character";
import { QuestResponseDto } from "@/types/quest";
import { LocationResponseDto } from "@/types/dm-zone";
import { ItemResponseDto } from "@/types/item";
import { SpellResponseDto } from "@/types/spell";

interface DMNoteEditorProps {
  campaignId: string;
  noteId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function DMNoteEditor({
  campaignId,
  noteId,
  onSave,
  onCancel,
}: DMNoteEditorProps) {
  const [note, setNote] = useState<DMNoteResponseDto | null>(null);
  const [content, setContent] = useState("");
  const [links, setLinks] = useState<LinkResponseDto[]>([]);
  const [availableEntities, setAvailableEntities] = useState<{
    characters: CharacterResponseDto[];
    quests: QuestResponseDto[];
    locations: LocationResponseDto[];
    items: ItemResponseDto[];
    spells: SpellResponseDto[];
  }>({
    characters: [],
    quests: [],
    locations: [],
    items: [],
    spells: [],
  });
  const [selectedEntityType, setSelectedEntityType] = useState<
    "NPC" | "QUEST" | "LOCATION" | "ITEM" | "SPELL"
  >("NPC");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadData();
  }, [campaignId, noteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [characters, quests, locations, items, spells] = await Promise.all([
        characterApi.getAll(),
        questApi.getAll(campaignId),
        locationApi.getAll(campaignId),
        itemApi.getAll(),
        spellApi.getAll(),
      ]);

      setAvailableEntities({
        characters,
        quests,
        locations,
        items,
        spells,
      });

      if (noteId) {
        const noteData = await dmNoteApi.getById(noteId);
        const noteLinks = await dmNoteApi.getLinks(noteId);
        if (noteData) {
          setNote(noteData);
          setContent(noteData.content);
          setLinks(noteLinks);
        }
      }
    } catch (error) {
      console.error("Error loading note data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      if (noteId) {
        await dmNoteApi.update(noteId, { content });
      } else {
        await dmNoteApi.create({ content });
      }
      onSave?.();
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!noteId || !selectedEntityId) return;

    try {
      const linkData: CreateLinkDto = {
        targetId: selectedEntityId,
        targetType: selectedEntityType,
      };
      await dmNoteApi.createLink(noteId, linkData);
      // Reload links
      const updatedLinks = await dmNoteApi.getLinks(noteId);
      setLinks(updatedLinks);
      setSelectedEntityId("");
    } catch (error) {
      console.error("Error adding link:", error);
      alert("Failed to add link");
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    try {
      await dmNoteApi.deleteLink(linkId);
      setLinks(links.filter((link) => link.id !== linkId));
    } catch (error) {
      console.error("Error removing link:", error);
      alert("Failed to remove link");
    }
  };

  const getEntityName = (type: string, id: string) => {
    const entities = availableEntities;
    switch (type) {
      case "NPC":
        return (
          entities.characters.find((c) => c.id === id)?.name || "Unknown NPC"
        );
      case "QUEST":
        return (
          entities.quests.find((q) => q.id === id)?.name || "Unknown Quest"
        );
      case "LOCATION":
        return (
          entities.locations.find((l) => l.id === id)?.name ||
          "Unknown Location"
        );
      case "ITEM":
        return entities.items.find((i) => i.id === id)?.name || "Unknown Item";
      case "SPELL":
        return (
          entities.spells.find((s) => s.id === id)?.name || "Unknown Spell"
        );
      default:
        return "Unknown Entity";
    }
  };

  const getAvailableEntitiesForType = () => {
    switch (selectedEntityType) {
      case "NPC":
        return availableEntities.characters;
      case "QUEST":
        return availableEntities.quests;
      case "LOCATION":
        return availableEntities.locations;
      case "ITEM":
        return availableEntities.items;
      case "SPELL":
        return availableEntities.spells;
      default:
        return [];
    }
  };

  if (loading) {
    return <div className="p-4">Loading note...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          {noteId ? "Edit Note" : "Create New Note"}
        </h2>
        <div className="space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>

      {/* Note Content */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Note Content
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your DM notes here..."
          rows={10}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
        />
      </div>

      {/* Entity Linking */}
      {noteId && (
        <div className="pt-6 border-t">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Entity Links
          </h3>

          {/* Add Link */}
          <div className="p-4 mb-4 rounded-md bg-gray-50">
            <h4 className="mb-3 font-medium text-gray-700">Add Link</h4>
            <div className="flex gap-2">
              <select
                value={selectedEntityType}
                onChange={(e) => {
                  setSelectedEntityType(e.target.value as any);
                  setSelectedEntityId("");
                }}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="NPC">NPC</option>
                <option value="QUEST">Quest</option>
                <option value="LOCATION">Location</option>
                <option value="ITEM">Item</option>
                <option value="SPELL">Spell</option>
              </select>
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">
                  Choose {selectedEntityType.toLowerCase()}...
                </option>
                {getAvailableEntitiesForType().map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {(entity as any).name || (entity as any).title || entity.id}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddLink}
                disabled={!selectedEntityId}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Link
              </button>
            </div>
          </div>

          {/* Existing Links */}
          <div>
            <h4 className="mb-3 font-medium text-gray-700">Linked Entities</h4>
            {links.length === 0 ? (
              <p className="text-sm text-gray-500">No links yet</p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-md bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        {link.targetType}:
                      </span>
                      <span className="text-sm">
                        {getEntityName(link.targetType, link.targetId)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveLink(link.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
