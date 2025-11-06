"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { PanelLeftCloseIcon, PanelLeftIcon} from 'lucide-react'
import { DashboardCommand } from './DashboardCommand'
import { usePathname } from 'next/navigation'

export const DashboardNavbar =()=> {
    const pathname = usePathname();
    const { state , toggleSidebar , isMobile} = useSidebar();
    const [commandOpen, setCommandOpen] = useState(false);
    const isActive = pathname != "/dashboard"
  return (
    <>
    <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
    <nav className='flex items-center px-4 gap-x-2 py-2 border-b bg-background shadow-md'>
        <Button className='size-9' variant="outline" onClick={toggleSidebar}>
            {(state ==="collapsed" || isMobile) ?<PanelLeftIcon className='size-4' /> : <PanelLeftCloseIcon className='size-4'/>}
        </Button>
        {!isActive && (<>
  
        </>)}
    </nav>
    </>
  )
}
