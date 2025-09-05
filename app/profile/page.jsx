"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Save, User } from "lucide-react"

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    profilePhoto: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFormData({
          username: data.user.username,
          email: data.user.email,
          bio: data.user.bio || "",
          profilePhoto: data.user.profilePhoto || "",
        })
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          bio: formData.bio,
          profilePhoto: formData.profilePhoto,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Profile updated successfully!")
        setUser(data.user)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account settings and personal information</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your profile details to personalize your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo Section */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.profilePhoto || "/placeholder.svg"} alt={formData.username} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl">
                      {formData.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="w-full max-w-sm">
                    <Label htmlFor="profilePhoto">Profile Photo URL</Label>
                    <Input
                      id="profilePhoto"
                      name="profilePhoto"
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={formData.profilePhoto}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter a URL for your profile photo</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="mt-1 bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell us about yourself and your poetry..."
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.bio.length}/500 characters</p>
                  </div>
                </div>

                {/* Account Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Account Status:</span>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Active" : "Banned"}
                  </Badge>
                  {user.role !== "user" && (
                    <Badge variant="secondary">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
                  )}
                </div>

                {/* Messages */}
                {message && (
                  <Alert>
                    <AlertDescription className="text-green-700">{message}</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
