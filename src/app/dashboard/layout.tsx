import { SidebarProvider} from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/Dashboard_sidebar";
import { DashboardNavbar } from "./_components/DashboardNavbar";

interface Props {
    children: React.ReactNode
}

const Layout =({children}: Props)=>{
    return (
         <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col h-screen w-screen bg-muted">
        <DashboardNavbar/>
        {children}
      </main>
    </SidebarProvider>
    )
}
export default Layout;