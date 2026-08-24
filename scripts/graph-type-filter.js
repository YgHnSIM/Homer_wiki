;(function () {
  var KEY = "homer-wiki-graph-types"
  var DEFAULTS = ["concept", "entity"]
  var CATS = [
    { id: "concept", label: "개념" },
    { id: "entity", label: "인물" },
    { id: "source", label: "문헌" },
    { id: "analysis", label: "분석" },
    { id: "word", label: "어원" },
    { id: "other", label: "기타" },
  ]

  function selected() {
    try {
      var raw = localStorage.getItem(KEY)
      if (!raw) return DEFAULTS.slice()
      var parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return DEFAULTS.slice()
      var known = {}
      for (var i = 0; i < CATS.length; i++) known[CATS[i].id] = true
      var next = parsed.filter(function (id) {
        return known[id]
      })
      if (next.length === 0) return DEFAULTS.slice()
      return next
    } catch (err) {
      return DEFAULTS.slice()
    }
  }

  function folderRest(slug, folder) {
    var marker = "/" + folder + "/"
    var idx = slug.indexOf(marker)
    if (idx !== -1) return slug.slice(idx + marker.length)
    if (slug.indexOf(folder + "/") === 0) return slug.slice(folder.length + 1)
    return ""
  }

  function isLeaf(rest) {
    return rest && rest !== "index"
  }

  function graphType(id, tags) {
    tags = tags || []
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i]
      if (tag === "type/concept") return "concept"
      if (tag === "type/entity") return "entity"
      if (tag === "type/source") return "source"
      if (tag === "type/analysis") return "analysis"
      if (tag === "type/word") return "word"
    }
    var slug = String(id || "")
    if (isLeaf(folderRest(slug, "concepts"))) return "concept"
    if (isLeaf(folderRest(slug, "entities"))) return "entity"
    if (isLeaf(folderRest(slug, "sources"))) return "source"
    if (isLeaf(folderRest(slug, "analyses"))) return "analysis"
    if (slug.indexOf("words/word-") !== -1) return "word"
    return "other"
  }

  window.__homerGraphSelected = selected
  window.__homerGraphType = graphType
  window.__homerGraphAllows = function (id, tags) {
    return selected().indexOf(graphType(id, tags)) !== -1
  }

  function save(next) {
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  function fillBar(el, variant) {
    var current = selected()
    el.className =
      "graph-type-filter" + (variant ? " graph-type-filter--" + variant : "")
    el.setAttribute("role", "group")
    el.setAttribute("aria-label", "그래프에 표시할 문서")
    el.replaceChildren()
    for (var i = 0; i < CATS.length; i++) {
      var cat = CATS[i]
      var btn = document.createElement("button")
      btn.type = "button"
      btn.dataset.type = cat.id
      btn.textContent = cat.label
      btn.setAttribute(
        "aria-pressed",
        current.indexOf(cat.id) !== -1 ? "true" : "false",
      )
      btn.addEventListener("click", onToggle)
      el.appendChild(btn)
    }
  }

  function syncPressed() {
    var current = selected()
    var buttons = document.querySelectorAll(".graph-type-filter button[data-type]")
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i]
      btn.setAttribute(
        "aria-pressed",
        current.indexOf(btn.dataset.type) !== -1 ? "true" : "false",
      )
    }
  }

  var renderTimer = 0
  function requestRender() {
    if (renderTimer) window.clearTimeout(renderTimer)
    renderTimer = window.setTimeout(function () {
      renderTimer = 0
      document.dispatchEvent(new CustomEvent("render"))
    }, 160)
  }

  function onToggle(event) {
    var type = event.currentTarget.dataset.type
    var next = selected()
    var idx = next.indexOf(type)
    if (idx === -1) next.push(type)
    else if (next.length === 1) return
    else next.splice(idx, 1)
    save(next)
    syncPressed()
    requestRender()
  }

  function mount() {
    var graphs = document.querySelectorAll(".graph")
    for (var i = 0; i < graphs.length; i++) {
      var graph = graphs[i]
      var local = graph.querySelector(
        ":scope > .graph-type-filter:not(.graph-type-filter--global)",
      )
      if (!local) {
        local = document.createElement("div")
        var outer = graph.querySelector(":scope > .graph-outer")
        if (outer) graph.insertBefore(local, outer)
        else graph.appendChild(local)
      }
      fillBar(local, "")

      var globalOuter = graph.querySelector(":scope > .global-graph-outer")
      if (!globalOuter) continue
      var globalBar = globalOuter.querySelector(":scope > .graph-type-filter")
      if (!globalBar) {
        globalBar = document.createElement("div")
        globalOuter.insertBefore(globalBar, globalOuter.firstChild)
      }
      fillBar(globalBar, "global")
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount)
  } else {
    mount()
  }
  document.addEventListener("nav", mount)
})()
