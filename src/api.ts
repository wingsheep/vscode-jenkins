import http from 'node:http'
import https from 'node:https'
import { Buffer } from 'node:buffer'
import type { RequestInfo, RequestInit } from 'node-fetch'
import fetch, { Headers } from 'node-fetch'

export interface Jenkins {
  id: string
  name: string
  createTime?: number
  updateTime?: number
  version?: string

  url: string
  username: string
  token?: string
  unsafeHttps: boolean
}

export interface Job {
  name: string
  path?: string
  description?: string
  url: string
  _class?: string
  color?: string
  shortClass?: string
}

export interface Build {
  number: number
  url: string
  _class: string
}

export interface View {
  name: string
  url: string
  _class: string
}

export interface Suggestion {
  name: string
  url: string
}

export interface SearchResponse {
  _class: string
  suggestions: Suggestion[]
}

export class JenkinsAPI {
  public jenkins: Jenkins

  constructor(j: Jenkins) {
    this.jenkins = j
  }

  public async search(q: string): Promise<Suggestion[]> {
    const api = `${this.jenkins.url}/search/suggest?query=${q}`
    const resp = await this.request(api)
    const result = (await resp.json()) as SearchResponse
    return result.suggestions.map((s) => {
      s.url = `${this.jenkins.url}/search/?q=${encodeURIComponent(s.name)}`
      return s
    })
  }

  public async getBuildInfo(jobName: string, buildNumber: number) {
    const api = `${this.jenkins.url}/job/${jobName}/${buildNumber}/api/json`
    const resp = await this.request(api)
    return (await resp.json()) as SearchResponse
  }

  public async getJobDetail(jobName: string) {
    const api = `${this.jenkins.url}/job/${jobName}/api/json`
    const resp = await this.request(api)
    return (await resp.json()) as SearchResponse
  }

  public async buildJob(jobName: string, params: Record<string, any>) {
    const api = `${this.jenkins.url}/job/${jobName}/buildWithParameters`
    const data = new URLSearchParams()
    Object.keys(params).forEach(key => data.append(key, params[key]))
    const resp = await this.request(api, {
      method: 'POST',
      body: data,
    })
    if (resp.status !== 201)
      return Promise.reject(new Error(`${resp.status} ${await resp.text()}`))
    const headers = resp.headers
    const parts = headers.get('location')?.split('/') || []
    return Number.parseInt(parts[parts.length - 2])
  }

  public async buildLog(jobName: string, number: number) {
    const api = `${this.jenkins.url}/job/${jobName}/${number}/logText/progressiveText`
    const resp = await this.request(api)
    return {
      text: (await resp.text()),
      more: resp.headers.get('X-More-Data') === 'true',
      size: resp.headers.get('x-text-size'),
    }
  }

  public async queueList() {
    const api = `${this.jenkins.url}/queue/api/json`
    const resp = await this.request(api)
    return (await resp.json())
  }

  public async queueItem(number: number) {
    const api = `${this.jenkins.url}/queue/item/${number}/api/json`
    const resp = await this.request(api)
    return (await resp.json())
  }

  public async cancelQueue(queueId: number) {
    const api = `${this.jenkins.url}/queue/item/${queueId}/cancelQueue`
    const resp = await this.request(api, {
      method: 'POST',
    })
    return (await resp.text())
  }

  public async stopBuild(jobName: string, buildNumber: number) {
    const api = `${this.jenkins.url}/job/${jobName}/${buildNumber}/stop`
    const data = new URLSearchParams()
    const params: any = { number: buildNumber }
    Object.keys(params).forEach(key => data.append(key, params[key]))
    const resp = await this.request(api, {
      method: 'POST',
      body: data,
    })
    return (await resp.text())
  }

  async getCrumbData() {
    const api = `${this.jenkins.url}/crumbIssuer/api/json`
    const resp = await fetch(api, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.jenkins.username}:${this.jenkins.token}`).toString('base64')}`,
      },
    })
    const result = (await resp.json()) as { _class: string, crumbRequestField: string, crumb: string, cookies: string[] }
    if (result._class === 'hudson.security.csrf.DefaultCrumbIssuer') {
      result.cookies = []
      const cookies = (resp.headers as any).get('set-cookie')
      result.cookies.push(cookies.split(';')[0])
    }
    return result
  }

  async request(url: RequestInfo, init?: RequestInit) {
    let urlAgent
    if (url.toString().startsWith('http://'))
      urlAgent = new http.Agent({})

    else if (url.toString().startsWith('https://'))
      urlAgent = new https.Agent({ rejectUnauthorized: !this.jenkins.unsafeHttps })

    else
      return Promise.reject(new Error('Wrong scheme in URL'))

    const { crumbRequestField, crumb, cookies } = await this.getCrumbData()
    const headers = new Headers()
    if (this.jenkins.token) {
      headers.append(
        'Authorization',
        `Basic ${Buffer.from(`${this.jenkins.username}:${this.jenkins.token}`).toString('base64')}`,
      )
    }

    if (crumb) {
      headers.append(crumbRequestField, crumb)
      headers.append('Cookie', cookies.join('; '))
    }

    const resp = await fetch(url, {
      headers,
      method: 'GET',
      agent: urlAgent,
      ...init,
    })
    if (!resp.ok) {
      if (resp.status === 403)
        return Promise.reject(new Error(resp.statusText))

      return Promise.reject(new Error(`${resp.status} ${await resp.text()}`))
    }
    return resp
  }
}
