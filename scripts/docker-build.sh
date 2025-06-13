#!/bin/bash

# Docker 이미지 빌드 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 정보
PROJECT_NAME="mcp-prompt-server"
IMAGE_TAG="latest"
DOCKERFILE_PATH="."

echo -e "${YELLOW}🐳 MCP Prompt Server Docker 이미지 빌드 시작...${NC}"

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json 파일을 찾을 수 없습니다. 프로젝트 루트 디렉토리에서 실행해주세요.${NC}"
    exit 1
fi

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되어 있지 않습니다.${NC}"
    exit 1
fi

# Docker 이미지 빌드
echo -e "${YELLOW}📦 Docker 이미지 빌드 중...${NC}"
docker build -t ${PROJECT_NAME}:${IMAGE_TAG} ${DOCKERFILE_PATH}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker 이미지 빌드 완료!${NC}"
    echo -e "${GREEN}   이미지 이름: ${PROJECT_NAME}:${IMAGE_TAG}${NC}"
    
    # 이미지 크기 확인
    IMAGE_SIZE=$(docker images ${PROJECT_NAME}:${IMAGE_TAG} --format "table {{.Size}}" | tail -n 1)
    echo -e "${GREEN}   이미지 크기: ${IMAGE_SIZE}${NC}"
    
    echo -e "${YELLOW}🚀 실행 방법:${NC}"
    echo -e "   docker run --rm -i ${PROJECT_NAME}:${IMAGE_TAG}"
    echo -e "   또는"
    echo -e "   docker-compose up"
else
    echo -e "${RED}❌ Docker 이미지 빌드 실패${NC}"
    exit 1
fi
