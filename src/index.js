import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { z } from 'zod';

// 현재 파일의 디렉토리 경로 가져오기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미리 설정된 prompts의 디렉토리 경로
const PROMPTS_DIR = path.join(__dirname, 'prompts');

// 로드된 모든 prompts 저장
let loadedPrompts = [];

/**
 * prompts 디렉토리에서 모든 미리 설정된 prompt 로드
 */
async function loadPrompts() {
  try {
    // prompts 디렉토리가 존재하는지 확인
    await fs.ensureDir(PROMPTS_DIR);
    
    // prompts 디렉토리의 모든 파일 읽기
    const files = await fs.readdir(PROMPTS_DIR);
    
    // YAML과 JSON 파일만 필터링
    const promptFiles = files.filter(file => 
      file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
    );
    
    // 각 prompt 파일 로드
    const prompts = [];
    for (const file of promptFiles) {
      const filePath = path.join(PROMPTS_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      let prompt;
      if (file.endsWith('.json')) {
        prompt = JSON.parse(content);
      } else {
        // 다른 파일들은 YAML 형식으로 가정
        prompt = YAML.parse(content);
      }
      
      // prompt에 name 필드가 있는지 확인
      if (!prompt.name) {
        console.warn(`경고: ${file}의 Prompt에 name 필드가 없습니다. 건너뜁니다.`);
        continue;
      }
      
      prompts.push(prompt);
    }
    
    loadedPrompts = prompts;
    console.log(`${PROMPTS_DIR}에서 ${prompts.length}개의 prompts를 로드했습니다.`);
    return prompts;
  } catch (error) {
    console.error('prompts 로드 중 오류:', error);
    return [];
  }
}

/**
 * MCP 서버 시작
 */
async function startServer() {
  // 모든 미리 설정된 prompts 로드
  await loadPrompts();
  
  // MCP 서버 생성
  const server = new McpServer({
    name: "mcp-prompt-server",
    version: "1.0.0"
  });
  
  // 각 미리 설정된 prompt에 대해 도구 생성
  loadedPrompts.forEach(prompt => {
    // 도구의 입력 스키마 구성
    const schemaObj = {};
    
    if (prompt.arguments && Array.isArray(prompt.arguments)) {
      prompt.arguments.forEach(arg => {
        // 기본적으로 모든 매개변수는 문자열 타입
        schemaObj[arg.name] = z.string().describe(arg.description || `매개변수: ${arg.name}`);
      });
    }
    
    // 도구 등록
    server.tool(
      prompt.name,
      schemaObj,
      async (args) => {
        // prompt 내용 처리
        let promptText = '';
        
        if (prompt.messages && Array.isArray(prompt.messages)) {
          // 사용자 메시지만 처리
          const userMessages = prompt.messages.filter(msg => msg.role === 'user');
          
          for (const message of userMessages) {
            if (message.content && typeof message.content.text === 'string') {
              let text = message.content.text;
              
              // 모든 {{arg}} 형식의 매개변수 교체
              for (const [key, value] of Object.entries(args)) {
                text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
              }
              
              promptText += text + '\n\n';
            }
          }
        }
        
        // 처리된 prompt 내용 반환
        return {
          content: [
            {
              type: "text",
              text: promptText.trim()
            }
          ]
        };
      },
      {
        description: prompt.description || `Prompt: ${prompt.name}`
      }
    );
  });
  
  // 관리 도구 추가 - prompts 다시 로드
  server.tool(
    "reload_prompts",
    {},
    async () => {
      await loadPrompts();
      return {
        content: [
          {
            type: "text",
            text: `${loadedPrompts.length}개의 prompts를 성공적으로 다시 로드했습니다.`
          }
        ]
      };
    },
    {
      description: "모든 미리 설정된 prompts를 다시 로드합니다"
    }
  );
  
  // 관리 도구 추가 - prompt 이름 목록 가져오기
  server.tool(
    "get_prompt_names",
    {},
    async () => {
      const promptNames = loadedPrompts.map(p => p.name);
      return {
        content: [
          {
            type: "text",
            text: `사용 가능한 prompts (${promptNames.length}개):\n${promptNames.join('\n')}`
          }
        ]
      };
    },
    {
      description: "사용 가능한 모든 prompt 이름을 가져옵니다"
    }
  );
  
  // stdio 전송 계층 생성
  const transport = new StdioServerTransport();
  
  // 서버 연결
  await server.connect(transport);
  console.log('MCP Prompt Server가 실행 중입니다...');
}

// 서버 시작
startServer().catch(error => {
  console.error('서버 시작 실패:', error);
  process.exit(1);
});
