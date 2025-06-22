# MCP Prompt Server

[English Version](README_EN.md)

Model Context Protocol (MCP) 기반 서버로, 사용자 작업 요구사항에 따라 미리 설정된 prompt 템플릿을 제공하여 Cline/Cursor/Windsurf 등에서 다양한 작업을 더 효율적으로 수행할 수 있도록 도와줍니다. 서버는 미리 설정된 prompt를 도구(tools)로 반환하여 Cursor와 Windsurf 등의 편집기에서 더 나은 사용 경험을 제공합니다.

## 설치

### NPM을 통한 설치 (권장)

```bash
# npx를 사용하여 바로 실행
npx -y @h16rkim/mcp-prompt-server

# 또는 전역 설치
npm install -g @h16rkim/mcp-prompt-server
mcp-prompt-server
```

### 소스코드에서 설치

```bash
git clone https://github.com/h16rkim/mcp-prompt-server.git
cd mcp-prompt-server
npm install
npm run build
npm start
```

## 주요 기능

- 코드 리뷰, API 문서 생성, 코드 리팩토링 등의 작업에 사용할 수 있는 미리 설정된 prompt 템플릿 제공
- 모든 prompt 템플릿을 MCP prompts 형식이 아닌 MCP 도구(tools)로 제공
- **Handlebars 템플릿 엔진**: 강력한 템플릿 처리 기능으로 동적 매개변수 치환 및 조건부 로직 지원
- 개발자가 자유롭게 prompt 템플릿을 추가하고 수정할 수 있음
- 도구 API를 제공하여 prompt 재로드 및 사용 가능한 prompt 조회 가능
- Cursor와 Windsurf 등의 편집기에 최적화되어 더 나은 통합 경험 제공
- **TypeScript 지원**: TypeScript로 완전히 재작성되어 타입 안전성과 더 나은 개발 경험 제공
- **다중 파일 형식 지원**: YAML, JSON, Markdown 파일 형식 지원
- **Strategy Pattern**: 확장 가능한 파일 파싱 아키텍처로 새로운 파일 형식 쉽게 추가 가능

## 지원하는 파일 형식

### YAML/JSON 파일
기존의 구조화된 prompt 템플릿 형식으로, 매개변수와 복잡한 설정을 지원합니다.

### Markdown 파일 (NEW!)
간단하고 직관적인 Markdown 형식으로 prompt를 작성할 수 있습니다.

**Markdown 파일 규칙:**
- **name**: 파일명 (확장자 제외)
- **description**: 첫 번째 문장을 자동 추출 (Markdown 형식 제거)
- **arguments**: 항상 빈 배열 (매개변수 없음)
- **messages**: 전체 내용이 user role의 단일 메시지로 변환

**예시:**
```markdown
# 코드 리뷰 도우미

이 프롬프트는 코드 리뷰를 도와줍니다.

## 주요 기능
- 코드 품질 검토
- 개선 사항 제안
```

위 파일은 다음과 같이 변환됩니다:
- name: "코드리뷰도우미" (파일명 기준)
- description: "이 프롬프트는 코드 리뷰를 도와줍니다"
- 전체 Markdown 내용이 메시지로 사용

## 기술 스택

- **TypeScript**: 타입 안전성과 더 나은 개발 경험 제공
- **Node.js**: 런타임 환경
- **MCP SDK**: Model Context Protocol 지원
- **Zod**: 런타임 타입 검증
- **YAML**: 설정 파일 형식 지원
- **Handlebars**: 강력한 템플릿 엔진으로 조건부 로직 및 helper 함수 지원
- **Strategy Pattern**: 확장 가능한 파일 파싱 아키텍처

## 디렉토리 구조

