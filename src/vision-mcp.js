import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { Ollama } from "ollama";

const { values } = parseArgs({
    options: {
        permitted: {
            type: "string",
            multiple: true,
            short: "p",
        },
        host: {
            type: "string",
            short: "h",
        },
        help: {
            type: "boolean",
        },
    },
});

// Now extract the host value with a default
const host = values.host || "http://127.0.0.1:11434"; // Default value if not provided

if (values.help) {
    console.log("Usage: node index.js --permitted <dir1> <dir2> ...");
    process.exit(0);
}

// Get permitted directories
const permittedDirectories = values.permitted || [];

// Create an MCP server
const server = new McpServer({
    name: "VisionMCP",
    version: "1.0.0",
});

server.resource(
    "getAllowedDirectories",
    "mcp-utils://getAllowedDirectories",
    async () => {
        return {
            contents: [
                {
                    type: "text",
                    text: JSON.stringify(permittedDirectories, null, 2),
                    uri: "data:text/plain;charset=utf-8", // Adding the required URI property
                },
            ],
        };
    }
);

server.tool(
    "getImageDescription",
    {
        mediaPaths: z
            .array(z.string())
            .describe("A list of image file paths to analyze"),
    },
    async ({ mediaPaths }) => {
        const results = [];

        const ollama = new Ollama({ host: host });
        for (const filePath of mediaPaths) {
            try {
                checkPath(filePath);

                const res = await ollama.chat({
                    model: "llava:34b",
                    messages: [
                        {
                            role: "user",
                            content: "Describe this image",
                            images: [filePath],
                        },
                    ],
                });

                const result = {
                    description: res.message.content,
                    path: filePath,
                    success: true,
                };

                results.push(result);
            } catch (error) {
                results.push({
                    path: filePath,
                    success: false,
                    error: error.message || "Unknown error occurred",
                    description: null,
                });
            }
        }

        return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
    }
);

// Function to check if a path is safe
function isSafePath(pathToCheck) {
    const normalizedPath = path.normalize(path.resolve(pathToCheck));

    for (const basePath of permittedDirectories) {
        const normalizedBasePath = path.normalize(path.resolve(basePath));

        try {
            if (normalizedPath.startsWith(normalizedBasePath)) {
                return true;
            }
        } catch (error) {
            continue;
        }
    }

    return false;
}

// Check if path exists and is safe
function checkPath(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Path does not exist: ${filePath}`);
    }

    if (!isSafePath(filePath)) {
        throw new Error("Path not allowed: Not in permitted directories");
    }

    return true;
}

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
