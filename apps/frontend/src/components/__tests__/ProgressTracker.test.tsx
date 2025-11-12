import { render, screen, waitFor, act } from "@testing-library/react";
import ProgressTracker from "../ProgressTracker";
import { questApi } from "@/lib/api/quest";
import { QuestStatus } from "@/types/quest";

// Mock the quest API
jest.mock("@/lib/api/quest");
const mockQuestApi = questApi as jest.Mocked<typeof questApi>;

describe("ProgressTracker", () => {
  const mockQuests = [
    {
      id: "1",
      campaignId: "campaign-1",
      name: "Quest 1",
      summary: "Summary 1",
      description: "Description 1",
      status: QuestStatus.COMPLETED,
      experienceReward: 100,
      loot: null,
      npcIds: [],
      locationIds: [],
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      campaignId: "campaign-1",
      name: "Quest 2",
      summary: "Summary 2",
      description: "Description 2",
      status: QuestStatus.IN_PROGRESS,
      experienceReward: 200,
      loot: null,
      npcIds: [],
      locationIds: [],
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      campaignId: "campaign-1",
      name: "Quest 3",
      summary: "Summary 3",
      description: "Description 3",
      status: QuestStatus.NOT_STARTED,
      experienceReward: 50,
      loot: null,
      npcIds: [],
      locationIds: [],
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockQuestApi.getAll.mockResolvedValue(mockQuests);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(<ProgressTracker campaignId="campaign-1" />);
    expect(screen.getByText("Loading progress...")).toBeInTheDocument();
  });

  it("renders progress statistics correctly", async () => {
    render(<ProgressTracker campaignId="campaign-1" />);

    await waitFor(() => {
      expect(screen.getByText("Campaign Progress")).toBeInTheDocument();
    });

    // Check completion percentage
    expect(screen.getByText("1 of 3 quests")).toBeInTheDocument();
    expect(screen.getByText("33.3% complete")).toBeInTheDocument();

    // Check stats
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // Completed count
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Not Started")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();

    // Check experience gained
    expect(screen.getByText("100 XP")).toBeInTheDocument();
  });

  it("displays quest milestones", async () => {
    render(<ProgressTracker campaignId="campaign-1" />);

    await waitFor(() => {
      expect(screen.getByText("Quest Milestones")).toBeInTheDocument();
    });

    expect(screen.getByText("Quest 1")).toBeInTheDocument();
    expect(screen.getByText("+100 XP")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument(); // Completed indicator
  });

  it("calls questApi.getAll with correct campaignId", async () => {
    render(<ProgressTracker campaignId="campaign-1" />);

    await waitFor(() => {
      expect(mockQuestApi.getAll).toHaveBeenCalledWith("campaign-1");
    });
  });

  it("handles empty quest list", async () => {
    mockQuestApi.getAll.mockResolvedValue([]);

    render(<ProgressTracker campaignId="campaign-1" />);

    await waitFor(() => {
      expect(screen.getByText("0 of 0 quests")).toBeInTheDocument();
      expect(screen.getByText("0 XP")).toBeInTheDocument();
    });
  });
});