```
prompt-server/
├── package.json         # 프로젝트 의존성 및 스크립트
├── tsconfig.json        # TypeScript 설정
├── src/                 # TypeScript 소스 코드 디렉토리
│   ├── index.ts         # 서버 진입점 파일
│   ├── types.ts         # 타입 정의
│   ├── server/          # 서버 관련 코드
│   │   └── McpPromptServer.ts
│   ├── utils/           # 유틸리티 함수들
│   │   ├── promptLoader.ts
│   │   ├── templateProcessor.ts
│   │   ├── handlebarTemplateProcessor.ts
│   │   ├── parseStrategies.ts
│   │   └── markdownUtils.ts
│   └── prompts/         # 미리 설정된 prompt 템플릿 디렉토리
│       ├── code_review.yaml
│       ├── api_documentation.yaml
│       ├── code_refactoring.yaml
│       ├── test_case_generator.yaml
│       ├── project_architecture.yaml
│       ├── convert.yaml
│       ├── commit_and_push.yaml
│       ├── fix.yaml
│       ├── writing_assistant.yaml
│       ├── prompt_template_generator.yaml
│       ├── build_mcp_server.yaml
│       └── test_markdown.md
├── dist/                # 컴파일된 JavaScript 파일
└── README.md            # 프로젝트 설명 문서
```

## 설치 및 사용

1. 의존성 설치:

```bash
cd prompt-server
npm install
```

2. 프로젝트 빌드:

```bash
npm run build
```

3. 서버 시작:

```bash
npm start
```

4. 개발 모드 (자동 재시작):

```bash
npm run dev
```

서버는 표준 입력/출력에서 실행되며, Cursor, Windsurf 또는 기타 MCP 클라이언트에서 연결할 수 있습니다.

## 환경 설정

### 사용자 정의 Prompts 디렉토리

기본적으로 서버는 `src/prompts` 디렉토리의 템플릿을 사용하지만, `PROMPTS_DIR` 환경변수를 통해 다른 디렉토리를 지정할 수 있습니다:

```bash
# 환경변수 설정하여 사용자 정의 prompts 디렉토리 사용
export PROMPTS_DIR="/path/to/custom/prompts"
npm start

# 또는 실행 시 직접 설정
PROMPTS_DIR="/path/to/custom/prompts" npm start

# npx 사용 시
PROMPTS_DIR="/path/to/custom/prompts" npx @h16rkim/mcp-prompt-server
```

**PROMPTS_DIR 설정 시 주의사항:**
- 지정된 디렉토리에 있는 모든 `.yaml`, `.json`, `.md` 파일을 프롬프트 템플릿으로 인식합니다
- 파일 형식은 본 문서의 "지원하는 파일 형식" 섹션을 참고하세요
- 디렉토리가 존재하지 않으면 자동으로 생성됩니다
- 서버 실행 중에도 `reload_prompts` 도구를 사용하여 변경사항을 반영할 수 있습니다

이 기능을 통해:
- 여러 프로젝트별로 다른 prompt 템플릿 세트 사용 가능
- 팀 공유 prompt 템플릿 디렉토리 활용 가능
- 개인 맞춤형 prompt 템플릿 관리 가능

## 개발 스크립트

- `npm run build`: TypeScript 코드 컴파일
- `npm run clean`: 컴파일 출력 디렉토리 정리
- `npm start`: 컴파일된 서버 시작 (로그 없음)
- `npm run start:debug`: 컴파일된 서버 시작 (디버그 로그 포함)
- `npm run dev`: 개발 모드, 파일 변경 감지 및 자동 재시작 (로그 없음)
- `npm run dev:debug`: 개발 모드, 파일 변경 감지 및 자동 재시작 (디버그 로그 포함)
- `npm run test:e2e`: E2E 테스트 실행

## E2E 테스트

프로젝트에는 MCP Server의 모든 기능을 테스트하는 E2E 테스트가 포함되어 있습니다:

```bash
# E2E 테스트 실행
npm run test:e2e

# 또는 직접 실행
node scripts/e2e-test.js
```

### 테스트 내용

E2E 테스트는 다음 항목들을 검증합니다:

