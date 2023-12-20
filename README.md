# Open in GitHub

<p align="center">
  <img src="https://wingsheep.gallerycdn.vsassets.io/extensions/wingsheep/jenkins-build/0.0.1/1703070712751/Microsoft.VisualStudio.Services.Icons.Default" width="128" alt="Logo">
</p>

Generate Jenkins configuration based on the current project and deploy with one click.

## Install

Follow the instructions in the [Marketplace](https://marketplace.visualstudio.com/items?itemName=wingsheep.jenkins-build), or run the following in the command palette:

```shell
ext install wingsheep.jenkins-build
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

### OBuild jenkins job

### Stop build job

### Generate setting


## License

[MIT](./LICENSE) License © 2023 [Wingsheep](https://github.com/wingsheep)
