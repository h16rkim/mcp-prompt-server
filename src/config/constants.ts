/**
 * 애플리케이션 상수 정의
 */

export const SERVER_CONFIG = {
  name: 'mcp-prompt-server',
  version: '1.0.0',
} as const;

export const DEFAULT_MESSAGES = {
  SERVER_STARTING: 'MCP Prompt Server를 시작합니다...',
  SERVER_RUNNING: 'MCP Prompt Server가 실행 중입니다...',
  SERVER_SHUTDOWN: '서버를 종료합니다...',
  PROMPTS_LOADED: (count: number) => `${count}개의 prompts가 로드되었습니다.`,
  PROMPTS_REGISTERED: (count: number) => `${count}개의 prompts를 MCP prompts로 등록했습니다.`,
  MANAGEMENT_TOOLS_REGISTERED: '관리 도구들을 등록했습니다.',
  PROMPTS_RELOADED: (count: number) => `${count}개의 prompts를 성공적으로 다시 로드했습니다.`,
  AVAILABLE_PROMPTS: (count: number, names: string[]) => 
    `사용 가능한 prompts (${count}개):\n${names.join('\n')}`,
} as const;

export const ERROR_MESSAGES = {
  SERVER_START_FAILED: '서버 시작 실패:',
  PROMPTS_LOAD_FAILED: 'prompts 로드 중 오류:',
  PROMPTS_RELOAD_FAILED: (error: string) => `Prompts 로드 중 오류가 발생했습니다: ${error}`,
  PROMPT_NOT_FOUND: (name: string) => `'${name}' 이름의 prompt를 찾을 수 없습니다.`,
  TEMPLATE_PROCESSING_ERROR: (errors: string[], missingArgs: string[]) =>
    `템플릿 처리 오류: ${errors.join(', ')}. 누락된 필수 인수: ${missingArgs.join(', ')}`,
  INVALID_PROMPT_FORMAT: (file: string) => `경고: ${file}의 Prompt 형식이 올바르지 않습니다. 건너뜁니다.`,
  UNCAUGHT_EXCEPTION: '처리되지 않은 예외:',
  UNHANDLED_REJECTION: '처리되지 않은 Promise 거부:',
} as const;

export const TOOL_NAMES = {
  RELOAD_PROMPTS: 'reload_prompts',
  GET_PROMPT_NAMES: 'get_prompt_names',
  GET_PROMPT_INFO: 'get_prompt_info',
} as const;

export const TOOL_DESCRIPTIONS = {
  RELOAD_PROMPTS: 'Reload all prompt templates',
  GET_PROMPT_NAMES: 'Get list of all available prompt names',
  GET_PROMPT_INFO: 'Get detailed information about a specific prompt',
} as const;
