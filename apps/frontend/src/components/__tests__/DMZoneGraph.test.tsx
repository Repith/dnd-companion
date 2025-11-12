import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DMZoneGraph from "../DMZoneGraph";

// Mock the API calls
jest.mock("@/lib/api/dm-zone", () => ({
  locationApi: {
    getAll: jest.fn(),
  },
  dmNoteApi: {
    getAll: jest.fn(),
    getLinks: jest.fn(),
  },
}));

jest.mock("@/lib/api/character", () => ({
  characterApi: {
    getAll: jest.fn(),
  },
}));

jest.mock("@/lib/api/quest", () => ({
  questApi: {
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

// Mock ReactFlow components
jest.mock("reactflow", () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Node: () => <div />,
  Edge: () => <div />,
  addEdge: jest.fn(),
  useNodesState: () => [[], jest.fn()],
  useEdgesState: () => [[], jest.fn()],
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  MiniMap: () => <div data-testid="minimap" />,
  Panel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="panel">{children}</div>
  ),
}));

const mockLocationApi = require("@/lib/api/dm-zone").locationApi;
const mockDmNoteApi = require("@/lib/api/dm-zone").dmNoteApi;
const mockCharacterApi = require("@/lib/api/character").characterApi;
const mockQuestApi = require("@/lib/api/quest").questApi;
const mockItemApi = require("@/lib/api/item").itemApi;
const mockSpellApi = require("@/lib/api/spell").spellApi;

describe("DMZoneGraph", () => {
  const mockCampaignId = "test-campaign-id";

  const mockLocations = [
    {
      id: "loc1",
      name: "Test Location",
      type: "TOWN",
      description: "A test town",
      parentId: null,
      npcIds: ["npc1"],
      questIds: ["quest1"],
      campaignIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockNotes = [
    {
      id: "note1",
      content: "Test note content",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCharacters = [
    {
      id: "npc1",
      name: "Test NPC",
      level: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockQuests = [
    {
      id: "quest1",
      name: "Test Quest",
      status: "IN_PROGRESS",
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
    mockLocationApi.getAll.mockResolvedValue(mockLocations);
    mockDmNoteApi.getAll.mockResolvedValue(mockNotes);
    mockDmNoteApi.getLinks.mockResolvedValue([]);
    mockCharacterApi.getAll.mockResolvedValue(mockCharacters);
    mockQuestApi.getAll.mockResolvedValue(mockQuests);
    mockItemApi.getAll.mockResolvedValue(mockItems);
    mockSpellApi.getAll.mockResolvedValue(mockSpells);
  });

  it("renders loading state initially", () => {
    render(<DMZoneGraph campaignId={mockCampaignId} />);
    expect(screen.getByText("Loading graph...")).toBeInTheDocument();
  });

  it("renders graph components after loading", async () => {
    render(<DMZoneGraph campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
      expect(screen.getByTestId("controls")).toBeInTheDocument();
      expect(screen.getByTestId("background")).toBeInTheDocument();
      expect(screen.getByTestId("minimap")).toBeInTheDocument();
      expect(screen.getByTestId("panel")).toBeInTheDocument();
    });
  });

  it("displays panel with correct title", async () => {
    render(<DMZoneGraph campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(screen.getByText("DM Zone Graph")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Drag nodes to reposition. Connect nodes to create relationships.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("calls API methods with correct parameters", async () => {
    render(<DMZoneGraph campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(mockLocationApi.getAll).toHaveBeenCalledWith(mockCampaignId);
      expect(mockDmNoteApi.getAll).toHaveBeenCalled();
      expect(mockCharacterApi.getAll).toHaveBeenCalled();
      expect(mockQuestApi.getAll).toHaveBeenCalledWith(mockCampaignId);
      expect(mockItemApi.getAll).toHaveBeenCalled();
      expect(mockSpellApi.getAll).toHaveBeenCalled();
    });
  });

  it("handles API errors gracefully", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockLocationApi.getAll.mockRejectedValue(new Error("API Error"));

    render(<DMZoneGraph campaignId={mockCampaignId} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error building graph data:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });
});
