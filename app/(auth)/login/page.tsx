import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'
import LoginForm from './login-form'

const Login = () => {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className='text-3xl font-bold text-center'>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
