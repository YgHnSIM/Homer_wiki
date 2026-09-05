---
title: 호메로스 위키 개념 프레임워크 지침 (Concept Framework Guide)
aliases: [개념 프레임워크, 개념 작성 지침, Concept Framework]
tags: [type/meta, domain/culture, status/active]
created: 2026-09-06
updated: 2026-09-06
sources: []
status: active
---

# 호메로스 위키 개념 프레임워크 지침 (Concept Framework Guide)

이 문서는 호메로스 위키(`wiki/concepts/`)에 축적되는 모든 핵심 사상, 도덕 규범, 사법 질서, 심리철학, 우주론적 원리(Arete, Time, Aidos, Dike, Themis, Menis, Xenia, Ate, Moira 등)의 생성, 분류, 13개 표준 서술 구조, 상호작용망 시각화 및 증거 검증 체계를 규정하는 공식 메타 지침입니다.

---

## 1. 기본 원칙과 문서 경계

### 1.1 개념(Concept)의 정의
개념은 호메로스 서사 세계와 고대 그리스 사유를 통어하는 **추상적 가치 규범, 제도적 원리, 감정 및 인지 범주, 신정론적 질서**를 의미합니다.

- **포함 대상**:
  - **도덕·윤리 규범**(Ethical): 아레테(Arete), 아이도스(Aidos), 네메시스(Nemesis), 아가토스(Agathos) 등
  - **사회·사법 제도**(Institutional): 디케(Dike), 테미스(Themis), 게라스(Geras), 티메(Time), 호르코스(Horkos), 크세니아(Xenia) 등
  - **심리·인지 범주**(Psychological): 메니스(Menis), 아테(Ate), 튀모스(Thumos), 프렌(Phren), 노오스(Noos), 엘레오스(Eleos) 등
  - **신학·제의 질서**(Theological): 히케시아(Hikesia), 스폰데(Sponde), 리타이(Litai), 아세베이아(Asebeia) 등
  - **우주·운명 법칙**(Cosmic): 모이라(Moira), 아이사(Aisa), 코스모스(Kosmos), 에리스(Eris), 쿠도스(Kydos) 등
