export enum LocationType {
  CITY = "CITY",
  DUNGEON = "DUNGEON",
  WILDERNESS = "WILDERNESS",
  TOWN = "TOWN",
  VILLAGE = "VILLAGE",
  CASTLE = "CASTLE",
  TEMPLE = "TEMPLE",
  SHOP = "SHOP",
}

export interface DMNoteResponseDto {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDMNoteDto {
  content: string;
}

export interface UpdateDMNoteDto {
  content: string;
}

export interface LinkResponseDto {
  id: string;
  noteId: string;
  targetId: string;
  targetType: "NPC" | "QUEST" | "LOCATION" | "ITEM" | "SPELL";
  createdAt: Date;
}

export interface CreateLinkDto {
  targetId: string;
  targetType: "NPC" | "QUEST" | "LOCATION" | "ITEM" | "SPELL";
}

export interface LocationResponseDto {
  id: string;
  name: string;
  type: LocationType;
  description: string | null;
  mapUrl: string | null;
  parentId: string | null;
  npcIds: string[];
  questIds: string[];
  campaignIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocationDto {
  name: string;
  type: LocationType;
  description?: string;
  mapUrl?: string;
  parentId?: string;
}

export interface UpdateLocationDto {
  name?: string;
  type?: LocationType;
  description?: string;
  mapUrl?: string;
  parentId?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "NPC" | "QUEST" | "LOCATION" | "ITEM" | "SPELL" | "NOTE";
  x?: number;
  y?: number;
  data?: any;
}

export interface GraphLink {
  source: string;
  target: string;
  type?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
