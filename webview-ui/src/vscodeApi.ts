declare function acquireVsCodeApi(): { postMessage(msg: unknown): void }

export const isStandalone = typeof acquireVsCodeApi !== 'function';

export const vscode = isStandalone
    ? { postMessage: (msg: unknown) => console.log('postMessage called outside VSCode:', msg) }
    : acquireVsCodeApi();
