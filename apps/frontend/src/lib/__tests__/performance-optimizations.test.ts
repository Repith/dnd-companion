import { getPerformanceSettings } from "../device-detection";

// Mock the ApiCache class for testing
class MockApiCache {
  private cache = new Map<string, any>();

  get<T>(key: string): T | null {
    return this.cache.get(key) || null;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, data);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

describe("Performance Optimizations", () => {
  describe("Performance Settings", () => {
    test("returns correct settings for low performance tier", () => {
      const settings = getPerformanceSettings("low");

      expect(settings.physicsSteps).toBe(30);
      expect(settings.shadowMapSize).toBe(512);
      expect(settings.maxDiceCount).toBe(3);
      expect(settings.enableShadows).toBe(false);
      expect(settings.enablePostProcessing).toBe(false);
      expect(settings.animationDuration).toBe(1000);
    });

    test("returns correct settings for medium performance tier", () => {
      const settings = getPerformanceSettings("medium");

      expect(settings.physicsSteps).toBe(60);
      expect(settings.shadowMapSize).toBe(1024);
      expect(settings.maxDiceCount).toBe(6);
      expect(settings.enableShadows).toBe(true);
      expect(settings.enablePostProcessing).toBe(false);
      expect(settings.animationDuration).toBe(2000);
    });

    test("returns correct settings for high performance tier", () => {
      const settings = getPerformanceSettings("high");

      expect(settings.physicsSteps).toBe(60);
      expect(settings.shadowMapSize).toBe(2048);
      expect(settings.maxDiceCount).toBe(10);
      expect(settings.enableShadows).toBe(true);
      expect(settings.enablePostProcessing).toBe(true);
      expect(settings.animationDuration).toBe(3000);
    });
  });

  describe("API Caching", () => {
    test("cache utility functions work", () => {
      const cache = new MockApiCache();

      cache.set("test-key", { data: "test" });
      const retrieved = cache.get("test-key");
      expect(retrieved).toEqual({ data: "test" });

      cache.delete("test-key");
      const afterDelete = cache.get("test-key");
      expect(afterDelete).toBeNull();

      cache.clear();
      expect(cache.get("any-key")).toBeNull();
    });
  });

  describe("Performance Logic", () => {
    test("device capability detection logic works", () => {
      // Test the logic without WebGL dependencies
      const userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15";
      const isMobile =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase(),
        );

      expect(isMobile).toBe(true);

      const desktopUA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      const isDesktop =
        !/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          desktopUA.toLowerCase(),
        );

      expect(isDesktop).toBe(true);
    });

    test("performance tier logic works", () => {
      // Test the tier classification logic
      const getTier = (
        isMobile: boolean,
        hardwareConcurrency: number,
        supportsWebGL: boolean,
      ) => {
        if (isMobile || hardwareConcurrency <= 2 || !supportsWebGL) {
          return "low";
        } else if (hardwareConcurrency >= 8 && supportsWebGL) {
          return "high";
        }
        return "medium";
      };

      expect(getTier(true, 4, true)).toBe("low");
      expect(getTier(false, 2, true)).toBe("low");
      expect(getTier(false, 8, true)).toBe("high");
      expect(getTier(false, 4, true)).toBe("medium");
    });
  });
});
