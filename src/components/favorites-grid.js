import { videoThumbnailUrl } from "@helpers/favorites"

const openVideo = (event) => {
  event.preventDefault()
  window.location.href = event.currentTarget.getAttribute("href")
}

export const renderFavoritesGrid = (container, favorites, { onRemove } = {}) => {
  container.classList.add("fy-favorites-grid")
  container.innerHTML = ""

  favorites.forEach((favorite) => {
    const card = document.createElement("div")
    card.className = "fy-favorite-card"

    const link = document.createElement("a")
    link.className = "fy-favorite-card__link"
    link.href = `/watch?v=${favorite.id}`
    link.onclick = openVideo

    const thumbnail = document.createElement("img")
    thumbnail.className = "fy-favorite-card__thumbnail"
    thumbnail.src = videoThumbnailUrl(favorite.id)
    thumbnail.alt = ""

    const title = document.createElement("div")
    title.className = "fy-favorite-card__title"
    title.textContent = favorite.title

    link.appendChild(thumbnail)
    link.appendChild(title)

    if (favorite.author) {
      const author = document.createElement("div")
      author.className = "fy-favorite-card__author"
      author.textContent = favorite.author
      link.appendChild(author)
    }

    card.appendChild(link)

    if (onRemove) {
      const remove = document.createElement("button")
      remove.className = "fy-favorite-card__remove"
      remove.type = "button"
      remove.title = "Remove from favourites"
      remove.textContent = "×"
      remove.onclick = () => onRemove(favorite.id)

      card.appendChild(remove)
    }

    container.appendChild(card)
  })
}
