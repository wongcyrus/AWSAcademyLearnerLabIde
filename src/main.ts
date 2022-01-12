import {App, Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {InstanceClass, InstanceSize, InstanceType, WindowsVersion} from 'aws-cdk-lib/aws-ec2';


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

        const initData = ec2.CloudFormationInit.fromElements(
            ec2.InitFile.fromAsset("c:\\cfn\\DisableESC.ps1", "./DisableESC.ps1"),
            ec2.InitFile.fromAsset("c:\\cfn\\EnableSshServer.ps1", "./EnableSshServer.ps1"),
            ec2.InitPackage.msi("https://s3.amazonaws.com/aws-cli/AWSCLI64.msi"),
            ec2.InitCommand.shellCommand('powershell.exe [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://chocolatey.org/install.ps1\'))', { key: "0-InstallChoco", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) }),
            ec2.InitCommand.shellCommand('powershell.exe choco install python3 -y', { key: "1-installPython3", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) }),
            ec2.InitCommand.shellCommand('powershell.exe choco install oraclejdk -y', { key: "2-installOraclejdk", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) }),
            ec2.InitCommand.shellCommand('powershell.exe choco install googlechrome -y', { key: "3-installGooglechrome", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) }),
            ec2.InitCommand.shellCommand('powershell.exe choco install microsoft-edge -y', { key: "4-installEdge", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) }),
            ec2.InitCommand.shellCommand('powershell.exe choco install 7zip.install -y', { key: "5-install7z", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) }),
            ec2.InitCommand.shellCommand('powershell.exe choco install vscode -y', { key: "6-installVSCode", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) }),
            ec2.InitCommand.shellCommand('powershell.exe choco install pycharm -y', { key: "7-installPycharm", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) }),
            ec2.InitCommand.shellCommand('powershell.exe -File "c:\\cfn\\DisableESC.ps1"', { key: "8-disableESC", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(10)) }),
            ec2.InitCommand.shellCommand('powershell.exe -File "c:\\cfn\\EnableSshServer.ps1"', { key: "8-disableESC", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(10)) }),
            ec2.InitCommand.shellCommand('cfn-signal.exe -e %ERRORLEVEL% --resource ideInstance --stack ' + this.stackId + ' --region ' + this.region, { key: "91-Signal", waitAfterCompletion: ec2.InitCommandWaitDuration.of(Duration.seconds(5)) })
        )

        var instance =new ec2.Instance(this, 'Instance', {
            vpc,
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.LARGE),
            machineImage: ec2.MachineImage.latestWindows(WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE),

            // Showing the most complex setup, if you have simpler requirements
            // you can use `CloudFormationInit.fromElements()`.
            init: initData,
            initOptions: {
                // Optional, which configsets to activate (['default'] by default)
                configSets: ['default'],

                // Optional, how long the installation is expected to take (5 minutes by default)
                timeout: Duration.minutes(30),

                // Optional, whether to include the --url argument when running cfn-init and cfn-signal commands (false by default)
                includeUrl: true,

                // Optional, whether to include the --role argument when running cfn-init and cfn-signal commands (false by default)
                includeRole: true,
            },
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