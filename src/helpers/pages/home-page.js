import { mountLogoMenu } from "@components/logo-menu"
import { renderFavoritesGrid } from "@components/favorites-grid"
import { getFavorites, writeFavorites } from "@helpers/favorites"

export const initHomePage = () => {
  const search = (event) => {
    event.preventDefault()

    const query = anchor.querySelector(".fy-search-form__text-input").value
    window.location.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query)
  }

  const body = document.querySelector("body")
  const anchor = document.createElement("div")
  anchor.id = "mega-app"

  body.innerHTML = ""
  document.body.appendChild(anchor)

  anchor.innerHTML = `
    <div class="fy-home-page">
      <div class="fy-home-page__logo-container">
        <div class="fy-home-page__bar-icon">
        </div>

        <div id="logo" class="fy-home-page__logo">
        </div>
      </div>

      <div class="fy-home-page__body">
        <form class="fy-home-page__form fy-search-form" action="#">
          <input class="fy-search-form__text-input" type="text" placeholder="Search" autofocus />
          <button class="fy-search-form__submit"></button>
        </form>

        <section class="fy-home-page__favorites">
          <div class="fy-home-page__favorites-header">
            <span class="fy-home-page__favorites-title">My favourites</span>

            <a class="fy-home-page__favorites-link" href="/">Add videos</a>
          </div>

          <p class="fy-home-page__favorites-empty">No videos yet. Click "Add videos" to add some.</p>

          <div class="fy-home-page__favorites-grid"></div>
        </section>
      </div>
    </div>
  `

  anchor.querySelector(".fy-search-form").onsubmit = search

  anchor.querySelector(".fy-home-page__favorites-link").onclick = (event) => {
    event.preventDefault()
    document.dispatchEvent(new CustomEvent("fy:show-favorites"))
  }

  const grid = anchor.querySelector(".fy-home-page__favorites-grid")
  const emptyMessage = anchor.querySelector(".fy-home-page__favorites-empty")

  const render = (favorites) => {
    emptyMessage.style.display = favorites.length === 0 ? "block" : "none"

    renderFavoritesGrid(grid, favorites, {
      onRemove: (videoId) => {
        const remaining = favorites.filter((favorite) => favorite.id !== videoId)

        writeFavorites(remaining, render)
      }
    })
  }

  getFavorites(render)

  mountLogoMenu()
}