1. **서버 초기화**: MCP 프로토콜 초기화
2. **Tools 목록**: 사용 가능한 관리 도구 확인
3. **Prompts 목록**: 사용 가능한 프롬프트 템플릿 확인
4. **개별 Tools 테스트**: 각 관리 도구 호출 및 응답 검증
5. **개별 Prompts 테스트**: 프롬프트 템플릿 호출 및 응답 검증
6. **에러 케이스**: 존재하지 않는 도구/프롬프트 호출 시 적절한 에러 응답

### 테스트 결과 예시

```
🚀 MCP Server E2E 테스트 시작
================================

[TEST] 🚀 Initialize 테스트
[SUCCESS] [initialize] 성공

[TEST] 🔧 Tools 목록 테스트
[SUCCESS] [tools/list] 성공
[INFO] 사용 가능한 Tools:
  - reload_prompts
  - get_prompt_names
  - get_prompt_info

[TEST] 📝 Prompts 목록 테스트
[SUCCESS] [prompts/list] 성공
[INFO] 사용 가능한 Prompts:
  - build_mcp_server
  - commit_and_push
  - convert
  - fix
  - mockapi
  - plan
  - prompt

============================================================
[INFO] 🧪 E2E 테스트 결과
============================================================
[INFO] 총 테스트: 11
[SUCCESS] 성공: 11
[ERROR] 실패: 0

[SUCCESS] 🎉 모든 테스트가 성공했습니다!
```

## 디버그 모드

MCP Server는 기본적으로 로그를 출력하지 않습니다. 이는 MCP의 stdio 통신을 방해하지 않기 위함입니다.

디버그 로그를 보려면 `DEBUG=true` 환경변수를 설정하세요:

```bash
# 디버그 로그와 함께 서버 실행
DEBUG=true npm start

# 또는 디버그 스크립트 사용
npm run start:debug

# 개발 모드에서 디버그 로그
npm run dev:debug
```

**주의사항:**
- 디버그 로그는 `stderr`로 출력되어 MCP의 JSON-RPC 통신(`stdout`)과 분리됩니다
- 프로덕션 환경에서는 `DEBUG=false` 또는 환경변수를 설정하지 않는 것을 권장합니다

## Handlebars 템플릿 엔진

이 서버는 **Handlebars** 템플릿 엔진을 사용하여 강력하고 유연한 템플릿 처리를 제공합니다.

### 기본 문법

```handlebars
# 변수 치환
안녕하세요 {{name}}님!

# 조건부 표시
{{#if format}}
선택된 형식: {{format}}
{{else}}
기본 형식을 사용합니다.
{{/if}}

# 부정 조건
{{#unless disabled}}
이 기능은 활성화되어 있습니다.
{{/unless}}
```

### Custom Helper 함수

서버에서 제공하는 추가 helper 함수들:

#### eq (equals)
두 값이 같은지 비교합니다.
```handlebars
{{#if (eq format "yaml")}}
YAML 형식입니다.
{{else}}
다른 형식입니다.
{{/if}}
```

#### eqIgnoreCase (equals ignore case)
두 값이 같은지 대소문자를 무시하고 비교합니다.
```handlebars
{{#if (eqIgnoreCase format "YAML")}}
YAML 형식입니다 (대소문자 무시).
{{/if}}
```

#### neq (not equals)
두 값이 다른지 비교합니다.
```handlebars
{{#if (neq status "completed")}}
아직 완료되지 않았습니다.
{{/if}}
```

#### in (includes)
값이 배열에 포함되어 있는지 확인합니다.
```handlebars
{{#if (in language ["javascript", "typescript"])}}
JavaScript 계열 언어입니다.
{{/if}}
```

#### inIgnoreCase (includes ignore case)
값이 배열에 포함되어 있는지 대소문자를 무시하고 확인합니다.
```handlebars
{{#inIgnoreCase format '["yaml", "yml"]'}}
YAML 계열 형식입니다.
{{/inIgnoreCase}}
```

#### startsWith
문자열이 특정 문자열로 시작하는지 확인합니다.
```handlebars
{{#if (startsWith filename "test_")}}
테스트 파일입니다.
{{/if}}
```

