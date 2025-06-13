import { z } from 'zod';

/**
 * Prompt 인수 정의
 */
export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
}

/**
 * Prompt 메시지 내용 정의
 */
export interface PromptMessageContent {
  type: 'text';
  text: string;
}

/**
 * Prompt 메시지 정의
 */
export interface PromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: PromptMessageContent;
}

/**
 * Prompt 템플릿 정의
 */
export interface PromptTemplate {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  messages: PromptMessage[];
}

/**
 * MCP 응답 메시지 정의 (MCP SDK 호환)
 */
export interface McpResponseMessage {
  [x: string]: unknown;
  role: 'user' | 'assistant';
  content: {
    [x: string]: unknown;
    type: 'text';
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
    type: 'text';
    text: string;
  }>;
  _meta?: { [x: string]: unknown } | undefined;
  structuredContent?: { [x: string]: unknown } | undefined;
  isError?: boolean | undefined;
}

/**
 * 인수 타입 정의 (동적으로 생성되는 Zod 스키마용)
 */
export type ArgumentsType = Record<string, unknown>;

/**
 * Zod 스키마 타입 정의
 */
export type ZodArgumentsSchema = Record<string, z.ZodType<any>> | undefined;
