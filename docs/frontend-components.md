# Frontend Components Documentation

This document provides detailed information about the React components in the D&D Companion frontend application.

## Component Architecture

The frontend follows a component-based architecture with clear separation of concerns:

- **Pages**: Route-level components (Next.js App Router)
- **Components**: Reusable UI components
- **Contexts**: Global state management
- **Hooks**: Custom React hooks for logic reuse
- **Types**: TypeScript type definitions

## Core Components

### Layout Components

#### Sidebar

**File**: `components/Sidebar.tsx`

**Purpose**: Main navigation sidebar with module selection.

**Props**:

```typescript
interface SidebarProps {
  activeModule: Module;
  onModuleChange: (module: Module) => void;
}
```

**Features**:

- Responsive design (mobile-friendly)
- Active module highlighting
- Module icons and labels
- Mobile overlay functionality

**Usage**:

```tsx
<Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
```

#### ErrorBoundary

**File**: `components/ErrorBoundary.tsx`

**Purpose**: Catches JavaScript errors in the component tree.

**Features**:

- Error logging to console
- Fallback UI display
- Error recovery options
- Development vs production error handling

**Usage**:

```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### Character Components

#### CharacterList

**File**: `components/CharacterList.tsx`

**Purpose**: Displays a list of user characters with actions.

**Props**:

```typescript
interface CharacterListProps {
  characters: CharacterResponseDto[];
  onCharacterSelect: (character: CharacterResponseDto) => void;
  onCreateCharacter: () => void;
}
```

**Features**:

- Character cards with key stats
- Create new character button
- Loading states
- Empty state handling

#### CharacterBuilder

**File**: `components/CharacterBuilder.tsx`

**Purpose**: Step-by-step character creation wizard.

**Props**:

```typescript
interface CharacterBuilderProps {
  onComplete: (character: CharacterResponseDto) => void;
}
```

**Features**:

- Multi-step form wizard
- Race, class, background selection
- Ability score assignment
- Skill and proficiency selection
- Form validation and error handling

#### CharacterDashboard

**File**: `components/CharacterDashboard.tsx`

**Purpose**: Comprehensive character sheet view.

**Props**:

```typescript
interface CharacterDashboardProps {
  character: CharacterResponseDto;
}
```

**Features**:

- Complete character statistics
- Inventory display
- Spell management
- Hit point tracking
- Death saves

### Campaign Components

#### QuestForm

**File**: `components/QuestForm.tsx`

**Purpose**: Create and edit quests within campaigns.

**Props**:

```typescript
interface QuestFormProps {
  campaignId: string;
  quest?: QuestResponseDto;
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Features**:

- Quest creation and editing
- Objective and reward management
- NPC and location associations
- Form validation

#### ProgressTracker

**File**: `components/ProgressTracker.tsx`

**Purpose**: Visual progress tracking for campaigns.

**Props**:

```typescript
interface ProgressTrackerProps {
  campaignId: string;
}
```

**Features**:

- Quest completion visualization
- Campaign milestone tracking
- Progress percentage calculations

### DM Zone Components

#### DMNoteEditor

**File**: `components/DMNoteEditor.tsx`

**Purpose**: Rich text editor for DM notes.

**Props**:

```typescript
interface DMNoteEditorProps {
  campaignId: string;
}
```

**Features**:

- Rich text editing
- Note organization
- Campaign association
- Auto-save functionality

#### DMZoneGraph

**File**: `components/DMZoneGraph.tsx`

**Purpose**: Interactive graph visualization of campaign elements.

**Props**:

```typescript
interface DMZoneGraphProps {
  campaignId: string;
}
```

**Features**:

- Node-link diagram
- Entity relationships
- Interactive navigation
- Zoom and pan controls

#### LocationManager

**File**: `components/LocationManager.tsx`

**Purpose**: Manage campaign locations.

**Props**:

```typescript
interface LocationManagerProps {
  campaignId: string;
}
```

**Features**:

- Location CRUD operations
- Hierarchical location structure
- Map integration (planned)
- Location descriptions

### Inventory Components

#### InventoryDisplay

**File**: `components/InventoryDisplay.tsx`

**Purpose**: Display and manage character inventory.

**Props**:

```typescript
interface InventoryDisplayProps {
  characterId: string;
}
```

**Features**:

- Item listing with details
- Equip/unequip functionality
- Weight and encumbrance tracking
- Item filtering and search

#### ItemCatalog

**File**: `components/ItemCatalog.tsx`

**Purpose**: Browse and search available items.

**Features**:

- Item filtering by type, rarity
- Search functionality
- Item details modal
- Add to inventory actions

### Game Components

#### DiceRoller

**File**: `components/DiceRoller.tsx`

**Purpose**: Digital dice rolling interface.

**Props**:

```typescript
interface DiceRollerProps {
  character?: CharacterResponseDto;
}
```

**Features**:

- Standard D&D dice (d4, d6, d8, d10, d12, d20, d100)
- Advantage/disadvantage support
- Roll history
- Character stat integration

#### Spellbook

**File**: `components/Spellbook.tsx`

**Purpose**: Character spell management interface.

**Features**:

- Known spells display
- Prepared spells management
- Spell slot tracking
- Spell casting interface

#### DeathSavesTracker

**File**: `components/DeathSavesTracker.tsx`

**Purpose**: Track death saving throws.

**Props**:

```typescript
interface DeathSavesTrackerProps {
  characterId: string;
}
```

**Features**:

- Success/failure tracking
- Visual indicators
- Automatic stabilization checks

### Utility Components

#### ProtectedRoute

**File**: `components/ProtectedRoute.tsx`

**Purpose**: Route protection wrapper.

**Props**:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Features**:

- Authentication checking
- Redirect to login for unauthenticated users
- Loading states during auth check

#### EventFeed

**File**: `components/EventFeed.tsx`

**Purpose**: Real-time event display.

**Props**:

```typescript
interface EventFeedProps {
  campaignId: string;
  limit?: number;
}
```

**Features**:

- Live event streaming
- Event filtering
- Pagination support
- Event details modal

## Context Providers

### AuthContext

**File**: `contexts/AuthContext.tsx`

**Purpose**: Global authentication state management.

**Features**:

- User authentication state
- Login/logout functionality
- Demo login support
- Token management
- Error handling

**Usage**:

```tsx
const { user, login, logout, isLoading } = useAuth();
```

## Custom Hooks

### API Hooks

**File**: `lib/api/character.ts`, `lib/api/campaign.ts`, etc.

**Purpose**: Encapsulated API calls with error handling.

**Features**:

- Automatic retry logic
- Error parsing and handling
- Loading states
- Response caching (planned)

**Example**:

```typescript
export const characterApi = {
  getAll: async (): Promise<CharacterResponseDto[]> => {
    return withApiRetry(async () => {
      const response = await api.get<CharacterResponseDto[]>("/characters");
      return response.data;
    });
  },
};
```

### Form Hooks

**File**: `lib/validations/character.ts`

**Purpose**: Form validation schemas.

**Features**:

- Zod schema validation
- Type-safe form handling
- Error message localization

**Example**:

```typescript
export const createCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  race: z.nativeEnum(Race),
  class: z.nativeEnum(CharacterClass),
  level: z.number().min(1).max(20),
});
```

## Component Patterns

### Container/Presentational Pattern

```tsx
// Container component (logic)
function CharacterListContainer() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const handleCharacterSelect = (character) => {
    // Navigation logic
  };

  return (
    <CharacterList
      characters={characters}
      loading={loading}
      onCharacterSelect={handleCharacterSelect}
    />
  );
}

// Presentational component (UI)
function CharacterList({ characters, loading, onCharacterSelect }) {
  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid gap-4">
      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          onClick={() => onCharacterSelect(character)}
        />
      ))}
    </div>
  );
}
```

### Compound Components

```tsx
// Modal compound component
function Modal({ children }) {
  return <div className="modal-overlay">{children}</div>;
}

Modal.Header = function ModalHeader({ children }) {
  return <div className="modal-header">{children}</div>;
};

Modal.Body = function ModalBody({ children }) {
  return <div className="modal-body">{children}</div>;
};

Modal.Footer = function ModalFooter({ children }) {
  return <div className="modal-footer">{children}</div>;
};

// Usage
<Modal>
  <Modal.Header>Character Details</Modal.Header>
  <Modal.Body>{/* content */}</Modal.Body>
  <Modal.Footer>
    <button>Close</button>
  </Modal.Footer>
</Modal>;
```

### Render Props Pattern

```tsx
function DataFetcher({ url, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [url]);

  const fetchData = async () => {
    try {
      const result = await api.get(url);
      setData(result.data);
    } finally {
      setLoading(false);
    }
  };

  return children({ data, loading, refetch: fetchData });
}

// Usage
<DataFetcher url="/characters">
  {({ data, loading }) =>
    loading ? <Spinner /> : <CharacterList characters={data} />
  }
</DataFetcher>;
```

## Styling Patterns

### Tailwind CSS Classes

Consistent class naming and organization:

```tsx
function CharacterCard({ character }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {character.name}
      </h3>
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Level {character.level}</span>
        <span>{character.class}</span>
      </div>
    </div>
  );
}
```

### CSS Modules (when needed)

For complex component-specific styles:

```css
/* CharacterCard.module.css */
.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6;
}

.card:hover {
  @apply shadow-lg;
}

.title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}
```

## State Management

### Local State

Use `useState` for component-specific state:

```tsx
function CharacterForm() {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
}
```

### Global State

Use Context for app-wide state:

```tsx
// AuthContext for user authentication
// ThemeContext for theme switching
// CampaignContext for current campaign (if needed)
```

### Server State

Use React Query (future) or SWR for server state:

```tsx
function useCharacters() {
  return useQuery({
    queryKey: ["characters"],
    queryFn: characterApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## Performance Optimizations

### Code Splitting

```tsx
// Dynamic imports for route-based splitting
const CharacterBuilder = dynamic(
  () => import("@/components/CharacterBuilder"),
  {
    loading: () => <div>Loading...</div>,
  },
);

// Lazy loading for heavy components
const DMZoneGraph = lazy(() => import("@/components/DMZoneGraph"));
```

### Memoization

```tsx
const CharacterCard = memo(function CharacterCard({ character, onClick }) {
  return <div onClick={() => onClick(character)}>{/* content */}</div>;
});

// Memoize expensive calculations
const characterStats = useMemo(() => {
  return calculateStats(character);
}, [character.abilityScores, character.level]);
```

### Virtualization

For large lists:

```tsx
import { FixedSizeList as List } from "react-window";

function CharacterList({ characters }) {
  return (
    <List height={400} itemCount={characters.length} itemSize={100}>
      {({ index, style }) => (
        <div style={style}>
          <CharacterCard character={characters[index]} />
        </div>
      )}
    </List>
  );
}
```

## Testing Components

### Unit Testing

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import CharacterCard from "@/components/CharacterCard";

describe("CharacterCard", () => {
  const mockCharacter = {
    id: "1",
    name: "Test Character",
    level: 3,
    class: "FIGHTER",
  };

  it("renders character information", () => {
    render(<CharacterCard character={mockCharacter} />);

    expect(screen.getByText("Test Character")).toBeInTheDocument();
    expect(screen.getByText("Level 3")).toBeInTheDocument();
    expect(screen.getByText("FIGHTER")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const mockOnClick = jest.fn();
    render(<CharacterCard character={mockCharacter} onClick={mockOnClick} />);

    fireEvent.click(screen.getByText("Test Character"));
    expect(mockOnClick).toHaveBeenCalledWith(mockCharacter);
  });
});
```

### Integration Testing

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CharacterBuilder from "@/components/CharacterBuilder";

describe("CharacterBuilder", () => {
  it("creates character successfully", async () => {
    const mockOnComplete = jest.fn();
    render(<CharacterBuilder onComplete={mockOnComplete} />);

    // Fill out form
    await userEvent.type(screen.getByLabelText("Name"), "New Character");
    await userEvent.selectOptions(screen.getByLabelText("Race"), "HUMAN");
    await userEvent.selectOptions(screen.getByLabelText("Class"), "FIGHTER");

    // Submit form
    await userEvent.click(screen.getByText("Create Character"));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});
```

## Accessibility

### ARIA Labels

```tsx
<button aria-label="Create new character" onClick={handleCreate}>
  <PlusIcon />
</button>
```

### Keyboard Navigation

```tsx
function CharacterCard({ character, onClick }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(character);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(character)}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${character.name}`}
    >
      {/* content */}
    </div>
  );
}
```

### Screen Reader Support

```tsx
<div aria-live="polite" aria-atomic="true">
  {error && <div role="alert">{error}</div>}
</div>

<div aria-describedby="character-description">
  <h3 id="character-description">
    {character.name}, Level {character.level} {character.class}
  </h3>
</div>
```

## Component Documentation

Each component should include:

```tsx
/**
 * CharacterCard component for displaying character information
 *
 * @param character - The character data to display
 * @param onClick - Callback when card is clicked
 * @param showStats - Whether to show detailed stats
 */
interface CharacterCardProps {
  character: CharacterResponseDto;
  onClick?: (character: CharacterResponseDto) => void;
  showStats?: boolean;
}

function CharacterCard({
  character,
  onClick,
  showStats = false,
}: CharacterCardProps) {
  // Implementation
}
```

## Future Enhancements

### Planned Components

- **Real-time Collaboration**: WebSocket-based live editing
- **Advanced Filtering**: Complex search and filter interfaces
- **Drag & Drop**: Inventory management, spell preparation
- **Charts & Graphs**: Character progression, campaign analytics
- **Offline Support**: Service worker integration

### Component Library

- **Design System**: Consistent component library
- **Storybook**: Component documentation and testing
- **Theme Support**: Multiple theme variants
- **Internationalization**: Multi-language support

This component documentation provides a foundation for understanding and extending the frontend architecture. Components follow React best practices and are designed for maintainability and reusability.
