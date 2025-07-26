import { SidebarProvider} from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/Dashboard_sidebar";
import { DashboardNavbar } from "./_components/DashboardNavbar";
import { TRPCReactProvider } from "@/trpc/client";

interface Props {
    children: React.ReactNode
}

const Layout =({children}: Props)=>{
    return (
      <TRPCReactProvider>
         <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col h-screen w-screen bg-muted">
        <DashboardNavbar/>
        {children}
      </main>
    </SidebarProvider>
    </TRPCReactProvider>
    )
}
export default Layout;