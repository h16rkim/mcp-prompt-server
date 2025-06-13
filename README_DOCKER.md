# MCP Prompt Server - Docker 사용 가이드

이 문서는 MCP Prompt Server를 Docker를 통해 실행하는 방법을 설명합니다.

## 🐳 Docker로 실행하기

### 1. Docker 이미지 빌드

```bash
# 자동 빌드 스크립트 사용
npm run docker:build

# 또는 직접 빌드
docker build -t mcp-prompt-server:latest .
```

### 2. Docker 컨테이너 실행

```bash
# 직접 실행
docker run --rm -i mcp-prompt-server:latest

# npm 스크립트 사용
npm run docker:run
```

### 3. Docker Compose 사용

```bash
# 서비스 시작
docker-compose up

# 백그라운드 실행
docker-compose up -d

# 서비스 중지
docker-compose down

# 빌드와 함께 시작
docker-compose up --build
```

## 🔧 MCP 클라이언트 설정

### Cursor 설정

`~/.cursor/mcp_config.json` 파일에 다음 설정을 추가하세요:

```json
{
  "mcpServers": {
    "prompt-server-docker": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--name", "mcp-prompt-server-instance",
        "mcp-prompt-server:latest"
      ],
      "transport": "stdio"
    }
  }
}
```

### Windsurf 설정

`~/.codeium/windsurf/mcp_config.json` 파일에 다음 설정을 추가하세요:

```json
{
  "mcpServers": {
    "prompt-server-docker": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--name", "mcp-prompt-server-instance",
        "mcp-prompt-server:latest"
      ],
      "transport": "stdio"
    }
  }
}
```

## 📝 설정 옵션

### 환경 변수

Docker 컨테이너 실행 시 다음 환경 변수를 설정할 수 있습니다:

```bash
docker run --rm -i \
  -e NODE_ENV=production \
  mcp-prompt-server:latest
```

### 볼륨 마운트

커스텀 prompts를 사용하고 싶다면 볼륨을 마운트하세요:

```bash
docker run --rm -i \
  -v /path/to/your/prompts:/app/dist/prompts:ro \
  mcp-prompt-server:latest
```

### Docker Compose에서 볼륨 설정

`docker-compose.yml` 파일에서 볼륨을 설정할 수 있습니다:

```yaml
services:
  mcp-prompt-server:
    # ... 기타 설정
    volumes:
      - ./custom-prompts:/app/dist/prompts:ro
```

## 🚀 고급 사용법

### 1. 멀티 스테이지 빌드 최적화

현재 Dockerfile은 이미 최적화되어 있지만, 더 작은 이미지를 원한다면:

```dockerfile
# 빌드 스테이지와 런타임 스테이지 분리
FROM node:20-alpine AS builder
# ... 빌드 과정

FROM node:20-alpine AS runtime
# ... 런타임 설정
```

### 2. 헬스체크 활용

Docker Compose에서 헬스체크를 활용하여 서비스 상태를 모니터링:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "console.log('MCP Server is healthy')"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 3. 로그 관리

Docker 로그를 효율적으로 관리:

```bash
# 로그 확인
docker logs mcp-prompt-server-instance

# 실시간 로그 모니터링
docker logs -f mcp-prompt-server-instance
```

## 🔍 트러블슈팅

### 일반적인 문제들

1. **포트 충돌**
   - MCP는 stdio를 사용하므로 포트 충돌은 일반적으로 발생하지 않습니다.

2. **권한 문제**
   - 컨테이너는 비root 사용자로 실행됩니다.
   - 볼륨 마운트 시 권한을 확인하세요.

3. **메모리 부족**
   - Docker 메모리 제한을 확인하세요:
   ```bash
   docker run --rm -i --memory=512m mcp-prompt-server:latest
   ```

### 디버깅

개발 모드로 컨테이너 실행:

```bash
docker run --rm -it \
  -e NODE_ENV=development \
  mcp-prompt-server:latest \
  /bin/sh
```

## 📊 성능 최적화

### 이미지 크기 최적화

- Alpine Linux 기반 이미지 사용
- 멀티 스테이지 빌드
- 불필요한 파일 제외 (.dockerignore)

### 런타임 최적화

- 비root 사용자 실행
- 메모리 제한 설정
- 헬스체크 구성

## 🔐 보안 고려사항

1. **비root 사용자 실행**: 컨테이너는 `mcp` 사용자로 실행됩니다.
2. **최소 권한 원칙**: 필요한 최소한의 권한만 부여합니다.
3. **이미지 스캔**: 정기적으로 보안 취약점을 스캔하세요.

```bash
# 보안 스캔 (Docker Desktop 필요)
docker scan mcp-prompt-server:latest
```
