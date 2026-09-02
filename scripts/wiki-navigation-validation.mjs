const HOME_PAGE = "index.md"

function publishedEntityTargets(records) {
  return records
    .map(({ relativePath }) => relativePath.match(/^wiki\/entities\/(entity-[a-z0-9-]+)\.md$/)?.[1])
    .filter((target) => target !== undefined)
    .sort()
}

function homeEntityTargets(markdown) {
  const readableDocuments = markdown.match(
    /^## 지금 읽을 수 있는 문서\s*$([\s\S]*?)(?=^## |$(?![\s\S]))/m,
  )?.[1]
  const people = readableDocuments?.match(
    /^### 인물\s*$([\s\S]*?)(?=^### |$(?![\s\S]))/m,
  )?.[1] ?? ""
  return new Set(
    [...people.matchAll(/\[\[(entity-[a-z0-9-]+)(?:\||\]\])/g)].map((match) => match[1]),
  )
}

export function validatePublicEntityIndex({ records, addError }) {
  const homePage = records.find(({ relativePath }) => relativePath === HOME_PAGE)
  if (homePage === undefined) {
    addError(HOME_PAGE, "공개 입구 문서를 찾을 수 없습니다.")
    return
  }

  const listedEntities = homeEntityTargets(homePage.markdown)
  for (const target of publishedEntityTargets(records)) {
    if (!listedEntities.has(target)) {
      addError(HOME_PAGE, `공개 입구 문서의 인물 목록에서 엔티티가 누락되었습니다: ${target}`)
    }
  }
}

export function validateWikiIndexFormat({ records, addError }) {
  const wikiIndex = records.find(({ relativePath }) => relativePath === "wiki/index.md")
  if (wikiIndex === undefined) {
    addError("wiki/index.md", "위키 색인 문서를 찾을 수 없습니다.")
    return
  }

  const sections = [
    {
      heading: "인물",
      pattern: /^- \[\[entity-[a-z0-9-]+\|.+?\s*\([^)]+\)\]\] — \S+/,
      example: "- [[entity-<name>|한국어명 (관용 라틴명)]] — [서사적 핵심 역할/위상]",
    },
    {
      heading: "개념",
      pattern: /^- \[\[concept-[a-z0-9-]+\|.+?\s*\([^)]+\)\]\] — \S+/,
      example: "- [[concept-<name>|한국어명 (관용 라틴명)]] — [개념 정의 및 핵심 작동 원리]",
    },
    {
      heading: "분석",
      pattern: /^- \[\[analysis-[a-z0-9-]+\|.+?\]\] — \S+/,
      example: "- [[analysis-<title>|분석 문서 제목]] — [분석 주제 및 학술적 기여]",
    },
    {
      heading: "소스 문서",
      pattern: /^- \[\[(?:[a-z0-9-]+-\d{4}-[a-z0-9-]+|raw-\d{4}-[a-z0-9-]+)\|.+?\]\] — \S+/,
      example: "- [[<author>-<year>-<title>|저자 (연도), 도서/논문명]] — [핵심 연구 테제]",
    },
  ]

  for (const { heading, pattern, example } of sections) {
    const sectionMatch = wikiIndex.markdown.match(
      new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m"),
    )
    if (!sectionMatch) continue

    const lines = sectionMatch[1].split(/\r?\n/)
    for (const [index, line] of lines.entries()) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("- [[")) continue
      if (!pattern.test(trimmed)) {
        addError(
          "wiki/index.md",
          `${heading} 항목이 1행 표준 서식을 준수하지 않았습니다 (${example}): "${trimmed}"`,
        )
      }
    }
  }
}

export function validateWordIndexFormat({ records, addError }) {
  const wordIndex = records.find(({ relativePath }) => relativePath === "words/index.md")
  if (wordIndex === undefined) {
    addError("words/index.md", "단어 색인 문서를 찾을 수 없습니다.")
    return
  }

  const sectionMatch = wordIndex.markdown.match(
    /^## 알파벳 색인\s*$([\s\S]*?)(?=^## |$(?![\s\S]))/m,
  )
  if (!sectionMatch) return

  const pattern = /^- \[\[word-[a-z0-9-]+\|[A-Za-z0-9' -]+\s*\([^)]+\)\]\] — \S+/
  const example = "- [[word-<name>|영어 표제어 (한국어명)]] — [*대표 파생어 1*, ...]"
  const lines = sectionMatch[1].split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith("- [[")) continue
    if (!pattern.test(trimmed)) {
      addError(
        "words/index.md",
        `알파벳 색인 항목이 1행 표준 서식을 준수하지 않았습니다 (${example}): "${trimmed}"`,
      )
    }
  }
}

export function validateOverviewSvgLinks({ records, resolves, addError }) {
  const overview = records.find(({ relativePath }) => relativePath === "wiki/overview.md")
  if (overview === undefined) {
    addError("wiki/overview.md", "서사시 개요 문서를 찾을 수 없습니다.")
    return
  }

  const svgMatch = overview.markdown.match(/<svg[\s\S]*?<\/svg>/)
  if (!svgMatch) return

  const links = [...svgMatch[0].matchAll(/<a\s+[^>]*href=["']([^"']+)["']/g)]
  for (const match of links) {
    const target = match[1]
    if (!resolves(target)) {
      addError(
        "wiki/overview.md",
        `SVG 지형도 내 링크 대상이 존재하지 않거나 유효하지 않습니다: ${target}`,
      )
    }
  }
}

