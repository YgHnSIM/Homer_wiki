;(function () {
  var GROUPS = [
    { id: "concept", label: "개념" },
    { id: "entity", label: "인물" },
    { id: "source", label: "문헌" },
    { id: "analysis", label: "분석" },
    { id: "word", label: "어원" },
  ]

  function currentSlug() {
    var slug = (document.body && document.body.dataset.slug) || ""
    if (slug === "index") return "index"
    return slug.replace(/^\/+/, "").replace(/\/+$/, "")
  }

  function hrefFor(slug) {
    var base = (document.body && document.body.dataset.basepath) || ""
    if (!slug || slug === "index") return (base || "") + "/"
    return base + "/" + slug
  }

  function shortTitle(title, slug) {
    var t = String(title || slug || "")
    var cut = t.search(/ — | - | \(/)
    if (cut > 0) t = t.slice(0, cut)
    return t
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;")
  }

  function resolveKey(link, data) {
    if (!link) return null
    if (data[link]) return link
    var stem = String(link).split("/").pop()
    var keys = Object.keys(data)
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]
      if (k === link || k.endsWith("/" + link) || k.split("/").pop() === stem) {
        return k
      }
    }
    return null
  }

  function typeOf(id, tags) {
    if (typeof window.__homerGraphType === "function") {
      return window.__homerGraphType(id, tags)
    }
    tags = tags || []
    for (var i = 0; i < tags.length; i++) {
      if (String(tags[i]).indexOf("type/") === 0) {
        return String(tags[i]).slice(5)
      }
    }
    return "other"
  }

  function collect(current, data) {
    var seen = {}
    var page = data[current]
    var links = (page && page.links) || []
    for (var i = 0; i < links.length; i++) {
      var k = resolveKey(links[i], data)
      if (k && k !== current) seen[k] = true
    }
    var keys = Object.keys(data)
    for (var j = 0; j < keys.length; j++) {
      var other = keys[j]
      if (other === current) continue
      var ol = (data[other] && data[other].links) || []
      for (var t = 0; t < ol.length; t++) {
        if (resolveKey(ol[t], data) === current) seen[other] = true
      }
    }
    return Object.keys(seen)
  }

  function render(el, data) {
    var current = currentSlug()
    if (!current || !data[current]) {
      el.hidden = true
      return
    }
    var buckets = {}
    for (var g = 0; g < GROUPS.length; g++) buckets[GROUPS[g].id] = []
    var ids = collect(current, data)
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i]
      var rec = data[id]
      var kind = typeOf(id, (rec && rec.tags) || [])
      if (!buckets[kind]) continue
      buckets[kind].push({
        id: id,
        title: shortTitle(rec && rec.title, id),
      })
    }
    var html = "<h3>맞물리는 문서</h3>"
    var shown = 0
    for (var n = 0; n < GROUPS.length; n++) {
      var group = GROUPS[n]
      var items = buckets[group.id]
      if (!items.length) continue
      items.sort(function (a, b) {
        return a.title.localeCompare(b.title, "ko")
      })
      shown += items.length
      html += '<section class="knowledge-neighbors__group">'
      html +=
        '<h4 class="knowledge-neighbors__label">' + group.label + "</h4><ul>"
      for (var p = 0; p < items.length; p++) {
        var item = items[p]
        html +=
          '<li><a class="internal" href="' +
          esc(hrefFor(item.id)) +
          '" data-slug="' +
          esc(item.id) +
          '">' +
          esc(item.title) +
          "</a></li>"
      }
      html += "</ul></section>"
    }
    if (!shown) {
      el.hidden = true
      el.replaceChildren()
      return
    }
    el.hidden = false
    el.innerHTML = html
  }

  function ensureEl() {
    var right = document.querySelector(".right.sidebar")
    if (!right) return null
    var el = document.getElementById("knowledge-neighbors")
    if (!el) {
      el = document.createElement("section")
      el.id = "knowledge-neighbors"
      el.className = "knowledge-neighbors"
      var graph = right.querySelector(":scope > .graph")
      var toc = right.querySelector(":scope > .toc")
      var back = right.querySelector(":scope > .backlinks")
      if (graph && graph.nextSibling) right.insertBefore(el, graph.nextSibling)
      else if (toc) right.insertBefore(el, toc)
      else if (back) right.insertBefore(el, back)
      else right.appendChild(el)
    }
    return el
  }

  function mount(data) {
    var el = ensureEl()
    if (!el) return
    render(el, data)
  }

  function indexPromise() {
    if (typeof fetchData !== "undefined" && fetchData && typeof fetchData.then === "function") {
      return fetchData
    }
    var base = (document.body && document.body.dataset.basepath) || ""
    return fetch(base + "/static/contentIndex.json").then(function (res) {
      return res.json()
    })
  }

  function start() {
    indexPromise().then(function (data) {
      mount(data)
      document.addEventListener("nav", function () {
        mount(data)
      })
    })
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start)
  } else {
    start()
  }
})()
