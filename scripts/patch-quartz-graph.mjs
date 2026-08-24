// Quartz graph: larger nodes, skip tag pages, readable labels,
// and a category filter (default: concepts + entities).
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const quartzRoot = process.argv[2] ?? ".quartz"
const here = path.dirname(fileURLToPath(import.meta.url))
const helperSrc = [
  fs.readFileSync(path.join(here, "graph-type-filter.js"), "utf8"),
  fs.readFileSync(path.join(here, "typed-neighbors.js"), "utf8"),
].join("\n")
const files = [
  path.join(quartzRoot, "node_modules/@quartz-community/graph/dist/index.js"),
  path.join(
    quartzRoot,
    "node_modules/@quartz-community/graph/dist/components/index.js",
  ),
]

const FOREACH_FILTERED =
  'ru.forEach(function(i){if(i.startsWith("tags/"))return;var F=eu.get(i)?.title||i,A=eu.get(i)?.tags||[];if(i!==m&&window.__homerGraphAllows&&!window.__homerGraphAllows(i,A))return;var v={id:i,text:F,tags:A,x:Math.random()*R-R/2,y:Math.random()*O-O/2,vx:0,vy:0};nu.push(v),ju.set(i,v),window.__homerGraphLastCount=nu.length});'

const FOREACH_FROM = [
  FOREACH_FILTERED,
  'ru.forEach(function(i){if(i.startsWith("tags/"))return;var F=eu.get(i)?.title||i,A=eu.get(i)?.tags||[];if(i!==m&&window.__homerGraphAllows&&!window.__homerGraphAllows(i,A))return;var v={id:i,text:F,tags:A,x:Math.random()*R-R/2,y:Math.random()*O-O/2,vx:0,vy:0};nu.push(v),ju.set(i,v)});',
  'ru.forEach(function(i){if(i.startsWith("tags/"))return;var F=eu.get(i)?.title||i,A=eu.get(i)?.tags||[],v={id:i,text:F,tags:A,x:Math.random()*R-R/2,y:Math.random()*O-O/2,vx:0,vy:0};nu.push(v),ju.set(i,v)});',
  'ru.forEach(function(i){var l=i.startsWith("tags/"),F=l?"#"+i.substring(5):eu.get(i)?.title||i,A=l?[]:eu.get(i)?.tags||[],v={id:i,text:F,tags:A,x:Math.random()*R-R/2,y:Math.random()*O-O/2,vx:0,vy:0};nu.push(v),ju.set(i,v)});',
]

const CLICK_OUTSIDE_FROM =
  'var q=m.target.closest(".global-graph-container"),x=m.target.closest(".global-graph-icon");!q&&!x&&G()'
const CLICK_OUTSIDE_TO =
  'var q=m.target.closest(".global-graph-container"),x=m.target.closest(".global-graph-icon"),hf=m.target.closest(".graph-type-filter");!q&&!x&&!hf&&G()'

const required = [
  ["return 2+Math.sqrt(l)", "return 5+2*Math.sqrt(l)"],
  [CLICK_OUTSIDE_FROM, CLICK_OUTSIDE_TO],
]

const optional = [
  ["lu.alpha=0", 'lu.alpha=d.className.indexOf("global")>=0?1:0'],
  [
    "_u===A.simulationData.id?(A.label.alpha=1,A.label.scale.set(l)):A.label.scale.set(i)",
    'A.label.alpha=(d.className.indexOf("global")>=0||A.simulationData.id===m||_u===A.simulationData.id)?1:0,A.simulationData.id===m||_u===A.simulationData.id?A.label.scale.set(l):A.label.scale.set(i)',
  ],
  [
    "text:Du.text,",
    'text:Du.text.length>12?Du.text.slice(0,12)+"…":Du.text,',
  ],
  [
    "Du.text.length>16?Du.text.slice(0,16)",
    "Du.text.length>12?Du.text.slice(0,12)",
  ],
  ["lu.alpha=1", 'lu.alpha=d.className.indexOf("global")>=0?1:0'],
  [
    "A.label.alpha=1,_u===A.simulationData.id?A.label.scale.set(l):A.label.scale.set(i)",
    'A.label.alpha=(d.className.indexOf("global")>=0||A.simulationData.id===m||_u===A.simulationData.id)?1:0,A.simulationData.id===m||_u===A.simulationData.id?A.label.scale.set(l):A.label.scale.set(i)',
  ],
  [
    'A.label.alpha=(d.className.indexOf("global")>=0||_u===A.simulationData.id)?1:0,_u===A.simulationData.id?A.label.scale.set(l):A.label.scale.set(i)',
    'A.label.alpha=(d.className.indexOf("global")>=0||A.simulationData.id===m||_u===A.simulationData.id)?1:0,A.simulationData.id===m||_u===A.simulationData.id?A.label.scale.set(l):A.label.scale.set(i)',
  ],
]

function applyOne(src, from, to, requiredReplace) {
  if (src.includes(to) && !src.includes(from)) return src
  if (!src.includes(from)) {
    if (requiredReplace) throw new Error(`pattern not found: ${from}`)
    return src
  }
  return src.split(from).join(to)
}

function applyForeach(src) {
  if (src.includes(FOREACH_FILTERED)) return src
  for (const from of FOREACH_FROM) {
    if (from === FOREACH_FILTERED) continue
    if (src.includes(from)) return src.split(from).join(FOREACH_FILTERED)
  }
  throw new Error("graph node forEach pattern not found")
}

function injectFilter(src) {
  const payload = JSON.stringify("\n" + helperSrc)
  const next = `Graph.afterDOMLoaded = /*homer-graph-filter*/ ${payload} + graph_inline_default;`
  const injected =
    /Graph\.afterDOMLoaded = \/\*homer-graph-filter\*\/ "(?:\\.|[^"\\])*" \+ graph_inline_default;/
  if (injected.test(src)) return src.replace(injected, next)
  const appended =
    /Graph\.afterDOMLoaded = graph_inline_default \+ \/\*homer-graph-filter\*\/ "(?:\\.|[^"\\])*";/
  if (appended.test(src)) return src.replace(appended, next)
  const plain = "Graph.afterDOMLoaded = graph_inline_default;"
  if (!src.includes(plain)) {
    throw new Error("Graph.afterDOMLoaded assignment not found")
  }
  return src.split(plain).join(next)
}

let checked = 0
for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`graph bundle not found: ${file}`)
    process.exit(1)
  }
  let src = fs.readFileSync(file, "utf8")
  const before = src
  try {
    for (const [from, to] of required) src = applyOne(src, from, to, true)
    src = applyForeach(src)
    src = injectFilter(src)
    for (const [from, to] of optional) src = applyOne(src, from, to, false)
  } catch (err) {
    console.error(`${file}: ${err.message}`)
    process.exit(1)
  }
  if (!src.includes('className.indexOf("global")')) {
    console.error(`${file}: graph label visibility patch did not apply`)
    process.exit(1)
  }
  if (!src.includes("__homerGraphAllows")) {
    console.error(`${file}: graph type filter did not apply`)
    process.exit(1)
  }
  if (!src.includes("knowledge-neighbors")) {
    console.error(`${file}: typed neighbors widget did not apply`)
    process.exit(1)
  }
  if (src !== before) {
    fs.writeFileSync(file, src)
    console.log(`patched ${file}`)
  } else {
    console.log(`already patched ${file}`)
  }
  checked += 1
}
console.log(`checked ${checked} graph bundles`)
