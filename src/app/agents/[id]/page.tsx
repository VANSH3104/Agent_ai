import React from "react";
import { getQueryClient } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Followpage } from "./components/folowpage";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  // console.log(id);
  
  if (!session) {
    redirect("/sign-in");
  }
  
  const queryClient = getQueryClient();
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          {/* Pass the id as a prop, not the entire params object */}
          <Followpage id={id} />
        </div>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;