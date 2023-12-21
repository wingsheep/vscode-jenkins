import { StatusBarAlignment, window } from 'vscode'
import * as vscode from 'vscode'
import Utils from './utils'
import Config from './config'

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 0)
  const outputChannel = vscode.window.createOutputChannel('Jenkins Build')
  let isBuildRunning = false
  let isBuildNumber = 0
  statusBarItem.text = '$(zap) Jenkins Build'
  statusBarItem.command = 'jenkins.buildJob'
  statusBarItem.tooltip = `Jenkins Build <${Config.get().jobName}>`
  statusBarItem.show()
  async function handleRequireParams() {
    const { passwordKey, userName, domain, jobName } = Config.get()
    if (!userName) {
      const inputUserName = await vscode.window.showInputBox({
        prompt: 'Please input jenkins user name',
      })
      if (inputUserName) {
        Config.update('userName', inputUserName)
      }
      else {
        window.showErrorMessage('Please input jenkins user name')
        return false
      }
    }
    if (!passwordKey) {
      const inputPasswordKey = await vscode.window.showInputBox({
        prompt: 'Please input jenkins password key in system variables',
      })
      if (inputPasswordKey) {
        Config.update('passwordKey', inputPasswordKey)
      }
      else {
        window.showErrorMessage('Please input jenkins password key in system variables')
        return false
      }
    }
    if (!domain) {
      const inputDomain = await vscode.window.showInputBox({
        prompt: 'Please input jenkins domain',
      })
      if (inputDomain) {
        Config.update('domain', inputDomain)
      }
      else {
        window.showErrorMessage('Please input jenkins domain')
        return false
      }
    }
    if (!jobName) {
      const inputJobName = await vscode.window.showInputBox({
        prompt: 'Please input jenkins job name',
      })
      if (inputJobName) {
        Config.update('jobName', inputJobName)
      }
      else {
        window.showErrorMessage('Please input jenkins job name')
        return false
      }
    }
    return true
  }

  const buildJob = vscode.commands.registerCommand('jenkins.buildJob', async () => {
    const flag = await handleRequireParams()
    if (!flag)
      return
    if (isBuildRunning)
      return window.showWarningMessage('Wait for the previous build to end')
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
        isBuildNumber = number
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
        isBuildNumber = 0
        window.showInformationMessage('Build end !!! ')
      })
    }
  })

  const killJob = vscode.commands.registerCommand('jenkins.killJob', async () => {
    const flag = await handleRequireParams()
    if (!flag)
      return
    if (isBuildRunning) {
      await Utils.jenkins.stopBuild(isBuildNumber)
      window.showInformationMessage(`#${isBuildNumber} is stopped`)
      isBuildRunning = false
      isBuildNumber = 0
      statusBarItem.text = '$(zap) Jenkins Build'
    }
    else {
      window.showWarningMessage(`Jenkins Build is not running`)
    }
  })

  const generateSetting = vscode.commands.registerCommand('jenkins.generateSetting', async () => {
    const { passwordKey, userName, domain, jobName, isBuildCurrentBranch, params } = Config.get()
    Config.update('passwordKey', passwordKey)
    Config.update('userName', userName)
    Config.update('domain', domain)
    Config.update('jobName', jobName)
    Config.update('jobName', jobName)
    Config.update('isBuildCurrentBranch', isBuildCurrentBranch)
    Config.update('params', params)
    const inputUserName = await vscode.window.showInputBox({
      prompt: 'Please confirm jenkins username',
      value: userName,
    })
    inputUserName && Config.update('userName', inputUserName)

    const inputPasswordKey = await vscode.window.showInputBox({
      prompt: 'Please confirm jenkins password key',
      value: passwordKey,
    })
    inputPasswordKey && Config.update('passwordKey', inputPasswordKey)

    const inputDomain = await vscode.window.showInputBox({
      prompt: 'Please confirm jenkins domain',
      value: domain,
    })
    inputDomain && Config.update('domain', inputDomain)

    const inputJobName = await vscode.window.showInputBox({
      prompt: 'Please confirm jenkins job name',
      value: jobName,
    })
    inputJobName && Config.update('jobName', inputJobName)

    const newConfig = Config.get()
    if (newConfig.userName && newConfig.passwordKey && newConfig.domain && newConfig.jobName) {
      const { actions } = await Utils.jenkins.getJobDetail() as any
      const jobParams = Utils.jenkins.handleParametersDefinitionProperty(actions)
      await Config.update('params', jobParams)
      if (Object.prototype.hasOwnProperty.call(jobParams, 'build_branch') && newConfig.isBuildCurrentBranch) {
        const rootPath = Utils.folder.getRootPath() || '/'
        const git = Utils.repo.get(rootPath)
        const branch = await Utils.repo.getBranch(git)
        Config.update('params', {
          ...params,
          build_branch: branch.current,
        })
      }
      vscode.window.showInformationMessage('Generate setting success')
    }
    else {
      window.showErrorMessage('Please check the required configuration items.')
    }
    await Config.open()
  })
  context.subscriptions.push(buildJob)
  context.subscriptions.push(killJob)
  context.subscriptions.push(generateSetting)
}

export function deactivate() {

}
