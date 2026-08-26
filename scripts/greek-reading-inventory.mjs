import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseDocument } from "yaml"

import {
  classifyContentPath,
  compareText,
  containsGreek,
  extractGreekMatches,
  extractGreekRuns,
  toPosix,
} from "./greek-reading-shared.mjs"
export { classifyContentPath, containsGreek, extractGreekMatches, extractGreekRuns, toPosix } from "./greek-reading-shared.mjs"

const AREA_NAMES = ["codeFence", "frontmatter", "heading", "prose", "quotation", "table"]
const SCOPE_NAMES = ["internal", "log", "public", "template"]

function parseFrontmatter(relativePath, markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (match === null) return { data: null, lineCount: 0 }
  const document = parseDocument(match[1], { prettyErrors: true, uniqueKeys: true })
  if (document.errors.length > 0) {
    const detail = document.errors.map(({ message }) => message.replace(/\s+/g, " ")).join("; ")
    throw new TypeError(`${relativePath}: ${detail}`)
  }
  const data = document.toJS()
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError(`${relativePath}: frontmatter must be a mapping`)
  }
  return { data, lineCount: match[0].split(/\r?\n/).length - 1 }
}

function splitMarkdownCells(text) {
  return text.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((cell) => cell.trim())
}

function isTableSeparator(text) {
  const cells = splitMarkdownCells(text)
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function isTableRow(text) {
  return splitMarkdownCells(text).length >= 2
}

export function parseMarkdown(relativePath, markdown) {
  const frontmatter = parseFrontmatter(relativePath, markdown)
  const lines = []
  const rawLines = markdown.split(/\r?\n/)
  let fence = null
  let tableMode = false
  for (const [index, text] of rawLines.entries()) {
    let area = "prose"
    if (index < frontmatter.lineCount) {
      area = "frontmatter"
    } else {
      const marker = text.match(/^\s{0,3}(`{3,}|~{3,})/)?.[1] ?? null
      if (fence !== null) {
        area = "codeFence"
        tableMode = false
        if (marker?.[0] === fence[0] && marker.length >= fence.length) fence = null
      } else if (marker !== null) {
        fence = marker
        area = "codeFence"
        tableMode = false
      } else if (
        isTableSeparator(text) ||
        (isTableRow(text) && isTableSeparator(rawLines[index + 1] ?? "")) ||
        (tableMode && text.trim().length > 0 && isTableRow(text))
      ) {
        area = "table"
        tableMode = true
      } else if (/^\s*#{1,6}\s/.test(text)) {
        area = "heading"
        tableMode = false
      } else if (/^\s*>/.test(text) || /^\s*-\s+\*\*(?:번역|원문|학술 전사)\*\*:/.test(text)) {
        area = "quotation"
        tableMode = false
      } else {
        tableMode = false
      }
    }
    lines.push({ area, lineNumber: index + 1, text })
  }
  return { frontmatter: frontmatter.data, lines }
}

function walkMarkdown(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return walkMarkdown(fullPath)
    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : []
  })
}

export function loadDocuments(root) {
  const candidates = [
    ...(fs.existsSync(path.join(root, "index.md")) ? [path.join(root, "index.md")] : []),
    ...walkMarkdown(path.join(root, "wiki")),
    ...walkMarkdown(path.join(root, "words")),
  ]
  return candidates
    .map((file) => {
      const relativePath = toPosix(path.relative(root, file))
      const markdown = fs.readFileSync(file, "utf8")
      return {
        file,
        relativePath,
        markdown,
        scope: classifyContentPath(relativePath),
        parsed: parseMarkdown(relativePath, markdown),
      }
    })
    .sort((left, right) => compareText(left.relativePath, right.relativePath))
}

function emptyCounts(names) {
  return Object.fromEntries(names.map((name) => [name, 0]))
}

export function inventoryFromDocuments(documents) {
  const scopes = emptyCounts(SCOPE_NAMES)
  const areas = emptyCounts(AREA_NAMES)
  const uniqueGreek = new Set()
  const uniqueRawGreek = new Set()
  const publicUniqueGreek = new Set()
  const records = documents.map((document) => {
    scopes[document.scope] += 1
    const documentAreas = emptyCounts(AREA_NAMES)
    const greekLines = new Set()
    const nfcViolationLines = new Set()
    const documentUniqueGreek = new Set()
    const documentUniqueRawGreek = new Set()
    let runCount = 0
    let rawRunCount = 0
    let nfcViolationCount = 0
    for (const line of document.parsed.lines) {
      const matches = extractGreekMatches(line.text)
      if (matches.length === 0) continue
      greekLines.add(line.lineNumber)
      runCount += matches.length
      rawRunCount += matches.length
      documentAreas[line.area] += matches.length
      areas[line.area] += matches.length
      for (const { raw, normalized } of matches) {
        documentUniqueRawGreek.add(raw)
        uniqueRawGreek.add(raw)
        documentUniqueGreek.add(normalized)
        uniqueGreek.add(normalized)
        if (document.scope === "public") publicUniqueGreek.add(normalized)
        if (raw !== normalized) {
          nfcViolationCount += 1
          nfcViolationLines.add(line.lineNumber)
        }
      }
    }
    const title = document.parsed.frontmatter?.title
    const titleRuns = typeof title === "string" ? extractGreekRuns(title).length : 0
    const h1 = document.parsed.lines.find(({ area, text }) => area === "heading" && /^# /.test(text))?.text ?? ""
    const legacyTripleTitle = [typeof title === "string" ? title : "", h1]
      .some((value) => containsGreek(value) && /\p{Script=Latin}/u.test(value) && /[()]/.test(value))
    const linkAliasRuns = [...document.markdown.matchAll(/\[\[[^\]]*?(?:\\?\|)([^\]]+)\]\]/g)]
      .reduce((total, match) => total + extractGreekRuns(match[1]).length, 0)
    return {
      path: document.relativePath,
      scope: document.scope,
      hasGreek: runCount > 0,
      greekLines: greekLines.size,
      runs: runCount,
      rawRuns: rawRunCount,
      uniqueRuns: documentUniqueGreek.size,
      rawUniqueRuns: documentUniqueRawGreek.size,
      nfcViolations: nfcViolationCount,
      nfcViolationLines: [...nfcViolationLines].sort((left, right) => left - right),
      areas: documentAreas,
      signals: { frontmatterTitleRuns: titleRuns, legacyTripleTitle, linkAliasRuns },
    }
  })
  const greekDocuments = records.filter(({ hasGreek }) => hasGreek)
  return {
    schemaVersion: 1,
    summary: {
      documents: records.length,
      greekDocuments: greekDocuments.length,
      publicGreekDocuments: greekDocuments.filter(({ scope }) => scope === "public").length,
      runs: records.reduce((total, record) => total + record.runs, 0),
      uniqueRuns: uniqueGreek.size,
      rawRuns: records.reduce((total, record) => total + record.rawRuns, 0),
      rawUniqueRuns: uniqueRawGreek.size,
      nfcViolations: records.reduce((total, record) => total + record.nfcViolations, 0),
      publicRuns: records.filter(({ scope }) => scope === "public").reduce((total, record) => total + record.runs, 0),
      publicUniqueRuns: publicUniqueGreek.size,
      scopes,
      areas,
      signals: {
        frontmatterTitleRuns: records.reduce((total, record) => total + record.signals.frontmatterTitleRuns, 0),
        legacyTripleTitles: records.filter((record) => record.signals.legacyTripleTitle).length,
        linkAliasRuns: records.reduce((total, record) => total + record.signals.linkAliasRuns, 0),
      },
    },
    documents: records,
    uniqueGreek: [...uniqueGreek].sort(compareText),
  }
}

export function collectInventory(root) {
  return inventoryFromDocuments(loadDocuments(path.resolve(root)))
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (error) {
    throw new TypeError(`${toPosix(file)}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function reportFor(root) {
  const inventory = collectInventory(root)
  const legacy = readJson(path.join(root, "scripts", "legacy-greek-reading-pages.json"))
  const exceptions = readJson(path.join(root, "scripts", "greek-transliteration-exceptions.json"))
  if (legacy.schemaVersion !== 1 || !Array.isArray(legacy.pages)) {
    throw new TypeError("legacy ledger schema mismatch")
  }
  if (exceptions.schemaVersion !== 1 || !Array.isArray(exceptions.entries)) {
    throw new TypeError("exception ledger schema mismatch")
  }
  const exceptionStatuses = { approved: 0, rejected: 0, review: 0 }
  for (const entry of exceptions.entries) {
    if (Object.hasOwn(exceptionStatuses, entry.status)) exceptionStatuses[entry.status] += 1
  }
  return {
    ...inventory,
    migration: {
      legacyPages: [...legacy.pages].sort(compareText),
      exceptionStatuses,
    },
  }
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    if (!process.argv.includes("--report")) throw new TypeError("expected --report")
    console.log(JSON.stringify(reportFor(process.cwd()), null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
