#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'path';
import { McpPromptServer } from './server/McpPromptServer.js';
import { FileUtils } from './utils/FileUtils.js';
import { Logger } from './utils/Logger.js';
import { DEFAULT_MESSAGES, ERROR_MESSAGES } from './config/constants.js';

/**
 * MCP Prompt Server 애플리케이션
 * 메인 엔트리 포인트
 */
class Application {
  private readonly promptsDirs: string[];
  private mcpPromptServer?: McpPromptServer;

  constructor() {
    // 환경변수 PROMPTS_DIRS가 있으면 해당 경로들 사용, 없으면 기본 경로 사용
    if (process.env.PROMPTS_DIRS) {
      this.promptsDirs = process.env.PROMPTS_DIRS
        .split(',')
        .map(dir => dir.trim())
        .filter(dir => dir.length > 0);
    } else {
      const currentDir = FileUtils.getCurrentDirectory(import.meta.url);
      this.promptsDirs = [path.join(currentDir, 'prompts')];
    }
  }

  /**
   * 애플리케이션 시작
   */
  async start(): Promise<void> {
    try {
      await this.initializeServer();
      await this.connectTransport();
      
      Logger.info(DEFAULT_MESSAGES.SERVER_RUNNING);
    } catch (error) {
      Logger.error(ERROR_MESSAGES.SERVER_START_FAILED, error);
      process.exit(1);
    }
  }

  /**
   * 서버 초기화
   */
  private async initializeServer(): Promise<void> {
    this.mcpPromptServer = new McpPromptServer(this.promptsDirs);
    await this.mcpPromptServer.initialize();
    
    const promptCount = this.mcpPromptServer.getPromptsCount();
    Logger.info(DEFAULT_MESSAGES.PROMPTS_LOADED(promptCount));
  }

  /**
   * 전송 계층 연결
   */
  private async connectTransport(): Promise<void> {
    if (!this.mcpPromptServer) {
      throw new Error('서버가 초기화되지 않았습니다.');
    }

    const transport = new StdioServerTransport();
    await this.mcpPromptServer.getServer().connect(transport);
  }
}

/**
 * 프로세스 이벤트 핸들러 설정
 */
class ProcessEventHandler {
  /**
   * 프로세스 종료 시 정리 작업 설정
   */
  static setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      Logger.info(`\n${signal} 신호를 받았습니다. ${DEFAULT_MESSAGES.SERVER_SHUTDOWN}`);
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * 처리되지 않은 예외 및 Promise 거부 처리 설정
   */
  static setupErrorHandlers(): void {
    process.on('uncaughtException', (error) => {
      Logger.error(ERROR_MESSAGES.UNCAUGHT_EXCEPTION, error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      Logger.error(ERROR_MESSAGES.UNHANDLED_REJECTION, reason);
      Logger.error('Promise:', promise);
      process.exit(1);
    });
  }

  /**
   * 모든 이벤트 핸들러 설정
   */
  static setupAll(): void {
    this.setupErrorHandlers();
    this.setupGracefulShutdown();
  }
}

/**
 * 애플리케이션 부트스트랩
 */
async function bootstrap(): Promise<void> {
  // 프로세스 이벤트 핸들러 설정
  ProcessEventHandler.setupAll();
  
  // 애플리케이션 시작
  const app = new Application();
  await app.start();
}

// 애플리케이션 시작
bootstrap().catch((error) => {
  Logger.error('애플리케이션 시작 실패:', error);
  process.exit(1);
});
