import fs from "node:fs"
import path from "node:path"
import { parseDocument } from "yaml"

const REQUIRED_FRONTMATTER = [
  "title",
  "aliases",
  "tags",
  "created",
  "updated",
  "sources",
  "status",
]
const VALID_STATUSES = new Set(["draft", "active", "review", "archived"])

function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  return match === null ? null : { raw: match[1] }
}

function expectedTypeTag(relativePath) {
  if (relativePath === "index.md") return "type/meta"
  if (/^wiki\/(?:index|overview|log)\.md$/.test(relativePath)) return "type/meta"
  if (relativePath === "wiki/greek-reading-guide.md") return "type/meta"
  if (relativePath.startsWith("wiki/meta/")) return "type/meta"
  if (relativePath.startsWith("wiki/analyses/")) return "type/analysis"
  if (relativePath.startsWith("wiki/concepts/")) return "type/concept"
  if (relativePath.startsWith("wiki/entities/")) return "type/entity"
  if (relativePath.startsWith("wiki/sources/")) return "type/source"
  if (relativePath === "words/index.md") return "type/meta"
  if (relativePath.startsWith("words/")) return "type/word"
  return null
}

function isStrictDescendant(root, candidate) {
  const relative = path.relative(root, candidate)
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  )
}

function isFileWithin(root, candidate) {
  const resolvedRoot = path.resolve(root)
  const resolvedCandidate = path.resolve(resolvedRoot, candidate)
  if (!isStrictDescendant(resolvedRoot, resolvedCandidate)) return false

  try {
    if (!fs.statSync(resolvedCandidate).isFile()) return false
    const realRoot = fs.realpathSync(resolvedRoot)
    const realCandidate = fs.realpathSync(resolvedCandidate)
    return isStrictDescendant(realRoot, realCandidate)
  } catch {
    return false
  }
}

function isHttpUrl(source) {
  if (!URL.canParse(source)) return false
  const sourceUrl = new URL(source)
  return (
    (sourceUrl.protocol === "http:" || sourceUrl.protocol === "https:") &&
    sourceUrl.hostname.length > 0
  )
}

function validateSourcePageSources({ root, relativePath, sources, sourceNodes, addError }) {
  const hasUnquotedRestrictedSource = sources.some((source, index) => {
    const requiresQuotes =
      source.includes(",") || /\.pdf\b/i.test(source) || /^https?:\/\//i.test(source)
    const nodeType = sourceNodes[index]?.type
    return requiresQuotes && nodeType !== "QUOTE_DOUBLE" && nodeType !== "QUOTE_SINGLE"
  })
  if (hasUnquotedRestrictedSource) {
    addError(relativePath, "소스 페이지의 쉼표 포함 값·PDF명·URL은 항목별로 인용해야 합니다.")
  }

  const rawRoot = path.join(root, "raw")
  for (const source of sources) {
    if (!isHttpUrl(source) && !isFileWithin(rawRoot, source)) {
      addError(relativePath, `raw 원본을 찾을 수 없습니다: ${source}`)
    }
  }
}

function validatesWikiSourceReferences(relativePath) {
  return (
    relativePath.startsWith("wiki/concepts/") ||
    relativePath.startsWith("wiki/entities/") ||
    relativePath.startsWith("wiki/analyses/")
  )
}

function validateWikiSourceReferences({ root, relativePath, sources, addError }) {
  const sourceRoot = path.join(root, "wiki", "sources")
  for (const source of sources) {
    const isDirectMarkdownFilename = /^[^/\\]+\.md$/.test(source)
    if (!isDirectMarkdownFilename || !isFileWithin(sourceRoot, source)) {
      addError(relativePath, `wiki/sources 문서를 찾을 수 없습니다: ${source}`)
    }
  }
}

function validateFrontmatterValues({
  root,
  relativePath,
  frontmatter,
  sourceNodes,
  addError,
}) {
  for (const field of REQUIRED_FRONTMATTER) {
    if (!Object.hasOwn(frontmatter, field)) {
      addError(relativePath, `프론트매터 필수 필드 ${field}가 없습니다.`)
    }
  }

  if (Object.hasOwn(frontmatter, "title") && typeof frontmatter.title !== "string") {
    addError(relativePath, "title은 문자열이어야 합니다.")
  }
  for (const sequenceField of ["aliases", "tags", "sources"]) {
    if (Object.hasOwn(frontmatter, sequenceField) && !Array.isArray(frontmatter[sequenceField])) {
      addError(relativePath, `${sequenceField}는 YAML sequence여야 합니다.`)
    }
  }

  const isTemplate = path.posix.basename(relativePath) === "_template.md"
  const created = frontmatter.created
  const updated = frontmatter.updated
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (
    !isTemplate &&
    Object.hasOwn(frontmatter, "created") &&
    (typeof created !== "string" || !datePattern.test(created))
  ) {
    addError(relativePath, `created 날짜가 YYYY-MM-DD 문자열 형식이 아닙니다: ${String(created)}`)
  }
  if (
    !isTemplate &&
    Object.hasOwn(frontmatter, "updated") &&
    (typeof updated !== "string" || !datePattern.test(updated))
  ) {
    addError(relativePath, `updated 날짜가 YYYY-MM-DD 문자열 형식이 아닙니다: ${String(updated)}`)
  }
  if (!isTemplate && datePattern.test(created ?? "") && datePattern.test(updated ?? "") && updated < created) {
    addError(relativePath, `updated(${updated})가 created(${created})보다 이릅니다.`)
  }

  const status = frontmatter.status
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : []
  if (Object.hasOwn(frontmatter, "status") && typeof status !== "string") {
    addError(relativePath, "status는 문자열이어야 합니다.")
  } else if (status && !VALID_STATUSES.has(status)) {
    addError(relativePath, `허용되지 않은 status입니다: ${status}`)
  }
  if (typeof status === "string" && !tags.includes(`status/${status}`)) {
    addError(relativePath, `status/${status} 태그가 status 필드와 동기화되지 않았습니다.`)
  }
  const typeTag = expectedTypeTag(relativePath)
  if (typeTag && !tags.includes(typeTag)) addError(relativePath, `${typeTag} 태그가 없습니다.`)

  if (!Array.isArray(frontmatter.sources)) return
  const sources = frontmatter.sources
  if (sources.some((source) => typeof source !== "string")) {
    addError(relativePath, "sources 항목은 모두 문자열이어야 합니다.")
    return
  }

  if (relativePath.startsWith("wiki/sources/")) {
    validateSourcePageSources({ root, relativePath, sources, sourceNodes, addError })
  } else if (validatesWikiSourceReferences(relativePath)) {
    validateWikiSourceReferences({ root, relativePath, sources, addError })
  }
}

