import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DMZonePage from "../../../app/dm-zone/page";

// Mock Next.js router
const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn(() => "test-campaign-id"),
};

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock all API calls
jest.mock("@/lib/api/dm-zone", () => ({
  locationApi: {
    getAll: jest.fn(),
    getHierarchy: jest.fn(),
  },
  dmNoteApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

jest.mock("@/lib/api/session", () => ({
  sessionApi: {
    getAll: jest.fn(),
    adjustHP: jest.fn(),
    grantItem: jest.fn(),
  },
}));

// Mock ReactFlow
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
const mockSessionApi = require("@/lib/api/session").sessionApi;

describe("DMZone Integration", () => {
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

  const mockSessions = [
    {
      id: "session1",
      name: "Test Session",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    mockLocationApi.getAll.mockResolvedValue(mockLocations);
    mockLocationApi.getHierarchy.mockResolvedValue(mockLocations);
    mockDmNoteApi.getAll.mockResolvedValue(mockNotes);
    mockDmNoteApi.create.mockResolvedValue({ ...mockNotes[0], id: "new-note" });
    mockDmNoteApi.getLinks.mockResolvedValue([]);
    mockCharacterApi.getAll.mockResolvedValue(mockCharacters);
    mockQuestApi.getAll.mockResolvedValue(mockQuests);
    mockItemApi.getAll.mockResolvedValue(mockItems);
    mockSpellApi.getAll.mockResolvedValue(mockSpells);
    mockSessionApi.getAll.mockResolvedValue(mockSessions);
  });

  it("renders DM Zone page with all tabs", async () => {
    render(<DMZonePage />);

    expect(screen.getByText("DM Zone")).toBeInTheDocument();
    expect(screen.getByText("Relationship Graph")).toBeInTheDocument();
    expect(screen.getByText("DM Notes")).toBeInTheDocument();
    expect(screen.getByText("Locations")).toBeInTheDocument();
    expect(screen.getByText("Session Tools")).toBeInTheDocument();
  });

  it("displays graph view by default", async () => {
    render(<DMZonePage />);

    await waitFor(() => {
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });
  });

  it("switches to notes tab and shows notes", async () => {
    render(<DMZonePage />);

    fireEvent.click(screen.getByText("DM Notes"));

    await waitFor(() => {
      expect(screen.getByText("Create Note")).toBeInTheDocument();
    });
  });

  it("switches to locations tab and shows location manager", async () => {
    render(<DMZonePage />);

    fireEvent.click(screen.getByText("Locations"));

    await waitFor(() => {
      expect(screen.getByText("Location Hierarchy")).toBeInTheDocument();
    });
  });

  it("switches to session tools tab and shows session controls", async () => {
    render(<DMZonePage />);

    fireEvent.click(screen.getByText("Session Tools"));

    await waitFor(() => {
      expect(screen.getByText("Session Control Tools")).toBeInTheDocument();
    });
  });

  it("creates a new note in notes tab", async () => {
    render(<DMZonePage />);

    fireEvent.click(screen.getByText("DM Notes"));

    await waitFor(() => {
      expect(screen.getByText("Create Note")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create Note"));

    // Should show note editor
    expect(screen.getByText("Create New Note")).toBeInTheDocument();
  });

  it("shows error when no campaign ID is provided", () => {
    mockSearchParams.get.mockReturnValue("");

    render(<DMZonePage />);

    expect(
      screen.getByText("Please select a campaign to access DM tools."),
    ).toBeInTheDocument();
  });

  it("loads campaign data on mount", async () => {
    render(<DMZonePage />);

    await waitFor(() => {
      expect(mockLocationApi.getAll).toHaveBeenCalledWith(mockCampaignId);
      expect(mockDmNoteApi.getAll).toHaveBeenCalled();
      expect(mockCharacterApi.getAll).toHaveBeenCalled();
      expect(mockQuestApi.getAll).toHaveBeenCalledWith(mockCampaignId);
      expect(mockItemApi.getAll).toHaveBeenCalled();
      expect(mockSpellApi.getAll).toHaveBeenCalled();
    });
  });
});
