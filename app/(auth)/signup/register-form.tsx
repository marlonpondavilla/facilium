"use client"

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { signupSchema } from '@/validation/signupSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export const RegisterForm = () => {
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    }
  });

  const handleSubmit = async (data: z.infer<typeof signupSchema>) => {
    console.log("test")
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col gap-4'
        >
        <div className="email-container">
          <FormField
            control={form.control}
            name='email'
            render={({field}) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type='email' 
                    placeholder='Email' 
                    {...field}
                    className='w-xs'
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="password-container">
          <FormField
            control={form.control}
            name='password'
            render={({field}) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type='text' 
                    placeholder='Password' 
                    {...field} 
                    className='w-xs'/>
                </FormControl>
                <FormMessage className='w-[20rem]'/>
              </FormItem>
            )}
          /> 
        </div>
        <div className="confirm-password-container">
          <FormField
            control={form.control}
            name='confirmPassword'
            render={({field}) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    type='text' 
                    placeholder='Confirm Password' 
                    {...field} 
                    className='w-xs'/>
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          /> 
        </div>
        <Button type='submit'>Signup</Button>
      </form>

    </Form>
  )
}
