import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "../api/client"

export default function useFeed({
  user,
  feedMode,
  feedScope,
  activeLabel,
  activeFeedProfileId,
  setFeedCache,
}) {
  const [posts, setPosts] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [isSwitchingFeed, setIsSwitchingFeed] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const loadMoreRef = useRef(null)

  const resolveEndpoint = () => {
    if (feedMode === "LABEL" && activeLabel) {
      return `/posts/label/${activeLabel}`
    }
    return `/posts/feed/${feedScope}`
  }

  const fetchFeed = useCallback(
    async (cursor = null, append = false) => {
      if (!user) return

      const endpoint = resolveEndpoint()
      if (!endpoint) return

      const query = cursor ? `?cursor=${cursor}` : ""

      const data = await api(`${endpoint}${query}`, {
        headers: activeFeedProfileId
          ? { "X-Feed-Profile": activeFeedProfileId }
          : {},
      })

      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : []

      const formatted = items.map((p) => ({
        ...p,
        likedByMe: !!p.likedByMe,
      }))

      setPosts((prev) => {
  const updated = append
  ? [
      ...prev,
      ...formatted.filter(
        (newPost) => !prev.some((p) => p.id === newPost.id)
      ),
    ]
  : formatted

  // ✅ Cache only first-page loads (not append)
  if (!append && activeFeedProfileId && setFeedCache) {
    setFeedCache((prevCache) => ({
      ...prevCache,
      [activeFeedProfileId]: updated,
    }))
  }

  return updated
})

setNextCursor(data?.nextCursor || null)
if (typeof data?.totalCount === "number") {
  setTotalCount(data.totalCount)
}
    },
    [user, feedMode, feedScope, activeLabel, activeFeedProfileId, setFeedCache]
  )

  const refreshFeed = useCallback(async () => {
    setIsSwitchingFeed(true)
    setNextCursor(null)
    await fetchFeed(null, false)
    setIsSwitchingFeed(false)
  }, [fetchFeed])

  const loadMore = useCallback(async () => {
  if (loadingMore) return
  if (!nextCursor) return

  setLoadingMore(true)

  try {
    await fetchFeed(nextCursor, true)
  } finally {
    setLoadingMore(false)
  }
}, [nextCursor, fetchFeed, loadingMore])

  // reload when inputs change
  useEffect(() => {
    if (!user) return
    refreshFeed()
  }, [user, feedMode, feedScope, activeLabel, activeFeedProfileId])

  useEffect(() => {
  const el = loadMoreRef.current
  if (!el) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMore()
      }
    },
    { rootMargin: "300px" }
  )

  observer.observe(el)

  return () => observer.disconnect()
}, [loadMore])

  return {
    posts,
    setPosts,
    nextCursor,
    totalCount,
    isSwitchingFeed,
    loadMoreRef,
    refreshFeed,
    loadingMore,
  }
}
