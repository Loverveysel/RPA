import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { states } from "@/states/states"
import { getServerSession } from "next-auth"
import authOptions from "../../auth/[...nextauth]/options"
import { convertToXml } from "@/utils/convertXML"

export async function GET(req: NextRequest, context: any) {
    const { id } = context.params
  
    const session = await getServerSession(authOptions)
    
    const genAI = new GoogleGenerativeAI('AIzaSyAgC-BJi1m5IzhdYIXobOnIAhBQJuTgUQI')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    let mails : any[] = []
    let categories : any = {buiseness: [], personal: [], education: [], advertisement: [], spam: []}

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
      invoice: "Invoice"
    }

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
            
        if (Object.values(categoryWordCount).every((value) => value == 0)) {
          const email = {...messageData, category: "spam"}
          categories = {...categories, spam: [...categories["spam"], email]}
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
          console.log(subcategoryVariableName, "/ ", definiteSubcategory)
          try {
            categories = {...categories, [definiteState]: {...categories[definiteState], [subcategoryVariableName] : [...categories[definiteState][subcategoryVariableName], email]}}//Mail kategorisine göre mail ekleniyor
          } catch (error) {
            console.log("errror : " + definiteSubcategory)
          }
        }
      }
    }

  if (session) {
    await DFA()

    const xml = convertToXml(categories)
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml"
      }
    })
          
  }else{
    return new NextResponse("Unauthorized", {status: 401})
  }
}