import { render, screen, fireEvent } from "@testing-library/react";
import DiceRoller from "../DiceRoller";

const mockCharacter = {
  id: "1",
  name: "Test Character",
  proficiencyBonus: 2,
  // Add other required properties as needed
};

describe("DiceRoller", () => {
  beforeEach(() => {
    // Mock Math.random for consistent test results
    jest.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders dice roller interface", () => {
    render(<DiceRoller character={mockCharacter as any} />);

    expect(screen.getByText("Dice Roller")).toBeInTheDocument();
    expect(screen.getByText("Custom Roll")).toBeInTheDocument();
    expect(screen.getByText("Quick Rolls")).toBeInTheDocument();
    expect(screen.getByText("Roll History")).toBeInTheDocument();
  });

  it("rolls dice and displays result", () => {
    render(<DiceRoller character={mockCharacter as any} />);

    const rollButton = screen.getByText("Roll");
    fireEvent.click(rollButton);

    // Since Math.random is mocked to return 0.5, 1d20 should roll 10 (floor(20 * 0.5) + 1)
    expect(screen.getByText("15")).toBeInTheDocument(); // 10 + 5 modifier (assuming default)
  });

  it("displays roll history", () => {
    render(<DiceRoller character={mockCharacter as any} />);

    const rollButton = screen.getByText("Roll");
    fireEvent.click(rollButton);

    expect(screen.getByText("Roll History")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("allows custom dice selection", () => {
    render(<DiceRoller character={mockCharacter as any} />);

    const diceSelect = screen.getByDisplayValue("1d20");
    fireEvent.change(diceSelect, { target: { value: "1d6" } });

    const rollButton = screen.getByText("Roll");
    fireEvent.click(rollButton);

    // 1d6 with Math.random = 0.5 should roll 3 (floor(6 * 0.5) + 1)
    expect(screen.getByText("8")).toBeInTheDocument(); // 3 + 5 modifier
  });

  it("includes modifier in roll calculation", () => {
    render(<DiceRoller character={mockCharacter as any} />);

    const modifierInput = screen.getByPlaceholderText("Modifier");
    fireEvent.change(modifierInput, { target: { value: "3" } });

    const rollButton = screen.getByText("Roll");
    fireEvent.click(rollButton);

    // 1d20 roll (10) + modifier (3) = 13
    expect(screen.getByText("13")).toBeInTheDocument();
  });
});
