import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create new user
    const hashedPassword = await hashPassword(password)
    const newUser = {
      username,
      email,
      password: hashedPassword,
      role: "user",
      bio: "",
      profilePhoto: "",
      createdAt: new Date(),
      isActive: true,
    }

    const result = await db.collection("users").insertOne(newUser)
    const token = generateToken(result.insertedId.toString())

    const response = NextResponse.json({
      message: "User created successfully",
      user: { id: result.insertedId, username, email, role: "user" },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
