export type IAMEffect = 'Allow' | 'Deny';

export interface IAMStatement {
  Sid?: string;
  Effect: IAMEffect;
  Action: string | string[];
  Resource: string | string[];
}

export interface IAMPolicy {
  Version: string;
  Statement: IAMStatement[];
}

export interface IAMPolicyInstance extends IAMPolicy {
  id: string;
  name: string;
  description?: string;
  isManaged?: boolean;
}

export interface IAMRole {
  id: string;
  name: string;
  description: string;
  attachedPolicyIds: string[];
}

export type IAMAction = 
  | 'cloudsim:*'
  | 'cloudsim:RunInstances'
  | 'cloudsim:TerminateInstances'
  | 'cloudsim:DescribeInstances'
  | 'cloudsim:RebootInstances'
  | 'cloudsim:ModifyInstanceAttribute'
  | 'cloudsim:CreateLoadBalancer'
  | 'cloudsim:DeleteLoadBalancer'
  | 'cloudsim:UpdateASG'
  | 'cloudsim:UpdateHPA'
  | 'cloudsim:UpdateVPA'
  | 'cloudsim:GetMetrics'
  | 'cloudsim:IAMFullAccess'
  | 'cloudsim:IAMReadOnlyAccess'
  | 's3:WriteObject'
  | 's3:ReadObject'
  | 's3:DeleteObject';

export const ARN_PREFIX = 'arn:cloudsim:us-east-1:123456789012';
