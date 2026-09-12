# AWS CLI

A real terminal that drives your simulator using AWS-style CLI syntax — `aws ec2 run-instances`, `aws iam list-roles`, `aws s3 ls`, and more — operating on the exact same instances, roles, and applications as every other page in the simulator.

## What you can do here

- **Manage instances**: `describe-instances`, `run-instances`, `terminate-instances`, `reboot-instances` — the same EC2-style commands used to manage real cloud VMs.
- **Inspect IAM**: `list-roles`, `list-policies`, `attach-role-policy` — read and modify the same roles and policies covered in the [Instances](app:/instances) doc.
- **Work with simulated S3**: `ls`, `cp`, `mb` — list buckets/objects, copy files, and create buckets.
- **Check simulator-wide status and applications**: extra commands (`get apps`, `get pods`, `get deployments`, `scale app`, `status`) that report on the state of your whole simulated environment, not just AWS-native resources.

## Core concepts

### Why a real CLI, not just a UI

A dashboard button can only ever cover the specific actions someone thought to build. A CLI covers the full command surface a real cloud provider exposes, and — just as importantly — is exactly how a huge share of real infrastructure work actually happens: scripted, automatable, and reproducible in a way clicking through a console never quite is. Anything you can do here with a command, you could put in a shell script and run identically a thousand times.

### Commands change the same state everywhere else

`aws ec2 run-instances` here does exactly what clicking "Add Instance" does on [Instances](app:/instances) — same store, same result, just a different interface to it. This matters because it demonstrates something true about real cloud environments too: the CLI, the web console, and any automation you write are all just different clients talking to the same underlying system. Nothing is CLI-only or console-only; they're interchangeable views onto one reality.

### IAM from the command line

`aws iam list-roles` and `list-policies` let you inspect exactly what's defined without navigating any UI, and `attach-role-policy` lets you grant a role a new policy directly. This is precisely the kind of action that, in a real environment, would typically be scripted as part of provisioning new infrastructure rather than clicked through by hand every time — Infrastructure as Code (see the [Terraform Lab](app:/terraform)) formalizes that idea, but the underlying CLI commands are often what a Terraform provider is calling on your behalf under the hood.

## Common beginner mistakes

- **Not using `describe-instances` before acting.** Checking current state before changing it is a basic but important CLI habit — you can't safely terminate or reboot something without first confirming you're targeting the right one.
- **Expecting real AWS command syntax to be pixel-perfect everywhere.** This lab covers the core, most commonly used commands and flags — it's a strong foundation for the real CLI's shape and mental model, not a byte-for-byte reimplementation of every AWS API.
- **Forgetting IAM changes here have the same effect as changing them anywhere else.** `attach-role-policy` isn't a separate sandbox from the Instances page's role picker — it's the same data.

## Try it yourself

1. Run `aws ec2 describe-instances` to see your current fleet, then `aws ec2 run-instances` to add one.
2. Run `aws iam list-roles` and `aws iam list-policies`, then attach a policy to a role with `attach-role-policy`.
3. Try `aws s3 mb` to create a bucket, then `aws s3 cp` to copy something into it.
4. Run `status` to see a full simulator-wide summary in one command.
