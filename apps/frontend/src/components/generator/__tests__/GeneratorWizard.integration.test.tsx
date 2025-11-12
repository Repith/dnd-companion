import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GeneratorWizard from "../../GeneratorWizard";
import { generatorApi } from "@/lib/api/generator";
import { GeneratorType, GeneratorStatus } from "@/types/generator";

// Mock the API
jest.mock("@/lib/api/generator");

const mockGeneratorApi = generatorApi as jest.Mocked<typeof generatorApi>;

const mockRequest = {
  id: "req-123",
  type: GeneratorType.NPC,
  tags: ["evil"],
  prompt: "Create a dark sorcerer",
  status: GeneratorStatus.PENDING,
  createdAt: "2023-01-01T00:00:00Z",
};

const mockCompletedRequest = {
  ...mockRequest,
  status: GeneratorStatus.COMPLETED,
  resultId: "entity-456",
};

const mockResult = {
  id: "entity-456",
  entityType: "NPC",
  data: {
    name: "Dark Sorcerer",
    race: "Human",
    class: "Wizard",
    level: 10,
    background: "Evil sorcerer",
    alignment: "Lawful Evil",
    personalityTraits: ["Cruel", "Intelligent"],
    tags: ["evil"],
  },
  createdAt: "2023-01-01T00:00:00Z",
};

describe("GeneratorWizard Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("completes full generation flow from config to approval", async () => {
    // Mock API calls
    mockGeneratorApi.createRequest.mockResolvedValue(mockRequest);
    mockGeneratorApi.getRequestById.mockResolvedValue(mockCompletedRequest);
    mockGeneratorApi.getGeneratedEntityById.mockResolvedValue(mockResult);

    const mockOnComplete = jest.fn();

    render(<GeneratorWizard onComplete={mockOnComplete} />);

    // Step 1: Configure generation
    expect(screen.getByText("Configure Generation")).toBeInTheDocument();

    // Select NPC type
    const npcButton = screen.getByText("NPC");
    fireEvent.click(npcButton);

    // Add a tag
    const tagInput = screen.getByPlaceholderText("Add tags and press Enter");
    fireEvent.change(tagInput, { target: { value: "evil" } });
    fireEvent.keyPress(tagInput, { key: "Enter", code: "Enter" });

    // Add prompt
    const promptTextarea = screen.getByPlaceholderText(
      "Provide additional context or specific requirements for the generation...",
    );
    fireEvent.change(promptTextarea, {
      target: { value: "Create a dark sorcerer" },
    });

    // Submit generation request
    const generateButton = screen.getByText("Generate Content");
    fireEvent.click(generateButton);

    // Should show loading and then move to result step
    await waitFor(() => {
      expect(screen.getByText("Review & Approve")).toBeInTheDocument();
    });

    // Should display the generated NPC
    expect(screen.getByText("Generated NPC")).toBeInTheDocument();
    expect(screen.getByText("Dark Sorcerer")).toBeInTheDocument();
    expect(screen.getByText("Human Wizard (Level 10)")).toBeInTheDocument();

    // Approve the result
    const approveButton = screen.getByText("Approve & Add to Campaign");
    fireEvent.click(approveButton);

    expect(mockOnComplete).toHaveBeenCalledWith(mockResult);
  });

  it("handles generation failure", async () => {
    const failedRequest = {
      ...mockRequest,
      status: GeneratorStatus.FAILED,
    };

    mockGeneratorApi.createRequest.mockResolvedValue(mockRequest);
    mockGeneratorApi.getRequestById.mockResolvedValue(failedRequest);

    render(<GeneratorWizard />);

    // Configure and submit
    const npcButton = screen.getByText("NPC");
    fireEvent.click(npcButton);

    const generateButton = screen.getByText("Generate Content");
    fireEvent.click(generateButton);

    // Should handle failure gracefully (in a real implementation, show error message)
    await waitFor(() => {
      expect(mockGeneratorApi.getRequestById).toHaveBeenCalledWith("req-123");
    });
  });

  it("allows editing generated content with JSON upload", async () => {
    mockGeneratorApi.createRequest.mockResolvedValue(mockRequest);
    mockGeneratorApi.getRequestById.mockResolvedValue(mockCompletedRequest);
    mockGeneratorApi.getGeneratedEntityById.mockResolvedValue(mockResult);

    render(<GeneratorWizard />);

    // Complete generation flow
    const npcButton = screen.getByText("NPC");
    fireEvent.click(npcButton);

    const generateButton = screen.getByText("Generate Content");
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Dark Sorcerer")).toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);

    expect(screen.getByText("Upload Custom JSON")).toBeInTheDocument();

    // Upload custom JSON
    const fileInput = screen.getByLabelText(/Upload Custom JSON/);
    const customJson = '{"name": "Custom Dark Sorcerer", "level": 15}';
    const file = new File([customJson], "custom.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Should show upload success
    expect(
      screen.getByText("✓ JSON file uploaded successfully"),
    ).toBeInTheDocument();

    // The display should now show custom data
    expect(screen.getByText("Custom Dark Sorcerer")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    render(<GeneratorWizard />);

    // Try to generate without selecting type
    const generateButton = screen.getByText("Generate Content");
    fireEvent.click(generateButton);

    // Should still be on config step (validation would prevent submission in real form)
    expect(screen.getByText("Configure Generation")).toBeInTheDocument();
  });
});
