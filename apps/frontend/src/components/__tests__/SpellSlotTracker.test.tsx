import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SpellSlotTracker } from "../SpellSlotTracker";
import { characterApi } from "@/lib/api/character";
import {
  CharacterResponseDto,
  Race,
  CharacterClass,
  Alignment,
} from "@/types/character";

// Mock the API functions
jest.mock("@/lib/api/character");

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
  featuresTraits: [],
  personalityTraits: "",
  ideals: "",
  bonds: "",
  flaws: "",
  appearance: {},
  backstory: "",
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

describe("SpellSlotTracker", () => {
  const mockOnCharacterUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders spell slots correctly", () => {
    render(
      <SpellSlotTracker
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    expect(screen.getByText("Spell Slots")).toBeInTheDocument();
    expect(screen.getByText("Level 1")).toBeInTheDocument();
    expect(screen.getByText("Level 2")).toBeInTheDocument();
    expect(screen.getByText("3/4")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  it("shows no spell slots message when character has no slots", () => {
    const characterWithoutSlots = {
      ...mockCharacter,
      spellcasting: undefined,
    };

    render(
      <SpellSlotTracker
        character={characterWithoutSlots}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    expect(
      screen.getByText("No spell slots available for this character."),
    ).toBeInTheDocument();
  });

  it("calls updateSpellSlots when slot is clicked", async () => {
    mockCharacterApi.updateSpellSlots.mockResolvedValue(mockCharacter);

    render(
      <SpellSlotTracker
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    // Find the minus button for level 1
    const minusButtons = screen.getAllByText("-");
    fireEvent.click(minusButtons[0]); // Click the first minus button (level 1)

    await waitFor(() => {
      expect(mockCharacterApi.updateSpellSlots).toHaveBeenCalledWith(
        mockCharacter.id,
        { 1: 2, 2: 2 }, // Should decrease level 1 from 3 to 2
      );
      expect(mockOnCharacterUpdate).toHaveBeenCalled();
    });
  });

  it("calls updateSpellSlots when plus button is clicked", async () => {
    mockCharacterApi.updateSpellSlots.mockResolvedValue(mockCharacter);

    render(
      <SpellSlotTracker
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    // Find the plus button for level 1
    const plusButtons = screen.getAllByText("+");
    fireEvent.click(plusButtons[0]); // Click the first plus button (level 1)

    await waitFor(() => {
      expect(mockCharacterApi.updateSpellSlots).toHaveBeenCalledWith(
        mockCharacter.id,
        { 1: 4, 2: 2 }, // Should increase level 1 from 3 to 4
      );
      expect(mockOnCharacterUpdate).toHaveBeenCalled();
    });
  });

  it("prevents decreasing slots below 0", async () => {
    const characterWithZeroSlots: CharacterResponseDto = {
      ...mockCharacter,
      spellcasting: {
        ...mockCharacter.spellcasting!,
        remainingSlots: { 1: 0, 2: 2 },
      },
    };

    render(
      <SpellSlotTracker
        character={characterWithZeroSlots}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    const minusButtons = screen.getAllByText("-");
    expect(minusButtons[0]).toBeDisabled();
  });

  it("prevents increasing slots above maximum", async () => {
    render(
      <SpellSlotTracker
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    const plusButtons = screen.getAllByText("+");
    expect(plusButtons[0]).toBeDisabled(); // Level 1 is already at max (3/4)
  });

  it("displays total slots used correctly", () => {
    render(
      <SpellSlotTracker
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    expect(screen.getByText("Total Slots Used:")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // 4-3 + 2-2 = 1 slot used
  });

  it("renders slot circles correctly", () => {
    render(
      <SpellSlotTracker
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    // Should have 4 circles for level 1, with 1 filled (red) and 3 empty
    const level1Circles = screen.getAllByLabelText(
      /Toggle spell slot .* for level 1/,
    );
    expect(level1Circles).toHaveLength(4);

    // Check that the circles have the correct classes
    expect(level1Circles[0]).toHaveClass("bg-red-500"); // Used slot
    expect(level1Circles[1]).toHaveClass("bg-white"); // Available slot
    expect(level1Circles[2]).toHaveClass("bg-white"); // Available slot
    expect(level1Circles[3]).toHaveClass("bg-white"); // Available slot
  });
});
