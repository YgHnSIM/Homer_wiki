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
