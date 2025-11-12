import { render, screen, fireEvent } from "@testing-library/react";
import GeneratorResultStep from "../GeneratorResultStep";
import {
  GeneratorRequest,
  GeneratedEntity,
  GeneratorStatus,
  GeneratorType,
} from "@/types/generator";

const mockRequest: GeneratorRequest = {
  id: "123",
  type: GeneratorType.NPC,
  tags: ["evil", "mysterious"],
  prompt: "Create a dark sorcerer",
  status: GeneratorStatus.COMPLETED,
  resultId: "456",
  createdAt: "2023-01-01T00:00:00Z",
};

const mockResult: GeneratedEntity = {
  id: "456",
  entityType: "NPC",
  data: {
    name: "Dark Sorcerer",
    race: "Human",
    class: "Wizard",
    level: 10,
    background: "Evil sorcerer",
    alignment: "Lawful Evil",
    personalityTraits: ["Cruel", "Intelligent"],
    tags: ["evil", "mysterious"],
  },
  createdAt: "2023-01-01T00:00:00Z",
};

const mockOnApprove = jest.fn();
const mockOnEdit = jest.fn();

describe("GeneratorResultStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state when no request or result", () => {
    render(
      <GeneratorResultStep
        request={null}
        result={null}
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
      />,
    );

    expect(screen.getByText("Generating content...")).toBeInTheDocument();
  });

  it("renders NPC result correctly", () => {
    render(
      <GeneratorResultStep
        request={mockRequest}
        result={mockResult}
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
      />,
    );

    expect(screen.getByText("Generated NPC")).toBeInTheDocument();
    expect(screen.getByText("Dark Sorcerer")).toBeInTheDocument();
    expect(screen.getByText("Human Wizard (Level 10)")).toBeInTheDocument();
    expect(screen.getByText("Alignment: Lawful Evil")).toBeInTheDocument();
  });

  it("renders tags used", () => {
    render(
      <GeneratorResultStep
        request={mockRequest}
        result={mockResult}
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
      />,
    );

    expect(screen.getByText("Tags Used")).toBeInTheDocument();
    expect(screen.getByText("evil")).toBeInTheDocument();
    expect(screen.getByText("mysterious")).toBeInTheDocument();
  });

  it("renders prompt used", () => {
    render(
      <GeneratorResultStep
        request={mockRequest}
        result={mockResult}
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
      />,
    );

    expect(screen.getByText("Prompt Used")).toBeInTheDocument();
    expect(screen.getByText("Create a dark sorcerer")).toBeInTheDocument();
  });

  it("calls onApprove when approve button is clicked", () => {
    render(
      <GeneratorResultStep
        request={mockRequest}
        result={mockResult}
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
      />,
    );

    const approveButton = screen.getByText("Approve & Add to Campaign");
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith(mockResult);
  });

  it("toggles edit mode when edit button is clicked", () => {
    render(
      <GeneratorResultStep
        request={mockRequest}
        result={mockResult}
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
      />,
    );

    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);

    expect(screen.getByText("Cancel Edit")).toBeInTheDocument();
    expect(screen.getByText("Upload Custom JSON")).toBeInTheDocument();
  });

  it("handles file upload", () => {
    render(
      <GeneratorResultStep
        request={mockRequest}
        result={mockResult}
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
      />,
    );

    // Enter edit mode
    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);

    const fileInput = screen.getByLabelText(/Upload Custom JSON/);
    const file = new File(['{"name": "Custom NPC"}'], "custom.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // The component should handle the file upload internally
    expect(
      screen.getByText("✓ JSON file uploaded successfully"),
    ).toBeInTheDocument();
  });
});
