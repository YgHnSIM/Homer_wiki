import fs from "node:fs"
import path from "node:path"
import { parseDocument } from "yaml"

const ROOT = process.cwd()
const RED_LINK_POLICY_PATH = path.join(ROOT, "scripts", "allowed-red-links.json")
const redLinkPolicy = JSON.parse(fs.readFileSync(RED_LINK_POLICY_PATH, "utf8"))
const redLinkGroups = [redLinkPolicy.futurePages, redLinkPolicy.templatePlaceholders]
if (redLinkGroups.some((group) => !Array.isArray(group))) {
  throw new TypeError(`${RED_LINK_POLICY_PATH}의 빨간 링크 그룹은 배열이어야 합니다.`)
}
const allowedRedLinkEntries = redLinkGroups.flat()
if (allowedRedLinkEntries.some((target) => typeof target !== "string" || target.length === 0)) {
  throw new TypeError(`${RED_LINK_POLICY_PATH}에는 비어 있지 않은 문자열만 사용할 수 있습니다.`)
}
const ALLOWED_RED_LINKS = new Set(allowedRedLinkEntries)
if (ALLOWED_RED_LINKS.size !== allowedRedLinkEntries.length) {
  throw new Error(`${RED_LINK_POLICY_PATH}에 중복된 대상이 있습니다.`)
}
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
const RELATED_EXCEPTIONS = new Set(["wiki/log.md"])
const PATH_LINK_EXCEPTIONS = new Set([
  "wiki/index",
  "words/index",
  "wiki/entities/_template",
  "words/_template",
])
const PUBLIC_ENTRY_FILES = new Set([
  "index.md",
  "wiki/index.md",
  "wiki/overview.md",
  "words/index.md",
])

function toPosix(file) {
  return file.split(path.sep).join("/")
}

function walkMarkdown(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(directory, entry.name)
      return entry.isDirectory() ? walkMarkdown(full) : full.endsWith(".md") ? [full] : []
    })
}

function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return null
  return { raw: match[1] }
}

function linesOutsideFences(markdown) {
  const result = []
  let inFence = false
  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (!inFence) result.push({ line, lineNumber: index + 1 })
  }
  return result
}

function expectedTypeTag(relativePath) {
  if (relativePath === "index.md") return "type/meta"
  if (/^wiki\/(?:index|overview|log)\.md$/.test(relativePath)) return "type/meta"
  if (relativePath.startsWith("wiki/meta/")) return "type/meta"
  if (relativePath.startsWith("wiki/analyses/")) return "type/analysis"
  if (relativePath.startsWith("wiki/concepts/")) return "type/concept"
  if (relativePath.startsWith("wiki/entities/")) return "type/entity"
  if (relativePath.startsWith("wiki/sources/")) return "type/source"
  if (relativePath === "words/index.md") return "type/meta"
  if (relativePath.startsWith("words/")) return "type/word"
  return null
}

