# FC26 Chrome Extension

## Overview

FC26 is a Chrome extension built with Plasmo framework that serves as a companion tool for FC26 sniper functionality and webapp enhancement utilities. The extension is designed to interact with EA.com websites and provide enhanced user experience for FIFA/FC gameplay features.

## Technology Stack

- **Framework**: Plasmo 0.90.5 (Chrome extension development framework)
- **Frontend**: React 19.1.1 with TypeScript
- **Build Tool**: Bun package manager
- **Development**: TypeScript 5.9.2 with strict type checking

## Project Structure

```txt
fc26/
├── src/
│   └── popup.tsx          # Main popup component
├── assets/                # Static assets
├── package.json           # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── biome.json            # Code formatting configuration
```

## Features

Currently implemented:

- Basic popup interface with FC26 branding
- Chrome extension manifest with necessary permissions

## Permissions

The extension requests the following Chrome permissions:

- `tabs` - Access to browser tabs
- `activeTab` - Access to the currently active tab
- `scripting` - Ability to inject scripts
- `webRequest` - Monitor and modify web requests
- Host permissions for `https://*.ea.com/*` - Access to EA websites

## Development Commands

- `bun run dev` - Start development mode with hot reload
- `bun run build` - Build the extension for production
- `bun run package` - Package the extension for distribution

## Current State

The project is in early development stage with a minimal popup component. The core sniper functionality and webapp enhancement utilities are yet to be implemented.

## Potential Features (Based on Project Name)

- Player sniping tools for FIFA Ultimate Team
- Market monitoring and price tracking
- Automated bidding functionality
- Enhanced webapp interface
- Real-time notifications for market opportunities

## Configuration

- TypeScript configured with strict type checking
- Module resolution set to "bundler" for optimal Plasmo integration
- React JSX transformation enabled
- Source maps and development tools configured

## Author

Developed by Meslzy (<i@meslzy.com>)