export function validateDocumentFrontmatter({ root, relativePath, markdown, addError }) {
  const frontmatterBlock = extractFrontmatter(markdown)
  if (frontmatterBlock === null) {
    addError(relativePath, "표준 YAML 프론트매터가 없습니다.")
    return false
  }

  const yamlDocument = parseDocument(frontmatterBlock.raw, {
    prettyErrors: true,
    uniqueKeys: true,
  })
  for (const error of yamlDocument.errors) {
    addError(relativePath, `YAML 파싱 오류: ${error.message.replace(/\s+/g, " ")}`)
  }
  if (yamlDocument.errors.length > 0) return true

  const frontmatter = yamlDocument.toJS()
  if (frontmatter === null || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    addError(relativePath, "프론트매터 최상위 값은 YAML mapping이어야 합니다.")
    return true
  }

  const sourceNodes = yamlDocument.get("sources", true)?.items ?? []
  validateFrontmatterValues({ root, relativePath, frontmatter, sourceNodes, addError })
  return true
}

export function validateFilename(relativePath, addError) {
  const name = path.posix.basename(relativePath)
  if (
    relativePath.startsWith("wiki/concepts/") &&
    name !== "_template.md" &&
    !/^concept-[a-z0-9-]+\.md$/.test(name)
  ) {
    addError(relativePath, "개념 파일명이 concept-<name>.md 규칙과 다릅니다.")
  }
  if (
    relativePath.startsWith("wiki/entities/") &&
    name !== "_template.md" &&
    !/^entity-[a-z0-9-]+\.md$/.test(name)
  ) {
    addError(relativePath, "엔티티 파일명이 entity-<name>.md 규칙과 다릅니다.")
  }
  if (relativePath.startsWith("wiki/analyses/") && !/^analysis-[a-z0-9-]+\.md$/.test(name)) {
    addError(relativePath, "분석 파일명이 analysis-<title>.md 규칙과 다릅니다.")
  }
  if (
    relativePath.startsWith("wiki/sources/") &&
    !/^[a-z0-9-]+-\d{4}-[a-z0-9-]+\.md$/.test(name)
  ) {
    addError(relativePath, "소스 파일명이 <author>-<year>-<title>.md 규칙과 다릅니다.")
  }
  if (
    relativePath.startsWith("words/") &&
    !["index.md", "_template.md"].includes(name) &&
    !/^word-[a-z0-9-]+\.md$/.test(name)
  ) {
    addError(relativePath, "단어 파일명이 word-<name>.md 규칙과 다릅니다.")
  }
}

export function validateBoldMarkdownSyntax({ relativePath, markdown, addError }) {
  const lines = markdown.split(/\r?\n/)
  let inFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1

    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    // Replace inline code with placeholders of exact same length
    const withoutCode = line.replace(/`[^`]*`/g, (m) => "_".repeat(m.length))

    // Rule 4: Unbalanced bold markers on a single line (odd count of **)
    const asterisks = withoutCode.match(/\*\*/g)
    if (asterisks && asterisks.length % 2 !== 0) {
      addError(relativePath, "단일 행에 닫히지 않은 볼드 마커(**)가 있습니다.", lineNumber)
      continue
    }

    // Inspect each bold span **inner**
    const boldMatches = withoutCode.matchAll(/\*\*(.+?)\*\*/g)
    for (const match of boldMatches) {
      const inner = match[1]

      // Rule 1: Inner quotes/brackets directly adjacent to bold markers
      if (/^[‘'“"『「]/.test(inner)) {
        addError(
          relativePath,
          `볼드 마커 안쪽에 인접한 여는 문장부호가 있습니다: '**${inner}**'`,
          lineNumber,
        )
      }
      if (/[’'”"』」]$/.test(inner)) {
        addError(
          relativePath,
          `볼드 마커 안쪽에 인접한 닫는 문장부호가 있습니다: '**${inner}**'`,
          lineNumber,
        )
      }

      // Rule 3: Spaces inside bold boundaries
      if (inner.startsWith(" ") || inner.endsWith(" ")) {
        addError(relativePath, `볼드 마커 안쪽 경계에 불필요한 공백이 있습니다: '**${inner}**'`, lineNumber)
      }
    }

    // Rule 2: Parentheses inside bold immediately followed by a Korean syllable
    // e.g. **표제어(원어)**조사
    if (/\*\*[^*()\r\n]+\([^)\r\n]+\)\*\*[가-힣]/.test(withoutCode)) {
      addError(
        relativePath,
        "볼드 내부에 괄호가 포함된 상태로 조사가 직결되었습니다. **표제어**(원어)조사 형식으로 분리하세요.",
        lineNumber,
      )
    }
  }
}

