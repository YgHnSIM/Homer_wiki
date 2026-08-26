import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  inventoryFromDocuments,
  loadDocuments,
} from "./greek-reading-inventory.mjs"
import {
  TRANSLITERATION_SYSTEM,
  classifyContentPath,
  containsGreek,
  issue,
  toPosix,
} from "./greek-reading-shared.mjs"
import { validateExceptionLedger, validateLegacyLedger } from "./greek-reading-ledgers.mjs"

const HEADWORD = /^(?:wiki\/(?:concepts\/concept-|entities\/entity-)|words\/word-)[a-z0-9-]+\.md$/
const READING_LINK = "**[[greek-reading-guide|읽는 법]]**"

function validateHeadword(document, errors) {
  const data = document.parsed.frontmatter
  if (data === null) {
    errors.push(issue("HEADWORD_FRONTMATTER", document.relativePath))
    return
  }
  const isWord = document.relativePath.startsWith("words/")
  const strings = ["title", "korean_name", "conventional_latin", "greek", "transliteration", "transliteration_system", ...(isWord ? ["word"] : [])]
  if (strings.some((field) => typeof data[field] !== "string" || data[field].length === 0 || data[field].trim() !== data[field])) {
    errors.push(issue("HEADWORD_FIELD", document.relativePath))
    return
  }
  if (data.transliteration_system !== TRANSLITERATION_SYSTEM) errors.push(issue("TRANSLITERATION_SYSTEM", document.relativePath))
  if (data.greek !== data.greek.normalize("NFC") || !containsGreek(data.greek)) errors.push(issue("GREEK_NFC", document.relativePath))
  if (containsGreek(data.transliteration) || containsGreek(data.conventional_latin)) errors.push(issue("TRANSLITERATION_SCRIPT", document.relativePath))
  if (!Array.isArray(data.cssclasses) || !data.cssclasses.includes("greek-reading-page")) errors.push(issue("CSSCLASS", document.relativePath))
  if (data.greek_variants !== undefined && (!Array.isArray(data.greek_variants) || data.greek_variants.some((value) => typeof value !== "string" || value !== value.normalize("NFC") || value.trim() !== value || !containsGreek(value)))) {
    errors.push(issue("GREEK_NFC", document.relativePath))
  }
  const aliases = data.aliases
  const searchForms = [data.conventional_latin, data.greek, data.transliteration]
  if (!Array.isArray(aliases) || aliases.some((value) => typeof value !== "string" || value.length === 0) || new Set(aliases).size !== aliases.length || searchForms.some((value) => !aliases.includes(value))) {
    errors.push(issue("ALIASES_SEARCH_FORMS", document.relativePath))
  }
  const expectedTitle = isWord
    ? `${data.word} (${data.korean_name})`
    : `${data.korean_name} (${data.conventional_latin})`
  if (data.title !== expectedTitle) {
    errors.push(issue("HEADWORD_TITLE", document.relativePath))
  }
  const h1Index = document.parsed.lines.findIndex(({ area, text }) => area === "heading" && /^# /.test(text))
  if (h1Index < 0 || document.parsed.lines[h1Index].text !== `# ${data.title}`) errors.push(issue("HEADWORD_H1", document.relativePath))
  const firstBodyLine = document.parsed.lines.slice(h1Index + 1).find(({ text }) => text.trim().length > 0)
  const expectedRow = `${READING_LINK}: ${data.korean_name} · **원어**: ${data.greek} · **학술 전사**: *${data.transliteration}*`
  if (firstBodyLine?.text !== expectedRow) errors.push(issue("READING_ROW", document.relativePath, firstBodyLine?.lineNumber ?? null))
}

function splitCells(line) {
  return line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((cell) => cell.trim())
}

function validateTables(document, errors) {
  const lines = document.parsed.lines
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].area !== "table" || (index > 0 && lines[index - 1].area === "table")) continue
    const table = []
    while (index < lines.length && lines[index].area === "table") {
      table.push(lines[index])
      index += 1
    }
    index -= 1
    const rows = table.map(({ text }) => splitCells(text))
    if (!rows.some((row) => row.some(containsGreek))) continue
    const isGreekStructureTable = rows[0].some((cell) => /(?:그리스어|희랍어|원어|Greek|형태론|정형구|morpholog|formula)/i.test(cell))
    if (!isGreekStructureTable) continue
    const greekColumn = rows[0].findIndex((cell) => /(?:그리스어|희랍어|원어|Greek)/i.test(cell))
    const transliterationColumn = rows[0].findIndex((cell) => /학술\s*전사/.test(cell))
    if (greekColumn < 0) errors.push(issue("TABLE_GREEK_COLUMN", document.relativePath, table[0].lineNumber))
    if (transliterationColumn < 0) errors.push(issue("TABLE_TRANSLITERATION_COLUMN", document.relativePath, table[0].lineNumber))
    for (const [rowIndex, row] of rows.slice(2).entries()) {
      if (row.some((cell) => containsGreek(cell) && /\(\s*\*?\p{Script=Latin}/u.test(cell))) {
        errors.push(issue("TABLE_MIXED_REPRESENTATION", document.relativePath, table[rowIndex + 2].lineNumber))
      }
      if (greekColumn >= 0 && transliterationColumn >= 0 && containsGreek(row[greekColumn] ?? "")) {
        const transliteration = row[transliterationColumn] ?? ""
        if (transliteration.length === 0 || containsGreek(transliteration)) errors.push(issue("TABLE_ROW_PAIR", document.relativePath, table[rowIndex + 2].lineNumber))
      }
    }
  }
}

