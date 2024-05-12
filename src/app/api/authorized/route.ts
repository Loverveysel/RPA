import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(req: NextRequest) {
    const res = new NextResponse()
    const session = await getToken({req, secret: process.env.NEXT_SECRET})  
    const sessionData = session?.user
    console.log("session  : " + session)    
    return NextResponse.json(session)
}