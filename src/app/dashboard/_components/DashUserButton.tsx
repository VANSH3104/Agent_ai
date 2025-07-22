import { authClient } from '@/lib/auth-client';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { GeneratedAvatar } from '@/components/generated-avatar';
import { CreditCardIcon, LogOutIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

export const DashUserButton = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const isMobile = useIsMobile();

  if (!data?.user || isPending) return null;

  const userInfo = (
    <>
      {data.user.image ? (
        <Avatar className="h-9 w-9 mr-3">
          <AvatarImage src={data.user.image} />
        </Avatar>
      ) : (
        <GeneratedAvatar seed={data.user.name} varient="initials" className="size-9 mr-3" />
      )}
      <div className="flex flex-col overflow-hidden">
        <p className="text-sm font-semibold truncate text-white">{data.user.name}</p>
        <p className="text-xs truncate">{data.user.email}</p>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger className="rounded-xl border border-border/10  w-full flex items-center bg-white/5 hover:bg-white/10 overflow-hidden text-left cursor-pointer gap-x-2">
          {userInfo}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">{data.user.name}</DrawerTitle>
            <p className="text-sm text-muted-foreground text-left">{data.user.email}</p>
          </DrawerHeader>

          <div className="px-4 py-2 space-y-2">
            <div
              onClick={() => router.push('/billing')}
              className="flex justify-between items-center px-4 py-3 rounded-md hover:bg-muted/30 cursor-pointer text-sm"
            >
              <span>Billing</span>
              <CreditCardIcon className="w-5 h-5 text-muted-foreground" />
            </div>

            <div
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => router.push("/"),
                  },
                })
              }
              className="flex justify-between items-center px-4 py-3 rounded-md hover:bg-red-50 text-red-600 cursor-pointer text-sm"
            >
              <span>Logout</span>
              <LogOutIcon className="w-5 h-5" />
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose className="w-full">
              <button className="w-full py-2 px-4 bg-muted text-sm rounded-md">Close</button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-xl border border-border/10 p-3 w-full flex items-center bg-white/5 hover:bg-white/10 overflow-hidden text-left cursor-pointer gap-x-2">
        {userInfo}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="right" className="w-72 ml-1 md:ml-0 md:mr-1">
        <div className="p-3">
          <p className="text-sm font-semibold truncate">{data.user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{data.user.email}</p>
        </div>
        <DropdownMenuSeparator />

        {/* <DropdownMenuItem
          className="flex justify-between items-center px-4 py-2 hover:bg-muted/30 cursor-pointer text-sm"
          onClick={() => router.push('/billing')}
        >
          <span>Billing</span>
          <CreditCardIcon className="w-5 h-5 text-muted-foreground" />
        </DropdownMenuItem> */}
        {/* <DropdownMenuSeparator /> */}
        <DropdownMenuItem
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => router.push("/"),
              },
            })
          }
          className="flex justify-between items-center px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer text-sm"
        >
          <span>Logout</span>
          <LogOutIcon className="w-5 h-5" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