- **배제 대상**:
  - 고유명으로 식별되는 구체적 인물, 신격, 장소, 사물, 생물은 `wiki/entities/` ([`entity-framework.md`](file:///c:/Vault/Homer_wiki/wiki/meta/entity-framework.md))에 수록합니다. (예: 신격으로서의 테미스/디케는 `entity-themis`, `entity-dike`)
  - 개별 어휘의 영어 수용사 및 현대 어원은 `words/` ([`words/_template.md`](file:///c:/Vault/Homer_wiki/words/_template.md))에 수록합니다. (예: `word-time`, `word-eleos`)
  - 전반적 연구사 종합 비평이나 서사 비교는 `wiki/analyses/`에 수록합니다.

### 1.2 단일 개념 본령 원칙 (Single Essence Principle)
동일한 표제어가 여신(신격)과 제도·규범을 동시에 지칭하는 경우(예: 테미스, 디케, 에리스, 모이라), 신화적 인격체는 `entities/`에, 추상적 규범 및 작동 메커니즘은 `concepts/`에 독립 분리하여 상호 교차 링크합니다.

### 1.3 13개 풀스펙 섹션 아키텍처
엔티티 프레임워크와의 구조적 대칭성(Symmetry)을 유지하며, 필수 코어 7개 섹션과 정당화된 선택적 렌즈 6개 섹션으로 구성됩니다.

---

## 2. 프론트매터 표준 스키마

모든 개념 문서는 상단에 다음 YAML 프론트매터를 필수로 선언합니다:

```yaml
---
title: 한국어 표제어 (관용 라틴명)
aliases: [원어 표기, 학술 전사, 대안 한국어 표기, 관용 영어명]
tags: [type/concept, domain/iliad, domain/odyssey, domain/culture, domain/etymology, status/active]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [관련_sources_파일명_목록]
status: active | review | draft
korean_name: 한국어명
conventional_latin: 관용라틴명
greek: "그리스어원어"
transliteration: "학술전사"
transliteration_system: homeric-oriented-v1
cssclasses: [greek-reading-page]
concept_domain: ethical | institutional | psychological | theological | cosmic
polar_opposites: [대립_개념_목록]
embodying_entities: [체현_영웅_신격_목록]
---
```

---

## 3. 표준 13개 섹션 구조

```text
# 한국어 표제어 (관용 라틴명)

**[[greek-reading-guide|읽는 법]]**: 한국어명 · **원어**: 그리스어원어 · **학술 전사**: *학술전사*

## 1. 정의와 핵심 테제 (Definition & Core Thesis) [필수 코어]
## 2. 어원과 형태론 (Etymology & Morphology) [필수 코어]
## 3. 호메로스 서사시 본문 용례와 맥락 (Homeric Attestation & Contexts) [필수 코어]
## 4. 개념 상호작용과 가치망 (Conceptual Network & Polarity) [필수 코어: Mermaid 필수]
## 5. 대표 서사 에피소드 정밀 해제 (Signature Epic Episodes) [필수 코어]
## 6. 역사적·제도적 맥락 (Historical & Institutional Context) [선택적 렌즈]
## 7. 물질문화와 신체성 (Material Culture & Embodiment) [선택적 렌즈]
## 8. 종교인류학 및 제의적 실천 (Religious Anthropology & Ritual) [선택적 렌즈]
## 9. 심리철학 및 도덕적 행위주체성 (Moral Psychology & Agency) [선택적 렌즈]
## 10. 후대 철학 및 비극 수용사 (Post-Homeric Reception) [선택적 렌즈]
## 11. 학술 논쟁과 이설 (Scholarly Debates & Theoretical Conflicts) [필수 코어: WARNING 필수]
## 12. 증거 매트릭스 (Evidence Matrix) [필수 코어: 1:1 매핑]
## 13. 관련 항목 (See Also) [필수 코어: 교차 링크]
```

---

## 4. 섹션별 상세 작성 가이드

### 제1절: 정의와 핵심 테제 (Definition & Core Thesis)
- 개념의 다층적 의미(일상 관습, 사회적 제도, 우주적 신정론)를 명료한 단문으로 정의합니다.
- 연구사적 핵심 테제를 2~3문장으로 집약 제시합니다.

### 제2절: 어원과 형태론 (Etymology & Morphology)
- 인도유럽 조어(PIE) 어근 및 음운 변화 계통을 명시합니다.
- **형태론 표 열 분리 규약 필수**: AGENTS.md 2.1 지침에 따라 `그리스어 실제형 | 학술 전사 | 품사 및 형태론 | 의미 및 문헌학적 맥락` 4열 표준 체계를 엄격히 준수합니다.

### 제3절: 호메로스 서사시 본문 용례와 맥락 (Homeric Attestation & Contexts)
- 『일리아스』와 『오뒷세이아』 양대 서사시에서의 출현 빈도와 용례 맥락을 비교합니다.
- 4어 이상 완결 시행은 반드시 `번역 → 원문 → 학술 전사` 3행 표준 서식을 적용합니다.

### 제4절: 개념 상호작용과 가치망 (Conceptual Network & Polarity)
- 개념의 대립쌍(Polarity: 예: Dike vs Bie, Time vs Atimia, Themis vs Hubris)을 규명합니다.
- **Mermaid 개념 상호작용망 필수**: 발동 조건, 매개 감정, 사회적 제도, 초월적 신벌 간의 역학 관계를 시각화합니다. (노드 라벨 내 마크다운 목록 문법 금지)

### 제5절: 대표 서사 에피소드 정밀 해제 (Signature Epic Episodes)
- 해당 개념이 극적으로 분출하거나 위기에 봉착하는 1~2개의 결정적 서사 장면(예: 아킬레우스 방패 재판, 1권 아킬레우스-아가멤논 불화, 24권 프리아모스 탄원 등)을 문헌학적으로 정밀 강독합니다.

### 제6~10절: 선택적 학문 렌즈 (Selectable Academic Lenses)
- 개념의 성격에 따라 `[적용]`, `[생략 (사유 명시)]`, `[근거 부족]`으로 명확히 판정합니다:
  - **6절 (역사·제도)**: 오이코스 질서, 아고라 공론장, 바실레이아 군주권, 호혜적 선물교환과의 결합.
  - **7절 (물질·신체성)**: 신체 부위(무릎, 턱, 심장, 간), 물질적 담지체(홀, 배상금, 등심 고기, 성유).
  - **8절 (종교·제의)**: 신벌(Nemesis/Tisis), 정화, 맹세 의례, 탄원 신체성, 희생 제의.
  - **9절 (심리·도덕)**: 신체-정신 감정좌소(Thumos, Phren, Noos), 미망(Ate), 이중 동기화, 도덕적 책임.
  - **10절 (후대 철학·비극 수용)**: 에픽 사이클, 아테네 3대 비극, 플라톤·아리스토텔레스 철학으로의 사상사적 전개.

### 제11절: 학술 논쟁과 이설 (Scholarly Debates & Theoretical Conflicts)
- 20세기 고전학계의 거대 학설 대립(도즈·애드킨스의 진화론적 비도덕론 대 로이드-존스·윌리엄스의 일관된 도덕 질서론 등)을 반드시 `> [!WARNING] 학설 대립: ...` 콜아웃으로 명시합니다.
- 콜아웃 내부에는 위키링크를 일체 사용하지 않고 순수 텍스트로만 기술합니다.

### 제12절: 증거 매트릭스 (Evidence Matrix)
- 본문에서 제기된 모든 핵심 주장에 대해 출전과 확실성 등급을 1:1로 매핑합니다:

| 주장 테제 | 원전·문헌 근거 위치 | 자료 유형 | 확실성 등급 | 적용 섹션 |
|:---|:---|:---|:---|:---|
| 핵심 정의/정형구 | _Il._ 18.508 | 호메로스 본문 | 원전 명시 | 1절, 3절, 5절 |
| 비교언어학적 어원 | Benveniste 1969 | 제도어휘학 | 강한 학술 추론 | 2절 |
| 우주적 제우스 정의 | Lloyd-Jones 1971 | 현대 고전학 | 논쟁적 | 4절, 11절 |

### 제13절: 관련 항목 (See Also)
- 상호 연관된 `concepts/`, `entities/`, `sources/`, `analyses/` 문서들을 체계적으로 연결합니다.

---

## 5. 2축 증거 평가 체계 (Evidence Framework)

모든 개념 서술은 다음 2개 축의 엄격한 교차 검증을 거칩니다:

1. **자료 유형 (Source Type)**:
   - `호메로스 본문 (Epic Text)`: 『일리아스』 및 『오뒷세이아』 직접 전언
   - `비교언어학 (Comparative Linguistics)`: PIE 조어 및 동계어 자료
   - `역사·고고학 (History & Material Culture)`: 미케네 선문자 B 및 물질 유물
   - `고전기 문헌 (Classical Reception)`: 헤시오도스, 비극, 고전기 철학 문헌
   - `현대 고전학 (Modern Scholarship)`: 20~21세기 비평 및 제도학 연구

2. **확실성 등급 (Certainty Level)**:
   - `원전 명시 (Explicit)`: 원전에 직접 등장하는 정형구 및 텍스트 팩트
   - `강한 학술 추론 (Strong Inference)`: 형태론적·제도사적 일관성을 지닌 다수설
   - `논쟁적 (Contested)`: 학파 간 대립이 팽팽한 쟁점 (`> [!WARNING]` 필수)
   - `후대 수용 (Reception)`: 고전기 이후에 투사·변형된 사상사적 해석

---

## 관련 항목

- [[wiki/concepts/_template|개념 표준 마크다운 템플릿]]
- [[entity-framework|엔티티 프레임워크 지침]]
- [[concept-dike|디케 (Dike)]] — 사법적 판결과 우주적 정의 표준 개념 문서
- [[concept-themis|테미스 (Themis)]] — 신성한 선례와 공적 판례 표준 개념 문서
- [[overview|서사시 개요]] — 호메로스 위키 메인 대시보드
- [[wiki/index|위키 색인]]
- [[analysis-concept-source-matrix|개념과 문헌 행렬]]
