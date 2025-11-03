import { auth } from "@/lib/auth";
import { AgentContainer, Homeview } from "../module/Home/ui/views/home-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
const page = async()=>{
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if(!session){
        redirect("/sign-in")
    }
    return (
    <AgentContainer>
    <HydrateClient>
      <ErrorBoundary fallback={<div>error</div>}>
        <Suspense fallback={<div>Loading...</div>}>
        <Homeview/>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
    </AgentContainer>
    )
}
export default page;