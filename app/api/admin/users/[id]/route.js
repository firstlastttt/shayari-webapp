import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { checkAdminRole } from "@/lib/admin-middleware"
import { ObjectId } from "mongodb"

// PUT - Update user (ban/unban, role change)
export async function PUT(request, { params }) {
  const authCheck = await checkAdminRole("admin")(request)
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const { id } = params
    const { action, role } = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent self-modification
    if (targetUser._id.equals(new ObjectId(authCheck.user._id))) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 })
    }

    const updateData = {}

    if (action === "ban") {
      updateData.isActive = false
    } else if (action === "unban") {
      updateData.isActive = true
    } else if (action === "change_role" && role) {
      // Only super_admin can change roles
      const superAdminCheck = await checkAdminRole("super_admin")(request)
      if (!superAdminCheck.success) {
        return NextResponse.json({ error: "Only super admin can change roles" }, { status: 403 })
      }

      if (!["user", "admin", "super_admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }

      // Prevent creating multiple super admins (optional business rule)
      if (role === "super_admin" && authCheck.user.role !== "super_admin") {
        return NextResponse.json({ error: "Only super admin can promote to super admin" }, { status: 403 })
      }

      updateData.role = role
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...updateData, updatedAt: new Date() } })

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete user (super admin only)
export async function DELETE(request, { params }) {
  const authCheck = await checkAdminRole("super_admin")(request)
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent self-deletion
    if (targetUser._id.equals(new ObjectId(authCheck.user._id))) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete user and all associated data
    await Promise.all([
      db.collection("users").deleteOne({ _id: new ObjectId(id) }),
      db.collection("shayaris").deleteMany({ authorId: new ObjectId(id) }),
      db.collection("likes").deleteMany({ userId: new ObjectId(id) }),
    ])

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
