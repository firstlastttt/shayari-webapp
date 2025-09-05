import { verifyToken } from "./auth"

export const checkAdminRole = (requiredRole = "admin") => {
  return async (request) => {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return { error: "Authentication required", status: 401 }
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return { error: "Invalid token", status: 401 }
    }

    // Get user from database to check current role
    const { connectDB } = await import("./mongodb")
    const { ObjectId } = await import("mongodb")

    const db = await connectDB()

    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return { error: "User not found", status: 404 }
    }

    if (!user.isActive) {
      return { error: "Account is banned", status: 403 }
    }

    // Check role hierarchy: super_admin > admin > user
    const roleHierarchy = { user: 0, admin: 1, super_admin: 2 }
    const userLevel = roleHierarchy[user.role] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 1

    if (userLevel < requiredLevel) {
      return { error: "Insufficient permissions", status: 403 }
    }

    return { user, success: true }
  }
}
