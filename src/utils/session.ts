import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import authOptions from "../app/api/auth/[...nextauth]/options"

export async function getSession(req: NextRequest, res: NextResponse) {
  const session = await getServerSession(
    authOptions
  )
  return session
}