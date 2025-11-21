import { InitialNode } from "@/components/InitialNode";
import { nodeTypesEnum } from "@/db/schema";
import type { NodeTypes } from "@xyflow/react";

export const NodeComponent = {
  [nodeTypesEnum.enumValues[0]]: InitialNode,
} as const satisfies NodeTypes;