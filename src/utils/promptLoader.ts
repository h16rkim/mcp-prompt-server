import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import type { PromptTemplate } from '../types.js';

/**
 * Prompt 로더 클래스
 */
export class PromptLoader {
  private promptsDir: string;
  private loadedPrompts: PromptTemplate[] = [];

  constructor(promptsDir: string) {
    this.promptsDir = promptsDir;
  }

  /**
   * prompts 디렉토리에서 모든 미리 설정된 prompt 로드
   */
  async loadPrompts(): Promise<PromptTemplate[]> {
    try {
      // prompts 디렉토리가 존재하는지 확인
      await fs.ensureDir(this.promptsDir);
      
      // prompts 디렉토리의 모든 파일 읽기
      const files = await fs.readdir(this.promptsDir);
      
      // YAML과 JSON 파일만 필터링
      const promptFiles = files.filter(file => 
        file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
      );
      
      // 각 prompt 파일 로드
      const prompts: PromptTemplate[] = [];
      for (const file of promptFiles) {
        const filePath = path.join(this.promptsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        let prompt: unknown;
        if (file.endsWith('.json')) {
          prompt = JSON.parse(content);
        } else {
          // 다른 파일들은 YAML 형식으로 가정
          prompt = YAML.parse(content);
        }
        
        // prompt 유효성 검사
        if (!this.isValidPromptTemplate(prompt)) {
          console.warn(`경고: ${file}의 Prompt 형식이 올바르지 않습니다. 건너뜁니다.`);
          continue;
        }
        
        prompts.push(prompt);
      }
      
      this.loadedPrompts = prompts;
      console.log(`${this.promptsDir}에서 ${prompts.length}개의 prompts를 로드했습니다.`);
      return prompts;
    } catch (error) {
      console.error('prompts 로드 중 오류:', error);
      return [];
    }
  }

  /**
   * 로드된 prompts 반환
   */
  getLoadedPrompts(): PromptTemplate[] {
    return this.loadedPrompts;
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
   * PromptTemplate 유효성 검사
   */
  private isValidPromptTemplate(obj: unknown): obj is PromptTemplate {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const prompt = obj as Record<string, unknown>;

    // name 필드 검사
    if (typeof prompt.name !== 'string' || prompt.name.trim() === '') {
      return false;
    }

    // description 필드 검사
    if (typeof prompt.description !== 'string') {
      return false;
    }

    // messages 필드 검사
    if (!Array.isArray(prompt.messages)) {
      return false;
    }

    // 각 메시지 유효성 검사
    for (const message of prompt.messages) {
      if (!this.isValidPromptMessage(message)) {
        return false;
      }
    }

    // arguments 필드 검사 (선택적)
    if (prompt.arguments !== undefined) {
      if (!Array.isArray(prompt.arguments)) {
        return false;
      }

      for (const arg of prompt.arguments) {
        if (!this.isValidPromptArgument(arg)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * PromptMessage 유효성 검사
   */
  private isValidPromptMessage(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const message = obj as Record<string, unknown>;

    // role 필드 검사
    if (!['user', 'assistant', 'system'].includes(message.role as string)) {
      return false;
    }

    // content 필드 검사
    if (typeof message.content !== 'object' || message.content === null) {
      return false;
    }

    const content = message.content as Record<string, unknown>;

    // content.type과 content.text 검사
    return content.type === 'text' && typeof content.text === 'string';
  }

  /**
   * PromptArgument 유효성 검사
   */
  private isValidPromptArgument(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const arg = obj as Record<string, unknown>;

    return (
      typeof arg.name === 'string' &&
      arg.name.trim() !== '' &&
      typeof arg.description === 'string' &&
      typeof arg.required === 'boolean'
    );
  }
}
