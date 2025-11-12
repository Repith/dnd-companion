import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Spellbook } from "../Spellbook";
import { SpellSlotTracker } from "../SpellSlotTracker";
import { Features } from "../Features";
import { spellApi } from "@/lib/api/spell";
import { featureApi } from "@/lib/api/feature";
import { characterApi } from "@/lib/api/character";
import {
  CharacterResponseDto,
  Race,
  CharacterClass,
  Alignment,
} from "@/types/character";
import { SpellResponseDto, SpellSchool } from "@/types/spell";
import { FeatureResponseDto } from "@/types/feature";

// Mock the API functions
jest.mock("@/lib/api/spell");
jest.mock("@/lib/api/feature");
jest.mock("@/lib/api/character");

const mockSpellApi = spellApi as jest.Mocked<typeof spellApi>;
const mockFeatureApi = featureApi as jest.Mocked<typeof featureApi>;
const mockCharacterApi = characterApi as jest.Mocked<typeof characterApi>;

const mockCharacter: CharacterResponseDto = {
  id: "1",
  name: "Test Character",
  race: Race.HUMAN,
  multiclasses: [{ id: "1", class: CharacterClass.WIZARD, level: 3 }],
  level: 3,
  background: "Sage",
  alignment: Alignment.NEUTRAL_GOOD,
  experiencePoints: 2700,
  inspiration: false,
  abilityScores: {
    id: "1",
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 16,
    wisdom: 12,
    charisma: 10,
  },
  skillProficiencies: [],
  savingThrows: { intelligence: true, wisdom: true },
  proficiencyBonus: 2,
  hitDice: "3d6",
  hitPoints: { max: 24, current: 24, temporary: 0 },
  armorClass: 13,
  initiative: 0,
  speed: 30,
  spellcasting: {
    class: "Wizard",
    saveDC: 13,
    attackBonus: 5,
    knownSpells: ["spell1", "spell2"],
    preparedSpells: ["spell1"],
    slots: { 1: 4, 2: 2 },
    remainingSlots: { 1: 3, 2: 2 },
  },
  featuresTraits: ["Spellcasting", "Arcane Recovery"],
  personalityTraits: "I use big words to sound smart",
  ideals: "Knowledge is power",
  bonds: "My spellbook is my most prized possession",
  flaws: "I am easily distracted by shiny objects",
  appearance: {},
  backstory: "Born in a library, raised by books...",
  languages: ["Common", "Elvish"],
  currency: { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 },
  ownerId: "user1",
  campaignId: undefined,
  isNPC: false,
  npcRole: undefined,
  challengeRating: undefined,
  lootTable: undefined,
  knownSpells: ["spell1", "spell2"],
  preparedSpells: ["spell1"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSpells: SpellResponseDto[] = [
  {
    id: "spell1",
    name: "Magic Missile",
    level: 1,
    school: SpellSchool.EVOCATION,
    castingTime: "1 action",
    range: "120 feet",
    components: { verbal: true, somatic: true },
    duration: { duration: "Instantaneous" },
    classes: ["Wizard", "Sorcerer"],
    description: "You create three glowing darts of magical force...",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "spell2",
    name: "Shield",
    level: 1,
    school: SpellSchool.ABJURATION,
    castingTime: "1 reaction",
    range: "Self",
    components: { verbal: true, somatic: true },
    duration: { duration: "1 round" },
    classes: ["Wizard", "Sorcerer"],
    description: "An invisible barrier of magical force appears...",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockFeatures: FeatureResponseDto[] = [
  {
    id: "feature1",
    name: "Spellcasting",
    description: "You have learned to cast spells...",
    source: "Wizard",
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "feature2",
    name: "Arcane Recovery",
    description: "You have learned to regain some of your magical energy...",
    source: "Wizard",
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("Spell and Feature Operations Integration", () => {
  const mockOnCharacterUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSpellApi.getAll.mockResolvedValue(mockSpells);
    mockFeatureApi.getAll.mockResolvedValue(mockFeatures);
  });

  describe("Spell Operations", () => {
    it("allows preparing and unpreparing spells", async () => {
      const updatedCharacterPrepared = {
        ...mockCharacter,
        preparedSpells: ["spell1", "spell2"],
      };
      const updatedCharacterUnprepared = {
        ...mockCharacter,
        preparedSpells: [],
      };

      mockCharacterApi.prepareSpell.mockResolvedValue(updatedCharacterPrepared);
      mockCharacterApi.unprepareSpell.mockResolvedValue(
        updatedCharacterUnprepared,
      );

      render(
        <Spellbook
          character={mockCharacter}
          onCharacterUpdate={mockOnCharacterUpdate}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Shield")).toBeInTheDocument();
      });

      // Prepare Shield spell
      const prepareButtons = screen.getAllByText("Prepare");
      fireEvent.click(prepareButtons[0]);

      await waitFor(() => {
        expect(mockCharacterApi.prepareSpell).toHaveBeenCalledWith(
          mockCharacter.id,
          "spell2",
        );
        expect(mockOnCharacterUpdate).toHaveBeenCalledWith(
          updatedCharacterPrepared,
        );
      });

      // Now unprepare Magic Missile
      const preparedButton = screen.getByText("Prepared");
      fireEvent.click(preparedButton);

      await waitFor(() => {
        expect(mockCharacterApi.unprepareSpell).toHaveBeenCalledWith(
          mockCharacter.id,
          "spell1",
        );
        expect(mockOnCharacterUpdate).toHaveBeenCalledWith(
          updatedCharacterUnprepared,
        );
      });
    });

    it("updates spell slot tracking when slots are modified", async () => {
      const updatedCharacter = {
        ...mockCharacter,
        spellcasting: {
          ...mockCharacter.spellcasting!,
          remainingSlots: { 1: 2, 2: 2 },
        },
      };

      mockCharacterApi.updateSpellSlots.mockResolvedValue(updatedCharacter);

      render(
        <SpellSlotTracker
          character={mockCharacter}
          onCharacterUpdate={mockOnCharacterUpdate}
        />,
      );

      // Use a level 1 spell slot
      const minusButtons = screen.getAllByText("-");
      fireEvent.click(minusButtons[0]);

      await waitFor(() => {
        expect(mockCharacterApi.updateSpellSlots).toHaveBeenCalledWith(
          mockCharacter.id,
          { 1: 2, 2: 2 },
        );
        expect(mockOnCharacterUpdate).toHaveBeenCalledWith(updatedCharacter);
      });

      // Verify the UI updates
      expect(screen.getByText("2/4")).toBeInTheDocument();
    });
  });

  describe("Feature Operations", () => {
    it("allows adding new features", async () => {
      const updatedCharacter = {
        ...mockCharacter,
        featuresTraits: ["Spellcasting", "Arcane Recovery", "New Feature"],
      };

      mockCharacterApi.update.mockResolvedValue(updatedCharacter);

      render(
        <Features
          character={mockCharacter}
          onCharacterUpdate={mockOnCharacterUpdate}
        />,
      );

      // Click Add Feature button
      const addButton = screen.getByText("Add Feature");
      fireEvent.click(addButton);

      // Enter feature text
      const textarea = screen.getByPlaceholderText(
        "Enter feature or trait description...",
      );
      fireEvent.change(textarea, { target: { value: "New Feature" } });

      // Click Add button
      const addConfirmButton = screen.getByText("Add");
      fireEvent.click(addConfirmButton);

      await waitFor(() => {
        expect(mockCharacterApi.update).toHaveBeenCalledWith(mockCharacter.id, {
          featuresTraits: ["Spellcasting", "Arcane Recovery", "New Feature"],
        });
        expect(mockOnCharacterUpdate).toHaveBeenCalledWith(updatedCharacter);
      });
    });

    it("allows removing features", async () => {
      const updatedCharacter = {
        ...mockCharacter,
        featuresTraits: ["Arcane Recovery"],
      };

      mockCharacterApi.update.mockResolvedValue(updatedCharacter);

      render(
        <Features
          character={mockCharacter}
          onCharacterUpdate={mockOnCharacterUpdate}
        />,
      );

      // Find and click remove button for "Spellcasting"
      const removeButtons = screen.getAllByLabelText(/Remove feature:/);
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(mockCharacterApi.update).toHaveBeenCalledWith(mockCharacter.id, {
          featuresTraits: ["Arcane Recovery"],
        });
        expect(mockOnCharacterUpdate).toHaveBeenCalledWith(updatedCharacter);
      });
    });

    it("allows editing personality traits", async () => {
      const updatedCharacter = {
        ...mockCharacter,
        personalityTraits: "I am very curious and always ask questions",
      };

      mockCharacterApi.update.mockResolvedValue(updatedCharacter);

      render(
        <Features
          character={mockCharacter}
          onCharacterUpdate={mockOnCharacterUpdate}
        />,
      );

      // Click Edit button for personality traits
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]); // First edit button should be for personality traits

      // Enter new text
      const textarea = screen.getByPlaceholderText(
        "Describe your character's personality traits...",
      );
      fireEvent.change(textarea, {
        target: { value: "I am very curious and always ask questions" },
      });

      // Click Save
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCharacterApi.update).toHaveBeenCalledWith(mockCharacter.id, {
          personalityTraits: "I am very curious and always ask questions",
        });
        expect(mockOnCharacterUpdate).toHaveBeenCalledWith(updatedCharacter);
      });
    });
  });

  describe("Combined Operations", () => {
    it("maintains data consistency across components", async () => {
      // This test ensures that when one component updates the character,
      // other components receive the updated data

      const characterWithUpdatedSpells = {
        ...mockCharacter,
        preparedSpells: ["spell1", "spell2"],
        spellcasting: {
          ...mockCharacter.spellcasting!,
          remainingSlots: { 1: 2, 2: 2 },
        },
      };

      mockCharacterApi.prepareSpell.mockResolvedValue(
        characterWithUpdatedSpells,
      );
      mockCharacterApi.updateSpellSlots.mockResolvedValue({
        ...characterWithUpdatedSpells,
        spellcasting: {
          ...characterWithUpdatedSpells.spellcasting!,
          remainingSlots: { 1: 1, 2: 2 },
        },
      });

      const { rerender } = render(
        <Spellbook
          character={mockCharacter}
          onCharacterUpdate={mockOnCharacterUpdate}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Shield")).toBeInTheDocument();
      });

      // Prepare a spell
      const prepareButtons = screen.getAllByText("Prepare");
      fireEvent.click(prepareButtons[0]);

      await waitFor(() => {
        expect(mockOnCharacterUpdate).toHaveBeenCalledWith(
          characterWithUpdatedSpells,
        );
      });

      // Rerender with updated character
      rerender(
        <SpellSlotTracker
          character={characterWithUpdatedSpells}
          onCharacterUpdate={mockOnCharacterUpdate}
        />,
      );

      // Use a spell slot
      const minusButtons = screen.getAllByText("-");
      fireEvent.click(minusButtons[0]);

      await waitFor(() => {
        expect(mockCharacterApi.updateSpellSlots).toHaveBeenCalledWith(
          mockCharacter.id,
          { 1: 1, 2: 2 },
        );
      });
    });
  });
});
