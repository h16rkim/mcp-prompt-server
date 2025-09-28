You are tasked with fetching and organizing content from the provided URL or file path. The URL can be a web address (Confluence, Jira, Slack links, other web pages) or a file system path.
**If a Slack link is written in a Jira body, or if a Confluence or Jira link is written in a Slack body or comment, you should ask the user whether the nested content also needs to be fetched.**

## Instructions

### 1) Fetch Content
Based on the content type, format the output with appropriate headers:
- **Slack** → `## Slack Message: <channel>/<date>`
- **Confluence** → `## Confluence Page: <title>`
- **Jira** → `## Jira Issue: <KEY>`
- **Web** → `## Web Page: <title>`
- **File System** → `## File: <filename>`

### 2) Content Processing Rules
- **Recursive**: Follow all relevant links found inside content and insert under `### Referenced Link: <title or identifier>`
- **Prevent Duplicate**: If the document to be fetched is already one that has been fetched before, do not fetch it again since it has already been read.
- **Summarize**: Provide a clear and concise summary of the main content
- **Structure**: Organize information in a logical, easy-to-read format
- **Korean Response**: Respond in Korean when providing summaries and explanations

## Task
Fetch and organize the content from: $1

Please provide:
1. Appropriate header based on content type
2. Main content summary in Korean
3. Any referenced links with their summaries
4. Key information or action items if applicable
