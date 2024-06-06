"use client"
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function page({params}: {params: {id: string}}) {
    const [mail, setMail] = useState<any>({})
    const [mailHeaders, setMailHeaders] = useState<any[any]>([{}])

    const { data: session, status } = useSession()

    const { id }= params

    const router = useRouter()

    const handleButton = () => {
        router.push('/home')
    }

    useEffect(()=>{

        const getMail = async () => {
            const apiUrl2 = 'https://www.googleapis.com/gmail/v1/users/me/messages/' + id //Mail id' si ile mail içeriğini çekmek için kullanılan api url' si
            const messageRes = await fetch(apiUrl2 ,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                //@ts-ignore
                "authorization": "Bearer " + session.token.accessToken,
                }
            })//api'ye get request atılıyor

            const mailData = await messageRes.json()
            console.log(mailData.payload.headers)
            setMailHeaders(mailData.payload.headers)
            setMail(mailData)
        }
        if(session){
            getMail()
        }
       
    }, [session])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if(session){
    return (
        <main className='flex flex-row min-h-screen min-w-full w-full h-full bg-gradient-to-t from-blue-200  to-blue-400 '>
            <div className='flex flex-col text-2xl'>
                <span className='text-bold text-8xl'>{mailHeaders[1] ?
                    mailHeaders.find((header: any) => header.name === 'Subject').value : 'Loading...'
                }</span>
                <span className='text-l'>{mailHeaders[1] ?
                    mailHeaders.find((header: any) => header.name === 'From').value : 'Loading...'
                }</span>
                <span className='text text-2xl'>{mail.snippet}</span>
                <span className='text-l'>{mailHeaders[1] ?
                    mailHeaders.find((header: any) => header.name === 'Date').value : 'Loading...'
                }</span>

            </div>
        </main>
      )
  }else{
    return (
        <main className=''>
            <div className=''>
                <span className=''>You are not logged in</span>
            </div>
        </main>
    )
  }
}
