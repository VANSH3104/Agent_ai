# Agent AI - Intelligent Workflow Builder

Agent AI is a powerful, visual workflow automation platform designed to help you build, deploy, and manage intelligent agents. With a drag-and-drop interface, you can connect various services, integrate AI capabilities, and automate complex logic without writing extensive code.

## 🚀 Features

- **Visual Workflow Builder**: Intuitive node-based editor to design your agent's logic.
- **AI-Powered**: Integrate with advanced LLMs to process text, generate content, and make decisions.
- **Robust Integrations**:
  - **Communication**: Discord, Slack, Email.
  - **Productivity**: Google Sheets, Google Forms.
  - **Data**: Database (PostgreSQL/Neon) support for querying and manipulation.
- **Core Logic Nodes**:
  - **Webhooks**: Trigger workflows from external events.
  - **HTTP Requests**: Make API calls to any service.
  - **Code Execution**: Run custom JavaScript/TypeScript code.
  - **Logic Control**: Conditions, Filters, and Scheduling.
- **Real-time Processing**: Built on Kafka for reliable, high-throughput event handling.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Database**: PostgreSQL (via [Neon](https://neon.tech/)), Drizzle ORM
- **Authentication**: Better Auth
- **Event Streaming**: Apache Kafka
- **State Management**: Jotai, React Query

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)
- A [Neon](https://neon.tech/) database account (or any PostgreSQL instance)
- A Kafka broker (local or hosted, e.g., Upstash)

## 🔧 Environment Variables

Create a `.env` file in the root directory and add the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/dbname"

# Authentication (Better Auth)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
BETTER_AUTH_SECRET="your_auth_secret"

# Kafka
KAFKA_BROKERS="broker1:port,broker2:port"
# KAFKA_USERNAME="your_username" # If using SASL
# KAFKA_PASSWORD="your_password" # If using SASL

# Other integrations (as needed)
# DISCORD_TOKEN=...
# SLACK_TOKEN=...
# OPENAI_API_KEY=...
```

## ⚡ Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/agent-ai.git
    cd agent-ai
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up the database:**

    Make sure your `.env` is configured, then push the schema:

    ```bash
    npm run db:push
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📦 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs lints.
- `npm run db:push`: Pushes Drizzle schema changes to the database.
- `npm run db:studio`: Opens Drizzle Studio to view your data.

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
