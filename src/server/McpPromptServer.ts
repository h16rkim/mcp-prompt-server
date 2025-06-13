import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { 
  PromptTemplate, 
  McpToolResponse, 
  ArgumentsType, 
  ZodArgumentsSchema 
} from '../types.js';
import { PromptLoader } from '../utils/promptLoader.js';
import { TemplateProcessor } from '../utils/templateProcessor.js';

/**
 * MCP Prompt 서버 클래스
 */
export class McpPromptServer {
  private server: McpServer;
  private promptLoader: PromptLoader;

  constructor(promptsDir: string) {
    this.server = new McpServer({
      name: "mcp-prompt-server",
      version: "1.0.0"
    });
    
    this.promptLoader = new PromptLoader(promptsDir);
  }

  /**
   * 서버 초기화 및 prompts 로드
   */
  async initialize(): Promise<void> {
    await this.promptLoader.loadPrompts();
    this.registerPrompts();
    this.registerManagementTools();
  }

  /**
   * 모든 로드된 prompts를 MCP prompts로 등록
   */
  private registerPrompts(): void {
    const prompts = this.promptLoader.getLoadedPrompts();
    
    prompts.forEach(prompt => {
      const argumentsSchema = this.createArgumentsSchema(prompt);
      
      if (argumentsSchema) {
        this.server.prompt(
          prompt.name,
          argumentsSchema,
          async (args: ArgumentsType) => {
            // 템플릿 유효성 검사
            const validation = TemplateProcessor.validateTemplate(prompt, args || {});
            if (!validation.isValid) {
              throw new Error(
                `템플릿 처리 오류: ${validation.errors.join(', ')}. ` +
                `누락된 필수 인수: ${validation.missingArgs.join(', ')}`
              );
            }

            return TemplateProcessor.processPromptTemplate(prompt, args || {});
          }
        );
      } else {
        this.server.prompt(
          prompt.name,
          `Prompt: ${prompt.name}`,
          async () => {
            return TemplateProcessor.processPromptTemplate(prompt, {});
          }
        );
      }
    });

    console.log(`${prompts.length}개의 prompts를 MCP prompts로 등록했습니다.`);
  }

  /**
   * Prompt 인수를 기반으로 Zod 스키마 생성
   */
  private createArgumentsSchema(prompt: PromptTemplate): ZodArgumentsSchema {
    if (!prompt.arguments || prompt.arguments.length === 0) {
      return undefined;
    }

    const schema: Record<string, z.ZodType<any>> = {};
    
    prompt.arguments.forEach(arg => {
      // 기본적으로 문자열 타입으로 설정, 필요시 확장 가능
      const baseSchema = z.string();
      schema[arg.name] = arg.required ? baseSchema : baseSchema.optional();
    });
    
    return schema;
  }

  /**
   * 관리 도구들 등록
   */
  private registerManagementTools(): void {
    // prompts 다시 로드 도구
    this.server.tool(
      "reload_prompts",
      "Reload all prompt templates",
      async (): Promise<McpToolResponse> => {
        try {
          await this.promptLoader.loadPrompts();
          // 기존 prompts 제거 후 새로 등록
          this.registerPrompts();
          
          const count = this.promptLoader.getLoadedPrompts().length;
          return {
            content: [
              {
                type: "text",
                text: `${count}개의 prompts를 성공적으로 다시 로드했습니다.`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Prompts 로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
              }
            ]
          };
        }
      }
    );

    // prompt 이름 목록 가져오기 도구
    this.server.tool(
      "get_prompt_names",
      "Get list of all available prompt names",
      async (): Promise<McpToolResponse> => {
        const promptNames = this.promptLoader.getPromptNames();
        return {
          content: [
            {
              type: "text",
              text: `사용 가능한 prompts (${promptNames.length}개):\n${promptNames.join('\n')}`
            }
          ]
        };
      }
    );

    // 특정 prompt 정보 가져오기 도구
    this.server.tool(
      "get_prompt_info",
      {
        name: z.string().describe("조회할 prompt의 이름")
      },
      async (args: { name: string }): Promise<McpToolResponse> => {
        const prompt = this.promptLoader.findPromptByName(args.name);
        
        if (!prompt) {
          return {
            content: [
              {
                type: "text",
                text: `'${args.name}' 이름의 prompt를 찾을 수 없습니다.`
              }
            ]
          };
        }

        const info = [
          `이름: ${prompt.name}`,
          `설명: ${prompt.description}`,
          `인수 개수: ${prompt.arguments?.length || 0}`,
          `메시지 개수: ${prompt.messages.length}`
        ];

        if (prompt.arguments && prompt.arguments.length > 0) {
          info.push('\n인수 목록:');
          prompt.arguments.forEach(arg => {
            info.push(`  - ${arg.name}: ${arg.description} (${arg.required ? '필수' : '선택'})`);
          });
        }

        return {
          content: [
            {
              type: "text",
              text: info.join('\n')
            }
          ]
        };
      }
    );

    console.log('관리 도구들을 등록했습니다.');
  }

  /**
   * MCP 서버 인스턴스 반환
   */
  getServer(): McpServer {
    return this.server;
  }

  /**
   * 로드된 prompts 개수 반환
   */
  getPromptsCount(): number {
    return this.promptLoader.getLoadedPrompts().length;
  }
}