#### raw
Handlebars 문법을 문자 그대로 출력하고 싶을 때 사용합니다.
```handlebars
{{{{raw}}}}
이 안의 {{변수}}는 처리되지 않고 그대로 출력됩니다.
{{{{/raw}}}}
```

### 템플릿 예시

```handlebars
# {{title}} 프롬프트

{{description}}

{{#if (eq format "yaml")}}
## YAML 형식 가이드라인
YAML 구조를 따라 작성해주세요.
{{/if}}

{{#if (eq format "json")}}
## JSON 형식 가이드라인
JSON 구조를 따라 작성해주세요.
{{/if}}

{{#if (neq format "markdown")}}
구조화된 형식을 사용합니다.
{{else}}
Markdown 형식을 사용합니다.
{{/if}}
```

## 새로운 Prompt 템플릿 추가

`src/prompts` 디렉토리에 새로운 YAML 또는 JSON 파일을 추가하여 새로운 prompt 템플릿을 생성할 수 있습니다. 각 템플릿 파일은 다음 내용을 포함해야 합니다:

```yaml
name: prompt_name                # 고유 식별자, 이 prompt 호출에 사용
description: prompt description  # prompt 기능에 대한 설명
arguments:                       # 매개변수 목록 (선택사항)
  - name: arg_name               # 매개변수 이름
    description: arg description # 매개변수 설명
    required: true/false         # 필수 여부
messages:                        # prompt 메시지 목록
  - role: user/assistant         # 메시지 역할
    content:
      type: text                 # 콘텐츠 타입
      text: |                    # 텍스트 내용, 매개변수 플레이스홀더 {{arg_name}} 포함 가능
        Your prompt text here...
```

### YAML 템플릿에서 Arguments 사용법

YAML 템플릿에서는 `arguments` 섹션에 정의된 매개변수를 Handlebars 문법으로 템플릿 내에서 사용할 수 있습니다:

#### 기본 매개변수 사용
```yaml
arguments:
  - name: format
    description: 출력 형식
    required: true
  - name: language
    description: 프로그래밍 언어
    required: false

messages:
  - role: user
    content:
      type: text
      text: |
        선택된 형식: {{format}}
        {{#if language}}
        사용 언어: {{language}}
        {{/if}}
```

#### 조건부 로직과 함께 사용
```yaml
arguments:
  - name: format
    description: 출력 형식 (yaml, json, markdown)
    required: true

messages:
  - role: user
    content:
      type: text
      text: |
        {{#if (eq format "yaml")}}
        YAML 형식으로 출력합니다.
        {{else if (eq format "json")}}
        JSON 형식으로 출력합니다.
        {{else}}
        Markdown 형식으로 출력합니다.
        {{/if}}
        
        {{#inIgnoreCase format '["yaml", "yml"]'}}
        YAML 계열 형식을 사용합니다.
        {{/inIgnoreCase}}
```

#### 복잡한 조건부 로직 예시
```yaml
arguments:
  - name: type
    description: 작업 유형
    required: true
  - name: options
    description: 추가 옵션
    required: false

messages:
  - role: user
    content:
      type: text
      text: |
        {{#if (in type ["review", "analysis", "documentation"])}}
        코드 관련 작업을 수행합니다: {{type}}
        {{else}}
        일반 작업을 수행합니다: {{type}}
        {{/if}}
        
        {{#if options}}
        추가 옵션: {{options}}
        {{/if}}
        
        {{#unless options}}
        기본 설정을 사용합니다.
        {{/unless}}
```

새 파일을 추가한 후, 서버는 다음 시작 시 자동으로 로드하거나 `reload_prompts` 도구를 사용하여 모든 prompt를 다시 로드할 수 있습니다.

## TypeScript 개발

### 타입 안전성

프로젝트는 TypeScript를 사용하여 완전한 타입 안전성을 제공합니다:

- **PromptTemplate**: Prompt 템플릿의 타입 정의
- **McpPromptResponse**: MCP 응답의 타입 정의
- **ArgumentsType**: 동적 매개변수의 타입 정의

### 주요 클래스

