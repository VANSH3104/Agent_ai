"use client"

import { Workflow , Key } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { DashUserButton } from "./DashUserButton"
import { usePathname } from "next/navigation"
import { AgentDialog } from "./AgentDialog"
const items = [
  {
    title: "Agent",
    url: "/dashboard",
    icon: Workflow,
  },
  {
    title: "Credentials",
    url: "dashboard/agents", 
    icon: Key
  },
  // {
  //   title: "Calendar",
  //   url: "#",
  //   icon: Calendar,
  // },
  // {
  //   title: "Search",
  //   url: "#",
  //   icon: Search,
  // },
  // {
  //   title: "Settings",
  //   url: "#",
  //   icon: Settings,
  // },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <Sidebar>
        <SidebarHeader className="flex space-x-3 p-2 text-sidebar-accent-foreground ">
        <Link href="/" className="flex items-center space-x-2">
        <Image src="/logo.svg" height={36} width={36} alt="Agent-Ai" />
        <p className="text-xl font-semibold">Agent-Ai</p>
        </Link>
        </SidebarHeader>
        <div className="px-4 ">
         <Separator className="opacity-10 text-blue-500" />        
        </div>
      <SidebarContent>
        <SidebarGroup className="pt-5">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem
                  key={item.title}
                  className={cn(
                    "rounded-md transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-[var(--sidebar-accent)] to-[bg-purple-300] text-white"
                      : "text-sidebar-accent-foreground"
                  )}
                >
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 w-full px-3 flex items-center gap-2 rounded-md transition-all duration-200",
                      "hover:border hover:border-[#5D6B68]/10",
                      "hover:bg-gradient-to-r hover:from-[var(--sidebar-accent)] hover:to-[bg-purple-300]",
                      "hover:text-white"
                    )}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                )
})}
           <div className="pt-3 flex justify-center">
           <AgentDialog />
          </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-3 text-sidebar-accent-foreground">
            <DashUserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}