import type {
  PromptTemplate,
  McpPromptResponse,
  McpResponseMessage,
  ArgumentsType,
  TemplateValidationResult,
  McpMessageRole,
} from "../types.js";
import { Logger } from "./Logger.js";
import {
  HandlebarTemplateProcessStrategy,
  MarkdownTemplateProcessStrategy,
  TemplateProcessStrategy,
} from "./TemplateProcessStrategy.js";

/**
 * 템플릿 처리 유틸리티 클래스
 * Strategy Pattern을 사용하여 다양한 템플릿 처리기를 지원
 */
export class TemplateProcessor {
  private static processors: TemplateProcessStrategy[] = [
    new MarkdownTemplateProcessStrategy(),
    new HandlebarTemplateProcessStrategy(), // 기본 처리기로 마지막에 배치
  ];

  /**
   * 템플릿에 적합한 처리기 선택
   */
  private static selectProcessor(template: string): TemplateProcessStrategy {
    const processor = this.processors.find((processor) =>
      processor.shouldHandle(template),
    );
    if (!processor) {
      throw new Error(
        "템플릿을 처리할 수 있는 적합한 processor를 찾을 수 없습니다.",
      );
    }
    return processor;
  }

  /**
   * Prompt 템플릿을 MCP 응답으로 변환
   */
  static processPromptTemplate(
    prompt: PromptTemplate,
    args: ArgumentsType = {},
  ): McpPromptResponse {
    try {
      if (!prompt) {
        throw new Error("프롬프트 템플릿이 제공되지 않았습니다.");
      }

      Logger.info(`프롬프트 템플릿 처리 시작: ${prompt.name}`);

      const processedMessages = this.processMessages(prompt.messages, args);

      const response: McpPromptResponse = {
        description: prompt.description || `Prompt: ${prompt.name}`,
        messages: processedMessages,
      };

      Logger.info(
        `프롬프트 템플릿 처리 완료: ${prompt.name}, ${processedMessages.length}개 메시지 생성`,
      );
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(
        `프롬프트 템플릿 처리 오류 [${prompt?.name || "unknown"}]:`,
        errorMessage,
      );
      throw new Error(`프롬프트 템플릿 처리 실패: ${errorMessage}`);
    }
  }

  /**
   * 메시지 배열 처리
   */
  private static processMessages(
    messages: readonly PromptTemplate["messages"][number][],
    args: ArgumentsType,
  ): McpResponseMessage[] {
    if (!messages || !Array.isArray(messages)) {
      Logger.warn("메시지 배열이 유효하지 않습니다.");
      return [];
    }

    const processedMessages = messages
      .filter((message) => {
        if (!message?.content?.text) {
          Logger.warn("빈 메시지 또는 텍스트가 없는 메시지를 건너뜁니다.");
          return false;
        }
        return true;
      })
      .map((message, index) => {
        try {
          return this.processMessage(message, args);
        } catch (error) {
          Logger.error(`메시지 ${index} 처리 중 오류:`, error);
          return null;
        }
      })
      .filter((message): message is McpResponseMessage => message !== null);

    Logger.info(
      `메시지 처리 완료: ${messages.length}개 중 ${processedMessages.length}개 성공`,
    );
    return processedMessages;
  }

  /**
   * 개별 메시지 처리
   */
  private static processMessage(
    message: PromptTemplate["messages"][number],
    args: ArgumentsType,
  ): McpResponseMessage | null {
    if (!message.content?.text) {
      Logger.warn("메시지 내용이 없습니다.");
      return null;
    }

    try {
      const processor = this.selectProcessor(message.content.text);
      const processedText = processor.renderTemplate(
        message.content.text,
        args,
      );
      const mcpRole = this.convertToMcpRole(message.role);

      return {
        role: mcpRole,
        content: {
          type: "text",
          text: processedText,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`메시지 렌더링 오류 [role: ${message.role}]:`, errorMessage);
      throw error; // 상위로 전파
    }
  }

  /**
   * 시스템 역할을 MCP 호환 역할로 변환
   */
  private static convertToMcpRole(role: string): McpMessageRole {
    return role === "system" ? "user" : (role as McpMessageRole);
  }

  /**
   * 템플릿 유효성 검사
   */
  static validateTemplate(
    prompt: PromptTemplate,
    args: ArgumentsType,
  ): TemplateValidationResult {
    try {
      Logger.info(`템플릿 검증 시작: ${prompt.name}`);

      const errors: string[] = [];
      const missingArgs: string[] = [];

      // 필수 인수 검사만 수행
      this.validateRequiredArguments(prompt, args, missingArgs);

      const isValid = missingArgs.length === 0 && errors.length === 0;

      if (isValid) {
        Logger.info(`템플릿 검증 성공: ${prompt.name}`);
      } else {
        Logger.warn(
          `템플릿 검증 실패: ${prompt.name} - 누락된 인수: [${missingArgs.join(", ")}]`,
        );
      }

      return {
        isValid,
        missingArgs,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`템플릿 검증 중 오류 [${prompt.name}]:`, errorMessage);

      return {
        isValid: false,
        missingArgs: [],
        errors: [`검증 중 오류 발생: ${errorMessage}`],
      };
    }
  }

  /**
   * 필수 인수 검증
   */
  private static validateRequiredArguments(
    prompt: PromptTemplate,
    args: ArgumentsType,
    missingArgs: string[],
  ): void {
    if (!prompt.arguments) return;

    const requiredArgs = prompt.arguments.filter((arg) => arg.required);
    Logger.info(`필수 인수 검증: ${requiredArgs.length}개 필수 인수 확인`);

    for (const arg of requiredArgs) {
      if (this.isArgumentMissing(args[arg.name])) {
        missingArgs.push(arg.name);
        Logger.warn(`필수 인수 누락: ${arg.name}`);
      }
    }
  }

  /**
   * 인수가 누락되었는지 확인
   */
  private static isArgumentMissing(value: unknown): boolean {
    return value === undefined || value === null;
  }
}
