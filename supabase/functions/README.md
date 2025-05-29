# Supabase Edge Functions

This directory contains Deno-based Edge Functions for the Climate Economy Assistant.

## Environment Setup

These files use **Deno runtime** (not Node.js) and have different import syntax:

- `https://deno.land/std@x.x.x/...` - Deno standard library
- `https://esm.sh/@package/name@version` - NPM packages via ESM.sh

## VS Code Configuration

The following files configure VS Code for proper Deno support:

- `deno.json` - Deno configuration with import maps
- `tsconfig.json` - TypeScript configuration for Deno
- `.vscode/settings.json` - VS Code settings enabling Deno for this folder

## Files

- `_shared/auth-middleware.ts` - Authentication middleware
- `enhanced-agent-response/index.ts` - Enhanced LangGraph agent
- `langgraph-agent-response/index.ts` - Basic LangGraph agent  
- `langgraph-process-resume/index.ts` - Resume processing function

## Note

These files are excluded from the main project's TypeScript checking to prevent conflicts between Node.js and Deno environments. 