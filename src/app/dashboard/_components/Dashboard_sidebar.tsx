"use client"

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
        <SidebarHeader className="flex space-x-3 text-sidebar-accent-foreground">
        <Link href="/" className="flex items-center space-x-2">
        <Image src="/logo.svg" height={36} width={36} alt="Agent-Ai" />
        <p className="text-xl font-semibold select-none">Agent-Ai</p>
        </Link>
        </SidebarHeader>
        <div>
         <Separator className="opacity-10 text-blue-500 " />        
        </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                        asChild
                        className={cn(
                            "h-10 border border-transparent hover:border-[#5D6B68]/10",
                            "hover:bg-gradient-to-r hover:from-[var(--sidebar-accent)] hover:via-[rgba(var(--sidebar-accent-rgb),0.7)] hover:to-[rgba(var(--sidebar-foreground-rgb),0.8)]"
                        )}
                        >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}