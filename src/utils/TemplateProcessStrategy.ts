import Handlebars from 'handlebars';
import type { ArgumentsType } from '../types.js';
import { Logger } from './Logger.js';
import {MARKDOWN_KEYWORDS} from "../config/constants";

/**
 * 템플릿 처리 인터페이스
 */
export interface TemplateProcessStrategy {
  shouldHandle(template: string): boolean;
  renderTemplate(template: string, args: ArgumentsType): string;
}

/**
 * Handlebars 템플릿 처리 전용 클래스
 * Handlebars 엔진을 사용한 템플릿 렌더링을 담당
 */
export class HandlebarTemplateProcessStrategy implements TemplateProcessStrategy {
  private handlebarsInstance: typeof Handlebars;

  constructor() {
    this.handlebarsInstance = Handlebars.create();
    this.initializeHandlebars();
  }

  /**
   * Handlebars 템플릿을 처리해야 하는지 확인
   */
  shouldHandle(): boolean {
    return true; // 기본 처리기로 항상 처리
  }

  /**
   * Handlebars 인스턴스 초기화 및 Helper 함수 등록
   */
  private initializeHandlebars(): void {

    // Custom helper 함수들 등록
    this.registerCustomHelpers();

    Logger.info('Handlebars 템플릿 엔진이 초기화되었습니다.');
  }

  /**
   * Custom Helper 함수들을 등록
   */
  private registerCustomHelpers(): void {
    // eq helper: 두 값이 같은지 비교
    this.handlebarsInstance.registerHelper('eq', function (this: any, a: any, b: any, options: Handlebars.HelperOptions) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    // eqIgnoreCase helper: 두 값이 같은지 비교
    this.handlebarsInstance.registerHelper('eqIgnoreCase', function (this: any, a: any, b: any, options: Handlebars.HelperOptions) {
      return a.toLowerCase() === b.toLowerCase() ? options.fn(this) : options.inverse(this);
    });

    // neq helper: 두 값이 다른지 비교
    this.handlebarsInstance.registerHelper('neq', function (this: any, a: any, b: any, options: Handlebars.HelperOptions) {
      return a !== b ? options.fn(this) : options.inverse(this);
    });

    // in helper: 값이 배열에 포함되어 있는지 확인
    this.handlebarsInstance.registerHelper('in', function (this: any, val: any, arrString: any[], options: Handlebars.HelperOptions) {
      const array = Array.isArray(arrString) ? arrString : JSON.parse(arrString)
      return array.includes(val) ? options.fn(this) : options.inverse(this);
    });

    // inIgnoreCase helper: 값이 배열에 포함되어 있는지 확인
    this.handlebarsInstance.registerHelper('inIgnoreCase', function (this: any, val: any, arrString: any[], options: Handlebars.HelperOptions) {
      const array = Array.isArray(arrString) ? arrString : JSON.parse(arrString)
      const ignoreCaseArray = array.map((it: string) => it.toLowerCase())
      return ignoreCaseArray.includes(val.toString().toLowerCase()) ? options.fn(this) : options.inverse(this);
    });

    // startsWith helper: 문자열이 특정 문자열로 시작하는지 확인
    this.handlebarsInstance.registerHelper('startsWith', function (this: any, str: any, prefix: any, options: Handlebars.HelperOptions) {
      if (typeof str !== 'string' || typeof prefix !== 'string') {
        return options.inverse(this);
      }
      return str.startsWith(prefix) ? options.fn(this) : options.inverse(this);
    });

    // {{{{raw}}}} {{{{/raw}}}} 로 감싸면 문자 그대로 출력됨
    this.handlebarsInstance.registerHelper('raw', function(options) {
      return options.fn();
    });

    Logger.info('Handlebars custom helper 함수들이 등록되었습니다: eq, neq, in, startsWith');
  }

  /**
   * Handlebars를 사용하여 템플릿 렌더링
   * @param template 템플릿 문자열
   * @param args 템플릿 변수들
   * @returns 렌더링된 문자열
   */
  renderTemplate(template: string, args: ArgumentsType): string {
    try {
      if (!template || typeof template !== 'string') {
        throw new Error('템플릿이 유효하지 않습니다. 문자열이어야 합니다.');
      }

      const compiledTemplate = this.handlebarsInstance.compile(template);
      const result = compiledTemplate(args || {});
      
      Logger.info(`템플릿 렌더링 성공: ${template.length}자 템플릿, ${Object.keys(args || {}).length}개 변수`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Handlebars 템플릿 렌더링 오류: ${errorMessage} - 템플릿: ${template?.substring(0, 100) + (template?.length > 100 ? '...' : '')}, 변수: [${Object.keys(args || {}).join(', ')}]`);
      throw new Error(`템플릿 렌더링 실패: ${errorMessage}`);
    }
  }
}


/**
 * Markdown 템플릿 처리 클래스
 * $ARGUMENTS 키워드를 감지하고 첫 번째 인자로 대체
 */
export class MarkdownTemplateProcessStrategy implements TemplateProcessStrategy {
  /**
   * $ARGUMENTS 키워드가 있는 템플릿을 처리해야 하는지 확인
   */
  shouldHandle(template: string): boolean {
    return template.includes(MARKDOWN_KEYWORDS.ARGUMENTS);
  }

  /**
   * $ARGUMENTS를 첫 번째 인자로 대체하여 템플릿 렌더링
   */
  renderTemplate(template: string, args: ArgumentsType): string {
    try {
      const argumentsValue = args[MARKDOWN_KEYWORDS.ARGUMENTS_KEY] || `${MARKDOWN_KEYWORDS.ARGUMENTS} (The user did not provide input. Ask the user for the value, or infer it and fill it in.)`;
      const result = template.replace(new RegExp(`\\${MARKDOWN_KEYWORDS.ARGUMENTS}`, 'g'), argumentsValue.toString());

      Logger.info(`Markdown 템플릿 렌더링 성공: $ARGUMENTS를 "${argumentsValue}"로 대체`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Markdown 템플릿 렌더링 오류: ${errorMessage}`);
      throw new Error(`Markdown 템플릿 렌더링 실패: ${errorMessage}`);
    }
  }
}
