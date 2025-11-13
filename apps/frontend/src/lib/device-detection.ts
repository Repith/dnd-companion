export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  hardwareConcurrency: number;
  deviceMemory?: number;
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  hasTouch: boolean;
  performanceTier: "low" | "medium" | "high";
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  // Check if running on client side
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      hardwareConcurrency: 4,
      supportsWebGL: true,
      supportsWebGL2: true,
      hasTouch: false,
      performanceTier: "high",
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent,
    );
  const isTablet =
    /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
    (isMobile && window.innerWidth >= 768);

  // Hardware concurrency (CPU cores)
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  // Device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;

  // WebGL support
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  const supportsWebGL = !!gl;

  // WebGL2 support
  const gl2 = canvas.getContext("webgl2");
  const supportsWebGL2 = !!gl2;

  // Touch capability
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Determine performance tier
  let performanceTier: "low" | "medium" | "high" = "medium";

  if (isMobile || hardwareConcurrency <= 2 || !supportsWebGL) {
    performanceTier = "low";
  } else if (
    hardwareConcurrency >= 8 &&
    supportsWebGL2 &&
    deviceMemory &&
    deviceMemory >= 4
  ) {
    performanceTier = "high";
  }

  return {
    isMobile,
    isTablet,
    hardwareConcurrency,
    deviceMemory,
    supportsWebGL,
    supportsWebGL2,
    hasTouch,
    performanceTier,
  };
}

// Hook for React components
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] =
    React.useState<DeviceCapabilities | null>(null);

  React.useEffect(() => {
    setCapabilities(detectDeviceCapabilities());
  }, []);

  return capabilities;
}

// Performance settings based on device tier
export function getPerformanceSettings(tier: "low" | "medium" | "high") {
  switch (tier) {
    case "low":
      return {
        physicsSteps: 30,
        shadowMapSize: 512,
        maxDiceCount: 3,
        enableShadows: false,
        enablePostProcessing: false,
        animationDuration: 1000,
      };
    case "medium":
      return {
        physicsSteps: 60,
        shadowMapSize: 1024,
        maxDiceCount: 6,
        enableShadows: true,
        enablePostProcessing: false,
        animationDuration: 2000,
      };
    case "high":
      return {
        physicsSteps: 60,
        shadowMapSize: 2048,
        maxDiceCount: 10,
        enableShadows: true,
        enablePostProcessing: true,
        animationDuration: 3000,
      };
  }
}

// Import React for the hook
import React from "react";
