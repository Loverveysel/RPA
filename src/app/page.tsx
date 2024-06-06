"use client"
import React, {useEffect} from 'react'
import LoginForm from '@/components/LoginForm'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function page() {
    const { data: session, status } = useSession()

    const router = useRouter()

    useEffect(() => {
        if (session) {
          router.push('/home')      
        }
    }, [session])

    return (
      <main className='flex flex-row min-h-screen min-w-full bg-gradient-to-t from-blue-200  to-blue-400 '>
        <div className='flex flex-row m-auto'>
          
        <div className='flex flex-col m-auto bg-pink-300 w-96 h-96 rounded-3xl shadow-2xl'>
          <div className='flex flex-col m-auto mt-3 ml-3 bg-gradient-to-tr from-blue-500 to-purple-400 w-96 h-96 rounded-3xl shadow-2xl'>
            <span className='text-3xl m-auto'>Welcome Back!</span>
          </div>
        </div>
        
        <div className=' divider  divider-horizontal m-auto ml-5 mr-5 '></div>

        <div className='flex flex-col m-auto bg-white h-96 w-96 rounded-3xl shadow-2xl duration-300 hover:scale-105 hover:shadow-lg border-2 border-blue-300'>
          
          <div className='m-auto'>
            <LoginForm/>
          </div>
        </div>
        

        </div>
      </main>
    )  
    
}