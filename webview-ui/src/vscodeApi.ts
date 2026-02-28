declare function acquireVsCodeApi(): { postMessage(msg: unknown): void }

export const isStandalone = typeof acquireVsCodeApi !== 'function';

export const vscode = isStandalone
    ? {
        postMessage: (msg: unknown) => {
            // console.log('postMessage called outside VSCode:', msg)
            fetch('/api/extension-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            }).catch(err => console.error('Failed to send to backend:', err));
        }
    }
    : acquireVsCodeApi();
