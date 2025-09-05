"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PenTool, Save, Eye, EyeOff } from "lucide-react"

export default function CreateShayariPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    visibility: "public",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [shayariId, setShayariId] = useState(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId) {
      setIsEditing(true)
      setShayariId(editId)
      fetchShayariForEdit(editId)
    }
  }, [searchParams])

  const fetchShayariForEdit = async (id) => {
    try {
      const response = await fetch(`/api/shayaris/${id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          title: data.shayari.title,
          content: data.shayari.content,
          visibility: data.shayari.visibility,
        })
      } else {
        setError("Failed to load shayari for editing")
      }
    } catch (error) {
      setError("Failed to load shayari for editing")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const url = isEditing ? `/api/shayaris/${shayariId}` : "/api/shayaris"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(isEditing ? "Shayari updated successfully!" : "Shayari created successfully!")
        if (!isEditing) {
          setFormData({ title: "", content: "", visibility: "public" })
        }
        setTimeout(() => {
          router.push("/my-shayaris")
        }, 1500)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <PenTool className="h-8 w-8 text-purple-600" />
              {isEditing ? "Edit Shayari" : "Write New Shayari"}
            </h1>
            <p className="text-gray-600">
              {isEditing ? "Update your shayari" : "Express your thoughts and emotions through poetry"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Your Shayari" : "Create Your Shayari"}</CardTitle>
              <CardDescription>Share your poetry with the world or keep it private for yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Give your shayari a beautiful title..."
                    value={formData.title}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">{formData.title.length}/100 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Shayari Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Write your shayari here...&#10;&#10;دل کی بات کہہ دو&#10;جو دل میں ہے وہ کہہ دو"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    rows={8}
                    maxLength={2000}
                    className="font-medium leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground">{formData.content.length}/2000 characters</p>
                </div>

                <div className="space-y-3">
                  <Label>Visibility</Label>
                  <RadioGroup
                    value={formData.visibility}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, visibility: value }))}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Eye className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Public</div>
                          <div className="text-sm text-muted-foreground">Everyone can see and like your shayari</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer flex-1">
                        <EyeOff className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium">Private</div>
                          <div className="text-sm text-muted-foreground">Only you can see this shayari</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : isEditing ? "Update Shayari" : "Publish Shayari"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/my-shayaris")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
