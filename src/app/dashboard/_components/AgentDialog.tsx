"use client"
import { useState } from "react"
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
import { useRouter } from "next/navigation"

import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { WorkflowSchema } from "@/app/module/agents/schema/WorkflowSchema"
export function AgentDialog() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient()
  const [input, setInput] = useState({ name: '', description: '' });
  const createWorkflow = useMutation(
    trpc.workflow.create.mutationOptions({
      onSuccess: ()=>{},
      onError: ()=> {}

    })
  )
  
  const onSubmit = (values: z.infer<typeof WorkflowSchema>) =>{
    createWorkflow.mutate(input)
  }


  return (
    <Dialog>
      <form onSubmit={onSubmit}>
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
              <Input id="name" name="name" placeholder="Enter workflow name"
              value={input.name} 
              onChange={(e)=>setInput(prev =>({...prev , name:e.target.value}))}/>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Workflow description"
              value={input.description} 
              onChange={(e)=>setInput(prev =>({...prev , description:e.target.value}))}
              />
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
