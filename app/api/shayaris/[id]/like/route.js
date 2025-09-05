import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request, { params }) {
  try {
    const { id } = params
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shayari ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const userId = new ObjectId(decoded.userId)
    const shayariId = new ObjectId(id)

    // Check if shayari exists and is public (or user owns it)
    const shayari = await db.collection("shayaris").findOne({ _id: shayariId })
    if (!shayari) {
      return NextResponse.json({ error: "Shayari not found" }, { status: 404 })
    }

    if (shayari.visibility === "private" && !shayari.authorId.equals(userId)) {
      return NextResponse.json({ error: "Cannot like private shayari" }, { status: 403 })
    }

    // Check if user already liked this shayari
    const existingLike = await db.collection("likes").findOne({
      userId,
      shayariId,
    })

    let liked = false

    if (existingLike) {
      // Unlike - remove the like
      await db.collection("likes").deleteOne({ _id: existingLike._id })
      liked = false
    } else {
      // Like - add new like
      await db.collection("likes").insertOne({
        userId,
        shayariId,
        createdAt: new Date(),
      })
      liked = true
    }

    // Get updated likes count
    const likesCount = await db.collection("likes").countDocuments({ shayariId })

    return NextResponse.json({
      liked,
      likesCount,
      message: liked ? "Shayari liked successfully" : "Shayari unliked successfully",
    })
  } catch (error) {
    console.error("Like operation failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Check if user has liked a shayari
export async function GET(request, { params }) {
  try {
    const { id } = params
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ liked: false, likesCount: 0 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ liked: false, likesCount: 0 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shayari ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const userId = new ObjectId(decoded.userId)
    const shayariId = new ObjectId(id)

    // Check if user liked this shayari
    const existingLike = await db.collection("likes").findOne({
      userId,
      shayariId,
    })

    // Get total likes count
    const likesCount = await db.collection("likes").countDocuments({ shayariId })

    return NextResponse.json({
      liked: !!existingLike,
      likesCount,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
