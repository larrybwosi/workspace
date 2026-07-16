import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

@Injectable()
export class McpService {
  private server: Server;
  private docsPath: string;
  private apiDocsPath: string;
  private openApiSchemaPath: string;

  constructor() {
    this.server = new Server(
      {
        name: 'skyrme-docs-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Paths relative to apps/api
    this.docsPath = path.resolve(process.cwd(), '../v3-docs/src/content/docs');
    this.apiDocsPath = path.resolve(process.cwd(), '../v3-docs/src/content/api');
    this.openApiSchemaPath = path.resolve(process.cwd(), '../v3-docs/src/content/openapi.json');

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [];

      // Add Markdown docs
      const docFiles = await this.getMarkdownFiles(this.docsPath);
      for (const file of docFiles) {
        resources.push({
          uri: `docs://user/${file}`,
          name: `User Doc: ${file}`,
          mimeType: 'text/markdown',
        });
      }

      // Add API docs
      const apiDocFiles = await this.getMarkdownFiles(this.apiDocsPath);
      for (const file of apiDocFiles) {
        resources.push({
          uri: `docs://api/${file}`,
          name: `API Doc: ${file}`,
          mimeType: 'text/markdown',
        });
      }

      // Add OpenAPI schema
      resources.push({
        uri: 'docs://api/openapi.json',
        name: 'OpenAPI Specification',
        mimeType: 'application/json',
      });

      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = new URL(request.params.uri);
      let content = '';
      let mimeType = 'text/markdown';

      if (uri.protocol === 'docs:') {
        const type = uri.host;
        const filePath = uri.pathname.startsWith('/') ? uri.pathname.slice(1) : uri.pathname;

        if (type === 'user') {
          content = await fs.readFile(path.join(this.docsPath, filePath), 'utf-8');
        } else if (type === 'api') {
          if (filePath === 'openapi.json') {
            content = await fs.readFile(this.openApiSchemaPath, 'utf-8');
            mimeType = 'application/json';
          } else {
            content = await fs.readFile(path.join(this.apiDocsPath, filePath), 'utf-8');
          }
        }
      }

      if (!content) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }

      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType,
            text: content,
          },
        ],
      };
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_docs',
            description: 'Search through the documentation for specific keywords',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'The search query' },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_api_schema',
            description: 'Get the full OpenAPI schema for the Skyrme Chat API',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'search_docs') {
        const { query } = request.params.arguments as { query: string };
        const results = await this.searchDocs(query);
        return {
          content: [{ type: 'text', text: results }],
        };
      }

      if (request.params.name === 'get_api_schema') {
        const content = await fs.readFile(this.openApiSchemaPath, 'utf-8');
        return {
          content: [{ type: 'text', text: content }],
        };
      }

      throw new Error(`Tool not found: ${request.params.name}`);
    });
  }

  private async getMarkdownFiles(dir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dir);
      return files.filter(f => f.endsWith('.md'));
    } catch (e) {
      return [];
    }
  }

  private async searchDocs(query: string): Promise<string> {
    const results: string[] = [];
    const searchInDir = async (dir: string, prefix: string) => {
      const files = await this.getMarkdownFiles(dir);
      for (const file of files) {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push(`- [${prefix}/${file}](docs://${prefix}/${file})`);
        }
      }
    };

    await searchInDir(this.docsPath, 'user');
    await searchInDir(this.apiDocsPath, 'api');

    if (results.length === 0) {
      return `No documentation found for query: "${query}"`;
    }

    return `Found ${results.length} documentation pages for "${query}":\n\n${results.join('\n')}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Skyrme MCP Server running on stdio');
  }
}
