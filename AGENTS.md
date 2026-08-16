# 호메로스 위키 (Homer Wiki) — LLM 지식베이스 스키마 및 운영 지침

이 문서는 호메로스의 서사시(_일리아스_, _오뒷세이아_) 및 고대 그리스 신화·문화·철학 지식을 지식 베이스(Wiki)로 유지·관리할 때 LLM이 준수해야 할 구조, 규칙, 워크플로를 정의합니다.

---

## 1.디렉토리 구조

```
c:/Vault/Homer_wiki/
├── AGENTS.md              # 이 파일 (운영 지침 및 지식베이스 스키마)
├── raw/                   # 원본 소스 (불변, 원문, 번역본, 논문 등)
│   ├── assets/            # 지도, 계보도, 이미지 등 첨부파일
│   └── README.md          # 소스 문서 추가 안내
├── wiki/                  # LLM이 생성·관리하는 마크다운 위키 페이지
│   ├── index.md           # 전체 페이지 카탈로그 및 인덱스
│   ├── log.md             # 작업 시간순 기록 타임라인
│   ├── overview.md        # 위키 대시보드 / 호메로스 서사시 개요
│   ├── sources/           # 텍스트 및 서적 요약 문서 (<author>-<year>-<title>.md)
│   ├── entities/          # 영웅, 신, 국가, 장소 등 개체 문서 (entity-<name>.md)
│   ├── concepts/          # Kleos, Xenia, Nostos 등 핵심 개념 문서 (concept-<name>.md)
│   ├── analyses/          # 서사 구조, 에피소드 비교, 비평 문서 (analysis-<title>.md)
│   └── meta/              # 용어집, 구조 안내 등 메타 문서
└── words/                 # 호메로스 어원·영단어 수용사 사전 (독립 지식베이스)
    ├── _template.md       # 표준 단어 어원 분석 문서 템플릿
    ├── index.md           # 단어 사전 카탈로그 및 색인
    └── word-<name>.md     # 개별 단어 어원·수용사 분석 문서 (word-<name>.md)
```

---

## 2.페이지 규칙

### 2.1 YAML 프론트매터

모든 위키 페이지는 상단에 다음과 같은 표준 YAML 프론트매터를 포함합니다:

```yaml
---
title: 페이지 제목
aliases: [원어/희랍어 이름, 대안 표기, 약어]
tags: [type/entity, domain/iliad, status/active]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [관련 raw 문서 파일명]
status: draft | active | review | archived
---
```

### 2.2 내부 링크 및 이중 대괄호

- 옵시디언 `[[위키링크]]` 형식을 필수 사용합니다.
- 문서 내 최초 언급 시 `[[개념명]]`으로 링크하며, 이후 동일 문서 내 반복 언급은 링크 없이 텍스트로 작성합니다.
- 아직 작성되지 않은 주요 영웅/신/개념도 미래 구축을 위해 `[[미래 페이지]]` 형태로 링크(빨간 링크)를 남겨둡니다.
- 특정 섹션 참조 시 `[[페이지명#섹션]]` 형식을 사용합니다.

### 2.3 태그 체계

| 접두사    | 용도              | 예시                                                                       |
| --------- | ----------------- | -------------------------------------------------------------------------- |
| `type/`   | 페이지 유형 분류  | `type/source`, `type/entity`, `type/concept`, `type/analysis`, `type/meta`, `type/word` |
| `domain/` | 주제 및 작품 분야 | `domain/iliad`, `domain/odyssey`, `domain/mythology`, `domain/culture`, `domain/etymology` |
| `status/` | 문서 완성도 상태  | `status/draft`, `status/active`, `status/review`, `status/archived`        |

### 2.4 작성 및 서술 원칙

