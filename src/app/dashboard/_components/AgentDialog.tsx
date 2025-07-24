"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CiSquarePlus } from "react-icons/ci"
import { useTRPC } from "@/trpc/client"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function AgentDialog() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient =  useQueryClient();
   const createWorkflow = useMutation(
    trpc.workflow.create.mutationOptions({
      onSuccess:()=>{
        queryClient.invalidateQueries(
          trpc.workflow.getMany.
        )
      }
    })
   )

  return (
    <Dialog>
      <form onSubmit={handleSubmit}>
        <DialogTrigger asChild>
          <Button className="bg-[var(--sidebar-accent)] hover:bg-purple-500 p-2 font-bold w-full">
            <div className="items-center flex gap-2 font-bold">
              Create
              <CiSquarePlus />
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription>
              Define a new workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Workflow Name</Label>
              <Input id="name" name="name" placeholder="Enter workflow name" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Workflow description" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
