import { z } from "zod";

/**
 * 기본 타입 정의
 */
export type MessageRole = "user" | "assistant" | "system";
export type McpMessageRole = "user" | "assistant";
export type ArgumentsType = Record<string, unknown>;
export type ZodArgumentsSchema = Record<string, z.ZodType<any>> | undefined;

/**
 * Prompt 인수 정의
 */
export interface PromptArgument {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
}

/**
 * Prompt 메시지 내용 정의
 */
export interface PromptMessageContent {
  readonly type: "text";
  readonly text: string;
}

/**
 * Prompt 메시지 정의
 */
export interface PromptMessage {
  readonly role: MessageRole;
  readonly content: PromptMessageContent;
}

/**
 * Prompt 템플릿 정의
 */
export interface PromptTemplate {
  readonly name: string;
  readonly description: string;
  readonly arguments?: readonly PromptArgument[];
  readonly messages: readonly PromptMessage[];
}

/**
 * MCP 응답 메시지 정의 (MCP SDK 호환)
 */
export interface McpResponseMessage {
  [x: string]: unknown;
  role: McpMessageRole;
  content: {
    [x: string]: unknown;
    type: "text";
    text: string;
  };
}

/**
 * MCP Prompt 응답 정의 (MCP SDK 호환)
 */
export interface McpPromptResponse {
  [x: string]: unknown;
  description?: string;
  messages: McpResponseMessage[];
  _meta?: { [x: string]: unknown } | undefined;
}

/**
 * MCP Tool 응답 정의
 */
export interface McpToolResponse {
  [x: string]: unknown;
  content: Array<{
    [x: string]: unknown;
    type: "text";
    text: string;
  }>;
  _meta?: { [x: string]: unknown } | undefined;
  structuredContent?: { [x: string]: unknown } | undefined;
  isError?: boolean | undefined;
}

/**
 * 템플릿 검증 결과
 */
export interface TemplateValidationResult {
  readonly isValid: boolean;
  readonly missingArgs: readonly string[];
  readonly errors: readonly string[];
}

/**
 * Prompt 정보 응답
 */
export interface PromptInfo {
  name: string;
  description: string;
  argumentCount: number;
  messageCount: number;
  arguments?: PromptArgument[] | undefined;
}
