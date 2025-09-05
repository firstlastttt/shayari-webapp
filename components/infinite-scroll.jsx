"use client"

import { useRef, useCallback } from "react"

export function useInfiniteScroll(callback, hasMore, loading) {
  const observer = useRef()

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback()
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, hasMore, callback],
  )

  return lastElementRef
}

export function InfiniteScrollTrigger({ onLoadMore, hasMore, loading, children }) {
  const triggerRef = useInfiniteScroll(onLoadMore, hasMore, loading)

  return <div ref={triggerRef}>{children}</div>
}
