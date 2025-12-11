import { GoogleFormOutputs } from "../../Nodecomponents/googleform/google-form-outputs";
import { GoogleFormConfig } from "../../Nodecomponents/googleform/googleformconf";
import { GoogleFormInputs } from "../../Nodecomponents/googleform/googleformInput";
import { HttpView } from "../../Nodecomponents/http/httpview";



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
    Inputs: GoogleFormInputs,
    Params: null,
    Outputs: null,
  },

  googleform: {
    label: "Google Form",
    Inputs: GoogleFormInputs,
    Params: GoogleFormConfig,
    Outputs: GoogleFormOutputs,
  },

  manual: { label: "Manual", Inputs: null, Params: null, Outputs: null },
  http: { label: "HTTP Request", Inputs: null, Params: HttpView, Outputs: null },
  email: { label: "Email", Inputs: null, Params: null, Outputs: null },
  code: { label: "Code Execution", Inputs: null, Params: null, Outputs: null },
  database: { label: "Database", Inputs: null, Params: null, Outputs: null },
  schedule: { label: "Schedule", Inputs: null, Params: null, Outputs: null },
  filter: { label: "Filter", Inputs: null, Params: null, Outputs: null },
  condition: { label: "Condition", Inputs: null, Params: null, Outputs: null },
};
