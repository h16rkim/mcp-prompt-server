# Objective

Please review the guideline document below and make a git commit for the work completed so far.

# Git Commit Message Generation Guide

## Purpose

This document provides guidelines for AI agents to generate appropriate commit messages based on the current session's work and changes.

## Commit Message Structure

Your commit message MUST follow the structure below and be written in Korean.

### Header

Start with `agent-task: ` followed by a concise summary of the task in Korean.

### Body

Provide a detailed explanation of the work done. You can use sections like:

- **에이전트가 이번 커밋에서 한일**: (What the agent did in this commit)
- **특별한 요구사항이나 제한사항**: (Special requirements or constraints)
- **TODO: 앞으로 해야 할 일**: (Future tasks)
- **MEMO: 메모할 만한 것**: (Memos)
- **SUGGEST: 제안할 만한 것**: (Suggestions)

### User Prompt

Append the original user prompt exactly as it was given, without any modifications, inside `<prompt>` and `</prompt>` tags.

## Commit Message Template

```
agent-task: [작업 요약을 한국어로 간결하게]

- 에이전트가 이번 커밋에서 한일:
  [구체적인 작업 내용을 상세히 설명]
  [변경된 파일들과 주요 기능들을 나열]

- 특별한 요구사항이나 제한사항:
  [사용자가 요청한 특별한 제약사항이나 요구사항]

- TODO: 앞으로 해야 할 일:
  [향후 진행해야 할 작업들]

- MEMO: 메모할 만한 것:
  [기억해둘 만한 중요한 사항들]

- SUGGEST: 제안할 만한 것:
  [개선 사항이나 제안사항]

<prompt>
[사용자의 원본 프롬프트를 그대로 복사]
</prompt>
```

## Example Commit Messages

### Example 1: Search API Implementation

```
agent-task: 검색 API 엔드포인트 구현

- 에이전트가 이번 커밋에서 한일:
  사용자의 요청에 따라 검색 API의 신규 엔드포인트를 구현했습니다.
  MongoDB Atlas Search와 Google Retail Search를 활용한 검색 기능을 추가했습니다.
  CourseSearchController, CourseSearchService, CourseRepository 클래스를 생성했습니다.

- 특별한 요구사항이나 제한사항:
  페이징 처리와 정렬 기능을 포함하여 구현했습니다.

- TODO: 앞으로 해야 할 일:
  검색 결과 캐싱 기능 추가 검토가 필요합니다.

- MEMO: 메모할 만한 것:
  Atlas Search 인덱스 설정이 필요합니다.

- SUGGEST: 제안할 만한 것:
  검색 성능 모니터링 도구 도입을 고려해보세요.

<prompt>
검색 API 만들어줘. MongoDB Atlas Search 사용해서 구현하고, 페이징 처리도 포함해줘.
</prompt>
```

### Example 2: Repository Pattern Implementation

```
agent-task: Repository 패턴 구현 및 테스트 코드 작성

- 에이전트가 이번 커밋에서 한일:
  CourseRepository 인터페이스와 CourseRepositoryImpl 구현체를 작성했습니다.
  MongoDB Atlas Search DSL을 활용한 복합 검색 쿼리를 구현했습니다.
  Repository 테스트 코드를 Kotest 기반으로 작성했습니다.

- 특별한 요구사항이나 제한사항:
  기존 프로젝트의 Repository 패턴을 따라 Interface + Implementation 구조로 구현했습니다.

- TODO: 앞으로 해야 할 일:
  성능 테스트 및 인덱스 최적화 작업이 필요합니다.

- MEMO: 메모할 만한 것:
  외부 의존성이 필요한 테스트는 @Ignored 처리했습니다.

- SUGGEST: 제안할 만한 것:

<prompt>
CourseRepository 만들어줘. Atlas Search 사용하고 테스트 코드도 포함해서.
</prompt>
```

## Guidelines for AI Agents

1. **Analyze the Session**: Review all the changes made during the current session
2. **Identify Key Changes**: List the main files created, modified, or deleted
3. **Summarize the Work**: Provide a clear summary of what was accomplished
4. **Include Context**: Reference the original user request and any special requirements
5. **Be Specific**: Include specific class names, file names, and functionality implemented
6. **Use Korean**: All commit messages should be written in Korean
7. **Follow Template**: Always use the provided template structure

## Important Notes

- **Commit Scope**: Only include changes made in the current session
- **File Changes**: List all significant files that were created, modified, or deleted
- **User Intent**: Reflect the user's original intent and requirements
- **Technical Details**: Include relevant technical implementation details
- **Future Work**: Mention any incomplete work or future improvements needed
