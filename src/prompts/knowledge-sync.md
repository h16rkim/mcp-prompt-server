## Goal

- Register the current directory in the knowledge tool with the latest state.
- If the current directory is already registered in knowledge, update it with the current code state; if not, add it to knowledge.
- If the current directory is a Kotlin/Typescript multi-module/monorepo repository, do not register the entire module root in knowledge; instead, register each child module individually.
- If additional information is required for knowledge registration, ask the user for that value and then update it using their response.
- Include files to knowledge with following rules
  - Include: `**/*.kt, **/*.java, **/*.ts, **/*.md`
  - Exclude: `target/**, dist/**`
- Knowledge Type
  - `Fast`
- Knowledge Name
  - If current directory is multi-module/monorepo repository, use root module name + sub directory name (ex. root directory: `kotlin-multiplatform-sample`, sub directory: `app`, knowledge name: `kotlin-multiplatform-sample-app`)
  - If current directory is not multi-module/monorepo repository, use directory name (ex. `kotlin-multiplatform-sample`, knowledge name: `kotlin-multiplatform-sample`)
- Always respond to the user in Korean.
