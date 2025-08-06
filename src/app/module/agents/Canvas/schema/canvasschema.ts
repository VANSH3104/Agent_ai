
import { Dispatch, SetStateAction } from "react";
import {Node, Connection } from "../../schema/interfaces";

export interface DraggedNodeType {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

export interface CanvasProps {
  nodeId:  string,
  setNodes: Dispatch<SetStateAction<Node[]>>;

  connections: Connection[];
  setConnections: Dispatch<SetStateAction<Connection[]>>;

  selectedNode: string | null;
  setSelectedNode: Dispatch<SetStateAction<string | null>>;

  isConnecting: boolean;
  setIsConnecting: Dispatch<SetStateAction<boolean>>;

  connectionStart: string | null;
  setConnectionStart: Dispatch<SetStateAction<string | null>>;

  draggedNode: DraggedNodeType | null;
  setDraggedNode: Dispatch<SetStateAction<DraggedNodeType | null>>;
}
