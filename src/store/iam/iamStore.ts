import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IAMPolicyInstance, IAMRole, ARN_PREFIX } from './types';

interface IAMState {
  managedPolicies: IAMPolicyInstance[];
  customPolicies: IAMPolicyInstance[];
  
  roles: IAMRole[];
  currentUserRoleId: string;

  setCurrentUserRole: (id: string) => void;
  attachPolicyToRole: (roleId: string, policyId: string) => void;
  detachPolicyFromRole: (roleId: string, policyId: string) => void;
  createPolicy: (policy: Omit<IAMPolicyInstance, 'id' | 'isManaged'>) => void;
  deletePolicy: (id: string) => void;
}

export const DEFAULT_MANAGED_POLICIES: IAMPolicyInstance[] = [
  {
    id: 'policy-admin',
    name: 'AdministratorAccess',
    description: 'Provides full access to all resources.',
    isManaged: true,
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: '*',
        Resource: '*',
      },
    ],
  },
  {
    id: 'policy-ec2-full',
    name: 'AmazonEC2FullAccess',
    description: 'Provides full access to instances and related resources.',
    isManaged: true,
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudsim:RunInstances',
          'cloudsim:TerminateInstances',
          'cloudsim:DescribeInstances',
          'cloudsim:RebootInstances',
          'cloudsim:ModifyInstanceAttribute',
          'cloudsim:GetMetrics'
        ],
        Resource: '*',
      },
    ],
  },
  {
    id: 'policy-ec2-readonly',
    name: 'AmazonEC2ReadOnlyAccess',
    description: 'Provides read-only access to instances and metrics.',
    isManaged: true,
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudsim:DescribeInstances',
          'cloudsim:GetMetrics'
        ],
        Resource: '*',
      },
    ],
  },
  {
    id: 'policy-iam-full',
    name: 'IAMFullAccess',
    description: 'Provides full access to IAM resources.',
    isManaged: true,
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'cloudsim:IAM*',
        Resource: '*',
      },
    ],
  },
  {
    id: 'policy-s3-full',
    name: 'AmazonS3FullAccess',
    description: 'Provides full access to S3 resources.',
    isManaged: true,
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 's3:*',
        Resource: '*',
      },
    ],
  }
];

export const DEFAULT_ROLES: IAMRole[] = [
  {
    id: 'role-admin',
    name: 'AdminRole',
    description: 'Administrator access with full permissions.',
    attachedPolicyIds: ['policy-admin'],
  },
  {
    id: 'role-readonly',
    name: 'ReadOnlyRole',
    description: 'Read-only access to resources.',
    attachedPolicyIds: ['policy-ec2-readonly'],
  },
  {
    id: 'role-devops',
    name: 'DevOpsRole',
    description: 'Can manage compute and scaling.',
    attachedPolicyIds: ['policy-ec2-full'],
  },
  {
    id: 'role-app-server',
    name: 'AppServerRole',
    description: 'Typical application server role (can access S3).',
    attachedPolicyIds: ['policy-s3-full'],
  }
];

export const useIAMStore = create<IAMState>()(
  persist(
    (set) => ({
      managedPolicies: DEFAULT_MANAGED_POLICIES,
      customPolicies: [],
      roles: DEFAULT_ROLES,
      currentUserRoleId: 'role-admin',

      setCurrentUserRole: (id) => set({ currentUserRoleId: id }),

      attachPolicyToRole: (roleId, policyId) => set((state) => ({
        roles: state.roles.map(r => {
          if (r.id === roleId && !r.attachedPolicyIds.includes(policyId)) {
            return { ...r, attachedPolicyIds: [...r.attachedPolicyIds, policyId] };
          }
          return r;
        })
      })),

      detachPolicyFromRole: (roleId, policyId) => set((state) => ({
        roles: state.roles.map(r => {
          if (r.id === roleId) {
            return { ...r, attachedPolicyIds: r.attachedPolicyIds.filter(pid => pid !== policyId) };
          }
          return r;
        })
      })),

      createPolicy: (policy) => set((state) => {
        const newPolicy: IAMPolicyInstance = {
          ...policy,
          id: `policy-custom-${Date.now()}`,
          isManaged: false,
        };
        return { customPolicies: [...state.customPolicies, newPolicy] };
      }),

      deletePolicy: (id) => set((state) => ({
        customPolicies: state.customPolicies.filter((p) => p.id !== id),
        roles: state.roles.map(r => ({
          ...r,
          attachedPolicyIds: r.attachedPolicyIds.filter(pid => pid !== id)
        }))
      })),
    }),
    {
      name: 'cloudsim-iam-storage',
    }
  )
);

/**
 * Hook to get policies for a specific role
 */
export const useRolePolicies = (roleId?: string) => {
  const { managedPolicies, customPolicies, roles } = useIAMStore();
  if (!roleId) return [];
  const role = roles.find(r => r.id === roleId);
  if (!role) return [];
  
  const allAvailable = [...managedPolicies, ...customPolicies];
  return allAvailable.filter(p => role.attachedPolicyIds.includes(p.id));
};

/**
 * Hook to get policies for the current user
 */
export const useUserPolicies = () => {
  const { currentUserRoleId } = useIAMStore();
  return useRolePolicies(currentUserRoleId);
};
