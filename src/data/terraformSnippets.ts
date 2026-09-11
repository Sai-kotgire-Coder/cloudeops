import type { Provider } from '@/store/terraformStore';

export type SnippetEntry = string | Partial<Record<Provider, string>>;

// Real, syntactically valid Terraform HCL per resource category and provider --
// these are meant to be representative of what you'd actually find in that
// provider's Terraform Registry docs, not the simplified attrs the interactive
// config editor uses. Kept resource-block-only (no provider{}/backend{} blocks)
// since that's what a learner copies into an existing main.tf.
export const TERRAFORM_SNIPPETS: Record<string, SnippetEntry> = {
  compute_instance: {
    aws: `resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_size

  tags = {
    Name = "web-server"
  }
}`,
    gcp: `resource "google_compute_instance" "web" {
  name         = "web-server"
  machine_type = var.instance_size
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }
}`,
    azure: `resource "azurerm_linux_virtual_machine" "web" {
  name                  = "web-server"
  resource_group_name   = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  size                  = var.instance_size
  admin_username        = "azureuser"
  network_interface_ids = [azurerm_network_interface.main.id]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }
}`,
  },

  auto_scaling_group: {
    aws: `resource "aws_autoscaling_group" "web" {
  name                = "web-asg"
  desired_capacity    = 2
  min_size            = 1
  max_size            = var.max_size
  vpc_zone_identifier = [aws_subnet.public.id]

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }
}`,
    gcp: `resource "google_compute_region_autoscaler" "web" {
  name   = "web-autoscaler"
  region = "us-central1"
  target = google_compute_region_instance_group_manager.web.id

  autoscaling_policy {
    max_replicas = var.max_replicas
    min_replicas = 1

    cpu_utilization {
      target = 0.6
    }
  }
}`,
    azure: `resource "azurerm_linux_virtual_machine_scale_set" "web" {
  name                = "web-vmss"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard_B1s"
  instances           = var.instance_count
  admin_username      = "azureuser"

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }
}`,
  },

  load_balancer: {
    aws: `resource "aws_lb" "web" {
  name               = "web-lb"
  internal           = var.internal
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}`,
    gcp: `resource "google_compute_forwarding_rule" "web" {
  name                  = "web-lb"
  target                = google_compute_target_http_proxy.web.id
  port_range            = var.port_range
  load_balancing_scheme = "EXTERNAL"
}`,
    azure: `resource "azurerm_lb" "web" {
  name                = "web-lb"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.lb_sku

  frontend_ip_configuration {
    name                 = "PublicIPAddress"
    public_ip_address_id = azurerm_public_ip.web.id
  }
}`,
  },

  virtual_network: {
    aws: `resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "main-vpc"
  }
}`,
    gcp: `resource "google_compute_network" "main" {
  name                    = var.network_name
  auto_create_subnetworks = false
}`,
    azure: `resource "azurerm_virtual_network" "main" {
  name                = "main-vnet"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = var.address_space
}`,
  },

  subnet: {
    aws: `resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet_cidr
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
}`,
    gcp: `resource "google_compute_subnetwork" "public" {
  name          = "public-subnet"
  ip_cidr_range = var.subnet_cidr
  region        = "us-central1"
  network       = google_compute_network.main.id
}`,
    azure: `resource "azurerm_subnet" "public" {
  name                 = "public-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.subnet_prefixes
}`,
  },

  security_group: {
    aws: `resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = var.allowed_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}`,
    gcp: `resource "google_compute_firewall" "web" {
  name    = "allow-https"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = var.allowed_ports
  }

  source_ranges = ["0.0.0.0/0"]
}`,
    azure: `resource "azurerm_network_security_group" "web" {
  name                = "web-nsg"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = var.allowed_port
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}`,
  },

  nat_gateway: {
    aws: `resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = var.nat_name
  }
}`,
    gcp: `resource "google_compute_router_nat" "main" {
  name                               = var.nat_name
  router                             = google_compute_router.main.name
  region                             = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}`,
    azure: `resource "azurerm_nat_gateway" "main" {
  name                = "main-natgw"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku_name            = var.sku_name
}`,
  },

  object_storage: {
    aws: `resource "aws_s3_bucket" "assets" {
  bucket = var.bucket_name

  tags = {
    Environment = "production"
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}`,
    gcp: `resource "google_storage_bucket" "assets" {
  name          = var.bucket_name
  location      = "US"
  storage_class = "STANDARD"

  versioning {
    enabled = true
  }
}`,
    azure: `resource "azurerm_storage_account" "assets" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}`,
  },

  managed_database: {
    aws: `resource "aws_db_instance" "main" {
  identifier             = "app-db"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "appdb"
  username               = "appuser"
  password               = var.db_password
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.db.id]
}`,
    gcp: `resource "google_sql_database_instance" "main" {
  name             = "app-db"
  database_version = "POSTGRES_16"
  region           = "us-central1"

  settings {
    tier = var.db_tier
  }
}`,
    azure: `resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "app-db"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "16"
  administrator_login    = "appuser"
  administrator_password = var.db_password
  sku_name               = "B_Standard_B1ms"
  storage_mb             = 32768
}`,
  },

  cache_cluster: {
    aws: `resource "aws_elasticache_cluster" "main" {
  cluster_id           = "app-cache"
  engine               = "redis"
  node_type            = var.node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}`,
    gcp: `resource "google_redis_instance" "main" {
  name           = "app-cache"
  tier           = "BASIC"
  memory_size_gb = var.memory_size_gb
  region         = "us-central1"
}`,
    azure: `resource "azurerm_redis_cache" "main" {
  name                = "app-cache"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  capacity            = var.capacity
  family              = "C"
  sku_name            = "Basic"
}`,
  },

  dns_zone: {
    aws: `resource "aws_route53_zone" "main" {
  name = var.domain_name
}`,
    gcp: `resource "google_dns_managed_zone" "main" {
  name     = "main-zone"
  dns_name = var.domain_name
}`,
    azure: `resource "azurerm_dns_zone" "main" {
  name                = var.domain_name
  resource_group_name = azurerm_resource_group.main.name
}`,
  },

  dns_record: {
    aws: `resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "A"
  ttl     = var.record_ttl
  records = [aws_instance.web.public_ip]
}`,
    gcp: `resource "google_dns_record_set" "www" {
  name         = "www.example.com."
  type         = "A"
  ttl          = var.record_ttl
  managed_zone = google_dns_managed_zone.main.name
  rrdatas      = [google_compute_instance.web.network_interface[0].access_config[0].nat_ip]
}`,
    azure: `resource "azurerm_dns_a_record" "www" {
  name                = "www"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = azurerm_resource_group.main.name
  ttl                 = var.record_ttl
  records             = [azurerm_public_ip.web.ip_address]
}`,
  },

  cdn_distribution: {
    aws: `resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = var.default_root_object

  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "s3-assets"
  }

  default_cache_behavior {
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}`,
    gcp: `resource "google_compute_backend_bucket" "cdn" {
  name        = "cdn-backend"
  bucket_name = google_storage_bucket.assets.name
  enable_cdn  = var.enable_cdn
}`,
    azure: `resource "azurerm_cdn_profile" "cdn" {
  name                = "app-cdn"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.cdn_sku
}`,
  },

  iam_role: {
    aws: `resource "aws_iam_role" "app" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}`,
    gcp: `resource "google_service_account" "app" {
  account_id   = var.service_account_id
  display_name = "Application Service Account"
}`,
    azure: `resource "azurerm_role_definition" "app" {
  name  = var.role_name
  scope = data.azurerm_subscription.primary.id

  permissions {
    actions = ["Microsoft.Compute/virtualMachines/read"]
  }
}`,
  },

  kubernetes_cluster: {
    aws: `resource "aws_eks_cluster" "main" {
  name     = "app-cluster"
  role_arn = aws_iam_role.eks.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  }
}`,
    gcp: `resource "google_container_cluster" "main" {
  name               = "app-cluster"
  location           = "us-central1"
  initial_node_count = var.node_count

  node_config {
    machine_type = "e2-medium"
  }
}`,
    azure: `resource "azurerm_kubernetes_cluster" "main" {
  name                = "app-cluster"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  dns_prefix          = "app-cluster"

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = "Standard_D2_v2"
  }

  identity {
    type = "SystemAssigned"
  }
}`,
  },

  container_registry: {
    aws: `resource "aws_ecr_repository" "app" {
  name                 = "my-app"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }
}`,
    gcp: `resource "google_artifact_registry_repository" "app" {
  repository_id = "my-app"
  location      = var.registry_location
  format        = "DOCKER"
}`,
    azure: `resource "azurerm_container_registry" "app" {
  name                = "myappregistry"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.registry_sku
  admin_enabled       = false
}`,
  },

  serverless_function: {
    aws: `resource "aws_lambda_function" "app" {
  function_name = "app-function"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  filename      = "function.zip"
  memory_size   = var.memory_size
  timeout       = 10
}`,
    gcp: `resource "google_cloudfunctions_function" "app" {
  name        = "app-function"
  runtime     = var.runtime
  entry_point = "handler"
  region      = "us-central1"

  source_archive_bucket = google_storage_bucket.functions.name
  source_archive_object = google_storage_bucket_object.function_zip.name
  trigger_http           = true
}`,
    azure: `resource "azurerm_linux_function_app" "app" {
  name                       = "app-function"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  service_plan_id            = azurerm_service_plan.main.id
  storage_account_name       = azurerm_storage_account.assets.name
  storage_account_access_key = azurerm_storage_account.assets.primary_access_key

  site_config {
    application_stack {
      node_version = var.node_version
    }
  }
}`,
  },

  message_queue: {
    aws: `resource "aws_sqs_queue" "app" {
  name                       = "app-queue"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = 86400
}`,
    gcp: `resource "google_pubsub_topic" "app" {
  name = var.topic_name
}

resource "google_pubsub_subscription" "app" {
  name  = "app-subscription"
  topic = google_pubsub_topic.app.name
}`,
    azure: `resource "azurerm_servicebus_queue" "app" {
  name         = var.queue_name
  namespace_id = azurerm_servicebus_namespace.main.id
}`,
  },

  secrets_manager: {
    aws: `resource "aws_secretsmanager_secret" "db_password" {
  name = var.secret_name
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}`,
    gcp: `resource "google_secret_manager_secret" "db_password" {
  secret_id = var.secret_id

  replication {
    auto {}
  }
}`,
    azure: `resource "azurerm_key_vault_secret" "db_password" {
  name         = var.secret_name
  value        = var.db_password
  key_vault_id = azurerm_key_vault.main.id
}`,
  },

  monitoring_alert: {
    aws: `resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_threshold
}`,
    gcp: `resource "google_monitoring_alert_policy" "cpu_high" {
  display_name = "CPU Utilization High"
  combiner     = "OR"

  conditions {
    display_name = "CPU above threshold"

    condition_threshold {
      filter          = "metric.type=\\"compute.googleapis.com/instance/cpu/utilization\\""
      comparison      = "COMPARISON_GT"
      threshold_value = var.cpu_threshold
      duration        = "300s"
    }
  }
}`,
    azure: `resource "azurerm_monitor_metric_alert" "cpu_high" {
  name                = "cpu-utilization-high"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_virtual_machine.web.id]

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "Percentage CPU"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.cpu_threshold
  }
}`,
  },

  // GitHub / CI -- single real provider (integrations/github), no per-cloud variants.
  github_repository: `resource "github_repository" "app" {
  name        = var.repository_name
  description = "Application repository"
  visibility  = "private"
  auto_init   = true
}`,

  github_actions_secret: `resource "github_actions_secret" "deploy_token" {
  repository      = github_repository.app.name
  secret_name     = "DEPLOY_TOKEN"
  plaintext_value = var.deploy_token
}`,

  github_actions_variable: `resource "github_actions_variable" "environment" {
  repository    = github_repository.app.name
  variable_name = "APP_ENVIRONMENT"
  value         = var.environment_name
}`,

  github_branch_protection: `resource "github_branch_protection" "main" {
  repository_id = github_repository.app.node_id
  pattern       = "main"

  required_pull_request_reviews {
    required_approving_review_count = var.required_reviews
  }
}`,

  github_repository_environment: `resource "github_repository_environment" "production" {
  repository  = github_repository.app.name
  environment = var.environment_name

  reviewers {
    teams = [github_team.platform.id]
  }
}`,

  github_actions_environment_secret: `resource "github_actions_environment_secret" "db_password" {
  repository      = github_repository.app.name
  environment     = github_repository_environment.production.environment
  secret_name     = "DB_PASSWORD"
  plaintext_value = var.db_password
}`,

  github_webhook: `resource "github_repository_webhook" "ci" {
  repository = github_repository.app.name

  configuration {
    url          = var.webhook_url
    content_type = "json"
  }

  events = ["push"]
}`,

  github_team: `resource "github_team" "platform" {
  name        = var.team_name
  description = "Platform engineering team"
  privacy     = "closed"
}`,

  github_team_repository: `resource "github_team_repository" "platform_app" {
  team_id    = github_team.platform.id
  repository = github_repository.app.name
  permission = var.permission
}`,

  github_repository_collaborator: `resource "github_repository_collaborator" "reviewer" {
  repository = github_repository.app.name
  username   = var.collaborator_username
  permission = "push"
}`,

  github_repository_file: `resource "github_repository_file" "ci_workflow" {
  repository          = github_repository.app.name
  branch              = "main"
  file                = var.workflow_path
  content             = file("\${path.module}/workflows/ci.yml")
  commit_message      = "Add CI workflow via Terraform"
  overwrite_on_create = true
}`,

  github_deploy_key: `resource "github_repository_deploy_key" "ci" {
  repository = github_repository.app.name
  title       = "ci-deploy-key"
  key         = var.deploy_public_key
  read_only   = true
}`,
};

export function getTerraformSnippet(typeId: string, provider?: Provider): string {
  const entry = TERRAFORM_SNIPPETS[typeId];
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[provider ?? 'aws'] ?? Object.values(entry).find(Boolean) ?? '';
}
