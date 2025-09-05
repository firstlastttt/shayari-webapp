import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Navbar from "@/components/navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-800">Shayari Hub</h1>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-purple-600 hover:bg-purple-700">Join Now</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 text-balance">
            Share Your Heart Through
            <span className="text-purple-600"> Shayari</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 text-pretty">
            Join thousands of poets and writers sharing their emotions, thoughts, and creativity through beautiful Urdu
            and Hindi poetry. Express yourself and connect with others who share your passion for words.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 px-8">
                Start Writing Today
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline" className="px-8 bg-transparent">
                Explore Shayaris
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="text-purple-700">Share & Express</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Write and share your original shayaris with a community that appreciates poetry and creativity.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-pink-100">
              <CardHeader>
                <CardTitle className="text-pink-700">Connect & Engage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Like, comment, and connect with fellow poets. Build your following and discover new voices.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="text-orange-700">Grow & Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get feedback on your work, learn from others, and improve your craft in a supportive environment.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
