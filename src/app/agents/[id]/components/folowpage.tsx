import { prefectchid } from "@/app/module/Agents/server/prefetch";

interface FollowpageProps {
  id: string;
}

export const Followpage = async ({ id }: FollowpageProps) => {
  prefectchid(id);
  return <div>id: {id}</div>;
};