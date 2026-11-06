import { readStorageKeys, writeStorageData } from "@helpers/chrome-storage"

export const FAVORITES_KEY = "settings:favorites"

export const getFavorites = (callback) => {
  readStorageKeys([FAVORITES_KEY], (config) => {
    callback(config[FAVORITES_KEY] || [])
  })
}

export const writeFavorites = (favorites, callback) => {
  writeStorageData(FAVORITES_KEY, favorites, callback)
}

export const parseVideoId = (input) => {
  const value = input.trim()

  if (/^[\w-]{11}$/.test(value)) {
    return value
  }

  try {
    const url = new URL(value)
    const watchId = url.searchParams.get("v")

    if (watchId && /^[\w-]{11}$/.test(watchId)) {
      return watchId
    }

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1, 12)
    }

    const shorts = url.pathname.match(/^\/shorts\/([\w-]{11})/)
    const embed = url.pathname.match(/^\/embed\/([\w-]{11})/)

    if (shorts) return shorts[1]
    if (embed) return embed[1]
  } catch {
    return null
  }

  return null
}

export const videoThumbnailUrl = (videoId) => {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
}

export const FAVORITES_EXPORT_FILENAME = "focused-youtube-favourites.json"

export const exportFavoritesFile = (favorites) => {
  const blob = new Blob([JSON.stringify(favorites, null, 2)], {
    type: "application/json"
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = FAVORITES_EXPORT_FILENAME
  link.style.display = "none"

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

export const parseFavoritesJson = (text) => {
  const data = JSON.parse(text)
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data.favorites) ? data.favorites : null

  if (!items) {
    throw new Error("Unexpected JSON format")
  }

  const favorites = items.reduce((result, item) => {
    if (typeof item === "string") {
      const id = parseVideoId(item)

      if (id) {
        result.push({ id, title: id, author: "" })
      }

      return result
    }

    if (!item || typeof item.id !== "string") {
      return result
    }

    const id = parseVideoId(item.id)

    if (!id) {
      return result
    }

    result.push({
      id,
      title: typeof item.title === "string" && item.title ? item.title : id,
      author: typeof item.author === "string" ? item.author : ""
    })

    return result
  }, [])

  if (favorites.length === 0) {
    throw new Error("No valid videos found")
  }

  return favorites
}

export const fetchVideoMetadata = async (videoId) => {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`

  try {
    const response = await fetch(
      `${window.location.origin}/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    )

    if (!response.ok) {
      throw new Error("Could not load video metadata")
    }

    const data = await response.json()

    return {
      id: videoId,
      title: data.title,
      author: data.author_name || ""
    }
  } catch {
    return {
      id: videoId,
      title: videoId,
      author: ""
    }
  }
}
