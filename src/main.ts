import {App, Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {InstanceClass, InstanceSize, InstanceType, SubnetType} from 'aws-cdk-lib/aws-ec2';
import {Role} from "aws-cdk-lib/aws-iam";

export class IdeStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps = {}) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'VPC', {
            cidr: "10.0.0.0/16",
            subnetConfiguration: [{
                name: 'name',
                subnetType: ec2.SubnetType.PUBLIC,
                // the properties below are optional
                cidrMask: 24,
                mapPublicIpOnLaunch: true,
                reserved: false,
            }],
        });

        const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
            vpc,
            description: 'Allow ssh access to ec2 instances',
            allowAllOutbound: true   // Can be set to false
        });
        ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow ssh access from the world');
        ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3389), 'allow rdp access from the world');

        const devTools = ['python3', 'oraclejdk', 'googlechrome', 'git', '7zip.install', 'vscode', 'pycharm'];
        const devToolConfigs = devTools.map((c, i) => ec2.InitCommand.shellCommand(`powershell.exe choco install ${c} -y`, {
            key: `${(i).toString().padStart(2, '0')}-install`,
            waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(0))
        }))
        const initData = ec2.CloudFormationInit.fromConfigSets({
            configSets: {
                // Applies the configs below in this order
                default: ['chocolateyPreInstall', 'windowsBase', 'devTools','complete'],
            },
            configs: {
                chocolateyPreInstall: new ec2.InitConfig([
                    ec2.InitCommand.shellCommand('powershell.exe iex ((New-Object System.Net.WebClient).DownloadString(\'https://chocolatey.org/install.ps1\'))', {
                        key: "01-InstallChoco",
                        waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(0)),
                    }),
                    ec2.InitCommand.shellCommand('powershell.exe -Command Restart-Computer -force', {
                        key: "02-Restart",
                        waitAfterCompletion: ec2.InitCommandWaitDuration.forever()
                    }),
                ]),
                windowsBase: new ec2.InitConfig([
                    ec2.InitFile.fromFileInline("c:\\cfn\\DisableESC.ps1", "./src/DisableESC.ps1"),
                    ec2.InitFile.fromFileInline("c:\\cfn\\EnableSshServer.ps1", "./src/EnableSshServer.ps1"),
                    ec2.InitPackage.msi("https://s3.amazonaws.com/aws-cli/AWSCLI64.msi"),
                    ec2.InitCommand.shellCommand('powershell.exe -File "c:\\cfn\\DisableESC.ps1"', {
                        key: "01-disableESC",
                        waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(0)),
                        ignoreErrors: true,
                    }),
                    ec2.InitCommand.shellCommand('powershell.exe -File "c:\\cfn\\EnableSshServer.ps1"', {
                        key: "02-EnableSshServer",
                        waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(0))
                    }),
                ]),
                devTools: new ec2.InitConfig(devToolConfigs),
                complete: new ec2.InitConfig([
                    ec2.InitCommand.shellCommand('cfn-signal.exe -e %ERRORLEVEL% --resource ideInstance --stack ' + this.stackId + ' --region ' + this.region, {
                        key: "00-Signal",
                        waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5))
                    })
                ]),
            },
        })

        const labRole = Role.fromRoleArn(
            this,
            'imported-role',
            `arn:aws:iam::${Stack.of(this).account}:role/LabRole`,
            {mutable: false},
        );
        const instance = new ec2.Instance(this, 'Instance', {
            vpc,
            vpcSubnets: vpc.selectSubnets({subnetType: SubnetType.PUBLIC}),
            securityGroup: ec2SecurityGroup,
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.LARGE),
            machineImage: ec2.MachineImage.genericWindows({"us-east-1": "ami-065024219ebe5213e"}),

            // Showing the most complex setup, if you have simpler requirements
            // you can use `CloudFormationInit.fromElements()`.
            init: initData,
            initOptions: {                               // Optional, how long the installation is expected to take (5 minutes by default)
                configSets: ['default'],
                timeout: Duration.minutes(60),
                ignoreFailures: false,
                includeUrl: true,
                includeRole: true,
            },
            role: labRole,
            keyName: "vockey",
        });
        instance.instance.overrideLogicalId('ideInstance');

    }
}

// for development, use account/region from cdk cli
const devEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new IdeStack(app, 'ide-stack-dev', {env: devEnv});
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();