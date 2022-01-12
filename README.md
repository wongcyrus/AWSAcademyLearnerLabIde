# AWS Academy Learner Lab IDE
This is a AWS CDK project to create a Windows 2022 server development environment in AWS Academy Learner Lab.
Learner lab does allow students to use shared AMI and even cannot create AMI so the Golden AMI way will not work.

## Setup
Open AWS Cloud Shell and run the following commands:
````
wget https://github.com/wongcyrus/AWSAcademyLearnerLabIde/raw/master/cloudformation/windowsIde.yaml
aws cloudformation create-stack --stack-name ide --template-body file://windowsIde.yaml --capabilities "CAPABILITY_IAM"
`````

## List of pre-installed Tools
1. Chocolatey Package Manager
2. SSH Server (Use the same login confidential for RDP and it uses "vockey" from Learner Lab)
3. The latest AWS CLI.
4. Python 3
5. Oracle JDK
6. Google Chrome
7. 7 zip
8. Visual Studio Code
9. Pycharm

## Network and Security
It is in a new VPC and EC2 runs in a public subnets. Security group sets 2 rules all RDP and SSH from any ip.

## Reminder
1. AWS Academy Learner Lab stops all EC2 instances after 4 hours session expired.
2. Students will lose everything if their credits are used up.
3. AWS Academy Learner Lab is not design for learning AWS and don't trust the list of supporting services! Most of them cannot use as AWS services must create a lot of IAM roles and policies but the learner lab does let you touch IAM at all.    