function validateFilename(relativePath, addError) {
  const name = path.posix.basename(relativePath)
  if (relativePath.startsWith("wiki/concepts/") && !/^concept-[a-z0-9-]+\.md$/.test(name)) {
    addError(relativePath, "개념 파일명이 concept-<name>.md 규칙과 다릅니다.")
  }
  if (
    relativePath.startsWith("wiki/entities/") &&
    name !== "_template.md" &&
    !/^entity-[a-z0-9-]+\.md$/.test(name)
  ) {
    addError(relativePath, "엔티티 파일명이 entity-<name>.md 규칙과 다릅니다.")
  }
  if (
    relativePath.startsWith("wiki/analyses/") &&
    !/^analysis-[a-z0-9-]+\.md$/.test(name)
  ) {
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

const contentFiles = [path.join(ROOT, "index.md"), ...walkMarkdown(path.join(ROOT, "wiki")), ...walkMarkdown(path.join(ROOT, "words"))]
  .map((file) => path.resolve(file))
  .sort()
const records = contentFiles.map((file) => ({
  file,
  relativePath: toPosix(path.relative(ROOT, file)),
  markdown: fs.readFileSync(file, "utf8"),
}))
const pathTargets = new Set(
  records.map(({ relativePath }) => relativePath.replace(/\.md$/, "")),
)
const basenameTargets = new Map()
for (const target of pathTargets) {
  const basename = path.posix.basename(target)
  const targets = basenameTargets.get(basename) ?? []
  targets.push(target)
  basenameTargets.set(basename, targets)
}

const errors = []
const unresolved = new Map()
let linkCount = 0
function addError(file, message, lineNumber = null) {
  errors.push(`${file}${lineNumber === null ? "" : `:${lineNumber}`} ${message}`)
}

function resolves(target) {
  if (target.includes("/")) return pathTargets.has(target)
  return (basenameTargets.get(target) ?? []).length === 1
}

function targetsIn(markdown) {
  const targets = new Set()
  for (const { line } of linesOutsideFences(markdown)) {
    const withoutCode = line.replace(/`[^`]*`/g, "")
    for (const match of withoutCode.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const normalized = match[1].replace("\\|", "|")
      targets.add(normalized.split("|", 1)[0].split("#", 1)[0].trim())
    }
  }
  return targets
}

for (const { relativePath, markdown } of records) {
  validateFilename(relativePath, addError)
  const frontmatterBlock = extractFrontmatter(markdown)
  if (frontmatterBlock === null) {
    addError(relativePath, "표준 YAML 프론트매터가 없습니다.")
    continue
  }

  const yamlDocument = parseDocument(frontmatterBlock.raw, {
    prettyErrors: true,
    uniqueKeys: true,
  })
  for (const error of yamlDocument.errors) {
    addError(relativePath, `YAML 파싱 오류: ${error.message.replace(/\s+/g, " ")}`)
  }

  let frontmatter = null
  if (yamlDocument.errors.length === 0) {
    const parsed = yamlDocument.toJS()
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      addError(relativePath, "프론트매터 최상위 값은 YAML mapping이어야 합니다.")
    } else {
      frontmatter = parsed
    }
  }

  if (frontmatter !== null) {
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
    if (!isTemplate && Object.hasOwn(frontmatter, "created") && (typeof created !== "string" || !datePattern.test(created))) {
      addError(relativePath, `created 날짜가 YYYY-MM-DD 문자열 형식이 아닙니다: ${String(created)}`)
    }
    if (!isTemplate && Object.hasOwn(frontmatter, "updated") && (typeof updated !== "string" || !datePattern.test(updated))) {
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

    if (Array.isArray(frontmatter.sources)) {
      const sources = frontmatter.sources
      if (sources.some((source) => typeof source !== "string")) {
        addError(relativePath, "sources 항목은 모두 문자열이어야 합니다.")
      } else if (relativePath.startsWith("wiki/sources/")) {
        const sourcesLine = frontmatterBlock.raw.match(/^sources:\s*(.*)$/m)?.[1]?.trim() ?? ""
        if (sources.some((source) => /\.pdf\b/i.test(source) || /^https?:\/\//.test(source))) {
          if (!/^\[\s*(["']).*\1\s*\]$/s.test(sourcesLine)) {
            addError(relativePath, "소스 페이지의 PDF명·URL은 YAML flow sequence 안에서 인용해야 합니다.")
          }
        }
        for (const source of sources) {
          if (/^https?:\/\//.test(source)) continue
          if (source && !fs.existsSync(path.join(ROOT, "raw", source))) {
            addError(relativePath, `raw 원본을 찾을 수 없습니다: ${source}`)
          }
        }
      } else if (
        relativePath.startsWith("wiki/concepts/") ||
        relativePath.startsWith("wiki/entities/") ||
        relativePath.startsWith("wiki/analyses/")
      ) {
        for (const source of sources) {
          if (source && !fs.existsSync(path.join(ROOT, "wiki", "sources", source))) {
            addError(relativePath, `wiki/sources 문서를 찾을 수 없습니다: ${source}`)
          }
        }
      }
    }
  }

  const outside = linesOutsideFences(markdown)
  const h2Headings = outside.filter(({ line }) => /^## /.test(line)).map(({ line }) => line.trim())
  if (!RELATED_EXCEPTIONS.has(relativePath) && h2Headings.at(-1) !== "## 관련 항목") {
    addError(relativePath, "마지막 H2가 정확한 '## 관련 항목'이 아닙니다.")
  }

  for (const { line, lineNumber } of outside) {
    if (/^## ## /.test(line)) addError(relativePath, "중복된 마크다운 H2 표지가 있습니다.", lineNumber)
    if (/^>.*\[\[/.test(line)) addError(relativePath, "콜아웃·인용 블록 안에 위키링크가 있습니다.", lineNumber)
    if (/\p{Emoji_Presentation}|\uFE0F/u.test(line)) addError(relativePath, "이모지 문자가 있습니다.", lineNumber)

    const withoutCode = line.replace(/`[^`]*`/g, "")
    for (const match of withoutCode.matchAll(/\[\[([^\]]+)\]\]/g)) {
      linkCount += 1
      const body = match[1]
      const separator = body.includes("\\|") ? "\\|" : body.includes("|") ? "|" : null
      const parts = separator === null ? [body] : body.split(separator)
      const rawTarget = parts[0].split("#", 1)[0]
      const target = rawTarget.trim()
      const alias = parts.slice(1).join(separator ?? "").trim()
      if (rawTarget !== target || (parts.length > 1 && parts.slice(1).join(separator ?? "") !== alias)) {
        addError(relativePath, `위키링크 대상 또는 별칭에 불필요한 공백이 있습니다: [[${body}]]`, lineNumber)
      }
      if (line.trimStart().startsWith("|") && separator === "|") {
        addError(relativePath, `표 내부 위키링크 파이프를 \\|로 이스케이프해야 합니다: [[${body}]]`, lineNumber)
      }
      if (["index", "_template"].includes(target)) {
        addError(relativePath, `중복 basename 링크는 경로로 한정해야 합니다: [[${body}]]`, lineNumber)
      }
      if (target.includes("/") && !PATH_LINK_EXCEPTIONS.has(target)) {
        addError(relativePath, `고유 대상 링크에는 폴더 경로를 사용하지 않습니다: [[${body}]]`, lineNumber)
      }
      if (!resolves(target)) {
        if (PUBLIC_ENTRY_FILES.has(relativePath)) {
          addError(relativePath, `공개 입구 문서가 미작성 대상을 링크합니다: ${target}`, lineNumber)
        } else {
          const record = unresolved.get(target) ?? { count: 0, locations: [] }
          record.count += 1
          record.locations.push(`${relativePath}:${lineNumber}`)
          unresolved.set(target, record)
        }
      }
    }
  }
}

const wikiIndex = records.find(({ relativePath }) => relativePath === "wiki/index.md")
const wordsIndex = records.find(({ relativePath }) => relativePath === "words/index.md")
const wikiIndexTargets = targetsIn(wikiIndex.markdown)
const wordsIndexTargets = targetsIn(wordsIndex.markdown)
for (const target of pathTargets) {
  const basename = path.posix.basename(target)
  if (/^wiki\/(?:sources|concepts|entities|analyses)\//.test(target) && basename !== "_template") {
    if (!wikiIndexTargets.has(basename) && !wikiIndexTargets.has(target)) {
      addError("wiki/index.md", `카탈로그에서 문서가 누락되었습니다: ${target}.md`)
    }
  }
  if (/^words\/word-/.test(target) && !wordsIndexTargets.has(basename)) {
    addError("words/index.md", `단어 색인에서 문서가 누락되었습니다: ${target}.md`)
  }
}

for (const [target, record] of unresolved) {
  if (!ALLOWED_RED_LINKS.has(target)) {
    addError(
      record.locations[0],
      `등록되지 않은 빨간 링크입니다: ${target}. ${toPosix(path.relative(ROOT, RED_LINK_POLICY_PATH))}에 의도를 기록하거나 오타를 수정하세요.`,
    )
  }
}
for (const target of ALLOWED_RED_LINKS) {
  if (resolves(target)) {
    addError(
      toPosix(path.relative(ROOT, RED_LINK_POLICY_PATH)),
      `이제 작성된 대상이 빨간 링크 허용 목록에 남아 있습니다: ${target}`,
    )
  } else if (!unresolved.has(target)) {
    addError(
      toPosix(path.relative(ROOT, RED_LINK_POLICY_PATH)),
      `현재 사용되지 않는 빨간 링크 대상이 허용 목록에 남아 있습니다: ${target}`,
    )
  }
}

if (process.argv.includes("--report-red-links")) {
  for (const [target, record] of [...unresolved.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    console.log(`${target}\t${record.count}`)
  }
}

if (errors.length > 0) {
  console.error(`Wiki validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  const unresolvedCount = [...unresolved.values()].reduce((sum, record) => sum + record.count, 0)
  console.log(
    `Wiki validation passed: ${records.length} documents, ${linkCount} links, ` +
      `${unresolvedCount} allowed red links (${unresolved.size} targets).`,
  )
}
