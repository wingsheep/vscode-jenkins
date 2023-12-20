/* IMPORT */

import * as vscode from 'vscode'

/* CONFIG */

interface ConfigData {
  userName: string
  domain: string
  password: string
  passwordKey: string
  jobName: string
  isBuildCurrentBranch: boolean
  params: Record<string, any>
}

const Config = {
  get(extension = 'jenkins') {
    const config = vscode.workspace.getConfiguration().get(extension) as any
    return config as ConfigData
  },
  async update(key: string, value: any, extension = 'jenkins') {
    const config = vscode.workspace.getConfiguration(extension)
    await config.update(key, value, vscode.ConfigurationTarget.Workspace)
  },
  async open() {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      const settingsJsonUri = vscode.Uri.joinPath(workspaceFolders[0].uri, '.vscode', 'settings.json')
      const document = await vscode.workspace.openTextDocument(settingsJsonUri)
      await vscode.window.showTextDocument(document)
    }
  },

}

/* EXPORT */

export default Config
