// tabs/NotesTab.tsx
import React from "react";
import type {
  CharacterResponseDto,
  UpdateCharacterDto,
} from "@/types/character";

interface NotesTabProps {
  character: CharacterResponseDto;
  onChange: (updates: UpdateCharacterDto) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ character, onChange }) => {
  return (
    <div className="p-6 bg-white border rounded-lg">
      <h3 className="mb-4 text-lg font-semibold">Character Notes</h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">
              Personality Traits
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={4}
              value={character.personalityTraits || ""}
              onChange={(e) =>
                onChange({
                  personalityTraits: e.target.value,
                } as UpdateCharacterDto)
              }
              placeholder="Describe your character's personality traits."
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Ideals</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={3}
              value={character.ideals || ""}
              onChange={(e) =>
                onChange({
                  ideals: e.target.value,
                } as UpdateCharacterDto)
              }
              placeholder="What does your character believe in?"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Bonds</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={3}
              value={character.bonds || ""}
              onChange={(e) =>
                onChange({
                  bonds: e.target.value,
                } as UpdateCharacterDto)
              }
              placeholder="What connections does your character have?"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Flaws</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={3}
              value={character.flaws || ""}
              onChange={(e) =>
                onChange({
                  flaws: e.target.value,
                } as UpdateCharacterDto)
              }
              placeholder="What are your character's flaws?"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block mb-2 text-sm font-medium">Backstory</label>
        <textarea
          className="w-full px-3 py-2 border rounded"
          rows={8}
          value={character.backstory || ""}
          onChange={(e) =>
            onChange({
              backstory: e.target.value,
            } as UpdateCharacterDto)
          }
          placeholder="Tell your character's story."
        />
      </div>
    </div>
  );
};
