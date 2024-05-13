"use client"
import React, { useEffect, useState } from 'react'
import LoginForm from '@/components/LoginForm'
import { signOut, useSession } from 'next-auth/react'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { states } from '@/words/words'
import { useRouter } from 'next/navigation'

export default function page() {
    const [input, setInput] = useState<string>()
    const [mails, setMails] = useState<any[]>([])
    const [categorizedMails, setCategorizedMails] = useState<any[]>([])
    const [translatedText, setTranslatedText] = useState<string>('')

    let categories  = {buiseness: [], personal: [], education: [], financal: [], spam: []}
    
    const { data: session, status } = useSession()
    const router = useRouter()

    const genAI = new GoogleGenerativeAI('AIzaSyAgC-BJi1m5IzhdYIXobOnIAhBQJuTgUQI')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })    
    
    let strictBanner = false

    useEffect(() => {
    const DFA = async () =>{
      //@ts-ignore
      const apiUrl = 'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10' //Son 10 e postayı çekmek için kullanılan api url' si
      const res = await fetch(apiUrl ,{ 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        //@ts-ignore
        "authorization": "Bearer " + session.token.accessToken,
      }
    })//api'ye get request atılıyor

    const data = await res.json()//E postaların id' lerini içeren json objesi data' ya atanıyor
    await data.messages.forEach(async (mail:any) => { //Her bir mail için DFA çalıştırılıyor
        const apiUrl2 = 'https://www.googleapis.com/gmail/v1/users/me/messages/' + mail.id //Mail id' si ile mail içeriğini çekmek için kullanılan api url' si
        const messageRes = await fetch(apiUrl2 ,{
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            //@ts-ignore
            "authorization": "Bearer " + session.token.accessToken,
          }
      })//api'ye get request atılıyor

      const messageData = await messageRes.json() //Mail içeriğini içeren json objesi messageData' ya atanıyor
      
      //Mail içeriği gemini yapay zekası ile ingilizceye çeviriliyor
      const result = await model.generateContent("Bu maili ingilizceye çevir (Bütün harfler küçük harf olacak) : " + messageData.snippet)
      const response = await result.response
      const englishSnippet = response.text() //İngilizceye çevrilmiş mail içeriği englishSnippet değişkenine atanıyor

      let word = ""
      let breakFlag = false 

      for (let index = 0; index < englishSnippet.length; index++) {//Mail içeriğindeki her bir kelime için aşağıdaki işlemler yapılıyor

        if (englishSnippet[index] === " " || index === englishSnippet.length-1) { //Eğer kelimenin sonuna gelinmişse veya kelime boşluk karakteri ile bitmişse
          for (let j = 0; j < Object.keys(states).length && breakFlag == false; j++) {//words objesindeki her bir kategorinin içindeki kelimeler ile karşılaştırma yapılıyor
            const state = Object.keys(states)[j] 
            const stateWords : string[] = states[state]

            if (stateWords.includes(word)) {
              const email = {...messageData, category: state}//Gelen input' a göre state belirleniyor
              setMails((prevMails)=>[...prevMails, email]) //Mails array'ine mail ekleniyor
              breakFlag = true
            }
            else if (j === stateWords.length-1){
              const email = {...messageData, category: "Spam"}//Gelen input' a göre state belirleniyor
              setMails((prevMails)=>[...prevMails, email])//Mails array'ine mail ekleniyor
              breakFlag = true
            }
          }
          word = ""
        }

        else{
          word += englishSnippet[index] 
        }
      }
    })
  }

    if (session) {
      if (strictBanner == false) {
        DFA()
        strictBanner = true
        convertToXml(categories)
      }
    }
    else{
      router.push('/')
    }
  }, [])

function convertToXml(emailsByCategory: any) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<emails>';

  for (const category in emailsByCategory) {
    xml += `\n  <category name="${category}">`;
    emailsByCategory[category].forEach((email: any) => {
      xml += `\n    <email>`;
      xml += `\n      <subject>${email.category}</subject>`;
      xml += `\n      <content>${email.content}</content>`;
      xml += `\n    </email>`;
    });
    xml += `\n  </category>`;
  }

  xml += '\n</emails>';
  return xml;
}


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
        <div className='text-3xl text-black'>
          { translatedText }
        </div>
        <button className='btn' onClick={()=>{console.log(categorizedMails)}}>TRY</button>
        <button type="button" className='btn ' onClick={()=>{signOut()}}>Log Out</button>
        
      </main>
    )
  }else{
    return (
      <main className='flex flex-row min-h-screen min-w-full bg-gradient-to-t from-blue-200  to-blue-400 '>
        <LoginForm />
      </main>
    )
  }
}