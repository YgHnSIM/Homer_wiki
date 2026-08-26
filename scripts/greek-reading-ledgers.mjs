import fs from "node:fs"
import path from "node:path"
import {
  TRANSLITERATION_SYSTEM,
  containsGreek,
  issue,
  ledgerPathIsValid,
  toPosix,
} from "./greek-reading-shared.mjs"

function readJson(file, errors, code) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    errors.push(issue(code, toPosix(file)))
    return null
  }
}

export function validateLegacyLedger({ root, documents, baselineLegacyPages, errors }) {
  const file = path.join(root, "scripts", "legacy-greek-reading-pages.json")
  const ledger = readJson(file, errors, "LEGACY_SCHEMA")
  if (ledger === null) return new Set()
  if (ledger.schemaVersion !== 1 || typeof ledger.reason !== "string" || !Array.isArray(ledger.pages)) {
    errors.push(issue("LEGACY_SCHEMA", "scripts/legacy-greek-reading-pages.json"))
    return new Set()
  }
  const byPath = new Map(documents.map((document) => [document.relativePath, document]))
  const pages = new Set()
  const baseline = baselineLegacyPages === null ? null : new Set(baselineLegacyPages)
  for (const page of ledger.pages) {
    if (!ledgerPathIsValid(page)) {
      errors.push(issue("LEDGER_PATH", "scripts/legacy-greek-reading-pages.json"))
      continue
    }
    if (pages.has(page)) errors.push(issue("LEGACY_DUPLICATE", page))
    pages.add(page)
    const document = byPath.get(page)
    if (document === undefined || document.scope !== "public" || !containsGreek(document.markdown)) {
      errors.push(issue("LEGACY_STALE", page))
    }
    if (baseline !== null && !baseline.has(page)) errors.push(issue("LEGACY_ADDITION", page))
  }
  return pages
}

function entryHasStrings(entry, field) {
  return Array.isArray(entry[field]) && entry[field].length > 0 && entry[field].every((value) => typeof value === "string" && value.trim() === value && value.length > 0)
}

export function validateExceptionLedger({ root, documents, errors }) {
  const ledgerPath = "scripts/greek-transliteration-exceptions.json"
  const ledger = readJson(path.join(root, ...ledgerPath.split("/")), errors, "EXCEPTION_SCHEMA")
  if (ledger === null) return
  if (ledger.schemaVersion !== 1 || ledger.transliterationSystem !== TRANSLITERATION_SYSTEM || !Array.isArray(ledger.entries)) {
    errors.push(issue("EXCEPTION_SCHEMA", ledgerPath))
    return
  }
  const publicDocuments = documents.filter(({ scope }) => scope === "public")
  const keys = new Set()
  for (const entry of ledger.entries) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(issue("EXCEPTION_SCHEMA", ledgerPath))
      continue
    }
    const greekIsValid = typeof entry.greek === "string" && entry.greek.length > 0 && containsGreek(entry.greek)
    if (greekIsValid) {
      const normalizedGreek = entry.greek.normalize("NFC")
      if (keys.has(normalizedGreek)) errors.push(issue("EXCEPTION_DUPLICATE", ledgerPath))
      keys.add(normalizedGreek)
    }
    const commonIsValid = greekIsValid && entry.greek === entry.greek.normalize("NFC") && entry.greek.trim() === entry.greek &&
      typeof entry.proposal === "string" && entry.proposal.trim() === entry.proposal && entry.proposal.length > 0 && !containsGreek(entry.proposal) &&
      typeof entry.reason === "string" && entry.reason.trim().length > 0 &&
      entryHasStrings(entry, "sources") && entryHasStrings(entry, "locations")
    if (!commonIsValid || !["approved", "rejected", "review"].includes(entry.status)) {
      errors.push(issue("EXCEPTION_SCHEMA", ledgerPath))
      continue
    }
    const locationPaths = entry.locations.map((location) => location.split(":", 1)[0])
    if (locationPaths.some((location) => !ledgerPathIsValid(location))) {
      errors.push(issue("LEDGER_PATH", ledgerPath))
    }
    const referenced = locationPaths.some((location) => publicDocuments.some((document) => document.relativePath === location && document.markdown.includes(entry.greek) && document.markdown.includes(entry.approvedTransliteration ?? entry.proposal)))
    if (entry.status === "approved") {
      const approvalIsValid = typeof entry.approvedTransliteration === "string" && entry.approvedTransliteration.length > 0 && !containsGreek(entry.approvedTransliteration) &&
        typeof entry.reviewedBy === "string" && entry.reviewedBy.trim().length > 0 &&
        typeof entry.reviewedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedAt)
      if (!approvalIsValid) errors.push(issue("EXCEPTION_SCHEMA", ledgerPath))
      if (!referenced) errors.push(issue("EXCEPTION_STALE", ledgerPath))
    } else {
      if (entry.approvedTransliteration !== null) errors.push(issue("EXCEPTION_SCHEMA", ledgerPath))
      const proposalUsed = publicDocuments.some(({ markdown }) => markdown.includes(entry.greek) && markdown.includes(entry.proposal))
      if (proposalUsed) errors.push(issue(entry.status === "review" ? "EXCEPTION_REVIEW_USED" : "EXCEPTION_REJECTED_USED", ledgerPath))
    }
  }
}
