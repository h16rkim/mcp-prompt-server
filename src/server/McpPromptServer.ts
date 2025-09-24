import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { 
  PromptTemplate, 
  McpToolResponse, 
  ArgumentsType, 
  ZodArgumentsSchema,
  PromptInfo
} from '../types.js';
import { PromptLoader } from '../utils/PromptLoader.js';
import { TemplateProcessor } from '../utils/TemplateProcessor.js';
import { Logger } from '../utils/Logger.js';
import { 
  SERVER_CONFIG, 
  DEFAULT_MESSAGES, 
  ERROR_MESSAGES, 
  TOOL_NAMES, 
  TOOL_DESCRIPTIONS 
} from '../config/constants.js';

/**
 * MCP Prompt 서버 클래스
 * MCP 프로토콜을 통해 Prompt 템플릿을 제공하는 서버
 */
export class McpPromptServer {
  private readonly server: McpServer;
  private readonly promptLoader: PromptLoader;

  constructor(promptsDir: string) {
    this.server = new McpServer(SERVER_CONFIG);
    this.promptLoader = new PromptLoader(promptsDir);
  }

  /**
   * 서버 초기화 및 prompts 로드
   */
  async initialize(): Promise<void> {
    Logger.info(DEFAULT_MESSAGES.SERVER_STARTING);
    
    await this.promptLoader.loadPrompts();
    this.registerPrompts();
    this.registerManagementTools();
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

  /**
   * 모든 로드된 prompts를 MCP prompts로 등록
   */
  private registerPrompts(): void {
    const prompts = [...this.promptLoader.getLoadedPrompts()];
    
    for (const prompt of prompts) {
      this.registerSinglePrompt(prompt);
    }

    Logger.info(DEFAULT_MESSAGES.PROMPTS_REGISTERED(prompts.length));
  }

  /**
   * 개별 prompt를 MCP prompt로 등록
   */
  private registerSinglePrompt(prompt: PromptTemplate): void {
    const argumentsSchema = this.createArgumentsSchema(prompt);
    
    if (argumentsSchema) {
      this.registerPromptWithArguments(prompt, argumentsSchema);
    } else {
      this.registerPromptWithoutArguments(prompt);
    }
  }

  /**
   * 인수가 있는 prompt 등록
   */
  private registerPromptWithArguments(
    prompt: PromptTemplate, 
    argumentsSchema: ZodArgumentsSchema
  ): void {
    this.server.prompt(
      prompt.name,
      prompt.description,
      argumentsSchema ?? {},
      async (args: ArgumentsType) => {
        return this.processPromptWithValidation(prompt, args || {});
      }
    );
  }

  /**
   * 인수가 없는 prompt 등록
   */
  private registerPromptWithoutArguments(prompt: PromptTemplate): void {
    this.server.prompt(
      prompt.name,
      prompt.description,
      async () => {
        return TemplateProcessor.processPromptTemplate(prompt, {});
      }
    );
  }

  /**
   * 검증과 함께 prompt 처리
   */
  private processPromptWithValidation(
    prompt: PromptTemplate, 
    args: ArgumentsType
  ) {
    const validation = TemplateProcessor.validateTemplate(prompt, args || {});
    
    if (!validation.isValid) {
      throw new Error(
        ERROR_MESSAGES.TEMPLATE_PROCESSING_ERROR([...validation.errors], [...validation.missingArgs])
      );
    }

    return TemplateProcessor.processPromptTemplate(prompt, args || {});
  }

  /**
   * Prompt 인수를 기반으로 Zod 스키마 생성
   */
  private createArgumentsSchema(prompt: PromptTemplate): ZodArgumentsSchema {
    const isNoArguments = !prompt.arguments || prompt.arguments?.length === 0
    if (isNoArguments) {
      return undefined;
    }

    const schema: Record<string, z.ZodType<any>> = {};
    
    for (const arg of prompt.arguments) {
      const baseSchema = z.string();
      schema[arg.name] = arg.required ? baseSchema : baseSchema.optional();
    }
    
    return schema;
  }

  /**
   * 관리 도구들 등록
   */
  private registerManagementTools(): void {
    this.registerReloadPromptsTools();
    this.registerGetPromptNamesTools();
    this.registerGetPromptInfoTools();
    
    Logger.info(DEFAULT_MESSAGES.MANAGEMENT_TOOLS_REGISTERED);
  }

  /**
   * prompts 다시 로드 도구 등록
   */
  private registerReloadPromptsTools(): void {
    this.server.tool(
      TOOL_NAMES.RELOAD_PROMPTS,
      TOOL_DESCRIPTIONS.RELOAD_PROMPTS,
      async (): Promise<McpToolResponse> => {
        try {
          await this.promptLoader.loadPrompts();
          this.registerPrompts();
          
          const count = this.promptLoader.getLoadedPrompts().length;
          return this.createSuccessResponse(DEFAULT_MESSAGES.PROMPTS_RELOADED(count));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return this.createErrorResponse(ERROR_MESSAGES.PROMPTS_RELOAD_FAILED(errorMessage));
        }
      }
    );
  }

  /**
   * prompt 이름 목록 가져오기 도구 등록
   */
  private registerGetPromptNamesTools(): void {
    this.server.tool(
      TOOL_NAMES.GET_PROMPT_NAMES,
      TOOL_DESCRIPTIONS.GET_PROMPT_NAMES,
      async (): Promise<McpToolResponse> => {
        const promptNames = [...this.promptLoader.getPromptNames()];
        const message = DEFAULT_MESSAGES.AVAILABLE_PROMPTS(promptNames.length, promptNames);
        return this.createSuccessResponse(message);
      }
    );
  }

  /**
   * 특정 prompt 정보 가져오기 도구 등록
   */
  private registerGetPromptInfoTools(): void {
    this.server.tool(
      TOOL_NAMES.GET_PROMPT_INFO,
      "프롬프트 리스트 조회",
      {
        name: z.string().describe("조회할 prompt의 이름"),
      },
      async (args: { name: string }): Promise<McpToolResponse> => {
        const prompt = this.promptLoader.findPromptByName(args.name);
        
        if (!prompt) {
          return this.createErrorResponse(ERROR_MESSAGES.PROMPT_NOT_FOUND(args.name));
        }

        const promptInfo = this.createPromptInfo(prompt);
        const infoText = this.formatPromptInfo(promptInfo);
        
        return this.createSuccessResponse(infoText);
      }
    );
  }

  /**
   * Prompt 정보 객체 생성
   */
  private createPromptInfo(prompt: PromptTemplate): PromptInfo {
    return {
      name: prompt.name,
      description: prompt.description,
      argumentCount: prompt.arguments?.length || 0,
      messageCount: prompt.messages.length,
      arguments: prompt.arguments ? [...prompt.arguments] : undefined
    };
  }

  /**
   * Prompt 정보를 문자열로 포맷팅
   */
  private formatPromptInfo(info: PromptInfo): string {
    const lines = [
      `이름: ${info.name}`,
      `설명: ${info.description}`,
      `인수 개수: ${info.argumentCount}`,
      `메시지 개수: ${info.messageCount}`
    ];

    if (info.arguments && info.arguments.length > 0) {
      lines.push('\n인수 목록:');
      for (const arg of info.arguments) {
        const requiredText = arg.required ? '필수' : '선택';
        lines.push(`  - ${arg.name}: ${arg.description} (${requiredText})`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 성공 응답 생성
   */
  private createSuccessResponse(text: string): McpToolResponse {
    return {
      content: [{ type: "text", text }]
    };
  }

  /**
   * 오류 응답 생성
   */
  private createErrorResponse(text: string): McpToolResponse {
    return {
      content: [{ type: "text", text }],
      isError: true
    };
  }
}
