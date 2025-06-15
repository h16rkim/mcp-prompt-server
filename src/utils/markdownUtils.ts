/**
 * Markdown 파싱 관련 유틸리티 함수들
 */
export class MarkdownUtils {
  /**
   * 파일명에서 확장자를 제거하고 name 추출
   * @param filename 파일명
   * @returns 확장자를 제거한 파일명
   */
  static extractNameFromFilename(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
  }

  /**
   * Markdown 내용에서 첫 번째 문장을 추출하여 description으로 사용
   * @param content Markdown 파일 내용
   * @param fallbackName description 추출 실패 시 사용할 fallback 이름
   * @returns 추출된 description
   */
  static extractDescription(content: string, fallbackName: string): string {
    try {
      // 줄 단위로 분할
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 빈 줄 건너뛰기
        if (!trimmedLine) {
          continue;
        }
        
        // Markdown 형식 제거하고 텍스트만 추출
        const cleanText = this.cleanMarkdownFormatting(trimmedLine);
        
        // 의미 있는 텍스트가 있으면 반환
        if (cleanText && cleanText.length > 0) {
          return cleanText;
        }
      }
      
      // 추출할 수 있는 텍스트가 없으면 fallback 사용
      return fallbackName;
    } catch (error) {
      // 파싱 중 오류 발생 시 fallback 사용
      return fallbackName;
    }
  }

  /**
   * Markdown 형식 문자들을 제거하고 순수 텍스트만 추출
   * @param text Markdown 형식이 포함된 텍스트
   * @returns 정리된 텍스트
   */
  private static cleanMarkdownFormatting(text: string): string {
    return text
      // 헤더 마크다운 제거 (# ## ### 등)
      .replace(/^#+\s*/, '')
      // 볼드/이탤릭 마크다운 제거 (**text**, *text*, __text__, _text_)
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // 인라인 코드 마크다운 제거 (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // 링크 마크다운 제거 ([text](url))
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 이미지 마크다운 제거 (![alt](url))
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // 리스트 마커 제거 (-, *, +, 1., 2. 등)
      .replace(/^[\s]*[-*+]\s+/, '')
      .replace(/^[\s]*\d+\.\s+/, '')
      // 인용 마크다운 제거 (>)
      .replace(/^>\s*/, '')
      // 여러 공백을 하나로 정리
      .replace(/\s+/g, ' ')
      // 앞뒤 공백 제거
      .trim();
  }

  /**
   * Markdown 내용 전체를 메시지 텍스트로 사용
   * @param content Markdown 파일 내용
   * @returns 메시지로 사용할 텍스트
   */
  static extractMessageText(content: string): string {
    // Markdown 내용을 그대로 사용 (형식 유지)
    return content.trim();
  }
}