- **McpPromptServer**: 주요 MCP 서버 클래스
- **PromptLoader**: Prompt 템플릿 로더
- **TemplateProcessor**: 템플릿 처리 도구
- **HandlebarTemplateProcessor**: Handlebars 템플릿 엔진 처리
- **ParseStrategyFactory**: 파일 파싱 전략 팩토리

### 확장 개발

새로운 기능을 추가하려면:

1. `src/types.ts`에서 관련 타입 정의
2. 해당 클래스에서 기능 구현
3. `npm run build` 실행하여 컴파일
4. `npm run dev`를 사용하여 개발 테스트

## 사용 예시

### Cursor 또는 Windsurf에서 코드 리뷰 도구 호출

```json
{
  "name": "code_review",
  "arguments": {
    "language": "javascript",
    "code": "function add(a, b) { return a + b; }"
  }
}
```

### Cursor 또는 Windsurf에서 API 문서 생성 도구 호출

```json
{
  "name": "api_documentation",
  "arguments": {
    "language": "python",
    "code": "def process_data(data, options=None):\n    # 데이터 처리\n    return result",
    "format": "markdown"
  }
}
```

## 도구 API

서버는 다음 관리 도구를 제공합니다:

- `reload_prompts`: 모든 미리 설정된 prompt 다시 로드
- `get_prompt_names`: 사용 가능한 모든 prompt 이름 가져오기
- `get_prompt_info`: 특정 prompt의 상세 정보 가져오기

또한 `src/prompts` 디렉토리에 정의된 모든 prompt 템플릿이 클라이언트에 도구로 제공됩니다.

## 편집기 통합

### Cursor

Cursor에서 MCP 설정 파일을 편집해야 합니다:

1. Cursor의 MCP 설정 파일을 찾거나 생성합니다 (일반적으로 `~/.cursor/` 디렉토리에 위치)
2. 다음 내용을 추가합니다:

```json
{
  "servers": [
    {
      "name": "Prompt Server",
      "command": ["node", "/path/to/prompt-server/dist/index.js"],
      "transport": "stdio",
      "initialization_options": {}
    }
  ]
}
```

`/path/to/prompt-server`를 실제 프로젝트 경로로 바꿔주세요.

3. 설정을 저장하고 편집기를 재시작합니다
4. 이제 도구 패널에서 사용 가능한 모든 prompt 도구를 볼 수 있습니다

### Windsurf

Windsurf에서 다음 방법으로 MCP 설정에 접근합니다:

1. Windsurf - 설정 > 고급 설정으로 이동하거나
2. 명령 팔레트 > Windsurf 설정 페이지 열기를 사용합니다
3. Cascade 섹션으로 스크롤하면 새 서버 추가 옵션이 표시됩니다
4. "서버 추가" 버튼을 클릭한 다음 "사용자 정의 서버 추가+"를 선택합니다
5. 또는 `~/.codeium/windsurf/mcp_config.json` 파일을 직접 편집하여 다음 내용을 추가할 수 있습니다:

```json
{
  "mcpServers": {
    "prompt-server": {
      "command": "node",
      "args": [
        "/path/to/prompt-server/dist/index.js"
      ],
      "transport": "stdio"
    }
  }
}
```

`/path/to/prompt-server`를 실제 프로젝트 경로로 바꿔주세요.

6. 서버를 추가한 후 새로고침 버튼을 클릭합니다
7. 이제 도구 패널에서 사용 가능한 모든 prompt 도구를 볼 수 있습니다

## 확장 제안

1. 더 많은 전문 분야의 prompt 템플릿 추가
2. prompt 버전 관리 구현
3. prompt 분류 및 태그 추가
4. prompt 사용 통계 및 분석 구현
5. 사용자 피드백 메커니즘 추가
6. 더 많은 Handlebars helper 함수 추가 (날짜, 문자열 처리 등)
7. prompt 템플릿 검증 및 테스트 기능 추가
8. 새로운 파일 형식 지원 (Strategy Pattern 활용)
9. 템플릿 캐싱 및 성능 최적화
10. 다국어 지원 및 국제화
