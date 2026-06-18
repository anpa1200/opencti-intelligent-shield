###############################################################################
# Core GCP placement
###############################################################################

variable "project_id" {
  description = "GCP project ID to deploy into."
  type        = string
}

variable "region" {
  description = "GCP region."
  type        = string
  default     = "europe-west1"
}

variable "zone" {
  description = "GCP zone (must be inside var.region)."
  type        = string
  default     = "europe-west1-b"
}

###############################################################################
# Compute sizing
###############################################################################

variable "machine_type" {
  description = <<-EOT
    Compute Engine machine type for the OpenCTI host.
    The full stack (Elasticsearch + OpenCTI 8GB heap + 3 workers + connectors)
    needs plenty of RAM. e2-standard-8 (8 vCPU / 32 GB) is the comfortable
    default; e2-standard-4 (16 GB) is the bare minimum and may be tight.
  EOT
  type        = string
  default     = "e2-standard-8"
}

variable "boot_disk_size_gb" {
  description = "Boot disk size in GB. Elasticsearch + MinIO data live here."
  type        = number
  default     = 200
}

variable "boot_disk_type" {
  description = "Boot disk type (pd-ssd recommended for Elasticsearch)."
  type        = string
  default     = "pd-ssd"
}

variable "boot_image" {
  description = "Boot image for the VM."
  type        = string
  default     = "ubuntu-os-cloud/ubuntu-2204-lts"
}

###############################################################################
# Networking / access control
###############################################################################

variable "ssh_source_ranges" {
  description = "CIDR ranges allowed to reach SSH (22). Restrict this in production."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "app_source_ranges" {
  description = <<-EOT
    CIDR ranges allowed to reach the application ports (OpenCTI UI 8080 and,
    if enabled, MinIO/RabbitMQ/Kibana consoles). Restrict to your IP ideally.
  EOT
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "expose_admin_consoles" {
  description = "If true, also open MinIO (9001), RabbitMQ (15672), Kibana (5601) and ES (9200) to app_source_ranges."
  type        = bool
  default     = false
}

###############################################################################
# Application source
###############################################################################

variable "repo_url" {
  description = "Git URL of the opencti-intelligent-shield repo to clone on the VM."
  type        = string
  default     = "https://github.com/anpa1200/opencti-intelligent-shield.git"
}

variable "repo_branch" {
  description = "Branch of the repo to check out."
  type        = string
  default     = "main"
}

variable "enable_kibana" {
  description = "Bring up the Kibana overlay (docker-compose.kibana.yml) alongside the core stack."
  type        = bool
  default     = false
}

variable "enable_ai_connector" {
  description = "Build and start the Claude AI enrichment connector (requires anthropic_api_key)."
  type        = bool
  default     = true
}

###############################################################################
# OpenCTI / application configuration
###############################################################################

variable "opencti_admin_email" {
  description = "OpenCTI admin login email."
  type        = string
  default     = "admin@opencti.local"
}

variable "opencti_admin_password" {
  description = "OpenCTI admin password. Leave empty to auto-generate a strong one (see outputs)."
  type        = string
  default     = ""
  sensitive   = true
}

###############################################################################
# External API keys (optional). Leave empty to skip / fill in later in .env.
###############################################################################

variable "anthropic_api_key" {
  description = "Anthropic (Claude) API key for the AI enrichment connector."
  type        = string
  default     = ""
  sensitive   = true
}

variable "alienvault_api_key" {
  description = "AlienVault OTX API key."
  type        = string
  default     = ""
  sensitive   = true
}

variable "nvd_api_key" {
  description = "NVD (CVE connector) API key."
  type        = string
  default     = ""
  sensitive   = true
}

###############################################################################
# Misc
###############################################################################

variable "name_prefix" {
  description = "Prefix used for all created resource names."
  type        = string
  default     = "opencti"
}

variable "enable_apis" {
  description = "Whether Terraform should enable the Compute Engine API on the project."
  type        = bool
  default     = true
}

variable "labels" {
  description = "Labels applied to created resources."
  type        = map(string)
  default = {
    app = "opencti-intelligent-shield"
  }
}
