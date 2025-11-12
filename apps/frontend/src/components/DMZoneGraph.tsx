"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from "reactflow";
// import "reactflow/dist/style.css";
import { GraphNode, GraphLink, GraphData } from "@/types/dm-zone";
import { dmNoteApi, locationApi } from "@/lib/api/dm-zone";
import { characterApi } from "@/lib/api/character";
import { questApi } from "@/lib/api/quest";
import { itemApi } from "@/lib/api/item";
import { spellApi } from "@/lib/api/spell";

interface DMZoneGraphProps {
  campaignId: string;
}

const nodeTypes = {
  default: ({ data }: { data: any }) => (
    <div className="px-4 py-2 bg-white border-2 rounded-md shadow-md border-stone-400">
      <div className="text-sm font-bold">{data.label}</div>
      <div className="text-xs text-gray-500">{data.type}</div>
    </div>
  ),
};

export default function DMZoneGraph({ campaignId }: DMZoneGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const buildGraphData = useCallback(async (): Promise<GraphData> => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    try {
      // Fetch all data
      const [locations, notes, characters, quests, items, spells] =
        await Promise.all([
          locationApi.getAll(campaignId),
          dmNoteApi.getAll(),
          characterApi.getAll(),
          questApi.getAll(campaignId),
          itemApi.getAll(),
          spellApi.getAll(),
        ]);

      // Add location nodes
      locations.forEach((location, index) => {
        nodes.push({
          id: `location-${location.id}`,
          label: location.name,
          type: "LOCATION",
          x: Math.random() * 800,
          y: Math.random() * 600,
          data: location,
        });

        // Add parent-child relationships
        if (location.parentId) {
          links.push({
            source: `location-${location.parentId}`,
            target: `location-${location.id}`,
            type: "hierarchy",
          });
        }

        // Add NPC relationships
        location.npcIds.forEach((npcId) => {
          links.push({
            source: `location-${location.id}`,
            target: `npc-${npcId}`,
            type: "contains",
          });
        });

        // Add quest relationships
        location.questIds.forEach((questId) => {
          links.push({
            source: `location-${location.id}`,
            target: `quest-${questId}`,
            type: "related",
          });
        });
      });

      // Add character/NPC nodes
      characters.forEach((character, index) => {
        nodes.push({
          id: `npc-${character.id}`,
          label: character.name,
          type: "NPC",
          x: Math.random() * 800,
          y: Math.random() * 600,
          data: character,
        });
      });

      // Add quest nodes
      quests.forEach((quest, index) => {
        nodes.push({
          id: `quest-${quest.id}`,
          label: quest.name,
          type: "QUEST",
          x: Math.random() * 800,
          y: Math.random() * 600,
          data: quest,
        });
      });

      // Add item nodes
      items.forEach((item, index) => {
        nodes.push({
          id: `item-${item.id}`,
          label: item.name,
          type: "ITEM",
          x: Math.random() * 800,
          y: Math.random() * 600,
          data: item,
        });
      });

      // Add spell nodes
      spells.forEach((spell, index) => {
        nodes.push({
          id: `spell-${spell.id}`,
          label: spell.name,
          type: "SPELL",
          x: Math.random() * 800,
          y: Math.random() * 600,
          data: spell,
        });
      });

      // Add note nodes and their links
      for (const note of notes) {
        nodes.push({
          id: `note-${note.id}`,
          label: note.content.substring(0, 50) + "...",
          type: "NOTE",
          x: Math.random() * 800,
          y: Math.random() * 600,
          data: note,
        });

        const noteLinks = await dmNoteApi.getLinks(note.id);
        noteLinks.forEach((link) => {
          links.push({
            source: `note-${note.id}`,
            target: `${link.targetType.toLowerCase()}-${link.targetId}`,
            type: "link",
          });
        });
      }

      return { nodes, links };
    } catch (error) {
      console.error("Error building graph data:", error);
      return { nodes: [], links: [] };
    }
  }, [campaignId]);

  useEffect(() => {
    const loadGraph = async () => {
      setLoading(true);
      const graphData = await buildGraphData();

      const flowNodes: Node[] = graphData.nodes.map((node) => ({
        id: node.id,
        type: "default",
        position: { x: node.x || 0, y: node.y || 0 },
        data: {
          label: node.label,
          type: node.type,
          ...node.data,
        },
      }));

      const flowEdges: Edge[] = graphData.links.map((link, index) => ({
        id: `edge-${index}`,
        source: link.source,
        target: link.target,
        type: "default",
        animated: true,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setLoading(false);
    };

    loadGraph();
  }, [campaignId, buildGraphData, setNodes, setEdges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading graph...</div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full"
      role="application"
      aria-label="Campaign relationship graph"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        aria-label="Interactive graph visualization"
      >
        <Controls aria-label="Graph controls" />
        <MiniMap aria-label="Graph minimap" />
        <Background />
        <Panel position="top-left">
          <div
            className="p-2 bg-white rounded shadow"
            role="region"
            aria-label="Graph information"
          >
            <h3 className="mb-2 font-bold">DM Zone Graph</h3>
            <p className="text-sm text-gray-600">
              Drag nodes to reposition. Connect nodes to create relationships.
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
