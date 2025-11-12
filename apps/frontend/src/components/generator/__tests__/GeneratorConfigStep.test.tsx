import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import GeneratorConfigStep from "../GeneratorConfigStep";
import { CreateGeneratorRequestFormData } from "@/lib/validations/generator";
import { GeneratorType } from "@/types/generator";

// Mock react-hook-form
jest.mock("react-hook-form", () => ({
  useForm: jest.fn(),
  useFormContext: jest.fn(),
}));

const mockForm = {
  register: jest.fn(),
  setValue: jest.fn(),
  watch: jest.fn(),
  formState: { errors: {} },
};

describe("GeneratorConfigStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useForm as jest.Mock).mockReturnValue(mockForm);
  });

  it("renders the generator config step", () => {
    mockForm.watch.mockReturnValue(GeneratorType.NPC);

    render(<GeneratorConfigStep form={mockForm as any} />);

    expect(screen.getByText("Generation Type")).toBeInTheDocument();
    expect(screen.getByText("NPC")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Quest")).toBeInTheDocument();
  });

  it("allows selecting different generation types", () => {
    mockForm.watch.mockReturnValue(GeneratorType.NPC);

    render(<GeneratorConfigStep form={mockForm as any} />);

    const locationButton = screen.getByText("Location");
    fireEvent.click(locationButton);

    expect(mockForm.setValue).toHaveBeenCalledWith(
      "type",
      GeneratorType.LOCATION,
    );
  });

  it("renders tags input and allows adding tags", () => {
    mockForm.watch.mockReturnValue([]);

    render(<GeneratorConfigStep form={mockForm as any} />);

    const tagInput = screen.getByPlaceholderText("Add tags and press Enter");
    fireEvent.change(tagInput, { target: { value: "evil" } });
    fireEvent.keyPress(tagInput, { key: "Enter", code: "Enter" });

    expect(mockForm.setValue).toHaveBeenCalledWith("tags", ["evil"]);
  });

  it("renders prompt textarea", () => {
    render(<GeneratorConfigStep form={mockForm as any} />);

    const promptTextarea = screen.getByPlaceholderText(
      "Provide additional context or specific requirements for the generation...",
    );
    expect(promptTextarea).toBeInTheDocument();
  });
});
