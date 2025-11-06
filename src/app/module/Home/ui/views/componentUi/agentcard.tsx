import { BotIcon, MoreVerticalIcon, Trash2Icon, Edit2Icon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface AgentProp {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export const AgentCard = ({ agent }: { agent: AgentProp }) => {
  const router = useRouter();
  
  const handleCardClick = () => {
    router.push(`/agents/${agent.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/agents/${agent.id}/edit`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Delete agent:', agent.id);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex items-center justify-between p-4 border rounded-lg bg-card hover:border-primary/50 hover:shadow-sm transition-all duration-150 cursor-pointer"
    >
      {/* Left Side: Icon + Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
          <BotIcon className="w-5 h-5 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate mb-0.5">
            {agent.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Updated {formatDate(agent.updatedAt)}
          </p>
        </div>
      </div>

      {/* Right Side: Three Dots Menu */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit2Icon className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2Icon className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};