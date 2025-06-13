import type { 
  PromptTemplate, 
  McpPromptResponse, 
  McpResponseMessage, 
  ArgumentsType 
} from '../types.js';

/**
 * 템플릿 처리 유틸리티 클래스
 */
export class TemplateProcessor {
  /**
   * 템플릿 문자열에서 매개변수 교체
   */
  static replaceTemplateVariables(text: string, args: ArgumentsType): string {
    let result = text;
    
    // 모든 {{arg}} 형식의 매개변수 교체
    for (const [key, value] of Object.entries(args)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const replacement = value !== null && value !== undefined ? String(value) : '';
      result = result.replace(regex, replacement);
    }
    
    return result;
  }

  /**
   * Prompt 템플릿을 MCP 응답으로 변환
   */
  static processPromptTemplate(
    prompt: PromptTemplate, 
    args: ArgumentsType = {}
  ): McpPromptResponse {
    const messages: McpResponseMessage[] = [];
    
    if (prompt.messages && Array.isArray(prompt.messages)) {
      for (const message of prompt.messages) {
        if (message.content && typeof message.content.text === 'string') {
          const processedText = this.replaceTemplateVariables(
            message.content.text, 
            args
          );
          
          // system role을 user로 변환 (MCP SDK 호환성)
          const role = message.role === 'system' ? 'user' : message.role;
          
          messages.push({
            role: role as 'user' | 'assistant',
            content: {
              type: 'text',
              text: processedText
            }
          });
        }
      }
    }
    
    return {
      description: prompt.description || `Prompt: ${prompt.name}`,
      messages: messages
    };
  }

  /**
   * 조건부 블록 처리 (Handlebars 스타일)
   * 예: {{#if condition}}...{{/if}}
   */
  static processConditionalBlocks(text: string, args: ArgumentsType): string {
    let result = text;
    
    // {{#if variable}}...{{/if}} 패턴 처리
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    result = result.replace(ifRegex, (match, variable, content) => {
      const value = args[variable];
      return value ? content : '';
    });
    
    // {{#unless variable}}...{{/unless}} 패턴 처리
    const unlessRegex = /{{#unless\s+(\w+)}}([\s\S]*?){{\/unless}}/g;
    result = result.replace(unlessRegex, (match, variable, content) => {
      const value = args[variable];
      return !value ? content : '';
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
    const regex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;
    
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
  ): { isValid: boolean; missingArgs: string[]; errors: string[] } {
    const errors: string[] = [];
    const missingArgs: string[] = [];
    
    // 필수 인수 검사
    if (prompt.arguments) {
      for (const arg of prompt.arguments) {
        if (arg.required && (args[arg.name] === undefined || args[arg.name] === null)) {
          missingArgs.push(arg.name);
        }
      }
    }
    
    // 템플릿 변수 검사
    for (const message of prompt.messages) {
      if (message.content && message.content.text) {
        const templateVars = this.extractTemplateVariables(message.content.text);
        for (const variable of templateVars) {
          if (args[variable] === undefined && prompt.arguments) {
            const argDef = prompt.arguments.find(arg => arg.name === variable);
            if (!argDef) {
              errors.push(`템플릿 변수 '${variable}'에 대한 인수 정의가 없습니다.`);
            }
          }
        }
      }
    }
    
    return {
      isValid: missingArgs.length === 0 && errors.length === 0,
      missingArgs,
      errors
    };
  }
}
