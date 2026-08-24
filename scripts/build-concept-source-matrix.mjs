// Emit or verify the concept × source table from the canonical wiki index.
import fs from "node:fs"
import path from "node:path"

const INDEX_PATH = "wiki/index.md"
const MATRIX_PATH = "wiki/analyses/analysis-concept-source-matrix.md"

function sectionLinks(markdown, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const section = markdown.match(
    new RegExp(`^## ${escapedHeading}\\s*$([\\s\\S]*?)(?=^## |^---\\s*$)`, "m"),
  )?.[1]
  if (!section) throw new Error(`${INDEX_PATH}에서 '${heading}' 섹션을 찾을 수 없습니다.`)

  return [...section.matchAll(/^- \[\[([^|\]]+)\|([^\]]+)\]\]/gm)].map((match) => [
    match[1].trim(),
    match[2].trim(),
  ])
}

const wikiIndex = fs.readFileSync(INDEX_PATH, "utf8")
const preferredConceptOrder = [
  "concept-menis",
  "concept-hikesia",
  "concept-aidos",
  "concept-nemesis",
  "concept-xenia",
  "concept-eleos",
  "concept-agathos",
  "concept-epic-cycle",
]
const preferredConceptRank = new Map(preferredConceptOrder.map((id, index) => [id, index]))
const indexedConcepts = sectionLinks(wikiIndex, "개념")
const CONCEPTS = indexedConcepts
  .map(([id, label], index) => {
    const file = path.join("wiki/concepts", `${id}.md`)
    if (!fs.existsSync(file)) throw new Error(`${INDEX_PATH}의 개념 문서를 찾을 수 없습니다: ${file}`)
    return { id, label, index }
  })
  .sort(
    (left, right) =>
      (preferredConceptRank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (preferredConceptRank.get(right.id) ?? Number.MAX_SAFE_INTEGER) ||
      left.index - right.index,
  )
  .map(({ id, label }) => [id, label])
const SOURCES = sectionLinks(wikiIndex, "소스 문서").map(([id, label]) => {
  const file = path.join("wiki/sources", `${id}.md`)
  if (!fs.existsSync(file)) throw new Error(`${INDEX_PATH}의 소스 문서를 찾을 수 없습니다: ${file}`)
  return [id, label]
})

const CENTRAL = {
  "cairns-1993-aidos": ["concept-aidos"],
  "scott-1980-aidos-and-nemesis": ["concept-aidos", "concept-nemesis"],
  "scott-1979-pity-and-pathos": ["concept-eleos"],
  "scott-1982-philos-philotes-xenia": ["concept-xenia"],
  "scott-1981-some-greek-terms": ["concept-agathos"],
  "williams-1993-shame-and-necessity": ["concept-aidos"],
  "dodds-1951-greeks-and-irrational": ["concept-aidos"],
  "lee-junseok-2018-wrath-and-pity": ["concept-menis", "concept-eleos"],
  "lee-junseok-2016-odyssey-humanity": ["concept-xenia"],
  "lee-junseok-2024-iliad-jeongam": ["concept-menis"],
  "shay-1994-achilles-in-vietnam": ["concept-menis"],
  "adkins-1960-merit-and-responsibility": ["concept-agathos"],
}

function sourcesField(markdown) {
  const match = markdown.match(/^sources:\s*\[([^\]]*)\]/m)
  if (!match) return []
  return match[1]
    .split(",")
    .map((source) => source.trim().replace(/\.md$/, "").replace(/["']/g, ""))
    .filter(Boolean)
}

function sourceLabel(sourceId) {
  const markdown = fs.readFileSync(path.join("wiki/sources", `${sourceId}.md`), "utf8")
  const aliases = markdown.match(/^aliases:\s*\[([^\]]*)\]/m)?.[1] ?? ""
  const koreanWithYear = aliases
    .split(",")
    .map((alias) => alias.trim())
    .find((alias) => /[가-힣]/.test(alias) && /\b\d{4}\b/.test(alias))
  if (!koreanWithYear) return sourceId
  const match = koreanWithYear.match(/^([가-힣·-]+).*?\b(\d{4})\b/)
  return match ? `${match[1]} ${match[2]}` : koreanWithYear
}

const citedByConcept = {}
for (const [id] of CONCEPTS) {
  const markdown = fs.readFileSync(path.join("wiki/concepts", `${id}.md`), "utf8")
  citedByConcept[id] = new Set(sourcesField(markdown))
}

const mentionedInSource = {}
for (const [sourceId] of SOURCES) {
  const markdown = fs.readFileSync(path.join("wiki/sources", `${sourceId}.md`), "utf8")
  const ids = [...markdown.matchAll(/concept-[a-z0-9-]+/g)].map((match) => match[0])
  mentionedInSource[sourceId] = new Set(ids.filter((id) => citedByConcept[id]))
}

function cell(sourceId, conceptId) {
  if ((CENTRAL[sourceId] ?? []).includes(conceptId)) return "**중심**"
  if (citedByConcept[conceptId]?.has(sourceId) || mentionedInSource[sourceId]?.has(conceptId)) {
    return "언급"
  }
  return "—"
}

function renderTable() {
  const header =
    "| 문헌 | " +
    CONCEPTS.map(([id, label]) => `[[${id}\\|${label.replace(/\s*\([^)]*\)\s*$/, "")}]]`).join(
      " | ",
    ) +
    " |"
  const separator = `| --- | ${CONCEPTS.map(() => ":---:").join(" | ")} |`
  const rows = SOURCES.map(([sourceId]) => {
    const shortLabel = sourceLabel(sourceId)
    const cells = CONCEPTS.map(([conceptId]) => cell(sourceId, conceptId)).join(" | ")
    return `| [[${sourceId}\\|${shortLabel}]] | ${cells} |`
  })
  return [header, separator, ...rows].join("\n")
}

function existingTable(markdown) {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex((line) => line.startsWith("| 문헌 |"))
  if (start < 0) throw new Error(`${MATRIX_PATH}에서 표 머리글을 찾을 수 없습니다.`)
  const table = []
  for (let index = start; index < lines.length && lines[index].startsWith("|"); index += 1) {
    table.push(lines[index])
  }
  return table.join("\n")
}

const rendered = renderTable()
if (process.argv.includes("--check")) {
  const current = existingTable(fs.readFileSync(MATRIX_PATH, "utf8"))
  if (current !== rendered) {
    console.error(
      `Concept-source matrix is stale. Run 'node scripts/build-concept-source-matrix.mjs' and update ${MATRIX_PATH}.`,
    )
    process.exitCode = 1
  } else {
    console.log(`Concept-source matrix is synchronized: ${CONCEPTS.length} concepts × ${SOURCES.length} sources.`)
  }
} else {
  console.log(rendered)
}
