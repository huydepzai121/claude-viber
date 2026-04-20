import { ipcMain, shell } from 'electron';

export function registerShellHandlers(): void {
  // Handle opening external links
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Failed to open external URL:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Handle opening folders in the OS file manager
  ipcMain.handle('shell:open-folder', async (_event, folderPath: string) => {
    try {
      const result = await shell.openPath(folderPath);
      if (result) {
        // openPath returns an empty string on success, or an error message on failure
        return { success: false, error: result };
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to open folder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}
