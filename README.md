# Opiumicon

Run Lua scripts directly from Visual Studio Code via the Opiumware protocol.

## Usage

1. Open any `.lua` or `.luau` file
2. Click the bolt icon in the editor toolbar
3. Select an active port from the dropdown
4. Your script is sent and ran

## How it works

The extension scans ports 8392–8397 on localhost for an active Opiumware instance, compresses your script with zlib, prepends the required `OpiumwareScript` prefix, and sends it over TCP.

## Requirements

- Roblox must be running with Opiumware attached on ports 8392–8397