- **한국어** 작성을 기본으로 하며, 주요 인물·신·고유명사 및 개념은 희랍어/영어 표기를 병기합니다. (예: 아킬레우스(Achilles, Ἀχιλλεύς), 클레오스(Kleos, κλέος))
- 객관적이고 백과사전적인 톤을 유지합니다.
- **이모지(Emoji) 사용 절대 금지**: 모든 위키 문서(문서 제목, 본문, 섹션 헤딩, 표, 목록, 콜아웃 등)에서 이모지를 일체 사용하지 않습니다. 순수 텍스트와 표준 마크다운 문법만을 사용하여 학술적 품격과 가독성을 유지합니다.
- 텍스트 분석 및 주장의 근거는 `[[소스 페이지]]` 또는 원문 서/행 번호(예: _일리아스_ 1권 1-9행)를 명시합니다.
- 학설이나 서사 해석 간 모순이 존재할 경우 경고 콜아웃을 명시적으로 남깁니다: `> [!WARNING] 모순/이설 발견`
- 모든 페이지 하단에는 `## 관련 항목` 섹션을 포함하여 관련 페이지 링크를 묶어 배치합니다.

### 2.5 파일 명명 규칙 (File Naming Conventions)

볼트 전역 고유성(Global Uniqueness)을 확보하고 동명 표제어(예: Achilles 인물 vs 단어) 간 링크 충돌 및 상대 경로 오작동을 방지하기 위해 **유형별 전치 접두사(Kebab-case Prefix)**를 의무 적용합니다:

| 디렉토리 | 유형 (Type) | 파일명 명명 규칙 | 작성 예시 | 위키링크 호출 형식 |
|:---|:---|:---|:---|:---|
| `wiki/entities/` | 인물, 신, 장소, 사물 | `entity-<name>.md` | `entity-achilles.md`, `entity-hector.md` | `[[entity-achilles\|아킬레우스]]` |
| `wiki/concepts/` | 호메로스 핵심 개념·사상 | `concept-<name>.md` | `concept-menis.md`, `concept-aidos.md` | `[[concept-menis\|메니스]]` |
| `words/` | 어원·영단어 수용사 | `word-<name>.md` | `word-achilles.md`, `word-mentor.md` | `[[word-achilles\|Achilles]]` |
| `wiki/sources/` | 원전 및 학술 소스 | `<author>-<year>-<title>.md` | `lee-junseok-2024-iliad-jeongam.md` | `[[lee-junseok-2024-iliad-jeongam]]` |
| `wiki/analyses/` | 종합 비평 및 서사 분석 | `analysis-<title>.md` | `homeric-ethics-literature-review.md` | `[[homeric-ethics-literature-review]]` |
| `wiki/meta/` | 메타 가이드라인 | `<name>.md` | `entity-framework.md` | `[[entity-framework]]` |

- **위키링크 작성 원칙**: 파일명이 볼트 전역에서 고유하므로, 어느 폴더에 위치한 문서에서 링크하든 상대경로(`../`)나 폴더 경로 없이 `[[entity-achilles|아킬레우스]]`, `[[concept-menis|메니스]]`, `[[word-achilles|Achilles]]`와 같이 간결하고 안전하게 표기합니다.


---

## 3.핵심 워크플로

### 3.1 소스 수집 (Ingest Workflow)

1. **소스 읽기**: `raw/`에 새로 추가된 원문/번역본/논문을 정독합니다.
2. **핵심 요약 공유**: 사용자에게 핵심 인사이트 3-5개를 공유하고 논의합니다.
3. **소스 문서 생성**: `wiki/sources/` 하위에 서지 정보, 핵심 요약, 인용 구절, 관련 위키 링크를 포함한 소스 문서를 작성합니다.
4. **연관 위키 갱신**: 해당 소스와 관련된 `entities/`, `concepts/`, `analyses/`, `words/` 페이지를 업데이트하고 교차 참조를 형성합니다.
5. **인덱스 및 로그 업데이트**: `wiki/index.md` 카탈로그, `words/index.md` 및 `wiki/log.md` 타임라인을 최신화합니다.

