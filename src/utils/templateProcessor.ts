import type { 
  PromptTemplate, 
  McpPromptResponse, 
  McpResponseMessage, 
  ArgumentsType,
  TemplateValidationResult,
  McpMessageRole
} from '../types.js';

/**
 * 템플릿 처리 유틸리티 클래스
 * Prompt 템플릿의 변수 치환과 검증을 담당
 */
export class TemplateProcessor {
  private static readonly TEMPLATE_VARIABLE_REGEX = /{{(\w+)}}/g;
  private static readonly CONDITIONAL_IF_REGEX = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  private static readonly CONDITIONAL_UNLESS_REGEX = /{{#unless\s+(\w+)}}([\s\S]*?){{\/unless}}/g;

  /**
   * 템플릿 문자열에서 매개변수 교체
   */
  static replaceTemplateVariables(text: string, args: ArgumentsType): string {
    return text.replace(this.TEMPLATE_VARIABLE_REGEX, (match, variableName) => {
      const value = args[variableName];
      return value !== null && value !== undefined ? String(value) : '';
    });
  }

  /**
   * Prompt 템플릿을 MCP 응답으로 변환
   */
  static processPromptTemplate(
    prompt: PromptTemplate, 
    args: ArgumentsType = {}
  ): McpPromptResponse {
    const processedMessages = this.processMessages(prompt.messages, args);
    
    return {
      description: prompt.description || `Prompt: ${prompt.name}`,
      messages: processedMessages
    };
  }

  /**
   * 메시지 배열 처리
   */
  private static processMessages(
    messages: readonly PromptTemplate['messages'][number][], 
    args: ArgumentsType
  ): McpResponseMessage[] {
    return messages
      .filter(message => message.content?.text)
      .map(message => this.processMessage(message, args))
      .filter((message): message is McpResponseMessage => message !== null);
  }

  /**
   * 개별 메시지 처리
   */
  private static processMessage(
    message: PromptTemplate['messages'][number], 
    args: ArgumentsType
  ): McpResponseMessage | null {
    if (!message.content?.text) return null;

    const processedText = this.processAdvancedTemplate(message.content.text, args);
    const mcpRole = this.convertToMcpRole(message.role);

    return {
      role: mcpRole,
      content: {
        type: 'text',
        text: processedText
      }
    };
  }

  /**
   * 시스템 역할을 MCP 호환 역할로 변환
   */
  private static convertToMcpRole(role: string): McpMessageRole {
    return role === 'system' ? 'user' : role as McpMessageRole;
  }

  /**
   * 조건부 블록 처리 (Handlebars 스타일)
   */
  static processConditionalBlocks(text: string, args: ArgumentsType): string {
    let result = text;
    
    // {{#if variable}}...{{/if}} 패턴 처리
    result = result.replace(this.CONDITIONAL_IF_REGEX, (match, variable, content) => {
      return args[variable] ? content : '';
    });
    
    // {{#unless variable}}...{{/unless}} 패턴 처리
    result = result.replace(this.CONDITIONAL_UNLESS_REGEX, (match, variable, content) => {
      return !args[variable] ? content : '';
    });
    
    return result;
  }

  /**
   * 고급 템플릿 처리 (조건부 블록 포함)
   */
  static processAdvancedTemplate(text: string, args: ArgumentsType): string {
    // 먼저 조건부 블록 처리
    let result = this.processConditionalBlocks(text, args);
    
    // 그 다음 일반 변수 교체
    result = this.replaceTemplateVariables(result, args);
    
    return result;
  }

  /**
   * 템플릿 변수 추출
   */
  static extractTemplateVariables(text: string): string[] {
    const variables: string[] = [];
    let match;
    
    // 정규식을 새로 생성하여 lastIndex 초기화
    const regex = new RegExp(this.TEMPLATE_VARIABLE_REGEX.source, 'g');
    
    while ((match = regex.exec(text)) !== null) {
      const variable = match[1];
      if (variable && !variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  }

  /**
   * 템플릿 유효성 검사
   */
  static validateTemplate(
    prompt: PromptTemplate, 
    args: ArgumentsType
  ): TemplateValidationResult {
    const errors: string[] = [];
    const missingArgs: string[] = [];
    
    // 필수 인수 검사
    this.validateRequiredArguments(prompt, args, missingArgs);
    
    // 템플릿 변수 검사
    this.validateTemplateVariables(prompt, args, errors);
    
    return {
      isValid: missingArgs.length === 0 && errors.length === 0,
      missingArgs,
      errors
    };
  }

  /**
   * 필수 인수 검증
   */
  private static validateRequiredArguments(
    prompt: PromptTemplate, 
    args: ArgumentsType, 
    missingArgs: string[]
  ): void {
    if (!prompt.arguments) return;

    for (const arg of prompt.arguments) {
      if (arg.required && this.isArgumentMissing(args[arg.name])) {
        missingArgs.push(arg.name);
      }
    }
  }

  /**
   * 템플릿 변수 검증
   */
  private static validateTemplateVariables(
    prompt: PromptTemplate, 
    args: ArgumentsType, 
    errors: string[]
  ): void {
    for (const message of prompt.messages) {
      if (!message.content?.text) continue;

      const templateVars = this.extractTemplateVariables(message.content.text);
      
      for (const variable of templateVars) {
        if (this.isUndefinedVariable(variable, args, prompt)) {
          errors.push(`템플릿 변수 '${variable}'에 대한 인수 정의가 없습니다.`);
        }
      }
    }
  }

  /**
   * 인수가 누락되었는지 확인
   */
  private static isArgumentMissing(value: unknown): boolean {
    return value === undefined || value === null;
  }

  /**
   * 정의되지 않은 변수인지 확인
   */
  private static isUndefinedVariable(
    variable: string, 
    args: ArgumentsType, 
    prompt: PromptTemplate
  ): boolean {
    if (args[variable] !== undefined) return false;
    if (!prompt.arguments) return true;
    
    return !prompt.arguments.some(arg => arg.name === variable);
  }
}
