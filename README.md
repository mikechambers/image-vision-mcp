# Image Vision MCP

MCP Server that provides descriptions of images.

## Requirements

### Ollama

You must have [Ollama](https://ollama.com/) set up, and exposing its LLMs via its API / webserver.

By default, the MCP uses the [llava:34b](https://ollama.com/library/llava) LLM, which you need to have installed and on the same computer that Ollama is running on.

You can install the model via:

```
ollama run llava:34b
```

You can also specify a different model installed via Ollama via the **--model** argument in Claude config.


## Installation

In order to install the MCP into Claude, add the following to the **claude_desktop_config.json** file.


```
    "image-vision": {
      "command": "npx",
      "args": [
        "-y",
        "node",
        "C:/Users/FOO/src/image-vision-mcp/src/image-vision-mcp.js",
        "--permitted",
        "C:/Users/FOO/mcp",
        "--host",
        "http://192.168.1.238:11434"
      ]
    }
```

### Arguments

* **--permitted** (required) The paths that the MCP is allowed to access. You can include multiple entries.
* **--host** (optional) The host and post for the Ollama server. Defaults to http://127.0.0.1:11434
* **--model** (optional) The model installed into Ollama that should be used for the image vision. Defaults to "llava:34b".

## Usage

To run the server:

```bash
node src/image-vision-mcp.js --permitted /path/to/dir1 /path/to/dir2
```

The `--permitted` flag is used to specify which directories roots the MCP is allowed to access for security reasons.

## Development

You can run in development mode using the [MCP inspector](https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file):

```
npx @modelcontextprotocol/inspector node src/image-vision-mcp.js --permitted /Users/FOO/Desktop/mcp/
```

## License

Project released under a [MIT License](LICENSE.md).

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE.md)
