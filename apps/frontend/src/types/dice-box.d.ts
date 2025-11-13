declare module "@3d-dice/dice-box" {
  export interface DiceBoxConfig {
    theme?: string;
    themeColor?: string;
    offscreen?: boolean;
    assetPath?: string;
    scale?: number;
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    linearDamping?: number;
    angularDamping?: number;
    spinForce?: number;
    throwForce?: number;
    settleTimeout?: number;
    enableShadows?: boolean;
    shadowTransparency?: number;
    shadowMapSize?: number;
    lightIntensity?: number;
    volumetricLights?: boolean;
    delay?: number;
    fps?: number;
  }

  export interface RollResult {
    value: number;
    rolls?: number[];
    notation?: string;
  }

  export default class DiceBox {
    constructor(container: string | HTMLElement, config?: DiceBoxConfig);

    init(): Promise<void>;
    roll(notation: string): Promise<RollResult[]>;
    clear(): void;
    hide(): void;
    show(): void;
    add(notation: string): void;
    onRollComplete?: (results: RollResult[]) => void;
  }
}

declare module "@3d-dice/dice-ui" {
  export class DisplayResults {
    constructor(container: string | HTMLElement);
    showResults(results: any): void;
    clear(): void;
  }

  export interface AdvancedRollerConfig {
    target: string | HTMLElement;
    onSubmit?: (notation: string) => void;
    onClear?: () => void;
    onReroll?: (rolls: any[]) => void;
    onResults?: (results: any) => void;
  }

  export class AdvancedRoller {
    constructor(config: AdvancedRollerConfig);
    handleResults(results: any): void;
  }
}

declare module "@3d-dice/dice-ui/src/displayResults" {
  export default class DisplayResults {
    constructor(container: string | HTMLElement);
    showResults(results: any): void;
    clear(): void;
  }
}

declare module "@3d-dice/dice-ui/src/advancedRoller" {
  export interface AdvancedRollerConfig {
    target: string | HTMLElement;
    onSubmit?: (notation: string) => void;
    onClear?: () => void;
    onReroll?: (rolls: any[]) => void;
    onResults?: (results: any) => void;
  }

  export default class AdvancedRoller {
    constructor(config: AdvancedRollerConfig);
    handleResults(results: any): void;
  }
}
