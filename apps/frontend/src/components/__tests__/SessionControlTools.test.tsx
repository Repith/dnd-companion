import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SessionControlTools from "../SessionControlTools";

// Mock the API calls
jest.mock("@/lib/api/session", () => ({
  sessionApi: {
    getAll: jest.fn(),
    adjustHP: jest.fn(),
    grantItem: jest.fn(),
  },
}));

jest.mock("@/lib/api/character", () => ({
  characterApi: {
    getAll: jest.fn(),
  },
}));

jest.mock("@/lib/api/item", () => ({
  itemApi: {
    getAll: jest.fn(),
  },
}));

jest.mock("@/lib/api/spell", () => ({
  spellApi: {
    getAll: jest.fn(),
  },
}));

const mockSessionApi = require("@/lib/api/session").sessionApi;
const mockCharacterApi = require("@/lib/api/character").characterApi;
const mockItemApi = require("@/lib/api/item").itemApi;
const mockSpellApi = require("@/lib/api/spell").spellApi;

describe("SessionControlTools", () => {
  const mockCampaignId = "test-campaign-id";

  const mockSessions = [
    {
      id: "session1",
      name: "Test Session",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCharacters = [
    {
      id: "char1",
      name: "Test Character",
      level: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockItems = [
    {
      id: "item1",
      name: "Test Item",
      type: "WEAPON",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockSpells = [
    {
      id: "spell1",
      name: "Test Spell",
      level: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    mockSessionApi.getAll.mockResolvedValue(mockSessions);
    mockCharacterApi.getAll.mockResolvedValue(mockCharacters);
    mockItemApi.getAll.mockResolvedValue(mockItems);
    mockSpellApi.getAll.mockResolvedValue(mockSpells);
  });

  it("renders component with title", async () => {
    render(<SessionControlTools campaignId={mockCampaignId} />);

    expect(screen.getByText("Session Control Tools")).toBeInTheDocument();
  });

  it("loads and displays sessions, characters, items, and spells", async () => {
    render(<SessionControlTools campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(screen.getByText(/Test Session/)).toBeInTheDocument();
      expect(screen.getByText("Test Character (Level 5)")).toBeInTheDocument();
      expect(screen.getByText("Test Item (WEAPON)")).toBeInTheDocument();
      expect(screen.getByText("Test Spell (Level 1)")).toBeInTheDocument();
    });
  });

  it("allows HP adjustment", async () => {
    mockSessionApi.adjustHP.mockResolvedValue({} as any);

    render(<SessionControlTools campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(screen.getByText(/Test Session/)).toBeInTheDocument();
    });

    // Select session
    fireEvent.change(screen.getByLabelText("Select Session"), {
      target: { value: "session1" },
    });

    // Select character
    fireEvent.change(screen.getByLabelText("Select Character"), {
      target: { value: "char1" },
    });

    // Enter HP adjustment
    fireEvent.change(screen.getByPlaceholderText("HP change (+/-)"), {
      target: { value: "10" },
    });

    // Click adjust HP button
    fireEvent.click(screen.getByText("Adjust HP"));

    await waitFor(() => {
      expect(mockSessionApi.adjustHP).toHaveBeenCalledWith("session1", {
        characterId: "char1",
        hpAdjustment: 10,
      });
    });
  });

  it("allows granting items", async () => {
    mockSessionApi.grantItem.mockResolvedValue({} as any);

    render(<SessionControlTools campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(screen.getByText(/Test Session/)).toBeInTheDocument();
    });

    // Select session
    fireEvent.change(screen.getByLabelText("Select Session"), {
      target: { value: "session1" },
    });

    // Select character
    fireEvent.change(screen.getByLabelText("Select Character"), {
      target: { value: "char1" },
    });

    // Select item
    fireEvent.change(screen.getByDisplayValue("Choose an item..."), {
      target: { value: "item1" },
    });

    // Set quantity
    fireEvent.change(screen.getByPlaceholderText("Quantity"), {
      target: { value: "2" },
    });

    // Click grant item button
    fireEvent.click(screen.getByText("Grant Item"));

    await waitFor(() => {
      expect(mockSessionApi.grantItem).toHaveBeenCalledWith("session1", {
        characterId: "char1",
        itemId: "item1",
        quantity: 2,
      });
    });
  });

  it("shows alert for spell granting (placeholder)", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<SessionControlTools campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(screen.getByText(/Test Session/)).toBeInTheDocument();
    });

    // Select session
    fireEvent.change(screen.getByLabelText("Select Session"), {
      target: { value: "session1" },
    });

    // Select character
    fireEvent.change(screen.getByLabelText("Select Character"), {
      target: { value: "char1" },
    });

    // Select spell
    fireEvent.change(screen.getByDisplayValue("Choose a spell..."), {
      target: { value: "spell1" },
    });

    // Click grant spell button
    fireEvent.click(screen.getByText("Grant Spell"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Spell granting not yet implemented for Test Spell",
      );
    });

    alertSpy.mockRestore();
  });

  it("disables buttons when required fields are not selected", async () => {
    render(<SessionControlTools campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(screen.getByText("Test Session")).toBeInTheDocument();
    });

    // HP adjust button should be disabled initially
    expect(screen.getByText("Adjust HP")).toBeDisabled();

    // Select session and character
    fireEvent.change(screen.getByLabelText("Select Session"), {
      target: { value: "session1" },
    });
    fireEvent.change(screen.getByLabelText("Select Character"), {
      target: { value: "char1" },
    });

    // Enter HP adjustment
    fireEvent.change(screen.getByPlaceholderText("HP change (+/-)"), {
      target: { value: "5" },
    });

    // Now HP adjust button should be enabled
    expect(screen.getByText("Adjust HP")).not.toBeDisabled();
  });
});
