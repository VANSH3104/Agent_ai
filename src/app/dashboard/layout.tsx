import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/Dashboard_sidebar";

interface Props {
    children: React.ReactNode
}

const Layout =({children}: Props)=>{
    return (
         <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
    )
}
export default Layout;