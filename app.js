// Canvas setup
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

// State
let isDrawing = false
let tool = "brush"
let color = "#000000"
let size = 5
let history = []
let historyStep = -1
let startX = 0
let startY = 0

// Helper: Check if mobile
const isMobile = () => window.innerWidth <= 768

// Initialize canvas
function initCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  saveHistory()
}

// History management
function saveHistory() {
  const newHistory = history.slice(0, historyStep + 1)
  newHistory.push(canvas.toDataURL())
  history = newHistory
  historyStep = newHistory.length - 1
  updateUndoRedoButtons()
}

function loadFromHistory(step) {
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
  }
  img.src = history[step]
}

function undo() {
  if (historyStep > 0) {
    historyStep--
    loadFromHistory(historyStep)
    updateUndoRedoButtons()
  }
}

function redo() {
  if (historyStep < history.length - 1) {
    historyStep++
    loadFromHistory(historyStep)
    updateUndoRedoButtons()
  }
}

function updateUndoRedoButtons() {
  document.getElementById("undoBtn").disabled = historyStep <= 0
  document.getElementById("redoBtn").disabled = historyStep >= history.length - 1
  document.getElementById("undoBtnMobile").disabled = historyStep <= 0
  document.getElementById("redoBtnMobile").disabled = historyStep >= history.length - 1
}

// Drawing functions
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  return { x, y }
}

function getTouchPos(e) {
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  return { x, y }
}

function startDrawing(e) {
  isDrawing = true
  const pos = e.touches ? getTouchPos(e) : getMousePos(e)
  startX = pos.x
  startY = pos.y
  e.preventDefault()
}

function draw(e) {
  if (!isDrawing) return

  const pos = e.touches ? getTouchPos(e) : getMousePos(e)
  const { x, y } = pos

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = size
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  if (tool === "brush") {
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(x, y)
    ctx.stroke()
    startX = x
    startY = y
  } else if (tool === "eraser") {
    ctx.clearRect(x - size / 2, y - size / 2, size, size)
    startX = x
    startY = y
  } else if (tool === "line" || tool === "rectangle" || tool === "circle") {
    // Reload from last history state to show preview
    if (history[historyStep]) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        if (tool === "line") {
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(x, y)
          ctx.stroke()
        } else if (tool === "rectangle") {
          const width = x - startX
          const height = y - startY
          ctx.strokeRect(startX, startY, width, height)
        } else if (tool === "circle") {
          const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2))
          ctx.beginPath()
          ctx.arc(startX, startY, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
      img.src = history[historyStep]
    }
  }

  e.preventDefault()
}

function stopDrawing(e) {
  if (!isDrawing) return
  isDrawing = false
  saveHistory()
  e.preventDefault()
}

// Clear canvas
function clearCanvas() {
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  saveHistory()
}

// Download image
function downloadImage() {
  const link = document.createElement("a")
  link.href = canvas.toDataURL("image/png")
  link.download = `paint-${Date.now()}.png`
  link.click()
}

// Upload image
function handleImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
      const x = (canvas.width - img.width * scale) / 2
      const y = (canvas.height - img.height * scale) / 2

      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      saveHistory()
    }
    img.src = event.target.result
  }
  reader.readAsDataURL(file)
}

// Canvas events
canvas.addEventListener("mousedown", startDrawing)
canvas.addEventListener("mousemove", draw)
canvas.addEventListener("mouseup", stopDrawing)
canvas.addEventListener("mouseout", stopDrawing)
canvas.addEventListener("touchstart", startDrawing)
canvas.addEventListener("touchmove", draw)
canvas.addEventListener("touchend", stopDrawing)

// Tool selection
document.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")
    tool = btn.dataset.tool
  })
})

// Color picker
document.getElementById("colorPicker").addEventListener("change", (e) => {
  color = e.target.value
  document.getElementById("colorPickerMobile").value = color
})

document.getElementById("colorPickerMobile").addEventListener("change", (e) => {
  color = e.target.value
  document.getElementById("colorPicker").value = color
})

// Size slider
document.getElementById("sizeSlider").addEventListener("input", (e) => {
  size = Number.parseInt(e.target.value)
  document.getElementById("sizeDisplay").textContent = `${size}px`
  document.getElementById("sizeSliderMobile").value = size
  document.getElementById("sizeDisplayMobile").textContent = `${size}px`
})

document.getElementById("sizeSliderMobile").addEventListener("input", (e) => {
  size = Number.parseInt(e.target.value)
  document.getElementById("sizeDisplay").textContent = `${size}px`
  document.getElementById("sizeSlider").value = size
  document.getElementById("sizeDisplayMobile").textContent = `${size}px`
})

// Action buttons
document.getElementById("undoBtn").addEventListener("click", undo)
document.getElementById("redoBtn").addEventListener("click", redo)
document.getElementById("undoBtnMobile").addEventListener("click", undo)
document.getElementById("redoBtnMobile").addEventListener("click", redo)

document.getElementById("clearBtn").addEventListener("click", clearCanvas)
document.getElementById("clearBtnMobile").addEventListener("click", clearCanvas)

document.getElementById("downloadBtn").addEventListener("click", downloadImage)
document.getElementById("downloadBtnMobile").addEventListener("click", downloadImage)

document.getElementById("imageUpload").addEventListener("change", handleImageUpload)
document.getElementById("imageUploadMobile").addEventListener("change", handleImageUpload)

// Window resize
window.addEventListener("resize", initCanvas)

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault()
    undo()
  } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
    e.preventDefault()
    redo()
  }
})

// Initialize
initCanvas()
