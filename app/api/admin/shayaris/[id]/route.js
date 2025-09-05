import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { checkAdminRole } from "@/lib/admin-middleware"
import { ObjectId } from "mongodb"

// DELETE - Delete any shayari (admin)
export async function DELETE(request, { params }) {
  const authCheck = await checkAdminRole("admin")(request)
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shayari ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const shayari = await db.collection("shayaris").findOne({ _id: new ObjectId(id) })
    if (!shayari) {
      return NextResponse.json({ error: "Shayari not found" }, { status: 404 })
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
