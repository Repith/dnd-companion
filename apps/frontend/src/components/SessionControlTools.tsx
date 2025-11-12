"use client";

import React, { useState, useEffect } from "react";
import { sessionApi } from "@/lib/api/session";
import { characterApi } from "@/lib/api/character";
import { itemApi } from "@/lib/api/item";
import { spellApi } from "@/lib/api/spell";
import { SessionResponseDto } from "@/types/session";
import { CharacterResponseDto } from "@/types/character";
import { ItemResponseDto } from "@/types/item";
import { SpellResponseDto } from "@/types/spell";

interface SessionControlToolsProps {
  campaignId: string;
  currentSessionId?: string;
}

export default function SessionControlTools({
  campaignId,
  currentSessionId,
}: SessionControlToolsProps) {
  const [sessions, setSessions] = useState<SessionResponseDto[]>([]);
  const [characters, setCharacters] = useState<CharacterResponseDto[]>([]);
  const [items, setItems] = useState<ItemResponseDto[]>([]);
  const [spells, setSpells] = useState<SpellResponseDto[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>(
    currentSessionId || "",
  );
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [hpAdjustment, setHpAdjustment] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [selectedSpell, setSelectedSpell] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      const [sessionsData, charactersData, itemsData, spellsData] =
        await Promise.all([
          sessionApi.getAll(campaignId),
          characterApi.getAll(),
          itemApi.getAll(),
          spellApi.getAll(),
        ]);
      setSessions(sessionsData);
      setCharacters(charactersData);
      setItems(itemsData);
      setSpells(spellsData);
    } catch (error) {
      console.error("Error loading session control data:", error);
    }
  };

  const handleHpAdjustment = async () => {
    if (!selectedSession || !selectedCharacter || hpAdjustment === 0) return;

    setLoading(true);
    try {
      await sessionApi.adjustHP(selectedSession, {
        characterId: selectedCharacter,
        hpAdjustment,
      });
      alert(`HP adjusted by ${hpAdjustment} for selected character`);
      setHpAdjustment(0);
    } catch (error) {
      console.error("Error adjusting HP:", error);
      alert("Failed to adjust HP");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantItem = async () => {
    if (!selectedSession || !selectedCharacter || !selectedItem) return;

    setLoading(true);
    try {
      await sessionApi.grantItem(selectedSession, {
        characterId: selectedCharacter,
        itemId: selectedItem,
        quantity: itemQuantity,
      });
      alert(
        `Granted ${itemQuantity}x ${
          items.find((i) => i.id === selectedItem)?.name
        } to selected character`,
      );
      setSelectedItem("");
      setItemQuantity(1);
    } catch (error) {
      console.error("Error granting item:", error);
      alert("Failed to grant item");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantSpell = async () => {
    if (!selectedSession || !selectedCharacter || !selectedSpell) return;

    setLoading(true);
    try {
      // Note: This would need a backend endpoint for granting spells
      // For now, we'll use a placeholder
      alert(
        `Spell granting not yet implemented for ${
          spells.find((s) => s.id === selectedSpell)?.name
        }`,
      );
      setSelectedSpell("");
    } catch (error) {
      console.error("Error granting spell:", error);
      alert("Failed to grant spell");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-6 space-y-6 bg-white rounded-lg shadow-md"
      role="region"
      aria-labelledby="session-tools-heading"
    >
      <h2
        id="session-tools-heading"
        className="text-2xl font-bold text-gray-800"
      >
        Session Control Tools
      </h2>

      {/* Session Selection */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Session
        </label>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a session...</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              Session {session.id} -{" "}
              {new Date(session.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Character Selection */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Character
        </label>
        <select
          value={selectedCharacter}
          onChange={(e) => setSelectedCharacter(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a character...</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name} (Level {character.level})
            </option>
          ))}
        </select>
      </div>

      {/* HP Adjustment */}
      <div className="pt-4 border-t">
        <h3 className="mb-3 text-lg font-semibold text-gray-800">
          HP Adjustment
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={hpAdjustment}
            onChange={(e) => setHpAdjustment(parseInt(e.target.value) || 0)}
            placeholder="HP change (+/-)"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleHpAdjustment}
            disabled={
              loading ||
              !selectedSession ||
              !selectedCharacter ||
              hpAdjustment === 0
            }
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adjusting..." : "Adjust HP"}
          </button>
        </div>
      </div>

      {/* Grant Item */}
      <div className="pt-4 border-t">
        <h3 className="mb-3 text-lg font-semibold text-gray-800">Grant Item</h3>
        <div className="space-y-2">
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose an item...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.type})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
              min="1"
              placeholder="Quantity"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleGrantItem}
              disabled={
                loading ||
                !selectedSession ||
                !selectedCharacter ||
                !selectedItem
              }
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Granting..." : "Grant Item"}
            </button>
          </div>
        </div>
      </div>

      {/* Grant Spell */}
      <div className="pt-4 border-t">
        <h3 className="mb-3 text-lg font-semibold text-gray-800">
          Grant Spell
        </h3>
        <div className="flex gap-2">
          <select
            value={selectedSpell}
            onChange={(e) => setSelectedSpell(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a spell...</option>
            {spells.map((spell) => (
              <option key={spell.id} value={spell.id}>
                {spell.name} (Level {spell.level})
              </option>
            ))}
          </select>
          <button
            onClick={handleGrantSpell}
            disabled={
              loading ||
              !selectedSession ||
              !selectedCharacter ||
              !selectedSpell
            }
            className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Granting..." : "Grant Spell"}
          </button>
        </div>
      </div>
    </div>
  );
}
