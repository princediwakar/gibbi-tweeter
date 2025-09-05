# Multi-Account AI Twitter Bot with Threading System 🚀

**⚡ PRODUCTION-READY** - A scalable Next.js application that supports unlimited Twitter accounts with AI-powered content generation, featuring account isolation, custom personas, automated posting, and a complete threading system for engaging storytelling.

> **🎯 MISSION**: Production-grade multi-account Twitter automation system supporting educational content (@gibbiai), personal branding with deep storytelling (@princediwakar25), and unlimited additional accounts with complete data isolation and custom configurations.

## Project Overview

This is an AI-powered multi-account Twitter automation system built with Next.js 15, TypeScript, and Tailwind CSS. The app supports unlimited Twitter accounts with complete isolation, custom AI personas, configurable posting schedules, and account-specific content strategies. A key feature is the advanced threading system that allows for creating and posting tweet threads with proper reply-chain management, enabling rich narrative content.

## Tech Stack

  - **Framework**: Next.js 15 (App Router)
  - **Language**: TypeScript 
  - **Styling**: Tailwind CSS + shadcn/ui components
  - **AI**: OpenAI API (configurable to use DeepSeek)
  - **Social Media**: Twitter API v2 with OAuth 1.0a
  - **Scheduling**: External cron service for automated posting (5-minute frequency)
  - **Data Storage**: Neon PostgreSQL database
  - **Multi-Account**: Account isolation with encrypted credential storage
  - **Configuration**: File-based persona and schedule management

## Key Features

### 🚀 Multi-Account Architecture

  - **Unlimited Accounts**: Support for any number of Twitter accounts with complete isolation.
  - **Account-Specific Credentials**: Encrypted storage of Twitter API keys per account.
  - **Custom Personas**: Each account can have its own set of AI personas with unique characteristics.
  - **Isolated Data**: Complete separation of tweets, threads, schedules, and configurations per account.
  - **Individual Rate Limiting**: Per-account posting limits and error handling.

### 🧵 Complete Threading System

  - **5-Minute Cron Frequency**: Enables rapid and consistent thread posting.
  - **Proper Reply Chain Management**: Ensures threads are posted as a valid reply chain.
  - **Parent Tweet Tracking**: Database schema supports tracking parent tweets for reply chains.
  - **Content Priority System**: Prioritizes posting active threads over single tweets.
  - **Smart Template Selection**: Algorithm for selecting story templates for thread generation.
  - **Thread Metadata**: Generation and storage of thread metadata like title, persona, and status.

### 🤖 Dynamic Persona System

  - **English Learning Account (@gibbiai)**:
      - **Vocabulary Builder** 🏆, **Grammar Master** 📚, **Communication Expert** 🗣️.
  - **Personal Account (@princediwakar25)**:
      - **Business Storyteller** 📈: Creates compelling threads about Indian business stories.
      - **Satirist** 😏: Posts single tweets with humor and satire about startup/business culture.
  - **Extensible Design**: Easy addition of new personas and account types.

### ⚡ AI Content Generation Engine

  - **Account-Specific Generation**: Custom prompts and styles per account.
  - **Dynamic Hashtag Systems**: Account-specific hashtag strategies.
  - **Content Type Variety**: Threads, single tweets, educational, professional, and satirical content.
  - **Quality Scoring**: AI-powered content quality assessment.
  - **Template-Based Prompts**: Configurable prompt templates per persona.

### 🕒 Advanced Scheduling & Automation

  - **Multi-Account Processing**: Simultaneous handling of all active accounts.
  - **Custom Schedules**: Account-specific posting times and frequencies.
  - **Smart Distribution**: Intelligent persona rotation and content variety.
  - **Error Recovery**: Individual account failure handling without affecting others.
  - **Account Health Checks**: Automated credential validation and account status monitoring.


## MCP Servers

This project utilizes MCP (Multi-Connect Proxy) servers for development, particularly for interacting with services like Playwright and Neon through the Gemini CLI.

### 1\. Starting the MCP Servers

First, start the required MCP servers in separate terminal windows. They will run as background processes.

  - **Neon**: For connecting to the Neon database.

      - **Command**: `npx -y mcp-remote@latest https://mcp.neon.tech/mcp`

  - **Playwright**: For browser automation and testing.

      - **Command**: `npx @playwright/mcp`

When you run these commands, they will output the local proxy URL, which you'll need for the next step. For example, Neon might output `Proxy listening on http://localhost:53210`.

### 2\. Configuring Gemini CLI

To use these servers with the Gemini CLI, you need to add their proxy URLs to the Gemini settings file.

1.  **Locate or create the settings file**: The configuration is stored in `~/.gemini/settings.json`. If this file or directory doesn't exist, create it.

2.  **Add server configurations**: Open the file and add the server names and their corresponding proxy URLs from the previous step. The file should look like this:

    ```json
    {
      "servers": {
        "neon": "http://localhost:53210",
        "playwright": "http://localhost:53211"
      }
    }
    ```

    > **Note**: Replace `http://localhost:53210` and `http://localhost:53211` with the actual URLs provided by the MCP commands when you start them.

### 3\. Using MCP Servers with Gemini CLI

Once configured, you can route commands through a specific MCP server by prefixing your Gemini command with the server name followed by `/`.

  - **Example with Neon**: To run a `psql` command through the Neon MCP server, use:

    ```bash
    gemini neon/ psql -U <user> -h <host> -d <database>
    ```

    This command securely tunnels your `psql` connection through the Neon proxy.

  - **Example with Playwright**: To run a test script using Playwright through its MCP server:

    ```bash
    gemini playwright/ npx playwright test
    ```

## Development Commands

```bash
npm run dev        # Start development server (with Turbopack)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### ⚠️ IMPORTANT: Pre-Commit Requirements

**ALWAYS run the build before committing and pushing:**

```bash
npm run build      # Must pass before committing
npm run lint       # Must pass before committing
git add .
git commit -m "Your commit message"
git push
```

-----

