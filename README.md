# MCP Prompt Server

[English Version](README_EN.md)

Model Context Protocol (MCP) 기반 서버로, 사용자 작업 요구사항에 따라 미리 설정된 prompt 템플릿을 제공하여 Cline/Cursor/Windsurf 등에서 다양한 작업을 더 효율적으로 수행할 수 있도록 도와줍니다. 서버는 미리 설정된 prompt를 도구(tools)로 반환하여 Cursor와 Windsurf 등의 편집기에서 더 나은 사용 경험을 제공합니다.

## 주요 기능

- 코드 리뷰, API 문서 생성, 코드 리팩토링 등의 작업에 사용할 수 있는 미리 설정된 prompt 템플릿 제공
- 모든 prompt 템플릿을 MCP prompts 형식이 아닌 MCP 도구(tools)로 제공
- 동적 매개변수 치환을 지원하여 prompt 템플릿을 더욱 유연하게 사용
- 개발자가 자유롭게 prompt 템플릿을 추가하고 수정할 수 있음
- 도구 API를 제공하여 prompt 재로드 및 사용 가능한 prompt 조회 가능
- Cursor와 Windsurf 등의 편집기에 최적화되어 더 나은 통합 경험 제공
- **TypeScript 지원**: TypeScript로 완전히 재작성되어 타입 안전성과 더 나은 개발 경험 제공

## 기술 스택

- **TypeScript**: 타입 안전성과 더 나은 개발 경험 제공
- **Node.js**: 런타임 환경
- **MCP SDK**: Model Context Protocol 지원
- **Zod**: 런타임 타입 검증
- **YAML**: 설정 파일 형식 지원

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
│   │   └── templateProcessor.ts
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
│       └── build_mcp_server.yaml
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

## 개발 스크립트

- `npm run build`: TypeScript 코드 컴파일
- `npm run clean`: 컴파일 출력 디렉토리 정리
- `npm start`: 컴파일된 서버 시작
- `npm run dev`: 개발 모드, 파일 변경 감지 및 자동 재시작

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
6. 더 많은 템플릿 구문 지원 (조건문, 반복문 등)
7. prompt 템플릿 검증 및 테스트 기능 추가
