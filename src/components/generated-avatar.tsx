import { createAvatar } from '@dicebear/core';
import{ botttsNeutral, initials } from '@dicebear/collection';
import { Avatar } from './ui/avatar';
import { AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
interface GeneratedAvatar {
     seed: string;
     className?: string;
     varient?: "botttsNeutral" | "initials";
}
export const GeneratedAvatar = ({ seed, className, varient }: GeneratedAvatar) => {
    let avatar;
    if(varient === "botttsNeutral") {
        avatar = createAvatar(botttsNeutral, {
            seed
        })
    }
    else {
        avatar = createAvatar(initials, {
            seed,
            fontWeight: 600,
            fontSize: 42,
        });
    }
    return (
        <div>
            <Avatar className={cn(className)}>
                <AvatarImage  src={avatar.toDataUri()} alt="Avatar"/>
                <AvatarFallback >{seed.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
        </div>
    )
}
