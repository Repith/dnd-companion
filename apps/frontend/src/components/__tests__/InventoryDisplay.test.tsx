import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InventoryDisplay from "../InventoryDisplay";
import { inventoryApi } from "@/lib/api/inventory";

// Mock the API
jest.mock("@/lib/api/inventory");
const mockInventoryApi = inventoryApi as jest.Mocked<typeof inventoryApi>;

const mockInventory = {
  id: "inv-1",
  ownerType: "CHARACTER" as const,
  ownerId: "char-1",
  items: [
    {
      id: "item-1",
      itemId: "item-def-1",
      item: {
        id: "item-def-1",
        name: "Sword of Testing",
        type: "WEAPON",
        weight: 3,
        rarity: "COMMON",
      },
      quantity: 1,
      equipped: true,
      notes: "A trusty sword",
    },
    {
      id: "item-2",
      itemId: "item-def-2",
      item: {
        id: "item-def-2",
        name: "Health Potion",
        type: "CONSUMABLE",
        weight: 0.5,
        rarity: "COMMON",
      },
      quantity: 3,
      equipped: false,
    },
  ],
  encumbrance: {
    currentWeight: 4,
    maxWeight: 150,
    isEncumbered: false,
  },
};

describe("InventoryDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInventoryApi.getCharacterInventory.mockResolvedValue(mockInventory);
  });

  it("renders loading state initially", () => {
    render(<InventoryDisplay characterId="char-1" />);

    expect(screen.getByText("Loading inventory...")).toBeInTheDocument();
  });

  it("renders inventory items after loading", async () => {
    render(<InventoryDisplay characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
      expect(screen.getByText("Health Potion")).toBeInTheDocument();
    });

    expect(screen.getByText("Equipped Items")).toBeInTheDocument();
    expect(screen.getByText("Inventory Items")).toBeInTheDocument();
  });

  it("displays encumbrance information", async () => {
    render(<InventoryDisplay characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Encumbrance")).toBeInTheDocument();
      expect(screen.getByText("4 lbs")).toBeInTheDocument();
      expect(screen.getByText("150 lbs max")).toBeInTheDocument();
    });
  });

  it("shows equipped status correctly", async () => {
    render(<InventoryDisplay characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Equipped")).toBeInTheDocument();
      expect(screen.getByText("Unequipped")).toBeInTheDocument();
    });
  });

  it("calls onItemSelect when view button is clicked", async () => {
    const mockOnItemSelect = jest.fn();
    render(
      <InventoryDisplay characterId="char-1" onItemSelect={mockOnItemSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);

    expect(mockOnItemSelect).toHaveBeenCalledWith(mockInventory.items[0]);
  });

  it("calls equip API when equip button is clicked", async () => {
    mockInventoryApi.equipItem.mockResolvedValue(mockInventory);

    render(<InventoryDisplay characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const unequipButton = screen.getByText("Unequip");
    fireEvent.click(unequipButton);

    await waitFor(() => {
      expect(mockInventoryApi.equipItem).toHaveBeenCalledWith(
        "inv-1",
        "item-1",
        { equipped: false },
      );
    });
  });

  it("calls remove API when remove button is clicked", async () => {
    mockInventoryApi.removeItem.mockResolvedValue(mockInventory);
    window.confirm = jest.fn(() => true);

    render(<InventoryDisplay characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockInventoryApi.removeItem).toHaveBeenCalledWith(
        "inv-1",
        "item-1",
      );
    });
  });

  it("shows empty state when no items", async () => {
    mockInventoryApi.getCharacterInventory.mockResolvedValue({
      ...mockInventory,
      items: [],
    });

    render(<InventoryDisplay characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("No items in inventory")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockInventoryApi.getCharacterInventory.mockRejectedValue(
      new Error("API Error"),
    );

    render(<InventoryDisplay characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load inventory")).toBeInTheDocument();
    });

    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    expect(mockInventoryApi.getCharacterInventory).toHaveBeenCalledTimes(2);
  });
});
