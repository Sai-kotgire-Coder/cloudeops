import type { Provider } from '@/store/terraformStore';
import type { SnippetEntry } from './terraformSnippets';

// Companion `variable` and `output` blocks for every resource in
// terraformSnippets.ts -- each `var.x` referenced in a main.tf snippet is
// declared here, and each resource exposes one realistic output. Together
// the three files (main.tf / variables.tf / outputs.tf) are what a real,
// minimally well-structured Terraform module looks like.

export const TERRAFORM_VARIABLES: Record<string, SnippetEntry> = {
  compute_instance: {
    aws: `variable "instance_size" {
  type        = string
  description = "EC2 instance type"
  default     = "t3.micro"
}`,
    gcp: `variable "instance_size" {
  type        = string
  description = "Compute Engine machine type"
  default     = "e2-medium"
}`,
    azure: `variable "instance_size" {
  type        = string
  description = "Azure VM size"
  default     = "Standard_B1s"
}`,
  },
  auto_scaling_group: {
    aws: `variable "max_size" {
  type        = number
  description = "Maximum number of instances in the ASG"
  default     = 5
}`,
    gcp: `variable "max_replicas" {
  type        = number
  description = "Maximum number of instances the autoscaler can create"
  default     = 5
}`,
    azure: `variable "instance_count" {
  type        = number
  description = "Number of VM instances in the scale set"
  default     = 2
}`,
  },
  load_balancer: {
    aws: `variable "internal" {
  type        = bool
  description = "Whether the load balancer is internal-only"
  default     = false
}`,
    gcp: `variable "port_range" {
  type        = string
  description = "Port the forwarding rule listens on"
  default     = "80"
}`,
    azure: `variable "lb_sku" {
  type        = string
  description = "SKU for the Azure Load Balancer"
  default     = "Standard"
}`,
  },
  virtual_network: {
    aws: `variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}`,
    gcp: `variable "network_name" {
  type        = string
  description = "Name of the VPC network"
  default     = "main-vpc"
}`,
    azure: `variable "address_space" {
  type        = list(string)
  description = "Address space for the virtual network"
  default     = ["10.0.0.0/16"]
}`,
  },
  subnet: {
    aws: `variable "subnet_cidr" {
  type        = string
  description = "CIDR block for the subnet"
  default     = "10.0.1.0/24"
}`,
    gcp: `variable "subnet_cidr" {
  type        = string
  description = "CIDR range for the subnetwork"
  default     = "10.0.1.0/24"
}`,
    azure: `variable "subnet_prefixes" {
  type        = list(string)
  description = "Address prefixes for the subnet"
  default     = ["10.0.1.0/24"]
}`,
  },
  security_group: {
    aws: `variable "allowed_port" {
  type        = number
  description = "Port allowed through the security group"
  default     = 443
}`,
    gcp: `variable "allowed_ports" {
  type        = list(string)
  description = "Ports allowed through the firewall rule"
  default     = ["443"]
}`,
    azure: `variable "allowed_port" {
  type        = string
  description = "Destination port allowed through the NSG"
  default     = "443"
}`,
  },
  nat_gateway: {
    aws: `variable "nat_name" {
  type        = string
  description = "Name tag for the NAT gateway"
  default     = "main-nat"
}`,
    gcp: `variable "nat_name" {
  type        = string
  description = "Name of the Cloud NAT configuration"
  default     = "main-nat"
}`,
    azure: `variable "sku_name" {
  type        = string
  description = "SKU for the NAT gateway"
  default     = "Standard"
}`,
  },
  object_storage: {
    aws: `variable "bucket_name" {
  type        = string
  description = "Globally-unique S3 bucket name"
  default     = "my-app-assets"
}`,
    gcp: `variable "bucket_name" {
  type        = string
  description = "Globally-unique GCS bucket name"
  default     = "my-app-assets"
}`,
    azure: `variable "storage_account_name" {
  type        = string
  description = "Globally-unique storage account name"
  default     = "myappassets"
}`,
  },
  managed_database: {
    aws: `variable "db_password" {
  type        = string
  description = "Master password for the database"
  sensitive   = true
}`,
    gcp: `variable "db_tier" {
  type        = string
  description = "Cloud SQL machine tier"
  default     = "db-f1-micro"
}`,
    azure: `variable "db_password" {
  type        = string
  description = "Administrator password for the database"
  sensitive   = true
}`,
  },
  cache_cluster: {
    aws: `variable "node_type" {
  type        = string
  description = "ElastiCache node instance type"
  default     = "cache.t3.micro"
}`,
    gcp: `variable "memory_size_gb" {
  type        = number
  description = "Memorystore instance size in GB"
  default     = 1
}`,
    azure: `variable "capacity" {
  type        = number
  description = "Redis cache capacity (0-6 depending on family)"
  default     = 1
}`,
  },
  dns_zone: {
    aws: `variable "domain_name" {
  type        = string
  description = "Domain name for the hosted zone"
  default     = "example.com"
}`,
    gcp: `variable "domain_name" {
  type        = string
  description = "DNS name for the managed zone (must end with a dot)"
  default     = "example.com."
}`,
    azure: `variable "domain_name" {
  type        = string
  description = "Domain name for the DNS zone"
  default     = "example.com"
}`,
  },
  dns_record: {
    aws: `variable "record_ttl" {
  type        = number
  description = "TTL for the DNS record, in seconds"
  default     = 300
}`,
    gcp: `variable "record_ttl" {
  type        = number
  description = "TTL for the DNS record, in seconds"
  default     = 300
}`,
    azure: `variable "record_ttl" {
  type        = number
  description = "TTL for the DNS record, in seconds"
  default     = 300
}`,
  },
  cdn_distribution: {
    aws: `variable "default_root_object" {
  type        = string
  description = "Object served for requests to the root URL"
  default     = "index.html"
}`,
    gcp: `variable "enable_cdn" {
  type        = bool
  description = "Whether to enable Cloud CDN on the backend bucket"
  default     = true
}`,
    azure: `variable "cdn_sku" {
  type        = string
  description = "Pricing tier for the CDN profile"
  default     = "Standard_Microsoft"
}`,
  },
  iam_role: {
    aws: `variable "role_name" {
  type        = string
  description = "Name of the IAM role"
  default     = "app-role"
}`,
    gcp: `variable "service_account_id" {
  type        = string
  description = "Account ID for the service account"
  default     = "app-service-account"
}`,
    azure: `variable "role_name" {
  type        = string
  description = "Name of the custom role definition"
  default     = "app-role"
}`,
  },
  kubernetes_cluster: {
    aws: `variable "cluster_version" {
  type        = string
  description = "Kubernetes version for the EKS cluster"
  default     = "1.29"
}`,
    gcp: `variable "node_count" {
  type        = number
  description = "Initial number of nodes in the cluster"
  default     = 3
}`,
    azure: `variable "node_count" {
  type        = number
  description = "Number of nodes in the default node pool"
  default     = 3
}`,
  },
  container_registry: {
    aws: `variable "image_tag_mutability" {
  type        = string
  description = "Whether image tags can be overwritten (MUTABLE or IMMUTABLE)"
  default     = "IMMUTABLE"
}`,
    gcp: `variable "registry_location" {
  type        = string
  description = "Region for the Artifact Registry repository"
  default     = "us-central1"
}`,
    azure: `variable "registry_sku" {
  type        = string
  description = "SKU for the container registry"
  default     = "Basic"
}`,
  },
  serverless_function: {
    aws: `variable "memory_size" {
  type        = number
  description = "Memory allocated to the Lambda function, in MB"
  default     = 256
}`,
    gcp: `variable "runtime" {
  type        = string
  description = "Language runtime for the Cloud Function"
  default     = "nodejs20"
}`,
    azure: `variable "node_version" {
  type        = string
  description = "Node.js version for the Function App"
  default     = "20"
}`,
  },
  message_queue: {
    aws: `variable "visibility_timeout" {
  type        = number
  description = "Visibility timeout for the SQS queue, in seconds"
  default     = 30
}`,
    gcp: `variable "topic_name" {
  type        = string
  description = "Name of the Pub/Sub topic"
  default     = "app-topic"
}`,
    azure: `variable "queue_name" {
  type        = string
  description = "Name of the Service Bus queue"
  default     = "app-queue"
}`,
  },
  secrets_manager: {
    aws: `variable "secret_name" {
  type        = string
  description = "Name of the secret in Secrets Manager"
  default     = "db-password"
}

variable "db_password" {
  type        = string
  description = "The actual secret value stored"
  sensitive   = true
}`,
    gcp: `variable "secret_id" {
  type        = string
  description = "ID of the secret in Secret Manager"
  default     = "db-password"
}`,
    azure: `variable "secret_name" {
  type        = string
  description = "Name of the secret in Key Vault"
  default     = "db-password"
}

variable "db_password" {
  type        = string
  description = "The actual secret value stored"
  sensitive   = true
}`,
  },
  monitoring_alert: {
    aws: `variable "cpu_threshold" {
  type        = number
  description = "CPU percentage that triggers the alarm"
  default     = 80
}`,
    gcp: `variable "cpu_threshold" {
  type        = number
  description = "CPU utilization ratio (0-1) that triggers the alert"
  default     = 0.8
}`,
    azure: `variable "cpu_threshold" {
  type        = number
  description = "CPU percentage that triggers the alert"
  default     = 80
}`,
  },

  github_repository: `variable "repository_name" {
  type        = string
  description = "Name of the GitHub repository"
  default     = "my-app"
}`,
  github_actions_secret: `variable "deploy_token" {
  type        = string
  description = "Token stored as an encrypted Actions secret"
  sensitive   = true
}`,
  github_actions_variable: `variable "environment_name" {
  type        = string
  description = "Value exposed to workflows as APP_ENVIRONMENT"
  default     = "production"
}`,
  github_branch_protection: `variable "required_reviews" {
  type        = number
  description = "Number of approving reviews required before merge"
  default     = 1
}`,
  github_repository_environment: `variable "environment_name" {
  type        = string
  description = "Name of the deployment environment"
  default     = "production"
}`,
  github_actions_environment_secret: `variable "db_password" {
  type        = string
  description = "Secret scoped to this environment only"
  sensitive   = true
}`,
  github_webhook: `variable "webhook_url" {
  type        = string
  description = "URL the webhook delivers events to"
  default     = "https://ci.example.com/hook"
}`,
  github_deploy_key: `variable "deploy_public_key" {
  type        = string
  description = "Public half of the SSH deploy key"
  sensitive   = true
}`,
  github_team: `variable "team_name" {
  type        = string
  description = "Name of the GitHub team"
  default     = "platform-eng"
}`,
  github_team_repository: `variable "permission" {
  type        = string
  description = "Permission level granted to the team (pull, push, admin)"
  default     = "push"
}`,
  github_repository_collaborator: `variable "collaborator_username" {
  type        = string
  description = "GitHub username to grant access to"
  default     = "octocat"
}`,
  github_repository_file: `variable "workflow_path" {
  type        = string
  description = "Path of the file to commit into the repository"
  default     = ".github/workflows/ci.yml"
}`,
};

