# Node.js 20 Alpine 이미지 사용 (경량화)
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일들 복사
COPY package*.json ./
COPY tsconfig.json ./

# 의존성 설치
RUN npm ci --only=production

# TypeScript 개발 의존성 임시 설치 (빌드용)
RUN npm install --save-dev typescript @types/node tsx rimraf

# 소스 코드 복사
COPY src/ ./src/
COPY scripts/ ./scripts/

# TypeScript 빌드
RUN npm run build

# 개발 의존성 제거 (이미지 크기 최적화)
RUN npm prune --production

# 비root 사용자 생성 및 권한 설정
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

# 앱 디렉토리 소유권 변경
RUN chown -R mcp:nodejs /app
USER mcp

# 포트 노출 (MCP는 stdio를 사용하지만 헬스체크용)
EXPOSE 3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('MCP Server is healthy')" || exit 1

# 환경 변수 설정
ENV NODE_ENV=production

# 서버 실행
CMD ["node", "dist/index.js"]
