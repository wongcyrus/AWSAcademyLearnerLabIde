# AWS Academy Learner Lab IDE
This is a AWS CDK project to create a Windows 2022 server development environment in AWS Academy Learner Lab.
Learner lab does allow students to use shared AMI and even cannot create AMI so the Golden AMI way will not work.

## How to set up?
Start Learner Lab, login AWS console, open AWS Cloud Shell and run the following commands:
```shell
wget https://github.com/wongcyrus/AWSAcademyLearnerLabIde/raw/master/cloudformation/windowsIde.json
aws cloudformation create-stack --stack-name ide --template-body file://windowsIde.json --capabilities "CAPABILITY_IAM"
````

[![How to set up AWS Academy Learner Lab IDE - Windows 2022 Server?](https://img.youtube.com/vi/8kQn1nROHRA/0.jpg)](https://www.youtube.com/watch?v=8kQn1nROHRA)

## How to connect the Windows 2022 IDE server?
Start Learner Lab, login AWS console, get windows password and connect it through RDP or SSH client.

[![How to login AWS Academy Learner Lab IDE - Windows 2022 Server?](https://img.youtube.com/vi/4P-I7uATz0I/0.jpg)](https://www.youtube.com/watch?v=4P-I7uATz0I)

## List of pre-installed Tools
1. Chocolatey Package Manager
2. SSH Server (Use the same login confidential for RDP and it uses "vockey" from Learner Lab)
3. The latest AWS CLI.
4. Python 3
5. Oracle JDK
6. Google Chrome
7. git
8. 7 zip
9. Visual Studio Code
10. Pycharm

## Network and Security
It is in a new VPC and EC2 runs in a public subnets. Security group sets 2 rules all RDP and SSH from any ip.

## Reminder
1. AWS Academy Learner Lab stops all EC2 instances after 4 hours session expired.
2. Students will lose everything if their credits are used up.
3. AWS Academy Learner Lab is not design for learning AWS and don't trust the list of supporting services! Most of them cannot use as AWS services must create a lot of IAM roles and policies but the learner lab does let you touch IAM at all.

## Development
Your class may need to other software, and you can first check it from https://community.chocolatey.org/packages .
Add or remove packages or change windows AMI (AWS Academy Learner Lab blocked AWS SSM parameter store so you have to hard code!).
```typescript
const devTools = ['python3', 'oraclejdk', 'googlechrome', 'git', '7zip.install', 'vscode', 'pycharm'];
const amiId = "ami-065024219ebe5213e";
```
Follow https://github.com/projen/projen to initialize projen. In short,
1. Install yarn
2. Run ```npx projen```
3. Change source code.
4. Run ``` npx projen gencfn```
5. The CloudFormation Template is ```cloudformation/windowsIde.json```

The standard way of AWS CDk deploy is not working in AWS Academy Learner Lab as you cannot complete CDK Boostrap without creating an IAM role, and the hack is to not use asset, SSM, no IAM role/policy, ....

# #WTFAWSAcademyLearnerLab
1. Can someone explain why students create AMI is a dangerous action?
2. Students can create EKS cluster but disabled IAM OIDC provider. And, at the end, the cluster is not able to run kubectl!
3. AWS SAM, AWS CDK, AWS Amplify, ... are all death as students are not able to create IAM role.
4. All community AMIs are blocked and students need to hack a cloud9 image to run an Ubuntu!
