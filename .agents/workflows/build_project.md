# Build Project Workflow

This workflow details how to install dependencies, verify types, and build the **Dandali Connect** Next.js application.

## Prerequisites
- Node.js >= 20 installed (verified with `node --version`).
- On Windows PowerShell, execute npm scripts using `npm.cmd` or standard shell npm.

## Step 1: Install Dependencies
Install all npm packages required for the project:
```bash
npm install
```

## Step 2: Typecheck Code
Run TypeScript static analysis to verify types across the codebase:
```bash
npm run typecheck
```

## Step 3: Build Web Application
Compile and build the Next.js production bundle:
```bash
npm run build
```
