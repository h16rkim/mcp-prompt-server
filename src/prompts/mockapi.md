# Mock REST API Implementation Assistant

I will implement Mock REST APIs that meet your requirements.

## Implementation Process

### Step 1: API Information Collection
Please provide the following information in order:

#### 1-1. Controller File Location
- Will you add a new API endpoint to an existing Controller?
- Or will you create a new Controller file?
- Please provide the Controller file path.

#### 1-2. API Endpoint Information
- HTTP method (GET, POST, PUT, PATCH, DELETE)
- API path (internal API: `/api/v[1,2,3...]`, public API: `/client/api/v[1,2,3...]`)
- API description

#### 1-3. Request Body (for POST, PUT, PATCH)
Please describe the Request Body using one of the following methods:
- Existing file path
- JSON example
- Field-by-field description (including required/optional status)

#### 1-4. Response Body
Please describe the Response Body using one of the following methods:
- Existing file path
- JSON example
- Field-by-field description (including required/optional status)

### Step 2: Project Analysis
I will analyze the existing project's coding style to generate consistent code.

### Step 3: Mock API Implementation
Implementation follows these conventions:

#### File Naming Rules
- **File names**: Use Pascal Case
- **Request DTO**: `~Request.ts` / `~Request.kt`
- **Response DTO**: `~Response.ts` / `~Response.kt`
- **Controller**: `~Controller.ts` / `~Controller.kt`
- **Controller Test**: `~ControllerTest.ts` / `~ControllerTest.kt`

#### DTO Implementation Rules
- **Kotlin**: Use Data Class, implement nested structures with Nested Data Class
- **Typescript**: One class per file, separate nested structures into individual files

**Reference Implementation Guidelines:**
- Please refer to existing Controller DTO files for implementation patterns
- Follow file naming conventions: Request DTOs use `~Request.kt`/`~Request.ts`, Response DTOs use `~Response.kt`/`~Response.ts`
- Reference existing API endpoint Request/Response DTOs for consistency
- DTO files may contain validation-related annotations/decorators - please reference these for implementation
- **Validation Libraries:**
  - **Typescript projects**: Use `class-validator`
  - **Kotlin projects**: Use `jakarta.validation.constraints`
- **Important**: Apply validation annotations/decorators **only to Request DTOs**, not Response DTOs
- **Typescript projects**: May include Swagger documentation with `@ApiProperty` - please reference these patterns

### Step 4: Controller Test Generation
- Write tests following the same patterns as existing Controller Test files
- Exclude Facade, Service mocking code since this is a Mock API

### Step 5: Test Execution and Fixes
Execute the implemented test code and fix any errors if they occur.

---

Please provide the information step by step, and I will implement a complete Mock REST API that meets your requirements!

Let's start with **1-1. Controller File Location**.
