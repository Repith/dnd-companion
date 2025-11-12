import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Spellbook } from "../Spellbook";
import { spellApi } from "@/lib/api/spell";
import { characterApi } from "@/lib/api/character";
import { SpellResponseDto, SpellSchool } from "@/types/spell";
import {
  CharacterResponseDto,
  Race,
  CharacterClass,
  Alignment,
} from "@/types/character";

// Mock the API functions
jest.mock("@/lib/api/spell");
jest.mock("@/lib/api/character");

const mockSpellApi = spellApi as jest.Mocked<typeof spellApi>;
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
    remainingSlots: { 1: 4, 2: 2 },
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
    higherLevel:
      "When you cast this spell using a spell slot of 2nd level or higher...",
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

describe("Spellbook", () => {
  const mockOnCharacterUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSpellApi.getAll.mockResolvedValue(mockSpells);
  });

  it("renders loading state initially", () => {
    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders spells after loading", async () => {
    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
      expect(screen.getByText("Shield")).toBeInTheDocument();
    });
  });

  it("filters spells by search term", async () => {
    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Spell name or description...",
    );
    fireEvent.change(searchInput, { target: { value: "force" } });

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
      expect(screen.queryByText("Shield")).not.toBeInTheDocument();
    });
  });

  it("filters spells by level", async () => {
    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
    });

    const levelSelect = screen.getByLabelText("Level");
    fireEvent.change(levelSelect, { target: { value: "1" } });

    // Both spells should still be visible as they're both level 1
    expect(screen.getByText("Magic Missile")).toBeInTheDocument();
    expect(screen.getByText("Shield")).toBeInTheDocument();
  });

  it("filters spells by school", async () => {
    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
    });

    const schoolSelect = screen.getByLabelText("School");
    fireEvent.change(schoolSelect, {
      target: { value: SpellSchool.EVOCATION },
    });

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
      expect(screen.queryByText("Shield")).not.toBeInTheDocument();
    });
  });

  it("shows prepare button for known spells", async () => {
    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
    });

    // Magic Missile should show "Prepared" since it's in preparedSpells
    expect(screen.getByText("Prepared")).toBeInTheDocument();

    // Shield should show "Prepare" since it's known but not prepared
    const prepareButtons = screen.getAllByText("Prepare");
    expect(prepareButtons.length).toBeGreaterThan(0);
  });

  it("calls prepareSpell when prepare button is clicked", async () => {
    mockCharacterApi.prepareSpell.mockResolvedValue({
      ...mockCharacter,
      preparedSpells: ["spell1", "spell2"],
    });

    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Shield")).toBeInTheDocument();
    });

    const prepareButtons = screen.getAllByText("Prepare");
    fireEvent.click(prepareButtons[0]);

    await waitFor(() => {
      expect(mockCharacterApi.prepareSpell).toHaveBeenCalledWith(
        mockCharacter.id,
        "spell2",
      );
      expect(mockOnCharacterUpdate).toHaveBeenCalled();
    });
  });

  it("calls unprepareSpell when prepared button is clicked", async () => {
    mockCharacterApi.unprepareSpell.mockResolvedValue({
      ...mockCharacter,
      preparedSpells: [],
    });

    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
    });

    const preparedButton = screen.getByText("Prepared");
    fireEvent.click(preparedButton);

    await waitFor(() => {
      expect(mockCharacterApi.unprepareSpell).toHaveBeenCalledWith(
        mockCharacter.id,
        "spell1",
      );
      expect(mockOnCharacterUpdate).toHaveBeenCalled();
    });
  });

  it("displays spell information correctly", async () => {
    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
    });

    // Check for spell level badge (not the dropdown option)
    const levelBadges = screen.getAllByText("Level 1");
    expect(levelBadges.length).toBeGreaterThan(0);
    expect(screen.getByText("Evocation")).toBeInTheDocument();
    expect(screen.getByText("Casting Time: 1 action")).toBeInTheDocument();
    expect(screen.getByText("Range: 120 feet")).toBeInTheDocument();
    expect(screen.getByText("Duration: Instantaneous")).toBeInTheDocument();
    expect(screen.getByText("Classes: Wizard, Sorcerer")).toBeInTheDocument();
  });

  it("shows no spells found message when filtered results are empty", async () => {
    render(
      <Spellbook
        character={mockCharacter}
        onCharacterUpdate={mockOnCharacterUpdate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Magic Missile")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Spell name or description...",
    );
    fireEvent.change(searchInput, { target: { value: "nonexistent spell" } });

    await waitFor(() => {
      expect(
        screen.getByText("No spells found matching your criteria."),
      ).toBeInTheDocument();
    });
  });
});
