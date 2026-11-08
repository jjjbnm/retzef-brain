# Retzef Brain

Retzef Brain is the home of Retzef's experimental language models and model-independent plugin orchestration.

Production: https://retzef-brain.vercel.app

## Retzef Code
The first Code Intelligence layer is available through `POST /api/code-tools`.
Actions:
- `analyze`: source-level diagnostics, severity counts, and line/column locations.
- `explain`: a compact source overview with diagnostics.
- `test-plan`: suggested test cases based on the source.
- `project-plan`: a structured multi-file implementation plan.

Initial language detection: JavaScript, TypeScript, Python, HTML, CSS, Java, C++, and C#.
This layer performs static pattern checks and planning only. It does not compile or execute user code, automatically edit repositories, or replace a full compiler/security review.

## Plugin system
- `GET /api/plugins`: list registered Retzef plugins.
- `POST /api/plugin-run`: run an allowlisted plugin with JSON input.
- `/plugins.html`: mobile-friendly plugin center.
- Built-ins: calculator, text analyzer, JSON formatter, and plugin draft builder.
- Drafts are metadata only and never execute automatically.
- The orchestration engine accepts structured `toolCalls` from compatible model adapters. Current tiny text models still return plain text, so they do not yet autonomously choose plugins.

## API
- `GET /api/health`
- `GET /api/models`
- `POST /api/chat`
- `GET /api/code-tools`
- `POST /api/code-tools`

## Limitations
The experimental N-gram/Neural/Subword models are small research prototypes, not Codex-level coding models. Serverless memory is temporary. Plugin execution remains server-side and allowlisted.
