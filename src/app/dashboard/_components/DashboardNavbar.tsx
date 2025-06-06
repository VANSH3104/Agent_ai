"use client"
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { PanelLeftCloseIcon, PanelLeftIcon, SearchIcon } from 'lucide-react'
import { DashboardCommand } from './DashboardCommand'

export const DashboardNavbar =()=> {
    const { state , toggleSidebar , isMobile} = useSidebar();
    const [commandOpen, setCommandOpen] = useState(false);
    useEffect(()=>{
        const down = (e: KeyboardEvent) => {
            if(e.key === "k" && (e.metaKey || e.ctrlKey) ) {
                e.preventDefault();
                setCommandOpen(open => !open);
            } 
        }
        document.addEventListener("keydown", down);
        return () => {
            document.removeEventListener("keydown", down);
        }
    },[])
  return (
    <>
    <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
    <nav className='flex items-center px-4 gap-x-2 py-2 border-b bg-background shadow-md'>
        <Button className='size-9' variant="outline" onClick={toggleSidebar}>
            {(state ==="collapsed" || isMobile) ?<PanelLeftIcon className='size-4' /> : <PanelLeftCloseIcon className='size-4'/>}
        </Button>
        <Button className='h-9 justify-start font-normal text-muted-foreground hover:text-muted-foreground w-[240px]' variant="outline" size="sm" onClick={()=>setCommandOpen(open => !open)}> 
            <SearchIcon />
            search
            <kbd className='pointer-events-none item-center gap-1 ml-auto inline-flex h-5 rounded border bg-muted px-1.5  font-mono font-medium text-muted-foreground '>
                <span className='text-xs'>&#8984;</span> K
            </kbd>
        </Button>
    </nav>
    </>
  )
}
