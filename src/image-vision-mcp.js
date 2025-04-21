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
        model: {
            type: "string",
            short: "m",
        }
    },
});


const host = values.host || "http://127.0.0.1:11434"; // Default value if not provided
const model = values.model || "llava:34b"; 

// Get permitted directories
const permittedDirectories = values.permitted || [];

// Create an MCP server
const server = new McpServer({
    name: "Image Vision MCP",
    version: "0.85.1",
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
    "getImageDescriptionWithPrompt",
    {
        mediaPaths: z
            .array(z.string())
            .describe("A list of absolute file paths to image files (JPG, PNG, etc.) to analyze. Each path must point to an accessible image file that exists on the system."),
        prompt: z
            .string()
            .describe("Custom instructions for analyzing the images. This prompt will determine what aspects of the image to focus on, what details to extract, and how the description should be structured. For example, you could ask for analysis of color palette, composition, technical aspects, emotional impact, or specific elements within the image.")
    },
    async ({ mediaPaths, prompt }) => {
        const results = [];
        for (const filePath of mediaPaths) {
            try {
                checkPath(filePath);

                const res = await _executePrompt(
                    filePath,
                    prompt
                )

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

server.tool(
    "getImageDescription",
    {
        mediaPaths: z
            .array(z.string())
            .describe("A list of absolute file paths to image files (JPG, PNG, etc.) for comprehensive visual analysis. Each path should point to an accessible image file that needs description. The analysis will examine visual elements, objects, colors, text, spatial relationships, context, and overall mood to provide an objective, detailed description suitable for accessibility purposes or content documentation."),
    },
    async ({ mediaPaths }) => {
        const results = [];
        for (const filePath of mediaPaths) {
            try {
                checkPath(filePath);

                const res = await _executePrompt(
                    filePath,
                    `Analyze this image and provide a detailed description. Focus on:
                    1. Main subjects or objects in the image
                    2. Notable details and characteristics
                    3. Colors, textures, and visual elements
                    4. Spatial relationships between elements
                    5. Overall context or setting
                    6. Any text visible in the image
                    7. Mood or atmosphere if applicable
                    
                    Be objective and thorough in your description, noting both obvious elements and subtle details that might be useful. If there's uncertainty about any element, acknowledge it.
                    
                    Provide your response in clear, concise language that would be useful for someone who cannot see the image.`
                )

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

server.tool(
    "getPhotoshopImageDescription",
    {
        mediaPaths: z
            .array(z.string())
            .describe("A list of absolute file paths to Photoshop images (PNG, JPG) or individual layer exports (PNG) for design analysis. Each path should point to an accessible file that represents either a complete composition or isolated design element to be analyzed for layer composition, color schemes, and design hierarchy purposes."),
    },
    async ({ mediaPaths }) => {
        const results = [];

        for (const filePath of mediaPaths) {
            try {
                checkPath(filePath);

                const res = await _executePrompt(
                    filePath, 
                    `Analyze this Photoshop layer for design work. Describe:

                    1. The specific content or elements visible (objects, shapes, text, graphics)
                    2. Whether this appears to be a full image or an isolated element
                    3. Colors and predominant tones if any
                    4. Visual style or artistic appearance
                    5. Resolution/quality assessment
                    6. Any transparency or special effects visible
                    7. Potential purpose or usage in a composition
                    8. Suggestions for layer naming based on content

                    Focus on details relevant for a graphic designer working with layer composition, color theory, and visual hierarchy.`
                )

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

server.tool(
    "getPhotographDescription",
    {
        mediaPaths: z
            .array(z.string())
            .describe("A list of absolute file paths to photographs (JPG, PNG, RAW, etc.) for comprehensive photographic analysis. Each path should point to an accessible image file that needs technical and artistic evaluation for composition, technique, storytelling, and creative intent purposes."),
    },
    async ({ mediaPaths }) => {
        const results = [];

        for (const filePath of mediaPaths) {
            try {
                checkPath(filePath);

                const res = await _executePrompt(
                    filePath, 
                    `Analyze this photograph from your perspective as a visual critic, considering:

                    - What do you notice first? What draws your eye?
                    - Technical aspects that contribute to the image's effectiveness
                    - Creative choices that reveal the photographer's intent or vision
                    - The story or emotional resonance of the image
                    - How the photograph fits within its genre or breaks conventions
                    - What makes this image successful, compelling, or noteworthy

                    Offer insights that would interest both photographers and viewers who appreciate photography as an art form.`
                )

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


const _executePrompt = async (filePath, prompt) => {
    const ollama = new Ollama({ host: host });
    const res = await ollama.chat({
        model: model,
        messages: [
            {
                role: "user",
                content: prompt,
                images: [filePath],
            },
        ],
    });

    return res
}


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
