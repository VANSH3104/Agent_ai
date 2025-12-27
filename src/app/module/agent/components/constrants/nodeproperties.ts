import { GoogleSheetConfig } from "../../Nodecomponents/googlesheet/googlesheet-config";
import { HttpView } from "../../Nodecomponents/http/httpview";
import { EmailView } from "../../Nodecomponents/email/emailview";
import { AIView } from "../../Nodecomponents/ai/ai-view";
import { DatabaseView } from "../../Nodecomponents/database/database-view";
import { FilterView } from "../../Nodecomponents/filter/filter-view";
import { ConditionView } from "../../Nodecomponents/condition/condition-view";
import { ScheduleView } from "../../Nodecomponents/schedule/schedule-view";
import { SlackView } from "../../Nodecomponents/slack/slack-view";
import { DiscordView } from "../../Nodecomponents/discord/discord-view";

import { CodeView } from "../../Nodecomponents/code/code-view";
import { WebhookView } from "../../Nodecomponents/web_hook/webhookviewpage";





export const NodePropertiesConfig: Record<
  string,
  {
    label: string;
    Inputs: React.FC<any> | null;
    Params: React.FC<any> | null;
    Outputs: React.FC<any> | null;
  }

> = {
  webhook: {
    label: "Webhook",
    Inputs: null,
    Params: WebhookView,
    Outputs: null,
  },

  googlesheet: {
    label: "Google Sheet",
    Inputs: null,
    Params: GoogleSheetConfig,
    Outputs: null,
  },

  manual: { label: "Manual", Inputs: null, Params: null, Outputs: null },
  http: { label: "HTTP Request", Inputs: null, Params: HttpView, Outputs: null },
  email: { label: "Email", Inputs: null, Params: EmailView, Outputs: null },
  ai: { label: "AI", Inputs: null, Params: AIView, Outputs: null },
  code: { label: "Code Execution", Inputs: null, Params: CodeView, Outputs: null },
  database: { label: "Database", Inputs: null, Params: DatabaseView, Outputs: null },
  schedule: { label: "Schedule", Inputs: null, Params: ScheduleView, Outputs: null },
  filter: { label: "Filter", Inputs: null, Params: FilterView, Outputs: null },
  condition: { label: "Condition", Inputs: null, Params: ConditionView, Outputs: null },
  slack: { label: "Slack", Inputs: null, Params: SlackView, Outputs: null },
  discord: { label: "Discord", Inputs: null, Params: DiscordView, Outputs: null },
};
