"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, User, BookOpen } from "lucide-react"

export default function SearchSuggestions({
  value,
  onChange,
  onSelect,
  placeholder = "Search shayaris...",
  className = "",
}) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions)
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    onChange(e.target.value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "author") {
      onSelect({ type: "author", value: suggestion.value })
    } else {
      onSelect({ type: "query", value: suggestion.value })
    }
    setShowSuggestions(false)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pl-10"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.text}-${index}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.type === "author" ? (
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={suggestion.avatar || "/placeholder.svg"} alt={suggestion.text} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                      {suggestion.text.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{suggestion.text}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <User className="w-3 h-3 mr-1" />
                    Author
                  </Badge>
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm">{suggestion.text}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Title
                  </Badge>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading suggestions...</span>
          </div>
        </div>
      )}
    </div>
  )
}
