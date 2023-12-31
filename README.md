# Easy Build Jenkins Job

<p align="center">
  <img src="https://wingsheep.gallerycdn.vsassets.io/extensions/wingsheep/easy-build-jenkins/0.0.2/1703142794203/Microsoft.VisualStudio.Services.Icons.Default" width="128" alt="Logo">
</p>

Generate Jenkins configuration based on the current project and deploy with one click.

## Install

Follow the instructions in the [Marketplace](https://marketplace.visualstudio.com/items?itemName=wingsheep.easy-build-jenkins&ssr=false#overview), or run the following in the command palette:

```shell
ext install wingsheep.easy-jenkins-build
```

## Usage

```js
'jenkins.buildJob' // Build jenkins job
'jenkins.killJob' // Stop build job
'jenkins.generateSetting' // Jenkins: Generate setting
```

## Settings

```js
{
  "jenkins.domain": "", // Custom Jenkins domain
  "jenkins.userName": "", // UserName of the Jenkins
  "jenkins.passwordKey": "JENKINS_PASSWORD", // The key for the Jenkins password in system variables
  "jenkins.jobName": "", // JobName of the Jenkins
  "jenkins.params": {}, // Params of the Jenkins
  "jenkins.isBuildCurrentBranch": true // Whether to build the current branch
}
```

## Demo

### Generate setting

https://github.com/wingsheep/vscode-jenkins/assets/26684771/58f15203-c701-42a5-9fb9-78e05b485f05


### Build jenkins job && Stop build job

https://github.com/wingsheep/vscode-jenkins/assets/26684771/995e7d57-c561-4a1a-9d87-6c075577c5a2




## License

[MIT](./LICENSE) License © 2023 [Wingsheep](https://github.com/wingsheep)
