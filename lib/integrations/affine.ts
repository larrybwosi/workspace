import { prisma } from "../db/prisma";

export interface AffineConfig {
  apiToken: string;
  workspaceId: string;
  baseUrl?: string;
}

export interface AffineWorkspace {
  id: string;
  name: string;
  avatar?: string;
  owner: string;
  memberCount: number;
}

export interface AffinePage {
  id: string;
  workspaceId: string;
  title: string;
  content?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags?: string[];
}

export interface AffineBlock {
  id: string;
  type: string;
  content: Record<string, any>;
  children?: string[];
}

export const affineUtils = {
  // Get workspace info
  getWorkspace: async (config: AffineConfig) => {
    const baseUrl = config.baseUrl || "https://app.affine.pro/api";
    const response = await fetch(`${baseUrl}/workspace/${config.workspaceId}`, {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Affine API error: ${response.statusText}`);
    }

    return response.json();
  },

  // List pages
  listPages: async (config: AffineConfig, limit = 50, skip = 0) => {
    const baseUrl = config.baseUrl || "https://app.affine.pro/api";
    const response = await fetch(
      `${baseUrl}/workspace/${config.workspaceId}/pages?limit=${limit}&skip=${skip}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Affine API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get page content
  getPage: async (config: AffineConfig, pageId: string) => {
    const baseUrl = config.baseUrl || "https://app.affine.pro/api";
    const response = await fetch(
      `${baseUrl}/workspace/${config.workspaceId}/page/${pageId}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Affine API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Create a page
  createPage: async (
    config: AffineConfig,
    data: {
      title: string;
      content?: string;
      isPublic?: boolean;
      tags?: string[];
    },
  ) => {
    const baseUrl = config.baseUrl || "https://app.affine.pro/api";
    const response = await fetch(
      `${baseUrl}/workspace/${config.workspaceId}/pages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Affine API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Update a page
  updatePage: async (
    config: AffineConfig,
    pageId: string,
    data: {
      title?: string;
      content?: string;
      isPublic?: boolean;
      tags?: string[];
    },
  ) => {
    const baseUrl = config.baseUrl || "https://app.affine.pro/api";
    const response = await fetch(
      `${baseUrl}/workspace/${config.workspaceId}/page/${pageId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Affine API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete a page
  deletePage: async (config: AffineConfig, pageId: string) => {
    const baseUrl = config.baseUrl || "https://app.affine.pro/api";
    const response = await fetch(
      `${baseUrl}/workspace/${config.workspaceId}/page/${pageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Affine API error: ${response.statusText}`);
    }

    return response.ok;
  },

  // Search pages
  searchPages: async (config: AffineConfig, query: string) => {
    const baseUrl = config.baseUrl || "https://app.affine.pro/api";
    const response = await fetch(
      `${baseUrl}/workspace/${config.workspaceId}/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Affine API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Export page as markdown
  exportPageAsMarkdown: async (config: AffineConfig, pageId: string) => {
    const baseUrl = config.baseUrl || "https://app.affine.pro/api";
    const response = await fetch(
      `${baseUrl}/workspace/${config.workspaceId}/page/${pageId}/export?format=markdown`,
      {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Affine API error: ${response.statusText}`);
    }

    return response.text();
  },
};

// Sync Affine pages to notes
export async function syncAffinePage(
  workspaceId: string,
  integrationId: string,
  page: AffinePage,
  action: "created" | "updated" | "deleted",
) {
  try {
    const integration = await prisma.workspaceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.active) {
      return;
    }

    const config = integration.config as any;

    if (action === "created" || action === "updated") {
      // Create or update note
      await prisma.note.upsert({
        where: {
          id: `affine-${page.id}`,
        },
        create: {
          id: `affine-${page.id}`,
          userId: config.userId,
          title: page.title,
          content: page.content || "",
          isPublic: page.isPublic,
          metadata: {
            source: "affine",
            affinePageId: page.id,
            affineWorkspaceId: page.workspaceId,
            tags: page.tags,
            externalUrl: `${config.baseUrl || "https://app.affine.pro"}/workspace/${page.workspaceId}/page/${page.id}`,
          },
        },
        update: {
          title: page.title,
          content: page.content || "",
          isPublic: page.isPublic,
          metadata: {
            source: "affine",
            affinePageId: page.id,
            affineWorkspaceId: page.workspaceId,
            tags: page.tags,
            externalUrl: `${config.baseUrl || "https://app.affine.pro"}/workspace/${page.workspaceId}/page/${page.id}`,
          },
        },
      });
    } else if (action === "deleted") {
      // Delete note
      await prisma.note.deleteMany({
        where: {
          id: `affine-${page.id}`,
        },
      });
    }
  } catch (error) {
    console.error("[Affine Sync Error]:", error);
    throw error;
  }
}

// Convert Affine blocks to markdown
export function affineBlocksToMarkdown(blocks: AffineBlock[]): string {
  const lines: string[] = [];

  blocks.forEach((block) => {
    switch (block.type) {
      case "heading":
        const level = block.content.level || 1;
        lines.push(`${"#".repeat(level)} ${block.content.text || ""}`);
        break;
      case "paragraph":
        lines.push(block.content.text || "");
        break;
      case "list":
        const bullet = block.content.ordered ? "1." : "-";
        lines.push(`${bullet} ${block.content.text || ""}`);
        break;
      case "code":
        lines.push("```" + (block.content.language || ""));
        lines.push(block.content.text || "");
        lines.push("```");
        break;
      case "quote":
        lines.push(`> ${block.content.text || ""}`);
        break;
      case "divider":
        lines.push("---");
        break;
      default:
        lines.push(block.content.text || "");
    }
    lines.push("");
  });

  return lines.join("\n");
}
