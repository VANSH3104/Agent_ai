import { SignInView } from "@/app/module/auth/ui/view/signin-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const page = async()=>{
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if(!!session){
        redirect("/dashboard")
    }
    return (
        <SignInView/>
    )
}
export default page;