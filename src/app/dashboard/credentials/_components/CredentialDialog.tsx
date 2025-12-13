"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useTRPC } from "@/trpc/client"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

interface CredentialDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editId?: string | null
    editType?: string | null
}

const CREDENTIAL_TYPES = [
    { value: "EMAIL_SMTP", label: "Email SMTP" },
    { value: "AI_API", label: "AI Provider API" },
    { value: "DATABASE", label: "Database Connection" },
    { value: "SLACK", label: "Slack Token" },
    { value: "DISCORD", label: "Discord Webhook" },
]

export function CredentialDialog({ open, onOpenChange, onSuccess, editId, editType }: CredentialDialogProps) {
    const trpc = useTRPC();
    const [type, setType] = useState<string>("EMAIL_SMTP")
    const [formData, setFormData] = useState<any>({});

    // Queries for fetching existing data
    const emailQuery = useQuery(trpc.credentials.getEmailCredentials.queryOptions());
    const aiQuery = useQuery(trpc.credentials.getAICredentials.queryOptions());
    const dbQuery = useQuery(trpc.credentials.getDatabaseCredentials.queryOptions());
    const slackQuery = useQuery(trpc.credentials.getSlackCredentials.queryOptions());
    const discordQuery = useQuery(trpc.credentials.getDiscordCredentials.queryOptions());

    // Mutations
    const saveEmail = useMutation(trpc.credentials.saveEmailCredentials.mutationOptions());
    const saveAi = useMutation(trpc.credentials.saveAICredentials.mutationOptions());
    const saveDb = useMutation(trpc.credentials.saveDatabaseCredentials.mutationOptions());
    const saveSlack = useMutation(trpc.credentials.saveSlackCredentials.mutationOptions());
    const saveDiscord = useMutation(trpc.credentials.saveDiscordCredentials.mutationOptions());

    const isPending = saveEmail.isPending || saveAi.isPending || saveDb.isPending || saveSlack.isPending || saveDiscord.isPending;

    useEffect(() => {
        if (editType) {
            setType(editType);
        } else {
            setType("EMAIL_SMTP");
            setFormData({});
        }
    }, [editType, open]);

    // Load data when editing
    useEffect(() => {
        if (!editId) return;

        if (editType === "EMAIL_SMTP" && emailQuery.data) {
            setFormData(emailQuery.data.data);
        } else if (editType === "AI_API" && aiQuery.data) {
            setFormData(aiQuery.data.data);
        } else if (editType === "DATABASE" && dbQuery.data) {
            setFormData(dbQuery.data.data);
        } else if (editType === "SLACK" && slackQuery.data) {
            setFormData(slackQuery.data);
        } else if (editType === "DISCORD" && discordQuery.data) {
            setFormData(discordQuery.data);
        }
    }, [editId, editType, emailQuery.data, aiQuery.data, dbQuery.data, slackQuery.data, discordQuery.data]);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (type === "EMAIL_SMTP") {
                // Validate required fields manually or rely on backend validation
                await saveEmail.mutateAsync({
                    host: formData.host,
                    port: Number(formData.port),
                    secure: Boolean(formData.secure),
                    user: formData.user,
                    password: formData.password,
                    fromEmail: formData.fromEmail,
                    fromName: formData.fromName,
                });
            } else if (type === "AI_API") {
                await saveAi.mutateAsync({
                    provider: formData.provider,
                    apiKey: formData.apiKey,
                    model: formData.model
                });
            } else if (type === "DATABASE") {
                await saveDb.mutateAsync({
                    connectionType: formData.connectionType,
                    connectionUrl: formData.connectionUrl,
                    host: formData.host,
                    port: Number(formData.port),
                    database: formData.database,
                    username: formData.username,
                    password: formData.password,
                    ssl: Boolean(formData.ssl)
                });
            }
            else if (type === "SLACK") {
                await saveSlack.mutateAsync({
                    credentials: {
                        botToken: formData.botToken,
                        workspaceId: formData.workspaceId
                    }
                });
            } else if (type === "DISCORD") {
                await saveDiscord.mutateAsync({
                    credentials: {
                        webhookUrl: formData.webhookUrl
                    }
                })
            }

            toast.success("Credentials saved successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to save: ${error.message}`);
        }
    }

    const renderFormFields = () => {
        switch (type) {
            case "EMAIL_SMTP":
                return (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="host">SMTP Host</Label>
                                <Input id="host" value={formData.host || ''} onChange={(e) => handleInputChange('host', e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="port">Port</Label>
                                <Input id="port" type="number" value={formData.port || ''} onChange={(e) => handleInputChange('port', e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="user">User</Label>
                                <Input id="user" value={formData.user || ''} onChange={(e) => handleInputChange('user', e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" value={formData.password || ''} onChange={(e) => handleInputChange('password', e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fromEmail">From Email</Label>
                            <Input id="fromEmail" type="email" value={formData.fromEmail || ''} onChange={(e) => handleInputChange('fromEmail', e.target.value)} required />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="secure" checked={formData.secure ?? true} onCheckedChange={(c) => handleInputChange('secure', c)} />
                            <Label htmlFor="secure">Secure (SSL/TLS)</Label>
                        </div>
                    </div>
                )
            case "AI_API":
                return (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="provider">Provider</Label>
                            <Select value={formData.provider || ''} onValueChange={(v) => handleInputChange('provider', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="anthropic">Anthropic</SelectItem>
                                    <SelectItem value="google">Google Gemini</SelectItem>
                                    <SelectItem value="groq">Groq</SelectItem>
                                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input id="apiKey" type="password" value={formData.apiKey || ''} onChange={(e) => handleInputChange('apiKey', e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="model">Default Model</Label>
                            <Input id="model" value={formData.model || ''} onChange={(e) => handleInputChange('model', e.target.value)} required />
                        </div>
                    </div>
                )
            case "DATABASE":
                return (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="connectionType">Database Type</Label>
                            <Select value={formData.connectionType || 'postgres'} onValueChange={(v) => handleInputChange('connectionType', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="postgres">PostgreSql</SelectItem>
                                    <SelectItem value="mysql">MySQL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="connectionUrl">Connection URL (Optional)</Label>
                            <Input id="connectionUrl" value={formData.connectionUrl || ''} onChange={(e) => handleInputChange('connectionUrl', e.target.value)} placeholder="postgres://..." />
                        </div>
                        <div className="text-center text-sm text-gray-500">- OR -</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="dbHost">Host</Label>
                                <Input id="dbHost" value={formData.host || ''} onChange={(e) => handleInputChange('host', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dbPort">Port</Label>
                                <Input id="dbPort" type="number" value={formData.port || ''} onChange={(e) => handleInputChange('port', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dbName">Database Name</Label>
                            <Input id="dbName" value={formData.database || ''} onChange={(e) => handleInputChange('database', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="dbUser">User</Label>
                                <Input id="dbUser" value={formData.username || ''} onChange={(e) => handleInputChange('username', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dbPass">Password</Label>
                                <Input id="dbPass" type="password" value={formData.password || ''} onChange={(e) => handleInputChange('password', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )
            case "SLACK":
                return (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="botToken">Bot User OAuth Token</Label>
                            <Input id="botToken" type="password" value={formData.botToken || ''} onChange={(e) => handleInputChange('botToken', e.target.value)} required placeholder="xoxb-..." />
                            <p className="text-xs text-muted-foreground">Found in OAuth & Permissions under Bot User OAuth Token</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="workspaceId">Workspace ID (Optional)</Label>
                            <Input id="workspaceId" value={formData.workspaceId || ''} onChange={(e) => handleInputChange('workspaceId', e.target.value)} />
                        </div>
                    </div>
                )
            case "DISCORD":
                return (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="webhookUrl">Webhook URL</Label>
                            <Input id="webhookUrl" value={formData.webhookUrl || ''} onChange={(e) => handleInputChange('webhookUrl', e.target.value)} required placeholder="https://discord.com/api/webhooks/..." />
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editId ? "Edit Credential" : "Add New Credential"}</DialogTitle>
                    <DialogDescription>
                        {editId ? "Update your existing credential details." : "Choose a credential type and enter the details."}
                    </DialogDescription>
                </DialogHeader>

                {!editId && (
                    <div className="grid gap-2 mb-4">
                        <Label>Credential Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {CREDENTIAL_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {renderFormFields()}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save Credential"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
