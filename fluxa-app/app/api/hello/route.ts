import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { message: 'Hello World da API do Fluxa!' },
    { status: 200 }
  )
}
