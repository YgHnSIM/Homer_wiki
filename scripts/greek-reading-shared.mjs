import path from "node:path"

export const TRANSLITERATION_SYSTEM = "homeric-oriented-v1"
const GREEK_RUN_PATTERN = /\p{Script=Greek}(?:\p{Script=Greek}|\p{Mark})*/gu
const GREEK_CHARACTER_PATTERN = /\p{Script=Greek}/u

export function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}

export function toPosix(file) {
  return file.split(path.sep).join("/")
}

export function extractGreekMatches(text) {
  return [...String(text).matchAll(GREEK_RUN_PATTERN)].map((match) => ({
    raw: match[0],
    normalized: match[0].normalize("NFC"),
    index: match.index ?? 0,
  }))
}

export function extractGreekRuns(text) {
  return extractGreekMatches(text).map(({ normalized }) => normalized)
}

export function containsGreek(text) {
  return GREEK_CHARACTER_PATTERN.test(String(text))
}

export function classifyContentPath(relativePath) {
  if (relativePath === "wiki/log.md") return "log"
  if (relativePath.startsWith("wiki/meta/")) return "internal"
  if (path.posix.basename(relativePath) === "_template.md") return "template"
  return "public"
}

export function issue(code, file, line = null) {
  return { code, file, ...(line === null ? {} : { line }) }
}

export function ledgerPathIsValid(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\\")) return false
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) return false
  const segments = value.split("/")
  return !segments.includes("..") && !segments.includes(".") && (value === "index.md" || /^(?:wiki|words)\/.+\.md$/.test(value))
}
