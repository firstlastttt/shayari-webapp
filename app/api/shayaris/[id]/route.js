import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// GET - Fetch single shayari
export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shayari ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const shayari = await db
      .collection("shayaris")
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "shayariId",
            as: "likes",
          },
        },
        {
          $addFields: {
            author: { $arrayElemAt: ["$author", 0] },
            likesCount: { $size: "$likes" },
          },
        },
        {
          $project: {
            "author.password": 0,
            "author.email": 0,
            likes: 0,
          },
        },
      ])
      .toArray()

    if (shayari.length === 0) {
      return NextResponse.json({ error: "Shayari not found" }, { status: 404 })
    }

    return NextResponse.json({ shayari: shayari[0] })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update shayari
export async function PUT(request, { params }) {
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

    const { title, content, visibility } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    if (!["public", "private"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility option" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    // Check if shayari exists and user owns it
    const existingShayari = await db.collection("shayaris").findOne({
      _id: new ObjectId(id),
      authorId: new ObjectId(decoded.userId),
    })

    if (!existingShayari) {
      return NextResponse.json({ error: "Shayari not found or unauthorized" }, { status: 404 })
    }

    const updateData = {
      title: title.trim(),
      content: content.trim(),
      visibility,
      updatedAt: new Date(),
    }

    await db.collection("shayaris").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    return NextResponse.json({ message: "Shayari updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete shayari
export async function DELETE(request, { params }) {
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

    // Check if shayari exists and user owns it
    const existingShayari = await db.collection("shayaris").findOne({
      _id: new ObjectId(id),
      authorId: new ObjectId(decoded.userId),
    })

    if (!existingShayari) {
      return NextResponse.json({ error: "Shayari not found or unauthorized" }, { status: 404 })
    }

    // Delete the shayari and associated likes
    await Promise.all([
      db.collection("shayaris").deleteOne({ _id: new ObjectId(id) }),
      db.collection("likes").deleteMany({ shayariId: new ObjectId(id) }),
    ])

    return NextResponse.json({ message: "Shayari deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
