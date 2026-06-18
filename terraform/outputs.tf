output "instance_name" {
  description = "Name of the Compute Engine instance."
  value       = google_compute_instance.opencti.name
}

output "external_ip" {
  description = "Static external IP of the OpenCTI host."
  value       = google_compute_address.opencti.address
}

output "opencti_url" {
  description = "OpenCTI web UI URL."
  value       = "http://${google_compute_address.opencti.address}:8080"
}

output "opencti_admin_email" {
  description = "Admin login email."
  value       = var.opencti_admin_email
}

output "opencti_admin_password" {
  description = "Admin login password (generated if not provided)."
  value       = local.admin_password
  sensitive   = true
}

output "opencti_admin_token" {
  description = "OpenCTI admin API token."
  value       = random_uuid.admin_token.result
  sensitive   = true
}

output "ssh_command" {
  description = "Convenience SSH command via gcloud."
  value       = "gcloud compute ssh ${google_compute_instance.opencti.name} --zone ${var.zone} --project ${var.project_id}"
}

output "bootstrap_log_hint" {
  description = "Where to watch first-boot progress."
  value       = "After SSH: sudo tail -f /var/log/opencti-bootstrap.log"
}
