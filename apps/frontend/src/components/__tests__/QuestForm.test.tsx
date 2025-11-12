import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestForm from "../QuestForm";
import { questApi } from "@/lib/api/quest";
import { QuestStatus } from "@/types/quest";

// Mock the quest API
jest.mock("@/lib/api/quest");
const mockQuestApi = questApi as jest.Mocked<typeof questApi>;

describe("QuestForm", () => {
  const mockQuest = {
    id: "1",
    campaignId: "campaign-1",
    name: "Test Quest",
    summary: "Test Summary",
    description: "Test Description",
    status: QuestStatus.NOT_STARTED,
    experienceReward: 100,
    loot: null,
    npcIds: [],
    locationIds: [],
    notes: "Test Notes",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultProps = {
    campaignId: "campaign-1",
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders create form correctly", () => {
    render(<QuestForm {...defaultProps} />);

    expect(screen.getByText("Create New Quest")).toBeInTheDocument();
    expect(screen.getByLabelText(/quest name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/experience reward/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dm notes/i)).toBeInTheDocument();
  });

  it("renders edit form correctly", () => {
    render(<QuestForm {...defaultProps} quest={mockQuest} />);

    expect(screen.getByText("Edit Quest")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Quest")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Summary")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Notes")).toBeInTheDocument();
  });

  it("submits create form successfully", async () => {
    const user = userEvent.setup();
    mockQuestApi.create.mockResolvedValue(mockQuest);

    render(<QuestForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/quest name/i), "New Quest");
    await user.type(screen.getByLabelText(/summary/i), "New Summary");
    await user.type(screen.getByLabelText(/experience reward/i), "150");

    await user.click(screen.getByRole("button", { name: /create quest/i }));

    await waitFor(() => {
      expect(mockQuestApi.create).toHaveBeenCalledWith("campaign-1", {
        name: "New Quest",
        summary: "New Summary",
        experienceReward: 150,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it("submits edit form successfully", async () => {
    const user = userEvent.setup();
    mockQuestApi.update.mockResolvedValue(mockQuest);

    render(<QuestForm {...defaultProps} quest={mockQuest} />);

    const nameInput = screen.getByDisplayValue("Test Quest");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Quest");

    await user.click(screen.getByRole("button", { name: /update quest/i }));

    await waitFor(() => {
      expect(mockQuestApi.update).toHaveBeenCalledWith("1", {
        name: "Updated Quest",
        summary: "Test Summary",
        description: "Test Description",
        experienceReward: 100,
        notes: "Test Notes",
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it("shows validation errors for required fields", async () => {
    const user = userEvent.setup();

    render(<QuestForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /create quest/i }));

    expect(
      await screen.findByText("Quest name is required"),
    ).toBeInTheDocument();
  });

  it("handles API errors", async () => {
    const user = userEvent.setup();
    mockQuestApi.create.mockRejectedValue(new Error("API Error"));

    render(<QuestForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/quest name/i), "Test Quest");
    await user.click(screen.getByRole("button", { name: /create quest/i }));

    expect(
      await screen.findByText("Failed to create quest"),
    ).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(<QuestForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    mockQuestApi.create.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<QuestForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/quest name/i), "Test Quest");
    await user.click(screen.getByRole("button", { name: /create quest/i }));

    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
  });
});
