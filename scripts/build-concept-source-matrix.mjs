// Emit the concept × source markdown table from vault frontmatter.
import fs from "node:fs"
import path from "node:path"

const written = fs
  .readdirSync("wiki/concepts")
  .filter((f) => f.startsWith("concept-") && f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""))

const CONCEPTS = [
  ["concept-menis", "메니스"],
  ["concept-hikesia", "히케시아"],
  ["concept-aidos", "아이도스"],
  ["concept-nemesis", "네메시스"],
  ["concept-xenia", "크세니아"],
  ["concept-eleos", "엘레오스"],
  ["concept-agathos", "아가토스"],
  ["concept-epic-cycle", "서사시환"],
].filter(([id]) => written.includes(id))

const SOURCES = [
  ["williams-1993-shame-and-necessity", "윌리엄스 1993"],
  ["adkins-1960-merit-and-responsibility", "애드킨스 1960"],
  ["long-1970-morals-and-values", "롱 1970"],
  ["cairns-1993-aidos", "케언스 1993"],
  ["dodds-1951-greeks-and-irrational", "도즈 1951"],
  ["snell-1946-discovery-of-mind", "스넬 1946"],
  ["lloyd-jones-1971-justice-of-zeus", "로이드-존스 1971"],
  ["macintyre-1981-after-virtue-ch10", "매킨타이어 1981"],
  ["vernant-1989-belle-mort", "베르낭 1989"],
  ["redfield-1975-nature-and-culture", "레드필드 1975"],
  ["shay-1994-achilles-in-vietnam", "셰이 1994"],
  ["zanker-1994-heart-of-achilles", "잰커 1994"],
  ["lee-junseok-2024-iliad-jeongam", "이준석 2024"],
  ["scott-1979-pity-and-pathos", "스콧 1979"],
  ["scott-1980-aidos-and-nemesis", "스콧 1980"],
  ["scott-1981-some-greek-terms", "스콧 1981"],
  ["scott-1982-philos-philotes-xenia", "스콧 1982"],
  ["lee-junseok-2018-wrath-and-pity", "이준석 2018"],
  ["lee-junseok-2016-odyssey-humanity", "이준석 2016"],
]

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

function sourcesField(md) {
  const m = md.match(/^sources:\s*\[([^\]]*)\]/m)
  if (!m) return []
  return m[1]
    .split(",")
    .map((s) => s.trim().replace(/\.md$/, "").replace(/["']/g, ""))
    .filter(Boolean)
}

const citedByConcept = {}
for (const id of written) {
  const md = fs.readFileSync(path.join("wiki/concepts", `${id}.md`), "utf8")
  citedByConcept[id] = new Set(sourcesField(md))
}

const mentionedInSource = {}
for (const [sid] of SOURCES) {
  const fp = path.join("wiki/sources", `${sid}.md`)
  if (!fs.existsSync(fp)) continue
  const md = fs.readFileSync(fp, "utf8")
  const ids = [...md.matchAll(/concept-[a-z0-9-]+/g)].map((m) => m[0])
  mentionedInSource[sid] = new Set(ids.filter((id) => written.includes(id)))
}

function cell(sid, cid) {
  if ((CENTRAL[sid] || []).includes(cid)) return "**중심**"
  if (citedByConcept[cid]?.has(sid) || mentionedInSource[sid]?.has(cid)) {
    return "언급"
  }
  return "—"
}

const header =
  "| 문헌 | " +
  CONCEPTS.map(([id, label]) => `[[${id}\\|${label}]]`).join(" | ") +
  " |"
const sep = "| --- | " + CONCEPTS.map(() => ":---:").join(" | ") + " |"
const rows = SOURCES.map(([sid, label]) => {
  const cells = CONCEPTS.map(([cid]) => cell(sid, cid)).join(" | ")
  return `| [[${sid}\\|${label}]] | ${cells} |`
})

console.log(header)
console.log(sep)
console.log(rows.join("\n"))
