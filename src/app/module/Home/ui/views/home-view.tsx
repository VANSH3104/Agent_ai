"use client"
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation';
import React from 'react'

export const Homeview=()=> {
    const router = useRouter();
    const {data: session} = authClient.useSession();
    if(!session){
        return (
            <p>loading</p>
        )
    }
  return (
    <div>home-view
       <Button onClick={()=>authClient.signOut({fetchOptions:{onSuccess:()=>router.push("/")}})}>signout</Button> 
    </div>
  )
}