### 3.2 질의 및 합성 (Query Workflow)

1. **인덱스 탐색**: `wiki/index.md`, `words/index.md` 및 관련 페이지를 탐색하여 지식을 합성합니다.
2. **답변 제공**: 출처와 `[[페이지링크]]`를 포함하여 응답합니다.
3. **지식 보존**: 가치 있는 분석적 답변은 `wiki/analyses/` 또는 `words/` 하위에 독립된 문서로 저장합니다.

### 3.3 검수 및 정제 (Lint Workflow)

- 주기적으로 고아 페이지(Orphaned page), 끊어진 링크, 오래된/모순된 설명을 검수하여 `wiki/log.md`에 기록하고 업데이트합니다.

---

## 4.핵심 관리 파일

- `wiki/overview.md`: 위키 대시보드. 서사시 전체 구조 및 메인 주제 지도.
- `wiki/index.md`: 카테고리별 전체 위키 문서 목록 및 요약.
- `words/index.md`: 어원·영단어 사전 전체 카탈로그 및 색인.
- `wiki/log.md`: 시계열 작업 이력 (`## [YYYY-MM-DD] 작업유형 | 제목`).

---

## 5. LLM 행동 수칙

1. `raw/` 폴더 내 원본 파일은 **절대로 직접 수정하지 않는다**.
2. `wiki/` 및 `words/` 폴더 내 위키/단어 파일은 지식 축적을 위해 자유롭게 생성·수정·보완한다.
3. 작업 수행 내역은 항상 `wiki/log.md`에 기록하고 `wiki/index.md` 및 `words/index.md` 상태를 최신으로 유지한다.

---

## 6. Git 커밋 및 버전 관리 지침

### 6.1 커밋 메시지 기본 구조

```text
<타입>(<스코프>): <커밋 제목>

[선택적 본문: 변경 이유 및 주요 변경 사항 (필요시)]
```

### 6.2 허용 타입 (Types)

| 타입       | 용도 및 적용 대상                                        |
| :--------- | :------------------------------------------------------- |
| `feat`     | 새로운 위키 문서(소스, 개념, 분석, 인물, 단어 등) 생성   |
| `docs`     | 기존 문서 내용 보완, 상세화, 주석 추가, 분석 심화        |
| `fix`      | 오타, 잘못된 인용 행 번호, 깨진 위키링크, 표기 오류 정정 |
| `refactor` | 지식베이스 템플릿 개편, 구조 재배치, 서식 정리           |
| `chore`    | `.gitignore`, `AGENTS.md`, 메타 설정, 환경 설정 변경     |

### 6.3 허용 스코프 (Scopes)

- `sources` : `wiki/sources/` 문헌 및 강의 소스 문서
- `entities` : `wiki/entities/` 영웅, 신, 인물, 장소 문서
- `concepts` : `wiki/concepts/` Arete, Aidos, Dike 등 핵심 개념 문서
- `analyses` : `wiki/analyses/` 서사 비교, 윤리학 종합 분석 문서
- `words` : `words/` 단어 어원 및 영단어 수용사 분석 문서
- `meta` : `wiki/index.md`, `words/index.md`, `wiki/overview.md`, `wiki/log.md`, `AGENTS.md`
- `all` : 전체 문서 대상 일괄 작업 시

### 6.4 4대 작성 원칙

1. **이모지(Emoji) 절대 금지**: 커밋 메시지 제목 및 본문에 이모지를 일체 포함하지 않는다.
2. **50자 이내 간결한 제목**: 핵심 변경 대상을 명확히 서술한다.
3. **명사형/개조식 종결**: `~추가`, `~수정`, `~개편`, `~정정` 등으로 명료하게 종결한다.
4. **`wiki/log.md` 연동**: 커밋 전 반드시 `wiki/log.md`에 동일한 작업 내역을 시계열로 기록한다.
