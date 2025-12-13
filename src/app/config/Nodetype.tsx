import { NodeTypes } from '@xyflow/react';
import {
  WebhookNode, ManualNode, ScheduleNode,
  HttpNode, DatabaseNode, EmailNode, AINode, CodeNode,
  ConditionNode, FilterNode, GoogleSheetNode, SlackNode, DiscordNode
} from '@/components/otherUi/customnode';


export const nodeComponents: NodeTypes = {
  webhook: WebhookNode,
  manual: ManualNode,
  schedule: ScheduleNode,
  http: HttpNode,
  googlesheet: GoogleSheetNode,
  database: DatabaseNode,
  email: EmailNode,
  ai: AINode,
  code: CodeNode,
  condition: ConditionNode,
  filter: FilterNode,
  slack: SlackNode,
  discord: DiscordNode,
};