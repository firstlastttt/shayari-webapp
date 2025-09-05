import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { username, bio, profilePhoto } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    // Check if username is already taken by another user
    const existingUser = await db.collection("users").findOne({
      username,
      _id: { $ne: new ObjectId(decoded.userId) },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 })
    }

    // Update user profile
    const updateData = {
      username,
      bio: bio || "",
      profilePhoto: profilePhoto || "",
      updatedAt: new Date(),
    }

    const result = await db.collection("users").updateOne({ _id: new ObjectId(decoded.userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch updated user data
    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { password: 0 } })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
