#!/usr/bin/env node

/**
 * MCP Server E2E Test Script
 * 이 스크립트는 MCP Server의 모든 tools와 prompts를 테스트합니다.
 * 
 * 사용법:
 * - 전체 테스트: node scripts/e2e-test.js
 * - 특정 프롬프트 테스트: node scripts/e2e-test.js --prompt <name> [--args <json>]
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
    mode: 'full', // 'full' 또는 'single'
    promptName: null,
    promptArgs: {}
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prompt':
        config.mode = 'single';
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
  node scripts/e2e-test.js                           # 전체 테스트 실행
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

  if (config.mode === 'single' && !config.promptName) {
    console.error('❌ --prompt 옵션에는 프롬프트 이름이 필요합니다');
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
    this.testCount = 0;
    this.successCount = 0;
    this.failedTests = [];
    this.buffer = '';
    this.responses = new Map();
    this.availableTools = [];
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
    this.testCount++;

    if (response.error) {
      log.error(`[${method}] 오류: ${response.error.message}`);
      this.failedTests.push(`${method}: ${response.error.message}`);
      return false;
    } else if (response.result !== undefined) {
      log.success(`[${method}] 성공`);
      const resultStr = JSON.stringify(response.result);
      log.result(resultStr)
      // log.result(resultStr.length > 100 ? resultStr.substring(0, 100) + '...' : resultStr);
      this.successCount++;
      return true;
    } else {
      log.warning(`[${method}] 예상치 못한 응답 형식`);
      this.failedTests.push(`${method}: Unexpected response format`);
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

  // Tools 목록 테스트
  async testToolsList() {
    log.test('🔧 Tools 목록 테스트');

    const { response } = await this.sendMessage('tools/list');
    const success = this.validateResponse('tools/list', response);

    if (success && response.result?.tools) {
      this.availableTools = response.result.tools.map(tool => tool.name);
      log.info('사용 가능한 Tools:');
      this.availableTools.forEach(tool => console.log(`  - ${tool}`));
    }

    return success;
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

  // 개별 Tools 테스트
  async testIndividualTools() {
    log.test('🛠️ 개별 Tools 테스트');

    for (const tool of this.availableTools) {
      log.test(`Testing tool: ${tool}`);

      let params;
      switch (tool) {
        case 'reload_prompts':
        case 'get_prompt_names':
          params = { name: tool, arguments: {} };
          break;
        case 'get_prompt_info':
          params = { name: tool, arguments: { name: 'fix' } };
          break;
        default:
          log.warning(`알 수 없는 tool: ${tool}`);
          continue;
      }

      try {
        const { response } = await this.sendMessage('tools/call', params);
        this.validateResponse(`tools/call (${tool})`, response);
      } catch (error) {
        log.error(`[${tool}] 테스트 실패: ${error.message}`);
        this.failedTests.push(`${tool}: ${error.message}`);
        this.testCount++;
      }
    }
  }

  // 단일 프롬프트 테스트
  async testSinglePrompt(promptName, promptArgs = {}) {
    log.test(`🎯 단일 프롬프트 테스트: ${promptName}`);
    
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
      this.failedTests.push(`${promptName}: ${error.message}`);
      this.testCount++;
      return false;
    }
  }

  // 개별 Prompts 테스트 (처음 3개만)
  async testIndividualPrompts() {
    log.test('📋 개별 Prompts 테스트');

    const promptsToTest = this.availablePrompts.slice(0, 10);

    for (const prompt of promptsToTest) {
      log.test(`Testing prompt: ${prompt}`);

      let params;
      if (prompt === 'prompt') {
        // prompt는 필수 인자가 있음
        params = { name: prompt, arguments: { format: 'yaml' } };
      } else {
        params = { name: prompt, arguments: {} };
      }

      try {
        const { response } = await this.sendMessage('prompts/get', params);
        this.validateResponse(`prompts/get (${prompt})`, response);
      } catch (error) {
        log.error(`[${prompt}] 테스트 실패: ${error.message}`);
        this.failedTests.push(`${prompt}: ${error.message}`);
        this.testCount++;
      }
    }
  }

  // 에러 케이스 테스트
  async testErrorCases() {
    log.test('❌ 에러 케이스 테스트');

    // 존재하지 않는 tool 호출
    log.test('Testing non-existent tool');
    try {
      const { response } = await this.sendMessage('tools/call', {
        name: 'non_existent_tool',
        arguments: {}
      });

      this.testCount++;
      if (response.error) {
        log.success('[non_existent_tool] 예상된 에러 응답');
        this.successCount++;
      } else {
        log.error('[non_existent_tool] 에러 응답이 와야 함');
        this.failedTests.push('non_existent_tool: Should return error');
      }
    } catch (error) {
      log.error(`[non_existent_tool] 테스트 실패: ${error.message}`);
      this.failedTests.push(`non_existent_tool: ${error.message}`);
      this.testCount++;
    }

    // 존재하지 않는 prompt 호출
    log.test('Testing non-existent prompt');
    try {
      const { response } = await this.sendMessage('prompts/get', {
        name: 'non_existent_prompt',
        arguments: {}
      });

      this.testCount++;
      if (response.error) {
        log.success('[non_existent_prompt] 예상된 에러 응답');
        this.successCount++;
      } else {
        log.error('[non_existent_prompt] 에러 응답이 와야 함');
        this.failedTests.push('non_existent_prompt: Should return error');
      }
    } catch (error) {
      log.error(`[non_existent_prompt] 테스트 실패: ${error.message}`);
      this.failedTests.push(`non_existent_prompt: ${error.message}`);
      this.testCount++;
    }
  }

  // 결과 출력
  printResults() {
    console.log('\n' + '='.repeat(60));
    log.info('🧪 E2E 테스트 결과');
    console.log('='.repeat(60));

    log.info(`총 테스트: ${this.testCount}`);
    log.success(`성공: ${this.successCount}`);
    log.error(`실패: ${this.testCount - this.successCount}`);

    if (this.failedTests.length > 0) {
      console.log('');
      log.error('실패한 테스트들:');
      this.failedTests.forEach(test => console.log(`  ❌ ${test}`));
    }

    console.log('');
    if (this.successCount === this.testCount) {
      log.success('🎉 모든 테스트가 성공했습니다!');
      return true;
    } else {
      log.error('💥 일부 테스트가 실패했습니다.');
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
  async run(config = { mode: 'full' }) {
    if (config.mode === 'single') {
      console.log(`🎯 단일 프롬프트 테스트: ${config.promptName}`);
      console.log('================================\n');
    } else {
      console.log('🚀 MCP Server E2E 테스트 시작');
      console.log('================================\n');
    }

    try {
      await this.startServer();

      // 기본 초기화는 항상 수행
      await this.testInitialize();
      await this.testPromptsList();

      if (config.mode === 'single') {
        // 단일 프롬프트 테스트
        const success = await this.testSinglePrompt(config.promptName, config.promptArgs);
        this.testCount = 1;
        this.successCount = success ? 1 : 0;
        if (!success) {
          this.failedTests = [`${config.promptName}: Test failed`];
        }
      } else {
        // 전체 테스트
        await this.testToolsList();
        await this.testIndividualTools();
        await this.testIndividualPrompts();
        await this.testErrorCases();
      }

      const success = this.printResults();
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

  const success = await tester.run(testConfig);
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  log.error(`실행 오류: ${error.message}`);
  process.exit(1);
});
