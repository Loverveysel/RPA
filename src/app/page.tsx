"use client"
import React, { useEffect, useState } from 'react'
import LoginForm from '@/components/LoginForm'
import { signOut, useSession } from 'next-auth/react'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { get } from 'http';


export default function page() {
  const [input, setInput] = useState<string>()
  const [mails, setMails] = useState<any[]>([])
  const { data: session, status } = useSession()
  const [categorizedMails, setCategorizedMails] = useState<any[]>([])

  const genAI = new GoogleGenerativeAI('AIzaSyAgC-BJi1m5IzhdYIXobOnIAhBQJuTgUQI')
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })    

  useEffect(() => {
    const getGmailUser = async () =>{
      //@ts-ignore
      const apiUrl = 'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10'
      const res = await fetch(apiUrl ,{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        //@ts-ignore
        "authorization": "Bearer " + session.token.accessToken,
      }
    })

    const data = await res.json()
    await data.messages.forEach(async (mail:any) => {
        const apiUrl2 = 'https://www.googleapis.com/gmail/v1/users/me/messages/' + mail.id
        const messageRes = await fetch(apiUrl2 ,{
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            //@ts-ignore
            "authorization": "Bearer " + session.token.accessToken,
          }
      })
      const messageData = await messageRes.json()
      const result = await model.generateContent("Bu maili kategorize et : " + messageData.snippet)
      const response = await result.response
      const text = response.text()
      const email = {...messageData, category: text}
      console.log(email)
      await setMails((prevMails)=>[...prevMails, email])
    })
  }

    
  
  if (session) {
    getGmailUser()
  }
}, [session])


  if(session){
    return (
      <main className='flex flex-row min-h-screen min-w-full bg-gradient-to-t from-blue-200  to-blue-400 '>
        <div className='flex flex-col m-auto'>
          {
            mails.map((mail, index) => 
              (
                  <div className=' text-black w-full h-full'>
                    <span className='bg-green-500'>{mail.snippet}</span>
                    <br />
                    <span className='bg-red-500'>{mail.category}</span>
                  </div>
              )
            
            )
          }
        </div>
        <button className='btn' onClick={()=>{console.log(categorizedMails)}}>TRY</button>
        <button type="button" className='btn ' onClick={()=>{signOut()}}>Log Out</button>
        
      </main>
    )
  }else {
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
}
