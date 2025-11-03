# Support Triage Bot

## Description

This project is a Support Triage Bot built with Mastra. It analyzes support messages, detects keywords, and assigns a priority level to the message. This helps support teams to quickly identify and address urgent issues.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Nabil201-ctrl/Support-Triage-Bot-.git
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

To start the development server, run the following command:

```bash
npm run dev
```

This will start the Mastra server and you can interact with the bot through the API.

## Workflow

The core logic of the bot is defined in the `src/mastra/workflow/triageworkflow.ts` file. The workflow consists of the following steps:

1. **Detect Keywords**: This step analyzes the support message and detects keywords that indicate the priority of the message. The keywords are categorized into high, medium, and low priority.

2. **Format Triage Response**: This step formats the triage response in a JSON format that can be easily integrated with other systems, such as Telex.

The `KeywordWorkflow` and `formatWorkflow` are exported, and can be used in agents or other workflows.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the ISC License.
