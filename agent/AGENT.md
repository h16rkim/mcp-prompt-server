# AGENT.md

This file provides guidance to AI assistants (Claude Code, Cursor, Windsurf, etc.) when working with code in this repository.

## Development Commands

### Building and Running
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run clean` - Remove compiled output directory
- `npm start` - Run the compiled server from dist/
- `npm run dev` - Development mode with auto-restart on file changes
- `npm run postbuild` - Copy prompt files to dist/ (runs automatically after build)

### Dependencies
- `npm install` - Install all dependencies

## Code Architecture

This is a TypeScript-based MCP (Model Context Protocol) server that provides prompt templates as tools to AI code editors like Cursor and Windsurf.

### Core Architecture

The server follows a modular TypeScript architecture:

1. **McpPromptServer** (`src/server/McpPromptServer.ts`) - Main server class that:
   - Registers YAML/JSON prompt templates as MCP tools (not prompts)
   - Handles dynamic parameter substitution with `{{parameter}}` syntax
   - Provides management tools (reload_prompts, get_prompt_names, get_prompt_info)
   - Uses Zod schemas for runtime type validation

2. **PromptLoader** (`src/utils/promptLoader.ts`) - Handles:
   - Loading and parsing YAML/JSON prompt templates from `src/prompts/`
   - Template validation with comprehensive type checking
   - Hot-reloading of prompt templates

3. **TemplateProcessor** (`src/utils/templateProcessor.ts`) - Processes:
   - Parameter substitution in prompt templates
   - Template validation and error handling

### Key Design Decisions

- **Tools vs Prompts**: Templates are exposed as MCP tools rather than prompts for better editor integration
- **TypeScript**: Full type safety with strict compiler settings and readonly interfaces
- **Dynamic Loading**: Prompts can be reloaded without server restart
- **YAML-first**: Templates are primarily YAML with JSON support

### Prompt Template Structure

Templates in `src/prompts/` follow this structure:
```yaml
name: unique_identifier
description: Korean description
arguments:
  - name: param_name
    description: Korean description  
    required: true/false
messages:
  - role: user
    content:
      type: text
      text: |
        Template content with {{param_name}} placeholders
```

### Type System

- All interfaces are readonly for immutability
- Strict TypeScript configuration with comprehensive null checks
- Zod for runtime validation of dynamic content
- MCP SDK compatibility with proper type annotations

### Build Process

1. TypeScript compilation to `dist/`
2. Automatic copying of prompt files via `scripts/copy-prompts.cjs`
3. ES modules with Node.js compatibility layer

### Server Integration

The server communicates via stdio transport with MCP clients and automatically loads all templates from `src/prompts/` as callable tools with parameter validation.