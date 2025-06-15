import path from 'path';
import { fileURLToPath } from 'url';
import { ParseStrategyFactory } from './parseStrategies.js';

/**
 * 파일 관련 유틸리티 함수들
 */
export class FileUtils {
  /**
   * 현재 모듈의 디렉토리 경로를 반환
   */
  static getCurrentDirectory(importMetaUrl: string): string {
    const filename = fileURLToPath(importMetaUrl);
    return path.dirname(filename);
  }

  /**
   * 지원되는 prompt 파일인지 확인
   */
  static isSupportedPromptFile(filename: string): boolean {
    const supportedExtensions = ParseStrategyFactory.getSupportedExtensions();
    return supportedExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * 파일 확장자에 따라 파싱 방법 결정
   * @deprecated Strategy Pattern을 사용하세요
   */
  static isJsonFile(filename: string): boolean {
    return filename.endsWith('.json');
  }

  /**
   * 파일 목록에서 지원되는 prompt 파일만 필터링
   */
  static filterPromptFiles(files: string[]): string[] {
    return files.filter(this.isSupportedPromptFile);
  }
}
