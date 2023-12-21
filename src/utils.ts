import absolute from 'absolute'
import type { SimpleGit } from 'simple-git'
import { simpleGit } from 'simple-git'
import * as vscode from 'vscode'
import { JenkinsAPI } from './api'
import Config from './config'
import type { ParameterDefintion } from './types'
import { PROPERTY_CLASS } from './constants'

/* UTILS */

let jenkins: JenkinsAPI

const Utils = {

  folder: {
    getRootPath(basePath?: string) {
      const { workspaceFolders } = vscode.workspace

      if (!workspaceFolders)
        return

      const firstRootPath = workspaceFolders[0].uri.fsPath
      if (!basePath || !absolute(basePath))
        return firstRootPath

      const rootPaths = workspaceFolders.map (folder => folder.uri.fsPath)
      const sortedRootPaths = rootPaths.sort((a, b) => b.length - a.length) // In order to get the closest root

      return sortedRootPaths.find(rootPath => basePath.startsWith(rootPath))
    },
  },

  repo: {
    get(baseDir: string) {
      const git: SimpleGit = simpleGit(baseDir)
      return git
    },
    async isGitRepo(git: SimpleGit) {
      return await git.checkIsRepo()
    },

    async getBranch(git: SimpleGit) {
      return await git.branch()
    },
    async getStatus(git: SimpleGit) {
      return await git.status()
    },
  },
  jenkins: {
    init() {
      if (jenkins)
        return jenkins
      const { domain, userName, passwordKey } = Config.get()
      // eslint-disable-next-line node/prefer-global/process
      const password = process.env[passwordKey]
      jenkins = new JenkinsAPI({
        id: '1',
        name: 'jenkins',
        url: domain,
        username: userName,
        token: password,
        unsafeHttps: false,
      })
      return jenkins
    },
    getJobDetail() {
      const jenkins = Utils.jenkins.init()
      return jenkins.getJobDetail(Config.get().jobName)
    },
    buildJob() {
      const jenkins = Utils.jenkins.init()
      const { jobName, params } = Config.get()
      return jenkins.buildJob(jobName, params)
    },
    getBuildLog(number: number) {
      const jenkins = Utils.jenkins.init()
      return jenkins.buildLog(Config.get().jobName, number)
    },
    getQueueList() {
      const jenkins = Utils.jenkins.init()
      return jenkins.queueList()
    },
    getQueueItem(number: number) {
      const jenkins = Utils.jenkins.init()
      return jenkins.queueItem(number)
    },
    getBuildInfo(buildNumber: number) {
      const jenkins = Utils.jenkins.init()
      return jenkins.getBuildInfo(Config.get().jobName, buildNumber)
    },
    cancelQueue(queueId: number) {
      const jenkins = Utils.jenkins.init()
      return jenkins.cancelQueue(queueId)
    },
    stopBuild(jobNumber: number) {
      const jenkins = Utils.jenkins.init()
      return jenkins.stopBuild(Config.get().jobName, jobNumber)
    },
    handleParametersDefinitionProperty(property = <any>[]) {
      const initialValues: any = {}
      const data = property.find((item: ParameterDefintion) => item._class === PROPERTY_CLASS)
      data.parameterDefinitions?.forEach((item: ParameterDefintion) => {
        initialValues[item.name] = item.defaultParameterValue.value || ' '
      })
      if (initialValues.build_type)
        initialValues.deploy_host = 'static_host'

      return initialValues
    },
  },
  common: {
    customInterval(callback: () => Promise<boolean>, delay: number, onComplete: () => void) {
      let timerId: NodeJS.Timeout

      async function tick() {
        const shouldClear = await callback()
        if (shouldClear)
          clearTimer()

        else
          timerId = setTimeout(tick, delay)
      }

      timerId = setTimeout(tick, delay)

      function clearTimer() {
        clearTimeout(timerId)
        onComplete()
      }

      return clearTimer
    },
  },

}

/* EXPORT */

export default Utils
