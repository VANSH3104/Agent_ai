"use client"

import { useState } from "react"
import { WrapperContainer, WrapperSearch, WrapperUI } from "@/components/ui/wrapperui"
import { CredentialCard } from "./_components/CredentialCard"
import { CredentialDialog } from "./_components/CredentialDialog"
import { useTRPC } from "@/trpc/client"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function CredentialsPage() {
    const trpc = useTRPC();
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingType, setEditingType] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const { data: credentials, isLoading, refetch } = useQuery(trpc.credentials.getAllCredentials.queryOptions())
    const deleteMutation = useMutation(trpc.credentials.deleteCredential.mutationOptions())

    const handleCreate = () => {
        setEditingId(null)
        setEditingType(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (id: string, type: string) => {
        setEditingId(id)
        setEditingType(type)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this credential? This action cannot be undone.")) {
            return
        }

        try {
            await deleteMutation.mutateAsync({ id })
            toast.success("Credential deleted successfully")
            refetch()
        } catch (error: any) {
            toast.error(`Failed to delete credential: ${error.message}`)
        }
    }

    const filteredCredentials = credentials?.filter(cred =>
        cred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.type.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
        <WrapperContainer
            header={
                <WrapperUI
                    title="Credentials"
                    description="Manage your API keys and connection secrets"
                    newButtonLabel="New Credential"
                    onNew={handleCreate}
                    isCreating={false}
                />
            }
            search={
                <WrapperSearch
                    placeholder="Search credentials..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                />
            }
            pagination={<></>}
        >
            <div className="mt-2 grid gap-4">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : filteredCredentials.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        {searchQuery ? `No credentials found for "${searchQuery}"` : "No credentials added yet"}
                    </div>
                ) : (
                    filteredCredentials.map((cred) => (
                        <CredentialCard
                            key={cred.id}
                            credential={{
                                id: cred.id,
                                name: cred.name,
                                type: cred.type,
                                description: cred.description ?? undefined,
                                createdAt: new Date(cred.createdAt),
                                updatedAt: new Date(cred.updatedAt)
                            }}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            <CredentialDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => refetch()}
                editId={editingId}
                editType={editingType}
            />
        </WrapperContainer>
    )
}
