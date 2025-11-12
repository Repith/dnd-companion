import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ItemCatalog from "../ItemCatalog";
import { itemApi } from "@/lib/api/item";
import { ItemType, Rarity } from "@/types/item";

// Mock the API
jest.mock("@/lib/api/item");
const mockItemApi = itemApi as jest.Mocked<typeof itemApi>;

const mockItems = [
  {
    id: "item-1",
    name: "Sword of Testing",
    type: ItemType.WEAPON,
    rarity: Rarity.COMMON,
    weight: 3,
    description: "A sharp sword for testing",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "item-2",
    name: "Health Potion",
    type: ItemType.CONSUMABLE,
    rarity: Rarity.COMMON,
    weight: 0.5,
    description: "Restores health",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "item-3",
    name: "Dragon Scale Armor",
    type: ItemType.ARMOR,
    rarity: Rarity.RARE,
    weight: 45,
    description: "Armor made from dragon scales",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("ItemCatalog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItemApi.getAll.mockResolvedValue(mockItems);
  });

  it("renders loading state initially", () => {
    render(<ItemCatalog />);

    expect(screen.getByText("Loading items...")).toBeInTheDocument();
  });

  it("renders items after loading", async () => {
    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
      expect(screen.getByText("Health Potion")).toBeInTheDocument();
      expect(screen.getByText("Dragon Scale Armor")).toBeInTheDocument();
    });

    expect(screen.getByText("Items (3)")).toBeInTheDocument();
  });

  it("filters items by search term", async () => {
    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    fireEvent.change(searchInput, { target: { value: "sword" } });

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
      expect(screen.queryByText("Health Potion")).not.toBeInTheDocument();
      expect(screen.queryByText("Dragon Scale Armor")).not.toBeInTheDocument();
    });

    expect(mockItemApi.getAll).toHaveBeenCalledWith({ search: "sword" });
  });

  it("filters items by type", async () => {
    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const typeSelect = screen.getByDisplayValue("All Types");
    fireEvent.change(typeSelect, { target: { value: "WEAPON" } });

    await waitFor(() => {
      expect(mockItemApi.getAll).toHaveBeenCalledWith({ type: "WEAPON" });
    });
  });

  it("filters items by rarity", async () => {
    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const raritySelect = screen.getByDisplayValue("All Rarities");
    fireEvent.change(raritySelect, { target: { value: "RARE" } });

    await waitFor(() => {
      expect(mockItemApi.getAll).toHaveBeenCalledWith({ rarity: "RARE" });
    });
  });

  it("combines multiple filters", async () => {
    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    const typeSelect = screen.getByDisplayValue("All Types");

    fireEvent.change(searchInput, { target: { value: "dragon" } });
    fireEvent.change(typeSelect, { target: { value: "ARMOR" } });

    await waitFor(() => {
      expect(mockItemApi.getAll).toHaveBeenCalledWith({
        search: "dragon",
        type: "ARMOR",
      });
    });
  });

  it("clears all filters", async () => {
    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    const typeSelect = screen.getByDisplayValue("All Types");
    const clearButton = screen.getByText("Clear");

    fireEvent.change(searchInput, { target: { value: "sword" } });
    fireEvent.change(typeSelect, { target: { value: "WEAPON" } });

    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockItemApi.getAll).toHaveBeenCalledWith({});
      expect(searchInput).toHaveValue("");
      expect(typeSelect).toHaveValue("");
    });
  });

  it("calls onItemSelect when view button is clicked", async () => {
    const mockOnItemSelect = jest.fn();
    render(<ItemCatalog onItemSelect={mockOnItemSelect} />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const viewButton = screen.getAllByText("View Details")[0];
    fireEvent.click(viewButton);

    expect(mockOnItemSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it("shows add button when showAddButton is true", async () => {
    const mockOnAddToInventory = jest.fn();
    render(
      <ItemCatalog
        onAddToInventory={mockOnAddToInventory}
        showAddButton={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    const addButton = screen.getAllByText("Add to Inventory")[0];
    fireEvent.click(addButton);

    expect(mockOnAddToInventory).toHaveBeenCalledWith(mockItems[0]);
  });

  it("does not show add button when showAddButton is false", async () => {
    render(<ItemCatalog showAddButton={false} />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    expect(screen.queryByText("Add to Inventory")).not.toBeInTheDocument();
  });

  it("shows empty state when no items found", async () => {
    mockItemApi.getAll.mockResolvedValue([]);

    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("No items found")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockItemApi.getAll.mockRejectedValue(new Error("API Error"));

    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load items")).toBeInTheDocument();
    });

    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    expect(mockItemApi.getAll).toHaveBeenCalledTimes(2);
  });

  it("displays item rarity with correct colors", async () => {
    render(<ItemCatalog />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    // Check that rarity badges are present
    expect(screen.getAllByText("Common")).toHaveLength(2); // Two common items
    expect(screen.getByText("Rare")).toBeInTheDocument();
  });
});
