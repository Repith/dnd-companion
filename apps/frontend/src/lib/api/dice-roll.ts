import api from "./auth";
import { withApiRetry } from "./error-handler";
import { CreateDiceRollDto, DiceRollResponseDto } from "@/types/character";

// Simple cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeout) {
      clearTimeout(timeout);
    }

    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}

const cache = new ApiCache();

export const diceRollApi = {
  // Create a new dice roll record with debouncing
  create: debounce(
    async (diceRollData: CreateDiceRollDto): Promise<DiceRollResponseDto> => {
      console.log("DEBUG: API create called with", diceRollData);
      return await withApiRetry(async () => {
        console.log("DEBUG: Making POST request to /dice-rolls");
        const response = await api.post<DiceRollResponseDto>(
          "/dice-rolls",
          diceRollData,
        );
        console.log("DEBUG: API response received", response.data);
        // Invalidate cache when creating new rolls
        cache.delete("dice-rolls");
        if (diceRollData.characterId) {
          cache.delete(`dice-rolls-character-${diceRollData.characterId}`);
        }
        return response.data;
      });
    },
    300,
  ), // 300ms debounce

  // Get all dice rolls for the authenticated user with caching
  getAll: async (
    characterId?: string,
    limit?: number,
  ): Promise<DiceRollResponseDto[]> => {
    const cacheKey = characterId
      ? `dice-rolls-character-${characterId}${limit ? `-limit-${limit}` : ""}`
      : `dice-rolls${limit ? `-limit-${limit}` : ""}`;

    // Check cache first
    const cached = cache.get<DiceRollResponseDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    return withApiRetry(async () => {
      const params: any = {};
      if (characterId) params.characterId = characterId;
      if (limit) params.limit = limit;
      const response = await api.get<DiceRollResponseDto[]>("/dice-rolls", {
        params,
      });
      const data = response.data;

      // Cache the result
      cache.set(cacheKey, data);

      return data;
    });
  },

  // Get a specific dice roll by ID with caching
  getById: async (id: string): Promise<DiceRollResponseDto> => {
    const cacheKey = `dice-roll-${id}`;

    // Check cache first
    const cached = cache.get<DiceRollResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    return withApiRetry(async () => {
      const response = await api.get<DiceRollResponseDto>(`/dice-rolls/${id}`);
      const data = response.data;

      // Cache the result
      cache.set(cacheKey, data);

      return data;
    });
  },

  // Delete a dice roll with cache invalidation
  delete: async (id: string): Promise<void> => {
    await withApiRetry(async () => {
      await api.delete(`/dice-rolls/${id}`);

      // Invalidate related caches
      cache.delete(`dice-roll-${id}`);
      cache.delete("dice-rolls"); // Invalidate all rolls cache
      // Note: We can't easily invalidate character-specific caches here
      // as we don't know which character this roll belonged to
    });
  },
};
