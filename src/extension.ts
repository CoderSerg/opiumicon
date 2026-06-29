import * as vscode from "vscode";
import * as net from "net";
import * as zlib from "zlib";

const PORTS = [8392, 8393, 8394, 8395, 8396, 8397];
const PREFIX = "OpiumwareScript ";

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

async function scanPorts(): Promise<number[]> {
  const results = await Promise.all(PORTS.map((p) => checkPort(p)));
  return PORTS.filter((_, i) => results[i]);
}

function sendScript(port: number, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = PREFIX + code;
    zlib.deflate(Buffer.from(payload), (err, compressed) => {
      if (err) return reject(err);

      const socket = new net.Socket();
      socket.setTimeout(800);
      socket.once("error", (e) => reject(e));
      socket.once("timeout", () => {
        socket.destroy();
        reject(new Error("send timed out"));
      });
      socket.connect(port, "127.0.0.1", () => {
        socket.write(compressed, () => {
          socket.destroy();
          resolve();
        });
      });
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand("opiumware.execute", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("no file is open bro");
      return;
    }

    const active = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "finding instances..." },
      () => scanPorts()
    );

    if (active.length === 0) {
      vscode.window.showErrorMessage("nothing found. is roblox open?");
      return;
    }

    const items = active.map((p) => ({
      label: `port ${p}`,
      description: "127.0.0.1",
      port: p,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: "select an instance",
    });

    if (!picked) return;

    const code = editor.document.getText();

    if (!code.trim()) {
      vscode.window.showWarningMessage("file is empty");
      return;
    }

    try {
      await sendScript(picked.port, code);
      vscode.window.showInformationMessage(`executed on port ${picked.port}`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`failed: ${e.message}`);
    }
  });

  context.subscriptions.push(cmd);
}

export function deactivate() {}