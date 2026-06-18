###############################################################################
# APIs
###############################################################################

resource "google_project_service" "compute" {
  count              = var.enable_apis ? 1 : 0
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

###############################################################################
# Generated secrets
###############################################################################

# Connector instance IDs (UUID4). Not used for auth, only identify the
# connector instance in the OpenCTI UI.
locals {
  connector_keys = [
    "mitre",
    "cve",
    "alienvault",
    "malwarebazaar",
    "urlhaus",
    "feodotracker",
    "ai_enrichment",
    "import_document",
    "threatfox",
  ]
}

resource "random_uuid" "connector" {
  for_each = toset(local.connector_keys)
}

resource "random_uuid" "admin_token" {}

# Strong service passwords. Restrict special chars so they are safe inside a
# dotenv file and docker compose ${VAR} interpolation.
resource "random_password" "elastic" {
  length           = 28
  special          = true
  override_special = "_-."
}

resource "random_password" "redis" {
  length           = 28
  special          = true
  override_special = "_-."
}

resource "random_password" "minio" {
  length           = 28
  special          = true
  override_special = "_-."
}

resource "random_password" "rabbitmq" {
  length           = 28
  special          = true
  override_special = "_-."
}

resource "random_password" "app_secret" {
  length           = 40
  special          = true
  override_special = "_-."
}

resource "random_password" "admin" {
  length           = 24
  special          = true
  override_special = "_-."
}

locals {
  admin_password = var.opencti_admin_password != "" ? var.opencti_admin_password : random_password.admin.result
  base_url       = "http://${google_compute_address.opencti.address}:8080"

  # Rendered .env content shipped to the VM (base64 in metadata to dodge quoting).
  env_file = templatefile("${path.module}/templates/env.tftpl", {
    admin_email        = var.opencti_admin_email
    admin_password     = local.admin_password
    admin_token        = random_uuid.admin_token.result
    base_url           = local.base_url
    app_secret         = random_password.app_secret.result
    elastic_password   = random_password.elastic.result
    redis_password     = random_password.redis.result
    minio_user         = "opencti"
    minio_password     = random_password.minio.result
    rabbitmq_user      = "opencti"
    rabbitmq_password  = random_password.rabbitmq.result
    connector_ids      = { for k, v in random_uuid.connector : k => v.result }
    alienvault_api_key = var.alienvault_api_key != "" ? var.alienvault_api_key : "CHANGE_ME"
    nvd_api_key        = var.nvd_api_key != "" ? var.nvd_api_key : "CHANGE_ME"
    anthropic_api_key  = var.anthropic_api_key != "" ? var.anthropic_api_key : "CHANGE_ME"
  })

  startup_script = templatefile("${path.module}/templates/startup.sh.tftpl", {
    repo_url            = var.repo_url
    repo_branch         = var.repo_branch
    enable_kibana       = var.enable_kibana
    enable_ai_connector = var.enable_ai_connector
    env_file_b64        = base64encode(local.env_file)
  })
}

###############################################################################
# Networking
###############################################################################

resource "google_compute_network" "opencti" {
  name                    = "${var.name_prefix}-net"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "opencti" {
  name          = "${var.name_prefix}-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = var.region
  network       = google_compute_network.opencti.id
}

resource "google_compute_address" "opencti" {
  name         = "${var.name_prefix}-ip"
  region       = var.region
  address_type = "EXTERNAL"
}

resource "google_compute_firewall" "ssh" {
  name      = "${var.name_prefix}-allow-ssh"
  network   = google_compute_network.opencti.id
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.ssh_source_ranges
  target_tags   = ["${var.name_prefix}-host"]
}

resource "google_compute_firewall" "ui" {
  name      = "${var.name_prefix}-allow-ui"
  network   = google_compute_network.opencti.id
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = var.app_source_ranges
  target_tags   = ["${var.name_prefix}-host"]
}

resource "google_compute_firewall" "admin_consoles" {
  count     = var.expose_admin_consoles ? 1 : 0
  name      = "${var.name_prefix}-allow-admin-consoles"
  network   = google_compute_network.opencti.id
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["9001", "15672", "5601", "9200"]
  }

  source_ranges = var.app_source_ranges
  target_tags   = ["${var.name_prefix}-host"]
}

###############################################################################
# Compute instance
###############################################################################

resource "google_compute_instance" "opencti" {
  name         = "${var.name_prefix}-host"
  machine_type = var.machine_type
  zone         = var.zone
  tags         = ["${var.name_prefix}-host"]
  labels       = var.labels

  boot_disk {
    initialize_params {
      image = var.boot_image
      size  = var.boot_disk_size_gb
      type  = var.boot_disk_type
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.opencti.id
    access_config {
      nat_ip = google_compute_address.opencti.address
    }
  }

  metadata = {
    startup-script = local.startup_script
  }

  scheduling {
    preemptible       = false
    automatic_restart = true
  }

  depends_on = [google_project_service.compute]

  lifecycle {
    ignore_changes = [boot_disk[0].initialize_params[0].image]
  }
}
