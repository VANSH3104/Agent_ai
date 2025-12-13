import { MoreVerticalIcon, Trash2Icon, Edit2Icon, Key } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CredentialProps {
    id: string;
    name: string;
    type: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface CredentialCardProps {
    credential: CredentialProps;
    onEdit: (id: string, type: string) => void;
    onDelete: (id: string) => void;
}

export const CredentialCard = ({ credential, onEdit, onDelete }: CredentialCardProps) => {
    const formatDate = (date: Date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch {
            return 'Unknown date';
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(credential.id, credential.type);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(credential.id);
    };

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onEdit(credential.id, credential.type);
            }}
            className="group relative flex items-center justify-between p-4 border rounded-lg bg-card hover:border-primary/50 hover:shadow-sm transition-all duration-150 cursor-pointer"
        >
            {/* Left Side: Icon + Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className='flex items-center gap-2'>
                        <h3 className="font-medium text-base truncate mb-0.5">
                            {credential.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                            {credential.type}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                        {credential.description || 'No description'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        Updated {formatDate(credential.updatedAt)}
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
