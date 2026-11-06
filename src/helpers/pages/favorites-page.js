import { mountLogoMenu } from "@components/logo-menu"
import { renderFavoritesGrid } from "@components/favorites-grid"
import {
  getFavorites,
  writeFavorites,
  parseVideoId,
  fetchVideoMetadata,
  exportFavoritesFile,
  parseFavoritesJson
} from "@helpers/favorites"

export const initFavoritesPage = () => {
  const body = document.querySelector("body")
  const anchor = document.createElement("div")
  anchor.id = "mega-app"

  body.innerHTML = ""
  document.body.appendChild(anchor)

  anchor.innerHTML = `
    <div class="fy-favorites-page">
      <div class="fy-home-page__logo-container">
        <div class="fy-home-page__bar-icon">
        </div>

        <div id="logo" class="fy-home-page__logo">
        </div>
      </div>

      <div class="fy-favorites-page__body">
        <a class="fy-favorites-page__back" href="/">Back to search</a>

        <h1 class="fy-favorites-page__title">My favourites</h1>

        <form class="fy-favorites-page__form" action="#">
          <input
            class="fy-favorites-page__input"
            type="text"
            placeholder="Paste a YouTube video link"
            autofocus />
          <button class="fy-favorites-page__add" type="submit">Add</button>
        </form>

        <div class="fy-favorites-page__actions">
          <button class="fy-favorites-page__import" type="button">Import JSON</button>
          <button class="fy-favorites-page__export" type="button">Export JSON</button>
          <input class="fy-favorites-page__file" type="file" accept="application/json,.json" hidden />
        </div>

        <p class="fy-favorites-page__status"></p>

        <p class="fy-favorites-page__empty">No videos yet. Paste a link above to add one.</p>

        <div class="fy-favorites-page__grid"></div>
      </div>
    </div>
  `

  const form = anchor.querySelector(".fy-favorites-page__form")
  const input = anchor.querySelector(".fy-favorites-page__input")
  const addButton = anchor.querySelector(".fy-favorites-page__add")
  const statusMessage = anchor.querySelector(".fy-favorites-page__status")
  const importButton = anchor.querySelector(".fy-favorites-page__import")
  const exportButton = anchor.querySelector(".fy-favorites-page__export")
  const fileInput = anchor.querySelector(".fy-favorites-page__file")
  const emptyMessage = anchor.querySelector(".fy-favorites-page__empty")
  const grid = anchor.querySelector(".fy-favorites-page__grid")
  const backLink = anchor.querySelector(".fy-favorites-page__back")

  backLink.onclick = (event) => {
    event.preventDefault()
    document.dispatchEvent(new CustomEvent("fy:show-home"))
  }

  const renderFavorites = (favorites) => {
    emptyMessage.style.display = favorites.length === 0 ? "block" : "none"

    renderFavoritesGrid(grid, favorites, {
      onRemove: (videoId) => {
        const remaining = favorites.filter((favorite) => favorite.id !== videoId)

        writeFavorites(remaining, renderFavorites)
      }
    })
  }

  getFavorites(renderFavorites)

  const showStatus = (text, isError = false) => {
    statusMessage.textContent = text
    statusMessage.classList.toggle("fy-favorites-page__status--error", isError)
  }

  exportButton.onclick = () => {
    getFavorites((favorites) => {
      if (favorites.length === 0) {
        showStatus("There are no favourites to export yet.", true)
        return
      }

      exportFavoritesFile(favorites)
      showStatus(`Exported ${favorites.length} video(s).`)
    })
  }

  importButton.onclick = () => {
    fileInput.click()
  }

  fileInput.onchange = () => {
    const file = fileInput.files[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      let imported

      try {
        imported = parseFavoritesJson(reader.result)
      } catch {
        showStatus("Could not read that file. Make sure it is a favourites JSON export.", true)
        fileInput.value = ""
        return
      }

      getFavorites((favorites) => {
        const knownIds = new Set(favorites.map((favorite) => favorite.id))
        const newFavorites = []
        let skipped = 0

        imported.forEach((favorite) => {
          if (knownIds.has(favorite.id)) {
            skipped += 1
            return
          }

          knownIds.add(favorite.id)
          newFavorites.push(favorite)
        })

        writeFavorites([...favorites, ...newFavorites], (updated) => {
          renderFavorites(updated)

          const skippedNote = skipped > 0 ? ` ${skipped} already added.` : ""
          showStatus(`Imported ${newFavorites.length} video(s).${skippedNote}`)
        })
      })

      fileInput.value = ""
    }

    reader.readAsText(file)
  }

  form.onsubmit = (event) => {
    event.preventDefault()
    showStatus("")

    const videoId = parseVideoId(input.value)

    if (!videoId) {
      showStatus("That doesn't look like a YouTube video link.", true)
      return
    }

    getFavorites(async (favorites) => {
      if (favorites.some((favorite) => favorite.id === videoId)) {
        showStatus("That video is already in your favourites.", true)
        return
      }

      addButton.disabled = true
      addButton.textContent = "Adding..."

      const metadata = await fetchVideoMetadata(videoId)

      writeFavorites([...favorites, metadata], (updated) => {
        input.value = ""
        addButton.disabled = false
        addButton.textContent = "Add"
        renderFavorites(updated)
      })
    })
  }

  mountLogoMenu()
}
