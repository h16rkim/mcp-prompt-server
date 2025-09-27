import YAML from 'yaml';
import { MarkdownUtils } from './MarkdownUtils.js';
import { MARKDOWN_KEYWORDS } from '../config/constants.js';
import type { PromptTemplate } from '../types.js';

/**
 * 파일 파싱 전략 인터페이스
 */
export interface ParseStrategy {
  /**
   * 파일 내용을 파싱하여 객체로 변환
   * @param content 파일 내용
   * @param filename 파일명 (Markdown 파싱 시 필요)
   * @returns 파싱된 객체
   */
  parse(content: string, filename?: string): unknown;

  /**
   * 해당 전략이 지원하는 파일 확장자들
   */
  getSupportedExtensions(): readonly string[];
}

/**
 * JSON 파싱 전략
 */
export class JsonParseStrategy implements ParseStrategy {
  parse(content: string): unknown {
    return JSON.parse(content);
  }

  getSupportedExtensions(): readonly string[] {
    return ['.json'];
  }
}

/**
 * YAML 파싱 전략
 */
export class YamlParseStrategy implements ParseStrategy {
  parse(content: string): unknown {
    return YAML.parse(content);
  }

  getSupportedExtensions(): readonly string[] {
    return ['.yaml', '.yml'];
  }
}

/**
 * Markdown 파싱 전략
 */
export class MarkdownParseStrategy implements ParseStrategy {
  parse(content: string, filename?: string): unknown {
    if (!filename) {
      throw new Error('Markdown 파싱에는 파일명이 필요합니다.');
    }

    const name = MarkdownUtils.extractNameFromFilename(filename);
    const description = MarkdownUtils.extractDescription(content, name);
    const messageText = MarkdownUtils.extractMessageText(content);

    // $ARGUMENTS 키워드 확인
    const hasArguments = content.includes(MARKDOWN_KEYWORDS.ARGUMENTS);
    const args = hasArguments ? [
      {
        name: MARKDOWN_KEYWORDS.ARGUMENTS_KEY,
        description: 'Arguments for the prompt',
        required: false
      }
    ] : [];

    const promptTemplate: PromptTemplate = {
      name,
      description,
      arguments: args,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: messageText
          }
        }
      ]
    };

    return promptTemplate;
  }

  getSupportedExtensions(): readonly string[] {
    return ['.md', '.markdown'];
  }
}

/**
 * 파싱 전략 팩토리
 * 파일 확장자에 따라 적절한 파싱 전략을 반환
 */
export class ParseStrategyFactory {
  private static readonly strategies: ParseStrategy[] = [
    new JsonParseStrategy(),
    new YamlParseStrategy(),
    new MarkdownParseStrategy(), // Markdown 지원 활성화
  ];

  /**
   * 파일 확장자에 맞는 파싱 전략 반환
   * @param filename 파일명
   * @returns 파싱 전략 또는 null
   */
  static getStrategy(filename: string): ParseStrategy | null {
    const extension = this.getFileExtension(filename);
    
    return this.strategies.find(strategy => 
      strategy.getSupportedExtensions().includes(extension)
    ) || null;
  }

  /**
   * 지원되는 모든 파일 확장자 반환
   */
  static getSupportedExtensions(): string[] {
    return this.strategies.flatMap(strategy => 
      [...strategy.getSupportedExtensions()]
    );
  }

  /**
   * 새로운 파싱 전략 등록
   * @param strategy 등록할 파싱 전략
   */
  static registerStrategy(strategy: ParseStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 파일명에서 확장자 추출
   */
  private static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex).toLowerCase();
  }
}
