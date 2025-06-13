import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { McpPromptServer } from './server/McpPromptServer.js';

// 현재 파일의 디렉토리 경로 가져오기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미리 설정된 prompts의 디렉토리 경로
const PROMPTS_DIR = path.join(__dirname, 'prompts');

/**
 * MCP 서버 시작
 */
async function startServer(): Promise<void> {
  try {
    // MCP Prompt 서버 생성 및 초기화
    const mcpPromptServer = new McpPromptServer(PROMPTS_DIR);
    await mcpPromptServer.initialize();
    
    console.log(`${mcpPromptServer.getPromptsCount()}개의 prompts가 로드되었습니다.`);
    
    // stdio 전송 계층 생성
    const transport = new StdioServerTransport();
    
    // 서버 연결
    await mcpPromptServer.getServer().connect(transport);
    console.log('MCP Prompt Server가 실행 중입니다...');
    
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

/**
 * 프로세스 종료 시 정리 작업
 */
function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    console.log(`\n${signal} 신호를 받았습니다. 서버를 종료합니다...`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * 처리되지 않은 예외 및 Promise 거부 처리
 */
function setupErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    console.error('처리되지 않은 예외:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('처리되지 않은 Promise 거부:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });
}

// 에러 핸들러 및 종료 처리 설정
setupErrorHandlers();
setupGracefulShutdown();

// 서버 시작
startServer();
