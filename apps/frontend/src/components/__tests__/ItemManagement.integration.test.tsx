import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ItemManagement from "../ItemManagement";
import { inventoryApi } from "@/lib/api/inventory";
import { itemApi } from "@/lib/api/item";
import { InventoryResponseDto } from "@/types/inventory";
import { ItemType, Rarity } from "@/types/item";

// Mock the APIs
jest.mock("@/lib/api/inventory");
jest.mock("@/lib/api/item");

const mockInventoryApi = inventoryApi as jest.Mocked<typeof inventoryApi>;
const mockItemApi = itemApi as jest.Mocked<typeof itemApi>;

const mockInventory: InventoryResponseDto = {
  id: "inv-1",
  ownerType: "CHARACTER",
  ownerId: "char-1",
  items: [
    {
      id: "item-inv-1",
      itemId: "item-1",
      item: {
        id: "item-1",
        name: "Sword of Testing",
        type: "WEAPON",
        weight: 3,
        rarity: "COMMON",
      },
      quantity: 1,
      equipped: false,
    },
  ],
  encumbrance: {
    currentWeight: 3,
    maxWeight: 150,
    isEncumbered: false,
  },
};

const mockItems = [
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
];

describe("ItemManagement Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInventoryApi.getCharacterInventory.mockResolvedValue(mockInventory);
    mockItemApi.getAll.mockResolvedValue(mockItems);
  });

  it("loads inventory and displays items", async () => {
    render(<ItemManagement characterId="char-1" />);

    // Wait for inventory to load
    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    expect(screen.getByText("Inventory Items")).toBeInTheDocument();
  });

  it("switches between inventory and catalog tabs", async () => {
    render(<ItemManagement characterId="char-1" />);

    // Start on inventory tab
    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    // Switch to catalog tab
    const catalogTab = screen.getByRole("tab", { name: /item catalog/i });
    fireEvent.click(catalogTab);

    await waitFor(() => {
      expect(screen.getByText("Health Potion")).toBeInTheDocument();
    });

    // Switch back to inventory
    const inventoryTab = screen.getByRole("tab", { name: /inventory/i });
    fireEvent.click(inventoryTab);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });
  });

  it("adds item from catalog to inventory", async () => {
    const mockUpdatedInventory = {
      ...mockInventory,
      items: [
        ...mockInventory.items,
        {
          id: "item-inv-2",
          itemId: "item-2",
          item: {
            id: "item-2",
            name: "Health Potion",
            type: "CONSUMABLE",
            weight: 0.5,
            rarity: "COMMON",
          },
          quantity: 1,
          equipped: false,
        },
      ],
    };

    mockInventoryApi.addItem.mockResolvedValue(mockUpdatedInventory);

    render(<ItemManagement characterId="char-1" />);

    // Switch to catalog
    const catalogTab = screen.getByRole("tab", { name: /item catalog/i });
    fireEvent.click(catalogTab);

    await waitFor(() => {
      expect(screen.getByText("Health Potion")).toBeInTheDocument();
    });

    // Click add to inventory
    const addButton = screen.getByText("Add to Inventory");
    fireEvent.click(addButton);

    // Modal should appear
    expect(screen.getByText("Add Item to Inventory")).toBeInTheDocument();

    // Confirm addition
    const confirmButton = screen.getByText("Add to Inventory");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockInventoryApi.addItem).toHaveBeenCalledWith("inv-1", {
        itemId: "item-2",
        quantity: 1,
      });
    });
  });

  it("equips and unequips items", async () => {
    const mockEquippedInventory = {
      ...mockInventory,
      items: [
        {
          ...mockInventory.items[0],
          equipped: true,
        },
      ],
    };

    mockInventoryApi.equipItem.mockResolvedValue(mockEquippedInventory);

    render(<ItemManagement characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    // Click equip button
    const equipButton = screen.getByText("Equip");
    fireEvent.click(equipButton);

    await waitFor(() => {
      expect(mockInventoryApi.equipItem).toHaveBeenCalledWith(
        "inv-1",
        "item-inv-1",
        { equipped: true },
      );
    });
  });

  it("removes items from inventory", async () => {
    const mockEmptyInventory = {
      ...mockInventory,
      items: [],
    };

    mockInventoryApi.removeItem.mockResolvedValue(mockEmptyInventory);
    window.confirm = jest.fn(() => true);

    render(<ItemManagement characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Sword of Testing")).toBeInTheDocument();
    });

    // Click remove button
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockInventoryApi.removeItem).toHaveBeenCalledWith(
        "inv-1",
        "item-inv-1",
      );
    });
  });

  it("displays stat effects for equipped items", async () => {
    // Mock item with effects
    mockItemApi.getById.mockResolvedValue({
      id: "item-1",
      name: "Sword of Testing",
      type: ItemType.WEAPON,
      rarity: Rarity.COMMON,
      weight: 3,
      effects: {
        abilityScoreModifiers: { STRENGTH: 2 },
        skillModifiers: { ATHLETICS: 1 },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inventoryWithEquipped = {
      ...mockInventory,
      items: [
        {
          ...mockInventory.items[0],
          equipped: true,
        },
      ],
    };

    mockInventoryApi.getCharacterInventory.mockResolvedValue(
      inventoryWithEquipped,
    );

    render(<ItemManagement characterId="char-1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Stat Effects from Equipment"),
      ).toBeInTheDocument();
    });

    // Should show the stat bonuses
    expect(screen.getByText("Ability Score Bonuses")).toBeInTheDocument();
    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    mockInventoryApi.getCharacterInventory.mockRejectedValue(
      new Error("Network error"),
    );

    render(<ItemManagement characterId="char-1" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load inventory")).toBeInTheDocument();
    });
  });
});
