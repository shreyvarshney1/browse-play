import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const fsUrl = `ftp://192.168.1.37:2121`;
  const response = await fetch(`${fsUrl}`);
  console.log(response.body);
  return new NextResponse(response.body, response);
}