export const TERRAFORM_OUTPUTS: Record<string, SnippetEntry> = {
  compute_instance: {
    aws: `output "instance_public_ip" {
  value = aws_instance.web.public_ip
}`,
    gcp: `output "instance_ip" {
  value = google_compute_instance.web.network_interface[0].network_ip
}`,
    azure: `output "instance_private_ip" {
  value = azurerm_linux_virtual_machine.web.private_ip_address
}`,
  },
  auto_scaling_group: {
    aws: `output "asg_name" {
  value = aws_autoscaling_group.web.name
}`,
    gcp: `output "autoscaler_id" {
  value = google_compute_region_autoscaler.web.id
}`,
    azure: `output "vmss_id" {
  value = azurerm_linux_virtual_machine_scale_set.web.id
}`,
  },
  load_balancer: {
    aws: `output "lb_dns_name" {
  value = aws_lb.web.dns_name
}`,
    gcp: `output "forwarding_rule_ip" {
  value = google_compute_forwarding_rule.web.ip_address
}`,
    azure: `output "lb_id" {
  value = azurerm_lb.web.id
}`,
  },
  virtual_network: {
    aws: `output "vpc_id" {
  value = aws_vpc.main.id
}`,
    gcp: `output "network_self_link" {
  value = google_compute_network.main.self_link
}`,
    azure: `output "vnet_id" {
  value = azurerm_virtual_network.main.id
}`,
  },
  subnet: {
    aws: `output "subnet_id" {
  value = aws_subnet.public.id
}`,
    gcp: `output "subnet_self_link" {
  value = google_compute_subnetwork.public.self_link
}`,
    azure: `output "subnet_id" {
  value = azurerm_subnet.public.id
}`,
  },
  security_group: {
    aws: `output "security_group_id" {
  value = aws_security_group.web.id
}`,
    gcp: `output "firewall_id" {
  value = google_compute_firewall.web.id
}`,
    azure: `output "nsg_id" {
  value = azurerm_network_security_group.web.id
}`,
  },
  nat_gateway: {
    aws: `output "nat_gateway_id" {
  value = aws_nat_gateway.main.id
}`,
    gcp: `output "nat_name" {
  value = google_compute_router_nat.main.name
}`,
    azure: `output "nat_gateway_id" {
  value = azurerm_nat_gateway.main.id
}`,
  },
  object_storage: {
    aws: `output "bucket_arn" {
  value = aws_s3_bucket.assets.arn
}`,
    gcp: `output "bucket_url" {
  value = google_storage_bucket.assets.url
}`,
    azure: `output "primary_blob_endpoint" {
  value = azurerm_storage_account.assets.primary_blob_endpoint
}`,
  },
  managed_database: {
    aws: `output "db_endpoint" {
  value = aws_db_instance.main.endpoint
}`,
    gcp: `output "db_connection_name" {
  value = google_sql_database_instance.main.connection_name
}`,
    azure: `output "db_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}`,
  },
  cache_cluster: {
    aws: `output "cache_cluster_id" {
  value = aws_elasticache_cluster.main.id
}`,
    gcp: `output "redis_host" {
  value = google_redis_instance.main.host
}`,
    azure: `output "redis_hostname" {
  value = azurerm_redis_cache.main.hostname
}`,
  },
  dns_zone: {
    aws: `output "zone_id" {
  value = aws_route53_zone.main.zone_id
}`,
    gcp: `output "name_servers" {
  value = google_dns_managed_zone.main.name_servers
}`,
    azure: `output "name_servers" {
  value = azurerm_dns_zone.main.name_servers
}`,
  },
  dns_record: {
    aws: `output "fqdn" {
  value = aws_route53_record.www.fqdn
}`,
    gcp: `output "record_name" {
  value = google_dns_record_set.www.name
}`,
    azure: `output "fqdn" {
  value = azurerm_dns_a_record.www.fqdn
}`,
  },
  cdn_distribution: {
    aws: `output "cdn_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}`,
    gcp: `output "backend_bucket_id" {
  value = google_compute_backend_bucket.cdn.id
}`,
    azure: `output "cdn_profile_id" {
  value = azurerm_cdn_profile.cdn.id
}`,
  },
  iam_role: {
    aws: `output "role_arn" {
  value = aws_iam_role.app.arn
}`,
    gcp: `output "service_account_email" {
  value = google_service_account.app.email
}`,
    azure: `output "role_definition_id" {
  value = azurerm_role_definition.app.role_definition_resource_id
}`,
  },
  kubernetes_cluster: {
    aws: `output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}`,
    gcp: `output "cluster_endpoint" {
  value = google_container_cluster.main.endpoint
}`,
    azure: `output "kube_config_host" {
  value     = azurerm_kubernetes_cluster.main.kube_config.0.host
  sensitive = true
}`,
  },
  container_registry: {
    aws: `output "repository_url" {
  value = aws_ecr_repository.app.repository_url
}`,
    gcp: `output "repository_id" {
  value = google_artifact_registry_repository.app.id
}`,
    azure: `output "login_server" {
  value = azurerm_container_registry.app.login_server
}`,
  },
  serverless_function: {
    aws: `output "function_arn" {
  value = aws_lambda_function.app.arn
}`,
    gcp: `output "function_id" {
  value = google_cloudfunctions_function.app.id
}`,
    azure: `output "function_app_hostname" {
  value = azurerm_linux_function_app.app.default_hostname
}`,
  },
  message_queue: {
    aws: `output "queue_url" {
  value = aws_sqs_queue.app.url
}`,
    gcp: `output "topic_id" {
  value = google_pubsub_topic.app.id
}`,
    azure: `output "queue_id" {
  value = azurerm_servicebus_queue.app.id
}`,
  },
  secrets_manager: {
    aws: `output "secret_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}`,
    gcp: `output "secret_id_out" {
  value = google_secret_manager_secret.db_password.id
}`,
    azure: `output "secret_id" {
  value = azurerm_key_vault_secret.db_password.id
}`,
  },
  monitoring_alert: {
    aws: `output "alarm_arn" {
  value = aws_cloudwatch_metric_alarm.cpu_high.arn
}`,
    gcp: `output "alert_policy_id" {
  value = google_monitoring_alert_policy.cpu_high.id
}`,
    azure: `output "metric_alert_id" {
  value = azurerm_monitor_metric_alert.cpu_high.id
}`,
  },

  github_repository: `output "repo_full_name" {
  value = github_repository.app.full_name
}`,
  github_actions_secret: `output "secret_name" {
  value = github_actions_secret.deploy_token.secret_name
}`,
  github_actions_variable: `output "variable_name" {
  value = github_actions_variable.environment.variable_name
}`,
  github_branch_protection: `output "branch_protection_id" {
  value = github_branch_protection.main.id
}`,
  github_repository_environment: `output "environment" {
  value = github_repository_environment.production.environment
}`,
  github_actions_environment_secret: `output "secret_name" {
  value = github_actions_environment_secret.db_password.secret_name
}`,
  github_webhook: `output "webhook_id" {
  value = github_repository_webhook.ci.id
}`,
  github_deploy_key: `output "deploy_key_id" {
  value = github_repository_deploy_key.ci.id
}`,
  github_team: `output "team_id" {
  value = github_team.platform.id
}`,
  github_team_repository: `output "permission" {
  value = github_team_repository.platform_app.permission
}`,
  github_repository_collaborator: `output "invitation_id" {
  value = github_repository_collaborator.reviewer.invitation_id
}`,
  github_repository_file: `output "commit_sha" {
  value = github_repository_file.ci_workflow.commit_sha
}`,
};

export function getTerraformVariables(typeId: string, provider?: Provider): string {
  const entry = TERRAFORM_VARIABLES[typeId];
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[provider ?? 'aws'] ?? Object.values(entry).find(Boolean) ?? '';
}

export function getTerraformOutputs(typeId: string, provider?: Provider): string {
  const entry = TERRAFORM_OUTPUTS[typeId];
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[provider ?? 'aws'] ?? Object.values(entry).find(Boolean) ?? '';
}
