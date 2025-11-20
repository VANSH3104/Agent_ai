import { WorkflowBuilder } from "@/app/module/agent/workflowpage";
import { prefectchid } from "@/app/module/Agents/server/prefetch";

interface FollowpageProps {
  id: string;
}

export const Followpage = async ({ id }: FollowpageProps) => {
  prefectchid(id);
  return (
    <div>
      <WorkflowBuilder id={id} />
    </div>
  )
};