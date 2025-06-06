"use client";
import { Card, CardContent } from '@/components/ui/card'
import React, { useState } from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { FaGithub, FaGoogle } from "react-icons/fa";
import { OctagonAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';
const formSchema = z.object({
  name: z.string().min(1, {message: "Name is required"}),
  email: z.string().email(),
  password: z.string().min(1,{message: "Password is required"}),
  confirmPassword: z.string().min(1,{message: "password is required"})
}).refine((data)=>data.password === data.confirmPassword,{
  message: "Password don't match",
  path: ["confirmPassword"],
})
export const SignUpView= ()=>{
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading , setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
      setError(null);
      setIsLoading(true); 
      try {
        await authClient.signUp.email({
          name: data.name,
          email: data.email,
          password: data.password,
        }, {
          onSuccess: () => {
            router.push('/dashboard');
          },
          onError: ({ error }) => {
            setError(error.message || "");
          },
        });
      } finally {
        setIsLoading(false);
      }
    }
    const onSocial = async (provider: "github" | "google") => {
      setError(null);
      setIsLoading(true); 
      try {
        await authClient.signIn.social({
          provider:provider,
          callbackURL: '/dashboard'
        }, {
          onSuccess: () => {
            
          },
          onError: ({ error }) => {
            setError(error.message || "");
          },
        });
      } finally {
        setIsLoading(false);
      }
    }
  return (
    <div className='flex flex-col gap-6'>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <Form {...form}>
          <form className='p-6 md:p-8' onSubmit={form.handleSubmit(onSubmit)}>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col item-center text-center'>
                <h1 className='text-2xl font-bold'>Let&apos;s get started</h1> 
                <p className='text-muted-foreground'>Create your account</p>
              </div>
              <div className='grid gap-3'>
                <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        type='text'
                        placeholder='vk'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
                ></FormField>
              </div>
              <div className='grid gap-3'>
                <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type='email'
                        placeholder='vk@email.com'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
                ></FormField>
              </div>
              <div className='grid gap-3'>
                <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type='password'
                        placeholder='********'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
                ></FormField>
              </div>
              <div className='grid gap-3'>
                <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type='password'
                        placeholder='********'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
                ></FormField>
              </div>
              {!!error && (
                <Alert className='bg-destructive/10 border-none '>
                  <OctagonAlertIcon  className='h-4 w-4 !text-destructive'/>
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full relative"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center absolute inset-0">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing Up...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </Button>
              <div className='relative text-center text-sm'>
              <div className="absolute inset-0 top-1/2 border-t border-border z-0" aria-hidden="true"></div>
              <span className='relative z-10 bg-card px-2 text-muted-foreground'>Or continue with</span>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <Button
                  variant="outline"
                  type='button'
                  onClick={()=> onSocial('google')}
                  className='w-full'
                >
                  <FaGoogle />
                </Button>
                <Button
                variant="outline"
                type='button'
                onClick={()=> onSocial('github')}
                className='w-full'
              >
                <FaGithub />
              </Button>
              </div>
              <div className='text-sm text-muted-foreground text-center'>
                Already have an account?{" "}<Link href="/sign-in" className='underline underline-offset-4 '>Sign in</Link>
              </div>
            </div>
          </form>
          </Form>
          <div className='bg-radial from-sidebar-accent to-sidebar relative hidden md:flex flex-col items-center justify-center p-6 text-white'>  
            <img src="/logo.svg" alt='Image' className='h-[150px] w-[150px]'/>
            <p className='text-xl font-bold text-white'>Agent.AI</p>
          </div>
        </CardContent>
      </Card>
      <footer className="text-center text-sm text-muted-foreground mt-8 px-4">
      <p>
        By continuing, you agree to our{' '}
        <a href="/terms" className="text-primary underline hover:opacity-80">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-primary underline hover:opacity-80">
          Privacy Policy
        </a>.
      </p>
  </footer>

    </div>
  )
}
