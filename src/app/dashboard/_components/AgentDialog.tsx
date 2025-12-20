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
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { WorkflowSchema } from "@/app/module/agent/schema/WorkflowSchema"

export function AgentDialog() {
  const router = useRouter();
  const trpc = useTRPC();
  // const queryClient = useQueryClient()
  const [input, setInput] = useState({ name: '', description: '' });
  const [open, setOpen] = useState(false);

  const createWorkflow = useMutation(
    trpc.agent.create.mutationOptions({
      onSuccess: (data) => {
        setOpen(false);
        setInput({ name: '', description: '' });
        if (data?.newAgent?.id) {
          router.push(`/workflow/${data.newAgent.id}`);
        } else {
          alert("No ID returned from server");
        }
      },
      onError: () => {
        alert("failed to create workflow try again");
      }
    })
  )

  const onSubmit = async (values: z.infer<typeof WorkflowSchema>) => {

    try {
      try {
        // Backend create mutation does not accept input currently, implies name auto-generation
        const work = createWorkflow.mutate();
        console.log(work, "work")
      } catch {
        alert("there is mistake")
      }
    } catch {
      alert("there is mistake 2")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center gap-3 font-semibold">
            <span className="text-lg">Create Workflow</span>
            <CiSquarePlus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit(input);
          }}
          className="space-y-6"
        >
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center mb-4">
              <CiSquarePlus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Create New Workflow
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-base mt-2">
              Design and configure your workflow to automate processes efficiently.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 px-1">
            <div className="space-y-3">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                Workflow Name
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Customer Onboarding Process"
                  value={input.name}
                  onChange={(e) =>
                    setInput((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 transition-colors duration-200 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 hover:opacity-5 transition-opacity duration-200 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                Description
              </Label>
              <div className="relative">
                <Input
                  id="description"
                  name="description"
                  placeholder="Describe what this workflow will accomplish..."
                  value={input.description}
                  onChange={(e) =>
                    setInput((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 hover:opacity-5 transition-opacity duration-200 pointer-events-none" />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <DialogClose asChild>
              <Button
                variant="outline"
                type="button"
                className="flex-1 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200 font-semibold"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={createWorkflow.isPending || !input.name.trim()}
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              {createWorkflow.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                'Create Workflow'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}