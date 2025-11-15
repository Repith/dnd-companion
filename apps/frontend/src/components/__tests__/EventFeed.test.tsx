import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventFeed from "../EventFeed";
import { eventApi } from "@/lib/api/event";

// Mock the event API
jest.mock("@/lib/api/event", () => ({
  eventApi: {
    getEvents: jest.fn(),
    getSessionEvents: jest.fn(),
    getCharacterEvents: jest.fn(),
  },
}));

const mockEventApi = eventApi as jest.Mocked<typeof eventApi>;

describe("EventFeed", () => {
  const mockEvents = [
    {
      id: "event-1",
      type: "DAMAGE_APPLIED",
      timestamp: new Date(),
      actorId: "user-1",
      targetId: "char-1",
      sessionId: "session-1",
      payload: {
        damage: 10,
        damageType: "slashing",
        source: "sword",
      },
    },
    {
      id: "event-2",
      type: "HEALING_RECEIVED",
      timestamp: new Date(),
      actorId: "user-2",
      targetId: "char-1",
      sessionId: "session-1",
      payload: {
        healing: 5,
        source: "potion",
      },
    },
    {
      id: "event-3",
      type: "QUEST_FINISHED",
      timestamp: new Date(),
      actorId: "user-1",
      sessionId: "session-1",
      payload: {
        questId: "quest-1",
        experienceReward: 100,
        loot: [],
      },
    },
    {
      id: "event-4",
      type: "EXPERIENCE_GAINED",
      timestamp: new Date(),
      targetId: "char-1",
      sessionId: "session-1",
      payload: {
        experienceGained: 50,
        totalExperience: 250,
      },
    },
    {
      id: "event-5",
      type: "LEVEL_UP",
      timestamp: new Date(),
      targetId: "char-1",
      sessionId: "session-1",
      payload: {
        newLevel: 3,
        oldLevel: 2,
      },
    },
    {
      id: "event-6",
      type: "DICE_ROLL",
      timestamp: new Date(),
      actorId: "user-1",
      sessionId: "session-1",
      payload: {
        notation: "1d20",
        result: 15,
        label: "Attack roll",
        individualResults: [15],
      },
    },
  ] as any; // Type assertion to avoid complex typing issues

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockEventApi.getEvents.mockImplementation(() => new Promise(() => {}));

    render(<EventFeed />);

    expect(screen.getByText("Loading events...")).toBeInTheDocument();
  });

  it("renders events for general feed", async () => {
    mockEventApi.getEvents.mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
      limit: 20,
      offset: 0,
    });

    render(<EventFeed />);

    await waitFor(() => {
      expect(screen.getByText("Event Feed")).toBeInTheDocument();
    });

    // Check that various event types are displayed
    expect(screen.getByText("Took 10 slashing")).toBeInTheDocument();
    expect(screen.getByText("Healed for 5 HP")).toBeInTheDocument();
    expect(
      screen.getByText("Quest completed - 100 XP awarded"),
    ).toBeInTheDocument();
    expect(screen.getByText("Gained 50 XP (Total: 250)")).toBeInTheDocument();
    expect(screen.getByText("Leveled up from 2 to 3")).toBeInTheDocument();
    expect(
      screen.getByText("Rolled 1d20: 15 (Attack roll)"),
    ).toBeInTheDocument();
  });

  it("renders session events when sessionId is provided", async () => {
    mockEventApi.getSessionEvents.mockResolvedValue({
      events: mockEvents.slice(0, 2),
      total: 2,
      limit: 20,
      offset: 0,
    });

    render(<EventFeed sessionId="session-1" />);

    await waitFor(() => {
      expect(mockEventApi.getSessionEvents).toHaveBeenCalledWith("session-1", {
        limit: 20,
      });
    });
  });

  it("renders character events when characterId is provided", async () => {
    mockEventApi.getCharacterEvents.mockResolvedValue({
      events: mockEvents.slice(0, 2),
      total: 2,
      limit: 20,
      offset: 0,
    });

    render(<EventFeed characterId="char-1" />);

    await waitFor(() => {
      expect(mockEventApi.getCharacterEvents).toHaveBeenCalledWith("char-1", {
        limit: 20,
      });
    });
  });

  it("displays correct icons for different event types", async () => {
    mockEventApi.getEvents.mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
      limit: 20,
      offset: 0,
    });

    render(<EventFeed />);

    await waitFor(() => {
      expect(screen.getByText("❤️")).toBeInTheDocument(); // Damage/Healing
      expect(screen.getByText("🎯")).toBeInTheDocument(); // Quest
      expect(screen.getByText("⭐")).toBeInTheDocument(); // Experience
      expect(screen.getByText("⬆️")).toBeInTheDocument(); // Level up
      expect(screen.getByText("🎲")).toBeInTheDocument(); // Dice roll
    });
  });

  it("shows empty state when no events", async () => {
    mockEventApi.getEvents.mockResolvedValue({
      events: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    render(<EventFeed />);

    await waitFor(() => {
      expect(screen.getByText("No events to display")).toBeInTheDocument();
    });
  });

  it("handles refresh button click", async () => {
    const user = userEvent.setup();

    mockEventApi.getEvents.mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
      limit: 20,
      offset: 0,
    });

    render(<EventFeed />);

    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    // Click refresh button
    await user.click(screen.getByText("Refresh"));

    // Should call API again
    expect(mockEventApi.getEvents).toHaveBeenCalledTimes(2);
  });

  it("displays error state on API failure", async () => {
    mockEventApi.getEvents.mockRejectedValue(new Error("API Error"));

    render(<EventFeed />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load events")).toBeInTheDocument();
    });
  });

  it("shows auto-refresh indicator when enabled", async () => {
    mockEventApi.getEvents.mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
      limit: 20,
      offset: 0,
    });

    render(<EventFeed autoRefresh={true} refreshInterval={30000} />);

    await waitFor(() => {
      expect(
        screen.getByText("Auto-refreshing every 30 seconds"),
      ).toBeInTheDocument();
    });
  });

  it("displays event metadata correctly", async () => {
    mockEventApi.getEvents.mockResolvedValue({
      events: [mockEvents[0]], // Just the damage event
      total: 1,
      limit: 20,
      offset: 0,
    });

    render(<EventFeed />);

    await waitFor(() => {
      expect(screen.getByText("Session")).toBeInTheDocument();
      expect(screen.getByText("Actor: user-1...")).toBeInTheDocument();
      expect(screen.getByText("Target: char-1...")).toBeInTheDocument();
    });
  });
});
