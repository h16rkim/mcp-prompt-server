import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import type { PromptTemplate, PromptMessage, PromptArgument } from '../types.js';
import { FileUtils } from './fileUtils.js';
import { Logger } from './logger.js';
import { DEFAULT_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Prompt 로더 클래스
 * Prompt 템플릿 파일들을 로드하고 검증하는 역할을 담당
 */
export class PromptLoader {
  private readonly promptsDir: string;
  private loadedPrompts: PromptTemplate[] = [];

  constructor(promptsDir: string) {
    this.promptsDir = promptsDir;
  }

  /**
   * prompts 디렉토리에서 모든 미리 설정된 prompt 로드
   */
  async loadPrompts(): Promise<PromptTemplate[]> {
    try {
      await this.ensurePromptsDirectory();
      const promptFiles = await this.getPromptFiles();
      const prompts = await this.parsePromptFiles(promptFiles);
      
      this.loadedPrompts = prompts;
      Logger.info(DEFAULT_MESSAGES.PROMPTS_LOADED(prompts.length));
      
      return prompts;
    } catch (error) {
      Logger.error(ERROR_MESSAGES.PROMPTS_LOAD_FAILED, error);
      return [];
    }
  }

  /**
   * 로드된 prompts 반환
   */
  getLoadedPrompts(): readonly PromptTemplate[] {
    return [...this.loadedPrompts];
  }

  /**
   * 특정 이름의 prompt 찾기
   */
  findPromptByName(name: string): PromptTemplate | undefined {
    return this.loadedPrompts.find(prompt => prompt.name === name);
  }

  /**
   * 모든 prompt 이름 반환
   */
  getPromptNames(): string[] {
    return this.loadedPrompts.map(prompt => prompt.name);
  }

  /**
   * prompts 디렉토리 존재 확인 및 생성
   */
  private async ensurePromptsDirectory(): Promise<void> {
    await fs.ensureDir(this.promptsDir);
  }

  /**
   * prompt 파일 목록 가져오기
   */
  private async getPromptFiles(): Promise<string[]> {
    const files = await fs.readdir(this.promptsDir);
    return FileUtils.filterPromptFiles(files);
  }

  /**
   * prompt 파일들을 파싱하여 PromptTemplate 배열로 변환
   */
  private async parsePromptFiles(promptFiles: string[]): Promise<PromptTemplate[]> {
    const prompts: PromptTemplate[] = [];

    for (const file of promptFiles) {
      try {
        const prompt = await this.parsePromptFile(file);
        if (prompt) {
          prompts.push(prompt);
        }
      } catch (error) {
        Logger.warn(`파일 ${file} 파싱 중 오류: ${error}`);
      }
    }

    return prompts;
  }

  /**
   * 개별 prompt 파일 파싱
   */
  private async parsePromptFile(filename: string): Promise<PromptTemplate | null> {
    const filePath = path.join(this.promptsDir, filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    const parsedContent = FileUtils.isJsonFile(filename) 
      ? JSON.parse(content)
      : YAML.parse(content);

    if (!this.isValidPromptTemplate(parsedContent)) {
      Logger.warn(ERROR_MESSAGES.INVALID_PROMPT_FORMAT(filename));
      return null;
    }

    return parsedContent;
  }

  /**
   * PromptTemplate 유효성 검사
   */
  private isValidPromptTemplate(obj: unknown): obj is PromptTemplate {
    if (!this.isObject(obj)) return false;

    const prompt = obj as Record<string, unknown>;

    return (
      this.isValidString(prompt.name) &&
      this.isValidString(prompt.description) &&
      this.isValidMessages(prompt.messages) &&
      this.isValidArguments(prompt.arguments)
    );
  }

  /**
   * 메시지 배열 유효성 검사
   */
  private isValidMessages(messages: unknown): messages is PromptMessage[] {
    if (!Array.isArray(messages)) return false;
    return messages.every(message => this.isValidPromptMessage(message));
  }

  /**
   * 개별 메시지 유효성 검사
   */
  private isValidPromptMessage(obj: unknown): obj is PromptMessage {
    if (!this.isObject(obj)) return false;

    const message = obj as Record<string, unknown>;
    const validRoles = ['user', 'assistant', 'system'];

    return (
      validRoles.includes(message.role as string) &&
      this.isObject(message.content) &&
      (message.content as any).type === 'text' &&
      this.isValidString((message.content as any).text)
    );
  }

  /**
   * 인수 배열 유효성 검사
   */
  private isValidArguments(args: unknown): args is PromptArgument[] | undefined {
    if (args === undefined) return true;
    if (!Array.isArray(args)) return false;
    return args.every(arg => this.isValidPromptArgument(arg));
  }

  /**
   * 개별 인수 유효성 검사
   */
  private isValidPromptArgument(obj: unknown): obj is PromptArgument {
    if (!this.isObject(obj)) return false;

    const arg = obj as Record<string, unknown>;
    return (
      this.isValidString(arg.name) &&
      this.isValidString(arg.description) &&
      typeof arg.required === 'boolean'
    );
  }

  /**
   * 객체 타입 검사
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  /**
   * 유효한 문자열 검사
   */
  private isValidString(value: unknown): value is string {
    return typeof value === 'string' && value.trim() !== '';
  }
}