function quotationLabel(text) {
  return text.match(/^\s*-\s+\*\*(번역|원문|학술 전사)\*\*:\s*(.*)$/)?.slice(1) ?? null
}

function isCalloutLine(lines, index) {
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const text = lines[cursor].text
    if (!/^\s*>/.test(text)) return false
    if (/^\s*>\s*\[![^\]]+\]/.test(text)) return true
  }
  return false
}

function validateQuotations(document, errors) {
  const lines = document.parsed.lines.filter(({ area, text }) => !["codeFence", "frontmatter", "table"].includes(area) && text.trim().length > 0)
  for (const [index, line] of lines.entries()) {
    if (/^\s*>/.test(line.text) && containsGreek(line.text) && !isCalloutLine(lines, index)) {
      errors.push(issue("BLOCK_QUOTATION", document.relativePath, line.lineNumber))
    }
    const label = quotationLabel(line.text)
    if (label === null) continue
    const previous = index > 0 ? quotationLabel(lines[index - 1].text) : null
    const next = index + 1 < lines.length ? quotationLabel(lines[index + 1].text) : null
    const isGreekSequence = label[0] === "원문" || (label[0] === "번역" && next?.[0] === "원문" && containsGreek(next[1])) || (label[0] === "학술 전사" && previous?.[0] === "원문" && containsGreek(previous[1]))
    if (!isGreekSequence) continue
    const sequenceIsValid = label[0] === "번역" ? next?.[0] === "원문" : label[0] === "원문" ? previous?.[0] === "번역" && next?.[0] === "학술 전사" : previous?.[0] === "원문"
    if (!sequenceIsValid) errors.push(issue("LONG_QUOTATION", document.relativePath, line.lineNumber))
    if (label[0] === "원문" && (!containsGreek(label[1]) || next === null || containsGreek(next[1]))) errors.push(issue("QUOTATION_SCRIPT_PAIR", document.relativePath, line.lineNumber))
    if (label[0] === "원문" && next !== null && (label[1].match(/<br\s*\/?\s*>/gi)?.length ?? 0) !== (next[1].match(/<br\s*\/?\s*>/gi)?.length ?? 0)) errors.push(issue("QUOTATION_LINE_COUNT", document.relativePath, line.lineNumber))
  }
}

export function validateRepository({ root, baselineLegacyPages = null }) {
  const resolvedRoot = path.resolve(root)
  const documents = loadDocuments(resolvedRoot)
  const errors = []
  const warnings = []
  const legacyPages = validateLegacyLedger({ root: resolvedRoot, documents, baselineLegacyPages, errors })
  validateExceptionLedger({ root: resolvedRoot, documents, errors })
  for (const document of documents) {
    if (document.scope !== "public" || legacyPages.has(document.relativePath)) continue
    if (HEADWORD.test(document.relativePath)) validateHeadword(document, errors)
    validateTables(document, errors)
    validateQuotations(document, errors)
  }
  return { errors, warnings, inventory: inventoryFromDocuments(documents), legacyPages: [...legacyPages].sort() }
}

function baselineFromGit(root) {
  const result = spawnSync("git", ["show", "HEAD:scripts/legacy-greek-reading-pages.json"], { cwd: root, encoding: "utf8" })
  if (result.status === 0) {
    try {
      const ledger = JSON.parse(result.stdout)
      if (Array.isArray(ledger.pages)) return ledger.pages
    } catch {
      return null
    }
  }
  const tracked = spawnSync("git", ["ls-files", "-z", "--", "index.md", "wiki", "words"], { cwd: root, encoding: "utf8" })
  if (tracked.status !== 0) return null
  return tracked.stdout
    .split("\0")
    .filter(Boolean)
    .map(toPosix)
    .filter((relativePath) => /\.md$/.test(relativePath) && classifyContentPath(relativePath) === "public")
    .filter((relativePath) => {
      const document = spawnSync("git", ["show", `HEAD:${relativePath}`], { cwd: root, encoding: "utf8" })
      return document.status === 0 && containsGreek(document.stdout)
    })
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    if (!process.argv.includes("--strict")) throw new TypeError("expected --strict")
    const result = validateRepository({ root: process.cwd(), baselineLegacyPages: baselineFromGit(process.cwd()) })
    if (result.errors.length > 0) {
      for (const error of result.errors) console.error(`${error.code}\t${error.file}${error.line === undefined ? "" : `:${error.line}`}`)
      process.exitCode = 1
    } else {
      console.log(JSON.stringify({ status: "passed", documents: result.inventory.summary.documents, legacyPages: result.legacyPages.length }))
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
