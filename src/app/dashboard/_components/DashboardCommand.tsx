import { CommandDialog, CommandInput, CommandItem } from "@/components/ui/command"
import { Dispatch, SetStateAction } from "react";
interface props {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}
export const DashboardCommand =({open , setOpen}: props)=> {
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
            placeholder="hello"
        />
        <CommandItem>
            Test
        </CommandItem>
    </CommandDialog>
  )
}
