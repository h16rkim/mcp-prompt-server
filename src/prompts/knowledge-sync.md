## Goal

*	Register the current directory in the knowledge tool with the latest state.
  *	If the current directory is already registered in knowledge, update it with the current code state; if not, add it to knowledge.
  *	If the current directory is a Kotlin/Typescript multi-module/monorepo repository, do not register the entire module root in knowledge; instead, register each child module individually.
  *	If additional information is required for knowledge registration, ask the user for that value and then update it using their response.
*	Always respond to the user in Korean.
