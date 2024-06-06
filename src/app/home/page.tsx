"use client"
import React, { useEffect, useState } from 'react'
import LoginForm from '@/components/LoginForm'
import { signOut, useSession } from 'next-auth/react'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { states } from '@/states/states'
import { useRouter } from 'next/navigation'

export default function page() {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [categories, setCateogies]  = useState<any>({news: {general: [], economic: [], cultureandart:[] }, personal: {familyandfriend: [], socialmedia: [], event: []}, education: {school: [], self:[]}, financial: {invoice:[], inform: [], payment: [], reminder: []},advertisement : {campaigns : [], subscriptions: [], opportunities: []}, spam: []})

    const categoryToText : any = {
      financial: "Financial",
      personal: "Personal",
      education: "Education",
      advertisement: "Advertisement",
      news: "News",
      spam: "Spam"
    }
    const categoryToColor : any = {
      financial: "blue",
      personal: "yellow",
      education: "green",
      advertisement: "red",
      news: "purple",
      spam: "gray"
    }

    const subcategoryToText : any = {
      general: "General News",
      economic: "Economic News",
      cultureandart: "Culture and Art News",
      familyandfriend: "Family and Friend",
      socialmedia: "Social Media",
      event: "Event",
      school: "School Nottification",
      self: "Self-Improvement",
      inform: "Inform",
      payment: "Payments",
      reminder: "Reminders",
      invoice: "Invoice",
      campaigns: "Campaigns",
      subscriptions: "Subscriptions",
      opportunities: "Opportunities"
    }
    
    const { data: session, status } = useSession()
    const router = useRouter()

    const genAI = new GoogleGenerativeAI('AIzaSyAgC-BJi1m5IzhdYIXobOnIAhBQJuTgUQI')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })    
    
    let strictBanner = false

    const DFA = async () =>{
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
      console.log(data)
      console.log(session)
      for (let i = 0; i < data.messages.length; i++) {
          const apiUrl2 = 'https://www.googleapis.com/gmail/v1/users/me/messages/' + data.messages[i].id //Mail id' si ile mail içeriğini çekmek için kullanılan api url' si
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
        let englishSnippet : string = ""
        try {
          const result = await model.generateContent("Bu maili ingilizceye çevir (Bütün harfler küçük harf olacak) : " + messageData.snippet)
          const response = await result.response
          englishSnippet = response.text() //İngilizceye çevrilmiş mail içeriği englishSnippet değişkenine atanıyor
          console.log(englishSnippet)
        } catch (error) {
          
        }

        let wordinSnippet = ""

        let categoryWordCount : {[key: string] : number} = {news: 0, personal: 0, education: 0, advertisement: 0, financial: 0, spam: 0}
        let categoriesWordObjects : {[key: string]: {word: string, subcategory: string}[]} = {news: [], personal: [], education: [], advertisement: [], financial: [], spam: [] } 

        for (let index = 0; index < englishSnippet.length; index++) {//Mail içeriğindeki her bir kelime için aşağıdaki işlemler yapılıyor

          if (englishSnippet[index] === " " || index === englishSnippet.length-1) { //Eğer kelimenin sonuna gelinmişse veya kelime boşluk karakteri ile bitmişse
            for (let j = 0; j < Object.keys(states).length; j++) {//words objesindeki her bir kategorinin içindeki kelimeler ile karşılaştırma yapılıyor
              const state = Object.keys(states)[j] 
              const stateWords = states[state]

              const wordObject = stateWords.find((categoryWord: {word: string, subcategory: string}) => categoryWord.word == wordinSnippet)
              if (wordObject) {
                categoryWordCount[state] += 1
                categoriesWordObjects[state].push(wordObject)
              }
            }
            wordinSnippet = ""
            
          }
          else{
            wordinSnippet += englishSnippet[index] 
          }
        }

        console.log(categoryWordCount)
        console.log(categoriesWordObjects)
            
        if (Object.values(categoryWordCount).every((value) => value == 0)) {
          const email = {...messageData, category: "spam"}
          setCateogies((prevCategories: any)=>({...prevCategories, spam: [...prevCategories["spam"], email]}))
        }else{
          //categoryWordCount objesindeki kategorilerin sayılarının max' ını bul 
          const indexOfMaxValue = Object.values(categoryWordCount).indexOf(Math.max(...Object.values(categoryWordCount)))
          const definiteState : string = Object.keys(categoryWordCount)[indexOfMaxValue]
          
          const subcategoriesArray = categoriesWordObjects[definiteState].map(wordObject => wordObject.subcategory) //[{word: wordinSnippet, subcategory: "none"}, ...]

          //subcategoriesArray içinde yer alan en çok subcategory' i bul
          let subcategoryCount : {[key: string] : number}  = {}
          for (let i = 0; i < subcategoriesArray.length; i++) {
            if (subcategoryCount[subcategoriesArray[i]] == undefined) {
              subcategoryCount[subcategoriesArray[i]] = 0
            }
            subcategoryCount[subcategoriesArray[i]] += 1
          }
          const indexOfMaxSubcategory = Object.values(subcategoryCount).indexOf(Math.max(...Object.values(subcategoryCount)))
          const definiteSubcategory = Object.keys(subcategoryCount)[indexOfMaxSubcategory]

          const subcategoryVariableName = Object.keys(subcategoryToText)[Object.values(subcategoryToText).indexOf(definiteSubcategory)]
          
          const email = {...messageData, category: definiteState, subcategory: definiteSubcategory}//Gelen input' a göre definiteState belirleniyor
          try {
            console.log(definiteSubcategory)
            console.log(subcategoryVariableName)
            setCateogies((prevCategories: any)=>({...prevCategories, [definiteState]: {...prevCategories[definiteState], [subcategoryVariableName] : [...prevCategories[definiteState][subcategoryVariableName], email]}}))//Mail kategorisine göre mail ekleniyor
          } catch (error) {
            console.log("errror : " + definiteSubcategory)
          }
        }
      }
    }

    useEffect(() => {
      if (session) {
        if (strictBanner === false) {
          strictBanner = true
          DFA().then(() => {
            setIsLoading(false)
            console.log("DFA BİTTİ")
          })
        }
      }

      else{
        router.push('/')
      }
    }, [])

  if(session){
    return (
      <main className='flex flex-row h-full min-h-screen min-w-full bg-gradient-to-t from-blue-200 to-blue-400'>
        <div className='flex flex-row text-black'>
          {Object.keys(categories).map((category, categoryIndex) => (
            <div className='flex w-full' key={categoryIndex}>
              <div className='grid flex-grow mt-2'>
                <div className='text-center'>
                  <span className='text-3xl m-auto text-bold' style={{ color: categoryToColor[category] }}>
                    {categoryToText[category]}
                  </span>
                  <div className='divider m-auto mt-3 mb-3'></div>
                  <div className='flex flex-col m-auto mt-3'>
                    {isLoading ? (
                      <span className="loading loading-spinner loading-lg"></span>
                    ) : (
                        category !== "spam" ? Object.keys(categories[category]).map((subcategory, subcategoryIndex) => (
                        <div key={subcategoryIndex}>
                          <div className='divider h-8'></div>
                          <span className='text-4xl text-bold'>{subcategoryToText[subcategory]}</span>
                          {categories[category][subcategory].map((mail: any, mailIndex: number) => (
                            <div
                              key={mailIndex}
                              className='flex flex-col m-auto border-b-2 border-b-gray-300 duration-300 mt-2 p-6 hover:border-2 hover:border-gray-300'
                            >
                              <div className='ml-0'>
                                <span className='text-2xl text-red-400'>
                                  {mail.payload.headers.find((header: any) => header.name === 'Subject').value}
                                </span>
                              </div>
                              <div
                                className='m-auto hover:underline hover:cursor-pointer'
                                onClick={() => router.push("/mail/" + mail.id)}
                              >
                                <span className='text-sm text-gray-500'>{mail.snippet}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )) : categories[category].map((mail: any, index: number) => (
                        <div
                        key={index}
                        className='flex flex-col m-auto border-b-2 border-b-gray-300 duration-300 mt-2 p-6 hover:border-2 hover:border-gray-300'
                      >
                        <div className='ml-0'>
                          <span className='text-2xl text-red-500'>
                            {mail.payload.headers.find((header: any) => header.name === 'Subject').value}
                          </span>
                        </div>
                        <div
                          className='m-auto hover:underline hover:cursor-pointer'
                          onClick={() => router.push("/mail/" + mail.id)}
                        >
                          <span className='text-sm text-gray-500'>{mail.snippet}</span>
                        </div>
                      </div>
                      ))
                    ) }
                  </div>
                </div>
              </div>
              <div className="divider divider-horizontal"></div>
            </div>
          ))}
        </div>
        <button type="button" className='btn' onClick={()=>{signOut()}}>Log Out</button>
      </main>
    )
  }
  else{
    return (
      <main className='flex flex-row min-h-screen min-w-full bg-gradient-to-t from-blue-200  to-blue-400 '>
        <LoginForm />
      </main>
    )
  }
}