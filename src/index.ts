import { StatusBarAlignment, window } from 'vscode'
import * as vscode from 'vscode'
import Utils from './utils'
import Config from './config'

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 0)
  const outputChannel = vscode.window.createOutputChannel('Jenkins Build')
  let isBuildRunning = false
  statusBarItem.text = '$(zap) Jenkins Build'
  statusBarItem.command = 'jenkins.buildJob'
  statusBarItem.tooltip = `Jenkins Build <${Config.get().jobName}>`
  statusBarItem.show()
  async function handleRequireParams() {
    const { passwordKey, userName, domain, jobName } = Config.get()
    const requiredParams = []
    if (!userName) {
      const inputUserName = await vscode.window.showInputBox({
        prompt: 'Please input jenkins user name：',
      })
      if (inputUserName)
        Config.update('userName', inputUserName)
      else
        requiredParams.push('userName')
    }
    if (!passwordKey) {
      const inputPasswordKey = await vscode.window.showInputBox({
        prompt: 'Please input jenkins password key in system variables：',
      })
      if (inputPasswordKey)
        Config.update('passwordKey', inputPasswordKey)
      else
        requiredParams.push('passwordKey')
    }
    if (!domain) {
      const inputDomain = await vscode.window.showInputBox({
        prompt: 'Please input jenkins domain：',
      })
      if (inputDomain)
        Config.update('domain', inputDomain)
      else
        requiredParams.push('domain')
    }
    if (!jobName) {
      const inputJobName = await vscode.window.showInputBox({
        prompt: 'Please input jenkins job name：',
      })
      if (inputJobName)
        Config.update('jobName', inputJobName)
      else
        requiredParams.push('jobName')
    }
    if (requiredParams.length) {
      const message = `The following parameters are required: ${requiredParams.join(', ')}`
      return window.showErrorMessage(message)
    }
    if (requiredParams.length) {
      const message = `The following parameters are required: ${requiredParams.join(', ')}`
      return window.showErrorMessage(message)
    }
    return requiredParams.length
  }

  const buildJob = vscode.commands.registerCommand('jenkins.buildJob', async () => {
    if (isBuildRunning)
      return window.showWarningMessage('Wait for the previous build to end')
    if (await handleRequireParams())
      return false
    const { params, jobName, isBuildCurrentBranch } = Config.get()
    if (isBuildCurrentBranch) {
      const rootPath = Utils.folder.getRootPath() || '/'
      const git = Utils.repo.get(rootPath)
      const branch = await Utils.repo.getBranch(git)
      Config.update('params', {
        ...params,
        build_branch: branch.current,
      })
    }
    isBuildRunning = true
    outputChannel.clear()
    outputChannel.show()
    outputChannel.appendLine(`Start build job <${jobName}> with params: `)
    outputChannel.appendLine(JSON.stringify(params, null, 2))
    const queueId = await Utils.jenkins.buildJob()
    outputChannel.appendLine(`Queue id: ${queueId}`)
    statusBarItem.text = '$(sync~spin) Queued'
    Utils.common.customInterval(async () => {
      const queueInfo = await Utils.jenkins.getQueueItem(queueId)
      queueInfo.why && outputChannel.appendLine(queueInfo.why)
      if (!queueInfo.why)
        return true
      return false
    }, 1000, async () => {
      outputChannel.appendLine('Building log')
      setTimeout(async () => {
        const { lastBuild: { number, url } } = await Utils.jenkins.getJobDetail() as any
        outputChannel.appendLine(`Building Number: ${number}`)
        outputChannel.appendLine(`Building url: ${url}`)
        logSteram(number)
      }, 1000)
    })

    function logSteram(buildNumber: number) {
      statusBarItem.text = '$(sync~spin) Building...'
      let newText = ''
      let oldText = ''
      Utils.common.customInterval(async () => {
        const { text, more } = await Utils.jenkins.getBuildLog(buildNumber)
        newText = text
        const index = text.indexOf(oldText)
        if (index !== -1) {
          newText = text.substring(index)
          oldText = text.substring(0, index)
          outputChannel.append(newText)
        }
        if (!more)
          return true
        return false
      }, 1000, async () => {
        outputChannel.appendLine('Build End!!!')
        statusBarItem.text = '$(zap) Jenkins Build'
        isBuildRunning = false
        window.showInformationMessage('Build end !!! 🎉')
      })
    }
  })

  const killJob = vscode.commands.registerCommand('jenkins.killJob', async () => {
    if (await handleRequireParams())
      return false
    const { lastBuild: { number }, isBuilding } = await Utils.jenkins.getJobDetail() as any
    if (isBuilding) {
      await Utils.jenkins.stopBuild(number)
      isBuildRunning = false
      statusBarItem.text = '$(zap) Jenkins Build'
      window.showInformationMessage('The last build is stopped')
    }
    else {
      window.showWarningMessage('The last build is not running')
    }
  })

  const generateSetting = vscode.commands.registerCommand('jenkins.generateSetting', async () => {
    if (await handleRequireParams())
      return false
    const inputJobName = await vscode.window.showInputBox({
      prompt: 'Please confirm jenkins job name：',
      value: Config.get().jobName,
    })
    if (inputJobName)
      Config.update('jobName', inputJobName)
    const { actions } = await Utils.jenkins.getJobDetail() as any
    const params = Utils.jenkins.handleParametersDefinitionProperty(actions)
    await Config.update('params', params)
    await Config.open()
  })
  context.subscriptions.push(buildJob)
  context.subscriptions.push(killJob)
  context.subscriptions.push(generateSetting)
}

export function deactivate() {

}
