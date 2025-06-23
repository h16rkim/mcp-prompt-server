#!/usr/bin/env node

/**
 * MCP Server E2E Test Script
 * 이 스크립트는 특정 프롬프트를 테스트합니다.
 * 
 * 사용법:
 * - node scripts/e2e-test.js --prompt <name> [--args <json>]
 * 
 * 예시:
 * - node scripts/e2e-test.js --prompt fix
 * - node scripts/e2e-test.js --prompt prompt --args '{"format":"markdown"}'
 * - node scripts/e2e-test.js --prompt edit --args '{"target":"안녕하세요"}'
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = dirname(__dirname);

// 명령행 인수 파싱
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    promptName: null,
    promptArgs: {}
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prompt':
        config.promptName = args[++i];
        break;
      case '--args':
        try {
          config.promptArgs = JSON.parse(args[++i]);
        } catch (e) {
          console.error('❌ Invalid JSON for --args parameter');
          process.exit(1);
        }
        break;
      case '--help':
      case '-h':
        console.log(`
MCP Server E2E Test Script

사용법:
  node scripts/e2e-test.js --prompt <name>           # 특정 프롬프트 테스트
  node scripts/e2e-test.js --prompt <name> --args <json>  # 인수와 함께 프롬프트 테스트

예시:
  node scripts/e2e-test.js --prompt fix
  node scripts/e2e-test.js --prompt prompt --args '{"format":"yaml"}'
  node scripts/e2e-test.js --prompt mockapi --args '{}'
        `);
        process.exit(0);
        break;
    }
  }

  if (!config.promptName) {
    console.error('❌ --prompt 옵션이 필요합니다');
    console.error('사용법: node scripts/e2e-test.js --prompt <name> [--args <json>]');
    console.error('도움말: node scripts/e2e-test.js --help');
    process.exit(1);
  }

  return config;
}

const testConfig = parseArgs();

// 색상 정의
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 로그 함수들
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.purple}[TEST]${colors.reset} ${msg}`),
  result: (msg) => console.log(`${colors.cyan}[RESULT]${colors.reset} ${msg}`)
};

class MCPTester {
  constructor() {
    this.server = null;
    this.messageId = 1;
    this.buffer = '';
    this.responses = new Map();
    this.availablePrompts = [];
  }

  // 서버 시작
  async startServer() {
    log.info('MCP Server 시작 중...');

    const serverPath = join(projectDir, 'dist', 'index.js');
    this.server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env, DEBUG: 'true' }
    });

    // 서버 응답 처리
    this.server.stdout.on('data', (data) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.server.on('error', (error) => {
      log.error(`서버 에러: ${error.message}`);
    });

    // 서버 시작 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (this.server.killed) {
      throw new Error('서버 시작 실패');
    }

    log.success('MCP Server 시작됨');
  }

  // 버퍼 처리 (JSON 메시지 파싱)
  processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          if (response.id) {
            this.responses.set(response.id, response);
          }
        } catch (e) {
          // JSON이 아닌 로그 메시지는 무시
        }
      }
    }
  }

  // 메시지 전송
  async sendMessage(method, params = {}) {
    const id = this.messageId++;
    const message = {
      jsonrpc: "2.0",
      id,
      method,
      params
    };

    log.test(`📤 Sending [${method}] (ID: ${id})`);

    this.server.stdin.write(JSON.stringify(message) + '\n');

    // 응답 대기
    const maxWait = 50; // 5초
    for (let i = 0; i < maxWait; i++) {
      if (this.responses.has(id)) {
        const response = this.responses.get(id);
        this.responses.delete(id);
        return { id, response };
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`응답 타임아웃: ${method}`);
  }

  // 응답 검증
  validateResponse(method, response) {
    if (response.error) {
      log.error(`[${method}] 오류: ${response.error.message}`);
      return false;
    } else if (response.result !== undefined) {
      log.success(`[${method}] 성공`);
      return true;
    } else {
      log.warning(`[${method}] 예상치 못한 응답 형식`);
      return false;
    }
  }

  // 초기화 테스트
  async testInitialize() {
    log.test('🚀 Initialize 테스트');

    const { response } = await this.sendMessage('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {
        prompts: {},
        tools: {}
      },
      clientInfo: {
        name: "e2e-test-client",
        version: "1.0.0"
      }
    });

    return this.validateResponse('initialize', response);
  }

  // Prompts 목록 테스트
  async testPromptsList() {
    log.test('📝 Prompts 목록 테스트');

    const { response } = await this.sendMessage('prompts/list');
    const success = this.validateResponse('prompts/list', response);

    if (success && response.result?.prompts) {
      this.availablePrompts = response.result.prompts.map(prompt => prompt.name);
      log.info('사용 가능한 Prompts:');
      this.availablePrompts.forEach(prompt => console.log(`  - ${prompt}`));
    }

    return success;
  }

  // 단일 프롬프트 테스트
  async testSinglePrompt(promptName, promptArgs = {}) {
    log.test(`🎯 프롬프트 테스트: ${promptName}`);
    
    // 먼저 프롬프트가 존재하는지 확인
    if (!this.availablePrompts.includes(promptName)) {
      log.error(`프롬프트 '${promptName}'이 존재하지 않습니다.`);
      log.info('사용 가능한 프롬프트들:');
      this.availablePrompts.forEach(p => console.log(`  - ${p}`));
      return false;
    }

    log.info(`📝 프롬프트: ${promptName}`);
    log.info(`📋 인수: ${JSON.stringify(promptArgs, null, 2)}`);
    
    const params = { 
      name: promptName, 
      arguments: promptArgs 
    };
    
    try {
      const { response } = await this.sendMessage('prompts/get', params);
      const success = this.validateResponse(`prompts/get (${promptName})`, response);
      
      if (success && response.result?.messages?.[0]?.content?.text) {
        const content = response.result.messages[0].content.text;
        log.info(`📄 프롬프트 응답 내용 (${content.length}자):`);
        console.log('═'.repeat(80));
        console.log(content);
        console.log('═'.repeat(80));
        
        // 응답 메타데이터 출력
        if (response.result.description) {
          log.info(`📖 설명: ${response.result.description}`);
        }
      }
      
      return success;
    } catch (error) {
      log.error(`[${promptName}] 테스트 실패: ${error.message}`);
      return false;
    }
  }

  // 정리
  cleanup() {
    if (this.server && !this.server.killed) {
      log.info('서버 종료 중...');
      this.server.kill();
    }
  }

  // 메인 테스트 실행
  async run(promptName, promptArgs = {}) {
    console.log(`🎯 프롬프트 테스트: ${promptName}`);
    console.log('================================\n');

    try {
      await this.startServer();
      await this.testInitialize();
      await this.testPromptsList();
      
      const success = await this.testSinglePrompt(promptName, promptArgs);
      
      console.log('\n' + '='.repeat(60));
      if (success) {
        log.success('🎉 테스트가 성공했습니다!');
      } else {
        log.error('💥 테스트가 실패했습니다.');
      }
      console.log('='.repeat(60));
      
      return success;

    } catch (error) {
      log.error(`테스트 실행 중 오류: ${error.message}`);
      return false;
    } finally {
      this.cleanup();
    }
  }
}

// 메인 실행
async function main() {
  const tester = new MCPTester();

  // 시그널 핸들러 설정
  process.on('SIGINT', () => {
    log.info('\n테스트 중단됨');
    tester.cleanup();
    process.exit(1);
  });

  const success = await tester.run(testConfig.promptName, testConfig.promptArgs);
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  log.error(`실행 오류: ${error.message}`);
  process.exit(1);
});
