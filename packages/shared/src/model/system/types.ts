export interface SystemMetrics {
  cpu?: number;
  memory?: number;
  activeConnections?: number;
  requestsPerSecond?: number;
  uptime?: number;
}

export interface AsgSummary {
  totalAsgCount: number;
  totalInstances: number;
  healthyInstances: number;
}

export interface AsgGroupOverview {
  autoScalingGroupName: string;
  environment?: string;
  serverGroup?: string;
  desiredCapacity?: number;
  instanceCount?: number;
  healthyInstances?: number;
  status?: 'healthy' | 'warning' | 'critical';
}

export interface AsgDashboardOverview {
  summary: AsgSummary;
  asgGroups: AsgGroupOverview[];
}

export interface InstanceInfo {
  instanceId: string;
  lifecycleState: string;
  healthStatus: string;
  availabilityZone?: string;
  launchTime?: string;
}

export interface LaunchTemplateInfo {
  id: string;
  version: string;
}

export type AsgLifecycleStatus = 'InService' | 'Updating' | 'Deleting';

export interface AsgDetails {
  autoScalingGroupName: string;
  environment?: string;
  serverGroup?: string;
  desiredCapacity: number;
  minSize: number;
  maxSize: number;
  status: AsgLifecycleStatus;
  subnetIds?: string[];
  availabilityZones?: string[];
  launchTemplate?: LaunchTemplateInfo;
  instances?: InstanceInfo[];
  createdTime?: string;
}

export interface AsgListItem {
  autoScalingGroupName: string;
  environment?: string;
  serverGroup?: string;
  desiredCapacity: number;
  instanceCount?: number;
  healthyInstances?: number;
}

export interface AsgListResponse {
  autoScalingGroups: AsgListItem[];
  nextToken?: string;
}

export interface InstanceListResponse {
  instances: InstanceInfo[];
}

export interface AsgCreateRequest {
  autoScalingGroupName?: string;
  desired?: number;
  min?: number;
  max?: number;
  environment?: string;
  serverGroup?: string;
  launchTemplateId?: string;
  launchTemplateVersion?: string;
  subnetIds?: string[];
  availabilityZones?: string[];
}

export interface AsgCreateResponse {
  message?: string;
  autoScalingGroupName?: string;
  status?: string;
}

export interface OperationResponse {
  success?: boolean;
  message?: string;
  requestId?: string;
}

export interface AsgCapacityRequest {
  desired?: number;
  min?: number;
  max?: number;
}
