# OpenCTI — End-to-End AI-Driven Deployment Guide

---

## Table of Contents

1. [What is OpenCTI?](#1-what-is-opencti)
2. [Core Capabilities](#2-core-capabilities)
3. [Architecture Overview](#3-architecture-overview)
4. [Threat Intelligence Feeds](#4-threat-intelligence-feeds)
5. [AI Integration Layer](#5-ai-integration-layer)
6. [Prerequisites](#6-prerequisites)
7. [Docker Compose Deployment](#7-docker-compose-deployment)
8. [Connector Configuration](#8-connector-configuration)
9. [AI-Driven Enrichment Pipeline](#9-ai-driven-enrichment-pipeline)
10. [Post-Deployment Hardening](#10-post-deployment-hardening)
11. [Operational Runbook](#11-operational-runbook)
12. [Troubleshooting](#12-troubleshooting)
13. [Usage Examples](#13-usage-examples)

---

## 1. What is OpenCTI?

**OpenCTI** (Open Cyber Threat Intelligence) is an open-source platform developed by Filigran (formerly a project of ANSSI, the French national cybersecurity agency) for structuring, storing, organizing, visualizing, and sharing cyber threat intelligence (CTI).

It implements the **STIX 2.1** (Structured Threat Information eXpression) standard as its native data model and exposes a **GraphQL API** for all read/write operations. Every object — threat actors, campaigns, malware, vulnerabilities, indicators, attack patterns — is stored as a STIX Domain Object (SDO) or STIX Relationship Object (SRO) backed by two databases:

- **ElasticSearch / OpenSearch** — full-text search and analytics
- **Apache Cassandra (via JanusGraph)** — graph relationship storage

### Why OpenCTI?

| Without OpenCTI | With OpenCTI |
|---|---|
| IOCs scattered across spreadsheets and feeds | Single normalized graph of all intelligence |
| No relationship between actors, TTPs, malware | STIX relationships: "APT28 uses Mimikatz via T1003" |
| Manual feed ingestion and deduplication | Automated connectors with deduplication |
| No provenance tracking | Every object tagged with source, confidence, TLP |
| Hard to share with partners | Native TAXII 2.1 server + sharing groups |

---

## 2. Core Capabilities

### 2.1 Knowledge Graph
- Entities: Threat Actors, Intrusion Sets, Campaigns, Malware, Tools, Vulnerabilities (CVE), Attack Patterns (MITRE ATT&CK), Courses of Action, Sectors, Countries, Organizations
- Relationships modelled as first-class STIX SROs with confidence scores, date ranges, and TLP markings
- Diamond Model and Kill Chain views built in

### 2.2 Indicator Management
- IOC lifecycle: `valid_from` / `valid_until` with automatic expiry
- Detection rule generation (Sigma, YARA, Snort)
- Bulk import via STIX, CSV, OpenIOC, MISP formats
- Scoring and confidence weighting per source

### 2.3 MITRE ATT&CK Navigator Integration
- Full ATT&CK Enterprise / Mobile / ICS matrices
- Heatmaps of technique usage per threat actor or campaign
- Gap analysis against your current detection coverage

### 2.4 Threat Actor Profiling
- Attributed aliases, motivations (financial, espionage, hacktivism)
- Geo and sector targeting mapped on world map
- Timeline of campaigns and malware usage

### 2.5 Automation & Rules Engine
- **Rules Engine (CE)**: 20 built-in inference rules that automatically propagate relationships, attributions, sightings, and locations as data arrives — no configuration needed beyond enabling them
- **Playbooks (EE only)**: UI-based trigger/action pipelines — not available in Community Edition
- Python SDK (`pycti`) for custom automation via `helper.listen()` event stream
- Webhook support for external integrations

### 2.6 Collaboration & Sharing
- Role-based access control (RBAC) with groups and organizations
- TLP (Traffic Light Protocol) enforcement at object level
- TAXII 2.1 server — push feeds to SIEMs, firewalls, EDR platforms
- Sharing with partner organizations via federated instances

### 2.7 Dashboard & Reporting
- Customizable dashboards with widget library
- PDF report generation
- Timeline, matrix, and entity views
- Attack path visualization

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenCTI Stack                            │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │  OpenCTI     │   │  RabbitMQ    │   │  Redis (Cache)    │   │
│  │  Platform    │◄──│  (Message    │   │  + Sessions       │   │
│  │  (Node.js)   │   │   Broker)    │   └───────────────────┘   │
│  └──────┬───────┘   └──────┬───────┘                           │
│         │                  │                                    │
│  ┌──────▼───────┐   ┌──────▼───────────────────────────────┐   │
│  │ ElasticSearch│   │  Connectors (Python workers)         │   │
│  │ (Search +    │   │  - MISP / AlienVault OTX             │   │
│  │  Analytics)  │   │  - MITRE ATT&CK / CVE / NVD          │   │
│  └──────────────┘   │  - Shodan / VirusTotal / Abuse.ch    │   │
│                     │  - TAXII clients / ISAC feeds         │   │
│  ┌──────────────┐   │  - Custom AI enrichment connector    │   │
│  │  MinIO       │   └──────────────────────────────────────┘   │
│  │  (File store)│                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼ Consumes via
┌────────────────────┐    ┌─────────────────────────┐
│  TAXII 2.1 Server  │    │  GraphQL API / REST API  │
│  (push to SIEM,    │    │  (custom integrations,   │
│   firewalls, EDR)  │    │   AI pipeline, SOAR)     │
└────────────────────┘    └─────────────────────────┘
```

---

## 4. Threat Intelligence Feeds

### 4.1 Free / Open-Source Feeds

| Feed | Connector | Data Types | Setup |
|---|---|---|---|
| **MITRE ATT&CK** | `opencti/connector-mitre` | Techniques, Mitigations, Groups, Software | API key not needed |
| **CVE / NVD** | `opencti/connector-cve` | Vulnerabilities | NVD API key (free) |
| **AlienVault OTX** | `opencti/connector-alienvault` | IOCs, Pulses, Malware families | Free OTX account |
| **Abuse.ch SSL Blacklist** | `opencti/connector-abuse-ssl` | Malicious SSL certs | Free |
| **Abuse.ch URLhaus** | `opencti/connector-urlhaus` | Malicious URLs | Free |
| **Shodan InternetDB** | `opencti/connector-shodan` | IP enrichment | Free tier |
| **CIRCL MISP feeds** | `opencti/connector-misp-feed` | STIX/MISP bundles | Free |
| **CyberCrime-Tracker** | `opencti/connector-cybercrime-tracker` | C2 panels | Free |
| **OpenPhish** | `opencti/connector-openphish` | Phishing URLs | Free |
| **DigitalSide IT-ISAC** | `opencti/connector-misp-feed` (custom URL) | IOCs | Free |

### 4.2 Commercial Feeds (require license/API key)

| Feed | Connector | Strengths |
|---|---|---|
| **MISP (self-hosted)** | `opencti/connector-misp` | Community sharing, custom events |
| **VirusTotal** | `opencti/connector-virustotal` | File/URL/IP enrichment |
| **Mandiant Threat Intel** | `opencti/connector-mandiant` | APT intelligence, deep reports |
| **Recorded Future** | `opencti/connector-recordedfuture` | Risk scores, dark web |
| **CrowdStrike Falcon Intel** | `opencti/connector-crowdstrike` | Actor tracking, IOCs |
| **Sekoia.io** | `opencti/connector-sekoia` | European threat landscape |
| **ThreatConnect** | `opencti/connector-threatconnect` | Enterprise TI management |
| **Intel 471** | `opencti/connector-intel471` | Underground forums, actors |

### 4.3 ISAC / Government Feeds

| Source | Method | Access |
|---|---|---|
| **US-CERT / CISA AIS** | TAXII 2.1 client | Free (US entities) |
| **FS-ISAC** | TAXII 2.1 / STIX | Financial sector membership |
| **H-ISAC** | TAXII 2.1 | Healthcare membership |
| **NATO MISP** | MISP sync | NATO partners |
| **ENISA** | STIX bundles | EU public |

### 4.4 Feed Priority and TLP Assignment

```yaml
# Recommended TLP assignment by source
feeds:
  - source: mitre_attack
    tlp: WHITE          # public, shareable
    confidence: 90
  - source: alienvault_otx
    tlp: GREEN          # community sharing
    confidence: 60
  - source: mandiant
    tlp: AMBER          # restricted to org
    confidence: 85
  - source: internal_soc
    tlp: RED            # internal only
    confidence: 95
```

---

## 5. AI Integration Layer

This is the "AI-driven" layer on top of standard OpenCTI — a custom connector and MCP server that adds:

### 5.1 AI Enrichment Connector (Claude API)
- On every new `Report`, `Malware`, or `Threat-Actor` ingested → call Claude API
- Extract structured STIX entities from unstructured text (PDFs, blog posts)
- Summarize long reports into 3-sentence executive briefs
- Score indicator relevance against your organization's sector profile
- Suggest ATT&CK technique mappings from narrative descriptions

### 5.2 CTI MCP Server
- Located at `/home/andrey/git-projects/cti-mcp-server`
- Exposes OpenCTI graph as tool calls accessible to Claude
- Enables natural language querying of the threat intelligence graph

### 5.3 AI Pipeline Architecture

```
New Report ingested
        │
        ▼
[AI Enrichment Connector]
        │
        ├─► Claude API: Extract entities → creates STIX SDOs
        ├─► Claude API: Map to ATT&CK techniques
        ├─► Claude API: Generate executive summary
        └─► Claude API: Score severity for your sector
                │
                ▼
        Update Report in OpenCTI
        (summary, related entities, confidence scores)
```

---

## 6. Prerequisites

### 6.1 Hardware (minimum production)

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 8 cores | 16 cores |
| RAM | 16 GB | 32 GB |
| Disk | 200 GB SSD | 1 TB NVMe |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 6.2 Software

```bash
# Install Docker Engine (Ubuntu 22.04)
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker compose version
```

### 6.3 System Tuning (required for ElasticSearch)

```bash
# ElasticSearch requires high vm.max_map_count
sudo sysctl -w vm.max_map_count=1048575
echo "vm.max_map_count=1048575" | sudo tee -a /etc/sysctl.conf

# Increase file descriptor limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

---

## 7. Docker Compose Deployment

### 7.1 Directory Structure

```
/home/andrey/openCTI/
├── .env                          # secrets and config
├── docker-compose.yml            # core stack
├── docker-compose.connectors.yml # feed connectors
├── docker-compose.ai.yml         # AI enrichment connector
├── patches/
│   └── back.js                   # ILM race condition fix (ES 8.13 + OpenCTI 6.2.0)
└── connectors/
    └── ai-enrichment/            # custom AI connector source
```

### 7.2 Environment File

```bash
cat > /home/andrey/openCTI/.env << 'EOF'
# === Core ===
OPENCTI_ADMIN_EMAIL=admin@opencti.local
OPENCTI_ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
OPENCTI_ADMIN_TOKEN=CHANGE_ME_UUID4_TOKEN
OPENCTI_BASE_URL=http://localhost:8080

# === Secrets ===
APP__ADMIN__TOKEN=CHANGE_ME_UUID4_TOKEN
APP__SECRET_KEY=CHANGE_ME_SECRET

# === ElasticSearch ===
# NOTE: key is ELASTIC_PASSWORD, not ELASTIC_AUTH
ELASTIC_PASSWORD=CHANGE_ME_ELASTIC_PASS

# === Redis ===
REDIS_PASSWORD=opencti

# === MinIO ===
MINIO_ROOT_USER=opencti
MINIO_ROOT_PASSWORD=CHANGE_ME_MINIO_PASS

# === RabbitMQ ===
RABBITMQ_DEFAULT_USER=opencti
RABBITMQ_DEFAULT_PASS=CHANGE_ME_RABBITMQ_PASS

# === Connector IDs (unique UUID4 per connector — NOT used for auth) ===
CONNECTOR_MITRE_TOKEN=CHANGE_ME_UUID4
CONNECTOR_CVE_TOKEN=CHANGE_ME_UUID4
CONNECTOR_ALIENVAULT_TOKEN=CHANGE_ME_UUID4
CONNECTOR_ABUSE_SSL_TOKEN=CHANGE_ME_UUID4
CONNECTOR_URLHAUS_TOKEN=CHANGE_ME_UUID4
CONNECTOR_AI_ENRICHMENT_TOKEN=CHANGE_ME_UUID4

# === External API keys ===
ALIENVAULT_API_KEY=your_otx_key_here
NVD_API_KEY=your_nvd_api_key_here     # UUID format from nvd.nist.gov/developers/request-an-api-key
ANTHROPIC_API_KEY=your_claude_api_key_here
EOF

# Generate unique UUIDs for connector IDs
python3 -c "import uuid; [print(uuid.uuid4()) for _ in range(8)]"
```

### 7.3 Core Stack — docker-compose.yml

```yaml
version: "3"

services:
  redis:
    image: redis:7.2
    restart: always
    volumes:
      - redisdata:/data
    command: redis-server --requirepass ${REDIS_PASSWORD:-opencti}

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    volumes:
      - esdata:/usr/share/elasticsearch/data
    environment:
      - discovery.type=single-node
      - xpack.ml.enabled=false
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD:-CHANGE_ME}
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - cluster.routing.allocation.disk.threshold_enabled=false
    ulimits:
      memlock:
        soft: -1
        hard: -1
    restart: always

  minio:
    image: minio/minio:RELEASE.2024-01-16T16-07-38Z
    volumes:
      - miniodata:/data
    ports:
      - "9001:9001"   # console
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-opencti}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-CHANGE_ME}
    command: server /data --console-address ":9001"
    restart: always

  rabbitmq:
    image: rabbitmq:3.13-management
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_DEFAULT_USER:-opencti}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_DEFAULT_PASS:-CHANGE_ME}
      RABBITMQ_NODENAME: rabbit01@localhost
    volumes:
      - rabbitmqdata:/var/lib/rabbitmq
    restart: always

  opencti:
    image: opencti/platform:6.2.0
    environment:
      NODE_OPTIONS: --max-old-space-size=8096
      APP__PORT: 8080
      APP__BASE_URL: ${OPENCTI_BASE_URL:-http://localhost:8080}
      APP__ADMIN__EMAIL: ${OPENCTI_ADMIN_EMAIL}
      APP__ADMIN__PASSWORD: ${OPENCTI_ADMIN_PASSWORD}
      APP__ADMIN__TOKEN: ${OPENCTI_ADMIN_TOKEN}
      APP__APP_LOGS__LOGS_LEVEL: error
      REDIS__HOSTNAME: redis
      REDIS__PORT: 6379
      REDIS__USE_SSL: "false"
      REDIS__PASSWORD: ${REDIS_PASSWORD:-opencti}
      ELASTICSEARCH__URL: http://elasticsearch:9200
      ELASTICSEARCH__USERNAME: elastic
      ELASTICSEARCH__PASSWORD: ${ELASTIC_PASSWORD:-CHANGE_ME}
      MINIO__ENDPOINT: minio
      MINIO__PORT: 9000
      MINIO__USE_SSL: "false"
      MINIO__ACCESS_KEY: ${MINIO_ROOT_USER:-opencti}
      MINIO__SECRET_KEY: ${MINIO_ROOT_PASSWORD:-CHANGE_ME}
      RABBITMQ__HOSTNAME: rabbitmq
      RABBITMQ__PORT: 5672
      RABBITMQ__USERNAME: ${RABBITMQ_DEFAULT_USER:-opencti}
      RABBITMQ__PASSWORD: ${RABBITMQ_DEFAULT_PASS:-CHANGE_ME}
      SMTP__HOSTNAME: localhost
      PROVIDERS__LOCAL__STRATEGY: LocalStrategy
    volumes:
      - ./patches/back.js:/opt/opencti/build/back.js:ro
    ports:
      - "8080:8080"
    depends_on:
      - redis
      - elasticsearch
      - minio
      - rabbitmq
    restart: always

  worker:
    image: opencti/worker:6.2.0
    environment:
      OPENCTI_URL: http://opencti:8080
      OPENCTI_TOKEN: ${OPENCTI_ADMIN_TOKEN}
      WORKER_LOG_LEVEL: error
    depends_on:
      - opencti
    deploy:
      mode: replicated
      replicas: 3
    restart: always

volumes:
  esdata:
  redisdata:
  miniodata:
  rabbitmqdata:
networks:
  default:
    name: opencti_network
    external: true
```

### 7.4 Connectors — docker-compose.connectors.yml

```yaml
version: "3"

services:
  # MITRE ATT&CK (no API key needed)
  connector-mitre:
    image: opencti/connector-mitre:6.2.0
    environment:
      OPENCTI_URL: http://opencti:8080
      OPENCTI_TOKEN: ${OPENCTI_ADMIN_TOKEN}
      CONNECTOR_ID: ${CONNECTOR_MITRE_TOKEN}
      CONNECTOR_NAME: "MITRE ATT&CK"
      CONNECTOR_SCOPE: "marking-definition,identity,attack-pattern,course-of-action,intrusion-set,campaign,malware,tool,vulnerability,x-mitre-matrix,x-mitre-tactic,x-mitre-collection"
      CONNECTOR_CONFIDENCE_LEVEL: 75
      CONNECTOR_UPDATE_EXISTING_DATA: "true"
      CONNECTOR_LOG_LEVEL: error
      MITRE_REMOVE_STATEMENT_MARKING: "true"
      MITRE_INTERVAL: 7  # days between full refresh
    restart: always

  # CVE / NVD Vulnerabilities
  # NOTE: connector-cve 6.2.0 has a bug — it sends the API key as "Bearer: <key>" header
  # but NVD 2.0 requires "apiKey: <key>" header. Patch api.py via volume mount to fix.
  connector-cve:
    image: opencti/connector-cve:6.2.0
    volumes:
      - ./patches/cve/api.py:/opt/opencti-connector-cve/services/client/api.py:ro
    environment:
      OPENCTI_URL: http://opencti:8080
      OPENCTI_TOKEN: ${OPENCTI_ADMIN_TOKEN}
      CONNECTOR_ID: ${CONNECTOR_CVE_TOKEN}
      CONNECTOR_NAME: "Common Vulnerabilities and Exposures"
      CONNECTOR_SCOPE: "identity,vulnerability"
      CONNECTOR_CONFIDENCE_LEVEL: 75
      CONNECTOR_LOG_LEVEL: error
      CONNECTOR_UPDATE_EXISTING_DATA: "true"
      CVE_BASE_URL: "https://services.nvd.nist.gov/rest/json/cves"
      CVE_API_KEY: ${NVD_API_KEY}
      CVE_MAX_DATE_RANGE: 120
      CVE_MAINTAIN_DATA: "true"
      CVE_INTERVAL: 2
    restart: always

  # AlienVault OTX
  connector-alienvault:
    image: opencti/connector-alienvault:6.2.0
    environment:
      OPENCTI_URL: http://opencti:8080
      OPENCTI_TOKEN: ${OPENCTI_ADMIN_TOKEN}
      CONNECTOR_ID: ${CONNECTOR_ALIENVAULT_TOKEN}
      CONNECTOR_NAME: "AlienVault OTX"
      CONNECTOR_SCOPE: "stix-core-object"
      CONNECTOR_CONFIDENCE_LEVEL: 40
      CONNECTOR_LOG_LEVEL: error
      ALIENVAULT_BASE_URL: "https://otx.alienvault.com"
      ALIENVAULT_API_KEY: ${ALIENVAULT_API_KEY}
      ALIENVAULT_TLP: "White"
      ALIENVAULT_CREATE_OBSERVABLES: "true"
      ALIENVAULT_CREATE_INDICATORS: "true"
      ALIENVAULT_PULSE_START_TIMESTAMP: "2020-01-01T00:00:00"
      ALIENVAULT_REPORT_STATUS: "New"
      ALIENVAULT_REPORT_TYPE: "threat-report"
      ALIENVAULT_GUESS_MALWARE: "false"
      ALIENVAULT_GUESS_CVE: "false"
      ALIENVAULT_INTERVAL: 30   # minutes
    restart: always

  # Abuse.ch SSL Blacklist
  # NOTE: connector-malwarebazaar does not exist at 6.2.0 — use connector-abuse-ssl
  connector-abuse-ssl:
    image: opencti/connector-abuse-ssl:6.2.0
    environment:
      OPENCTI_URL: http://opencti:8080
      OPENCTI_TOKEN: ${OPENCTI_ADMIN_TOKEN}
      CONNECTOR_ID: ${CONNECTOR_ABUSE_SSL_TOKEN}
      CONNECTOR_NAME: "Abuse.ch SSL Blacklist"
      CONNECTOR_SCOPE: "stix-core-object"
      CONNECTOR_CONFIDENCE_LEVEL: 50
      CONNECTOR_LOG_LEVEL: error
      ABUSE_SSL_URL: "https://sslbl.abuse.ch/blacklist/sslblacklist.csv"
      ABUSE_SSL_INTERVAL: 30  # minutes
    restart: always

  # Abuse.ch URLhaus
  connector-urlhaus:
    image: opencti/connector-urlhaus:6.2.0
    environment:
      OPENCTI_URL: http://opencti:8080
      OPENCTI_TOKEN: ${OPENCTI_ADMIN_TOKEN}
      CONNECTOR_ID: ${CONNECTOR_URLHAUS_TOKEN}
      CONNECTOR_NAME: "Abuse.ch URLhaus"
      CONNECTOR_SCOPE: "stix-core-object"
      CONNECTOR_CONFIDENCE_LEVEL: 40
      CONNECTOR_LOG_LEVEL: error
      URLHAUS_CSV_URL: "https://urlhaus.abuse.ch/downloads/csv_recent/"
      URLHAUS_IMPORT_OFFLINE: "true"
      URLHAUS_INTERVAL: 2  # hours
    restart: always

networks:
  default:
    name: opencti_network
    external: true
```

### 7.5 AI Enrichment Connector — docker-compose.ai.yml

```yaml
version: "3"

services:
  connector-ai-enrichment:
    build:
      context: ./connectors/ai-enrichment
      dockerfile: Dockerfile
    environment:
      OPENCTI_URL: http://opencti:8080
      OPENCTI_TOKEN: ${OPENCTI_ADMIN_TOKEN}
      CONNECTOR_ID: ${CONNECTOR_AI_ENRICHMENT_TOKEN}
      CONNECTOR_NAME: "AI Enrichment (Claude)"
      CONNECTOR_LOG_LEVEL: info
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      AI_MODEL: claude-opus-4-7
      AI_ENRICHMENT_REPORTS: "true"
      AI_ENRICHMENT_MALWARE: "true"
      AI_ENRICHMENT_THREAT_ACTORS: "true"
    restart: always

networks:
  default:
    name: opencti_network
    external: true
```

---

## 8. Connector Configuration

### Fast Start / Stop Scripts

The repository includes two helper scripts for daily operations:

```bash
# Start core OpenCTI, wait for the UI/API, then start connectors and AI enrichment
./scripts/start-all.sh

# Stop AI enrichment, connectors, and core OpenCTI while preserving Docker volumes
./scripts/stop-all.sh
```

Use these scripts for normal start/stop operations after `.env` is configured. Use the manual commands below when debugging a specific service startup problem.

### 8.1 Start the Core Stack

```bash
cd /home/andrey/openCTI

# Pre-flight: ElasticSearch refuses allocation above 90% disk usage
df -h /var/lib/docker
# If > 90% full, run: docker system prune -a   (frees ~47 GB of unused images)

# Create the shared Docker network (idempotent — safe to re-run)
docker network create opencti_network 2>/dev/null || true

# Start core services
docker compose -f docker-compose.yml up -d

# Wait for ElasticSearch to be healthy before OpenCTI finishes initializing
until curl -s -u "elastic:${ELASTIC_PASSWORD}" \
  http://localhost:9200/_cluster/health | grep -q '"status":"green"\|"status":"yellow"'; do
  echo "Waiting for ES..."; sleep 5
done

# Watch logs — first-run index creation takes 5-10 minutes
# Look for "Listening on port 8080"
docker compose -f docker-compose.yml logs -f opencti | grep -E "Listening|ERROR|indices"
```

### 8.2 Start Connectors

```bash
# Start feed connectors (after OpenCTI is healthy)
docker compose -f docker-compose.connectors.yml up -d

# Verify connectors registered (wait ~60s for startup)
docker compose -f docker-compose.connectors.yml ps
```

### 8.3 Verify in UI

```
http://localhost:8080
Login: admin@opencti.local / <your password>

Navigation:
  Data → Connectors → check all show status "connected"
  Knowledge → Malwares → should start populating within minutes
  Activities → Logs → watch ingest events
```

---

## 9. AI-Driven Enrichment Pipeline

### Overview

The AI enrichment pipeline adds a Claude-powered layer on top of the standard OpenCTI ingestion
flow. Every time a connector (AlienVault, MITRE, URLhaus, etc.) writes a new object into OpenCTI,
an event is published to RabbitMQ. The AI connector subscribes to that event stream, calls the
Claude API with the object's content, and writes the extracted structured intelligence back into
the graph as STIX relationships, notes, and entity updates — all automatically.

**Without AI enrichment:**
```
AlienVault pulse → Report object in OpenCTI
                   (raw text, no relationships, no ATT&CK mapping)
```

**With AI enrichment:**
```
AlienVault pulse → Report object in OpenCTI
                       ↓ AI connector picks it up from event stream
                   Claude API: extract entities, map techniques, score severity
                       ↓
                   Report now has:
                   ├── Note: executive summary (2-3 sentences)
                   ├── Relationship → ThreatActor (if found in graph)
                   ├── Relationship → Malware (if found in graph)
                   ├── Relationship → AttackPattern T1059.001 (created if missing)
                   └── x_opencti_score updated based on AI confidence
```

---

### 9.1 How the Event Stream Works

OpenCTI uses RabbitMQ as its internal message bus. Every write operation (create, update, delete)
on any STIX object publishes a message to a topic exchange. Connectors subscribe to this exchange
via `pycti`'s `OpenCTIConnectorHelper.listen()` method.

```
OpenCTI platform
      │
      │ write event (STIX bundle)
      ▼
  RabbitMQ
  exchange: amq.topic
      │
      ├──► worker-1 (standard workers — write to ES/graph)
      ├──► worker-2
      ├──► worker-3
      └──► connector-ai-enrichment  ← our connector subscribes here
                  │
                  │ reads event payload:
                  │ {
                  │   "type": "create",
                  │   "data": { "id": "report--uuid", "type": "report", ... }
                  │ }
                  ▼
            calls Claude API
                  ▼
            writes enrichment back via GraphQL API
```

Each message contains the full STIX object that was just created. The connector processes it
and acknowledges the message — if it crashes mid-processing, RabbitMQ redelivers it.

**Connector type `INTERNAL_ENRICHMENT`** means:
- It does not import data on a schedule
- It reacts to existing objects as they are created or updated
- It appears in Settings → Connectors → Enrichment in the UI

---

### 9.2 What Claude Extracts and How It Maps to STIX

The connector sends the report's description text to Claude with a structured prompt.
Claude returns JSON. The connector then maps each field to STIX operations:

| Claude output field | STIX action |
|---------------------|-------------|
| `summary` | Creates a `Note` object attached to the report (`object_refs`) |
| `threat_actors[]` | Looks up `ThreatActor` by name in graph → creates `related-to` relationship to report |
| `malware_families[]` | Looks up `Malware` by name → creates `related-to` relationship to report |
| `attack_techniques[]` | Looks up `AttackPattern` by external_id (T1059.001) → creates `uses` relationship to report |
| `targeted_sectors[]` | Looks up `Identity` (sector) → creates `targets` relationship |
| `targeted_countries[]` | Looks up `Location` by ISO code → creates `targets` relationship |
| `confidence` | Sets `x_opencti_score` on the report (0–100) |

**Why look up instead of creating?** MITRE ATT&CK and identity data is already loaded by the
MITRE connector. Looking up prevents duplicates. Only `AttackPattern` objects are created if
missing (since Claude may identify techniques not yet in the graph).

---

### 9.3 Connector Code

```bash
mkdir -p /home/andrey/openCTI/connectors/ai-enrichment
```

**[connectors/ai-enrichment/connector.py](connectors/ai-enrichment/connector.py)**

```python
import os
import json
import anthropic
from pycti import OpenCTIConnectorHelper

SYSTEM_PROMPT = """You are a senior cyber threat intelligence analyst.
Analyze threat intelligence content and return structured JSON only.
No prose, no markdown fences, no explanation — raw JSON."""

REPORT_PROMPT = """Analyze this threat intelligence report. Return JSON with exactly these keys:
- summary: string (2-3 sentence executive brief, plain text)
- threat_actors: list of strings (actor names, aliases, groups mentioned)
- malware_families: list of strings (malware/tool names)
- attack_techniques: list of strings (MITRE ATT&CK IDs only, e.g. ["T1059.001", "T1003"])
- targeted_sectors: list of strings (e.g. ["Finance", "Healthcare", "Government"])
- targeted_countries: list of strings (ISO 3166-1 alpha-2, e.g. ["US", "UA", "DE"])
- confidence: integer 0-100

Report:
{content}"""


class AIEnrichmentConnector:
    def __init__(self):
        config = {
            "opencti": {
                "url": os.environ.get("OPENCTI_URL", "http://opencti:8080"),
                "token": os.environ["OPENCTI_TOKEN"],
            },
            "connector": {
                "id": os.environ["CONNECTOR_ID"],
                "type": "INTERNAL_ENRICHMENT",
                "name": os.environ.get("CONNECTOR_NAME", "AI Enrichment (Claude)"),
                "scope": "Report",
                "log_level": os.environ.get("CONNECTOR_LOG_LEVEL", "info"),
                "auto": True,
            },
        }
        self.helper = OpenCTIConnectorHelper(config)
        self.client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        self.model = os.environ.get("AI_MODEL", "claude-opus-4-7")

    # -------------------------------------------------------------------------
    # Claude call
    # -------------------------------------------------------------------------

    def _call_claude(self, content: str) -> dict | None:
        try:
            msg = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": REPORT_PROMPT.format(content=content[:8000])}],
            )
            return json.loads(msg.content[0].text)
        except (json.JSONDecodeError, anthropic.APIError) as e:
            self.helper.log_error(f"Claude call failed: {e}")
            return None

    # -------------------------------------------------------------------------
    # STIX write-back helpers
    # -------------------------------------------------------------------------

    def _add_note(self, report_id: str, summary: str, confidence: int) -> None:
        """Attach an AI-generated summary as a Note to the report."""
        self.helper.api.note.create(
            abstract="AI Summary",
            content=summary,
            confidence=confidence,
            object_ids=[report_id],
        )

    def _link_threat_actors(self, report_id: str, names: list, confidence: int) -> None:
        for name in names:
            actor = self.helper.api.threat_actor_group.read(
                filters={"mode": "and", "filters": [{"key": "name", "values": [name]}], "filterGroups": []}
            )
            if actor:
                self.helper.api.stix_core_relationship.create(
                    fromId=report_id,
                    toId=actor["id"],
                    relationship_type="related-to",
                    confidence=confidence,
                )

    def _link_malware(self, report_id: str, names: list, confidence: int) -> None:
        for name in names:
            malware = self.helper.api.malware.read(
                filters={"mode": "and", "filters": [{"key": "name", "values": [name]}], "filterGroups": []}
            )
            if malware:
                self.helper.api.stix_core_relationship.create(
                    fromId=report_id,
                    toId=malware["id"],
                    relationship_type="related-to",
                    confidence=confidence,
                )

    def _link_attack_patterns(self, report_id: str, technique_ids: list, confidence: int) -> None:
        for tid in technique_ids:
            # Look up by MITRE external ID (e.g. "T1059.001")
            pattern = self.helper.api.attack_pattern.read(
                filters={"mode": "and", "filters": [{"key": "x_mitre_id", "values": [tid]}], "filterGroups": []}
            )
            if not pattern:
                # Create it if not yet loaded (e.g. MITRE connector hasn't run yet)
                pattern = self.helper.api.attack_pattern.create(
                    name=tid,
                    x_mitre_id=tid,
                    confidence=50,
                )
            if pattern:
                self.helper.api.stix_core_relationship.create(
                    fromId=report_id,
                    toId=pattern["id"],
                    relationship_type="uses",
                    confidence=confidence,
                )

    def _update_score(self, report_id: str, confidence: int) -> None:
        self.helper.api.stix_domain_object.update_field(
            id=report_id,
            input={"key": "x_opencti_score", "value": str(confidence)},
        )

    # -------------------------------------------------------------------------
    # Main enrichment
    # -------------------------------------------------------------------------

    def _enrich_report(self, report: dict) -> str:
        content = report.get("description") or report.get("name", "")
        if not content or len(content) < 100:
            return "Skipped: content too short"

        self.helper.log_info(f"Enriching report: {report['name']}")
        result = self._call_claude(content)
        if not result:
            return "Skipped: Claude error"

        confidence = result.get("confidence", 50)
        report_id = report["id"]

        if result.get("summary"):
            self._add_note(report_id, result["summary"], confidence)

        if result.get("threat_actors"):
            self._link_threat_actors(report_id, result["threat_actors"], confidence)

        if result.get("malware_families"):
            self._link_malware(report_id, result["malware_families"], confidence)

        if result.get("attack_techniques"):
            self._link_attack_patterns(report_id, result["attack_techniques"], confidence)

        self._update_score(report_id, confidence)

        self.helper.log_info(
            f"Enriched: {len(result.get('threat_actors', []))} actors, "
            f"{len(result.get('malware_families', []))} malware, "
            f"{len(result.get('attack_techniques', []))} techniques"
        )
        return "Enriched"

    # -------------------------------------------------------------------------
    # Event handler — called by pycti for every event on the RabbitMQ stream
    # -------------------------------------------------------------------------

    def process_message(self, data: dict) -> str:
        entity_type = data.get("data", {}).get("type", "")
        entity_id = data.get("data", {}).get("id")

        if entity_type != "report" or not entity_id:
            return "Skipped"

        report = self.helper.api.report.read(id=entity_id)
        return self._enrich_report(report) if report else "Not found"

    def start(self):
        self.helper.log_info("AI Enrichment connector starting...")
        self.helper.listen(self.process_message)


if __name__ == "__main__":
    AIEnrichmentConnector().start()
```

**[connectors/ai-enrichment/Dockerfile](connectors/ai-enrichment/Dockerfile)**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY connector.py .
CMD ["python", "connector.py"]
```

**[connectors/ai-enrichment/requirements.txt](connectors/ai-enrichment/requirements.txt)**

```
pycti>=6.2.0
anthropic>=0.40.0
```

---

### 9.4 Deploy the AI Connector

**Prerequisites:** Set `ANTHROPIC_API_KEY` in `.env` first.

```bash
cd /home/andrey/openCTI

# Build the image
docker compose -f docker-compose.ai.yml build

# Start it
docker compose -f docker-compose.ai.yml up -d

# Verify it registered with OpenCTI (look for "AI Enrichment" in connector list)
docker logs opencti-connector-ai-enrichment-1 --tail=20
```

In the OpenCTI UI: **Settings → Connectors → Enrichment** — the connector should appear
with status `connected` after ~10 seconds.

---

### 9.5 Testing the Pipeline

Trigger a manual enrichment by importing a real threat report:

```bash
# Import a STIX report via the API to trigger the connector
curl -s -X POST http://localhost:8080/graphql \
  -H "Authorization: Bearer $(grep OPENCTI_ADMIN_TOKEN .env | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { reportAdd(input: { name: \"Test: APT29 spearphishing campaign\", description: \"APT29, also known as Cozy Bear, conducted a spearphishing campaign targeting NATO members using a malicious PDF dropper that installed Cobalt Strike beacon via PowerShell (T1059.001). The campaign targeted defense contractors in Poland and Germany. The malware communicated with C2 over HTTPS using domain fronting (T1090.004).\", published: \"2024-01-15T00:00:00Z\", report_types: [\"threat-report\"] }) { id name } }"
  }'
```

Then check what the AI connector wrote back:

```bash
# Watch connector logs for the enrichment
docker logs -f opencti-connector-ai-enrichment-1 2>&1 | grep -E "Enriching|Enriched|Error"

# Expected output:
# Enriching report: Test: APT29 spearphishing campaign
# Enriched: 1 actors, 1 malware, 2 techniques
```

In the UI, open the report — it should now have a Note with the summary, relationships to
APT29 and Cobalt Strike, and links to T1059.001 and T1090.004.

---

### 9.6 Cost and Rate Limiting

**Estimated Claude API cost per report:**
- ~500–2000 tokens input (report text, truncated at 8000 chars)
- ~300 tokens output (JSON response)
- At `claude-opus-4-7` pricing: ~$0.01–0.05 per report

**Rate limiting:** The Anthropic API has per-minute token limits. If AlienVault imports
hundreds of reports in a burst, the connector will hit rate limits. Add a simple backoff:

```python
import time

def _call_claude(self, content: str) -> dict | None:
    for attempt in range(3):
        try:
            msg = self.client.messages.create(...)
            return json.loads(msg.content[0].text)
        except anthropic.RateLimitError:
            time.sleep(60 * (attempt + 1))
        except (json.JSONDecodeError, anthropic.APIError) as e:
            self.helper.log_error(f"Claude call failed: {e}")
            return None
    return None
```

**To limit scope** (only enrich reports above a confidence threshold, skip low-quality feeds):

```python
def process_message(self, data: dict) -> str:
    report = self.helper.api.report.read(id=entity_id)
    # Skip reports with low confidence (e.g. AlienVault auto-generated)
    if report.get("confidence", 0) < 40:
        return "Skipped: low confidence"
    return self._enrich_report(report)
```

### 9.7 Rules Engine (CE Automation)


**Note:** Playbooks are an Enterprise Edition feature. The Community Edition uses the built-in
Rules Engine, which automatically infers and propagates relationships as data arrives.

All 20 rules are enabled. To verify or toggle: **Settings → Customization → Rules**

To enable all rules via API (already done — included for re-initialization):

```bash
RULES="attribution_attribution attribution_targets indicate_sighted attribution_use \
localization_of_targets location_location location_targets participate-to_parts \
observable_related observe_sighting part_part part-of_targets sighting_incident \
sighting_observable sighting_indicator report_ref_identity_part_of \
report_ref_indicator_based_on report_ref_observable_based_on \
report_ref_location_located_at parent_technique_use"

TOKEN=$(grep OPENCTI_ADMIN_TOKEN /home/andrey/openCTI/.env | cut -d= -f2)

for rule in $RULES; do
  curl -s -X POST http://localhost:8080/graphql \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"mutation { ruleSetActivation(id: \\\"$rule\\\", enable: true) { id activated } }\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('$rule:', d['data']['ruleSetActivation']['activated'])"
done
```

**What these rules do automatically once data arrives:**

| Rule | Effect |
|------|--------|
| `attribution_attribution` | If APT-X is attributed to Country-A, and APT-Y is a sub-group of APT-X → APT-Y also attributed to Country-A |
| `sighting_incident` | If an indicator is sighted, automatically raise an Incident |
| `indicate_sighted` | If indicator is sighted → infer the targeted entity from the indicator's relationship |
| `report_ref_indicator_based_on` | If a Report references Observable X, and X has an Indicator → auto-link the Indicator to the Report |
| `observable_related` | If two objects share a common Observable → infer a `related-to` relationship |
| `parent_technique_use` | If a sub-technique (T1059.001) is used → auto-link parent technique (T1059) as used |

**For custom event-driven automation in CE**, use a pycti script or the AI connector (section 9.1).
The `pycti` library supports streaming the live event feed via `helper.listen()` — the AI connector
in 9.1 uses exactly this pattern.

---

## 10. Post-Deployment Hardening

### 10.1 Reverse Proxy with TLS (nginx)

```nginx
# /etc/nginx/sites-available/opencti
server {
    listen 443 ssl http2;
    server_name opencti.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/opencti.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/opencti.yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        client_max_body_size 100m;
    }
}

server {
    listen 80;
    server_name opencti.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

### 10.2 Backup Strategy

```bash
#!/bin/bash
# /home/andrey/openCTI/scripts/backup.sh
set -euo pipefail

BACKUP_DIR="/mnt/backup/opencti/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Snapshot ElasticSearch
curl -s -u elastic:${ELASTIC_PASSWORD} \
  -X PUT "http://localhost:9200/_snapshot/backup/snapshot_$(date +%Y%m%d)" \
  -H 'Content-Type: application/json' \
  -d '{"indices": "*", "ignore_unavailable": true}'

# Dump MinIO (reports, files)
docker run --rm \
  --network opencti_network \
  -v "$BACKUP_DIR:/backup" \
  minio/mc:latest \
  mirror myminio/opencti /backup/minio/

echo "Backup completed: $BACKUP_DIR"
```

### 10.3 Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate unique UUID4 tokens for every connector
- [ ] Enable TLS via nginx reverse proxy
- [ ] Restrict port 8080 to localhost only (`127.0.0.1:8080:8080`)
- [ ] Enable ElasticSearch authentication (already configured above)
- [ ] Set up fail2ban on the nginx access log
- [ ] Rotate `OPENCTI_ADMIN_TOKEN` every 90 days
- [ ] Review TLP markings — ensure nothing RED leaks via TAXII
- [ ] Enable audit logging: `APP__APP_LOGS__LOGS_LEVEL: info`

---

## 11. Operational Runbook

### Day 1 — Initial Data Load

```bash
# MITRE ATT&CK loads first (foundational framework)
# Wait ~10 minutes for it to complete, then verify:
TOKEN=$(grep OPENCTI_ADMIN_TOKEN /home/andrey/openCTI/.env | cut -d= -f2)

curl -s -X POST http://localhost:8080/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ attackPatterns { edges { node { name } } } }"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('Techniques loaded:', len(d['data']['attackPatterns']['edges']))"
# Should return 500+ techniques
```

### Common Operations

```bash
# Fast start/stop the whole stack
./scripts/start-all.sh
./scripts/stop-all.sh

# Check all connector health
docker compose -f docker-compose.connectors.yml ps

# View connector logs
docker compose -f docker-compose.connectors.yml logs --tail=50 connector-alienvault

# Restart a stuck connector
docker compose -f docker-compose.connectors.yml restart connector-abuse-ssl

# Scale workers for high ingest load
docker compose -f docker-compose.yml up -d --scale worker=5

# Check ElasticSearch cluster health
curl -s -u elastic:${ELASTIC_PASSWORD} http://localhost:9200/_cluster/health?pretty

# Check RabbitMQ queue depth (should stay near 0 at rest)
docker exec $(docker ps -qf name=rabbitmq) rabbitmqctl list_queues name messages
```

### Monitoring Metrics to Watch

| Metric | Healthy | Action if degraded |
|---|---|---|
| RabbitMQ queue depth | < 100 | Scale workers (`--scale worker=N`) |
| ElasticSearch heap usage | < 75% | Increase `ES_JAVA_OPTS` heap |
| OpenCTI memory | < 6 GB | Increase `NODE_OPTIONS` max heap |
| Connector status | connected | Check connector logs, restart |
| Ingest rate | > 0 entities/min | Check connector API keys |

---

## 12. Troubleshooting

### Known Issues — OpenCTI 6.2.0 + ElasticSearch 8.13

#### ILM Race Condition (`resource_already_exists_exception`)

ES 8.13's ILM daemon auto-bootstraps rollover indices the moment an index template with
`lifecycle.rollover_alias` is created. OpenCTI's `elCreateIndex` does a check-then-create
which loses the race. This kills initialization and loops with `restart: always`.

**Fix already applied:** `patches/back.js` is mounted over the compiled bundle and makes
`elCreateIndex` idempotent — it catches `resource_already_exists_exception` and returns null.

**Re-initialization procedure** (if ES volume is dropped):
```bash
# 1. Delete any leftover index templates from a failed run
curl -s -u elastic:${ELASTIC_PASSWORD} -X DELETE \
  "http://localhost:9200/_index_template/opencti*"

# 2. Flush Redis state
docker exec opencti-redis-1 redis-cli -a opencti FLUSHALL

# 3. Start ES first, wait for green/yellow
docker compose up -d elasticsearch
until curl -s -u elastic:${ELASTIC_PASSWORD} \
  http://localhost:9200/_cluster/health | grep -q '"status":"green"\|"status":"yellow"'; do
  sleep 5; done

# 4. Start the rest — OpenCTI will create 13 indices and load base STIX data (~5-10 min)
docker compose up -d
```

#### ElasticSearch Disk Watermark (cluster RED, no shard allocation)

ES 8.x refuses all shard allocation when disk exceeds 90% high watermark.
`cluster.routing.allocation.disk.threshold_enabled=false` is set in docker-compose.yml.

To reclaim disk space:
```bash
docker system prune -a   # frees ~47 GB of unused images/containers
```

#### Connectors Can't Reach `opencti` Hostname

Both compose files must share the same Docker network. `docker-compose.yml` defines:
```yaml
networks:
  default:
    name: opencti_network
    external: true
```
If the main stack was started without this, run:
```bash
docker network connect --alias opencti opencti_network opencti-opencti-1
```
Then add the `networks:` block to `docker-compose.yml` and run `docker compose up -d`
to make it permanent.

#### `OPENCTI_TOKEN` vs `CONNECTOR_ID`

Connectors authenticate to OpenCTI using `OPENCTI_TOKEN: ${OPENCTI_ADMIN_TOKEN}`.
The per-connector UUID variables (`CONNECTOR_MITRE_TOKEN`, etc.) are only used as
`CONNECTOR_ID` — they identify the connector instance in the UI, not for authentication.

#### CVE Connector — Zero Vulnerabilities Imported (NVD API Key Bug)

`connector-cve:6.2.0` has a bug: it sends the NVD API key as `Bearer: <key>` in the HTTP
header, but NVD 2.0 API requires `apiKey: <key>`. The connector silently gets a non-200
response and imports nothing. Additionally, `CVE_MAX_DATE_RANGE` is required but missing
from the image's default config — omitting it causes a `TypeError: '>' not supported
between instances of 'NoneType' and 'int'` crash every 60 seconds.

**Fix:** Mount a patched `api.py` that uses the correct header, and add the missing vars:

```yaml
connector-cve:
  image: opencti/connector-cve:6.2.0
  volumes:
    - ./patches/cve/api.py:/opt/opencti-connector-cve/services/client/api.py:ro
  environment:
    CVE_MAX_DATE_RANGE: 120
    CVE_MAINTAIN_DATA: "true"
    # ... other vars
```

`patches/cve/api.py` — change header from `"Bearer": api_key` to `"apiKey": api_key`:
```python
headers = {"User-Agent": header}
if api_key:
    headers["apiKey"] = api_key
```

---

## 13. Usage Examples

### 13.1 Standard OpenCTI Workflows

---

#### Example 1 — Investigate an IP address

You received an alert from your SIEM about suspicious outbound traffic to `185.220.101.45`.

**In OpenCTI UI:**
```
Search → type "185.220.101.45"
```
If AlienVault or URLhaus has seen it, you'll find:
- Which threat actor uses this IP as C2
- What malware family communicates with it
- When it was first/last observed
- TLP marking and confidence score
- All reports that mention it

**Via API:**
```bash
TOKEN=$(grep OPENCTI_ADMIN_TOKEN /home/andrey/openCTI/.env | cut -d= -f2)
curl -s -X POST http://localhost:8080/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ stixCyberObservables(filters: {mode: and, filters: [{key: \"value\", values: [\"185.220.101.45\"]}], filterGroups: []}) { edges { node { id entity_type ... on IPv4Addr { value } } } } }"}' | \
  python3 -m json.tool
```

---

#### Example 2 — Build an APT profile

You want to understand everything known about Lazarus Group before a threat briefing.

```
Knowledge → Intrusion Sets → search "Lazarus"
```

The profile shows:
- **Attributed to:** North Korea
- **Motivations:** Financial gain, Espionage
- **Targets:** Finance, Cryptocurrency, Defense
- **Malware used:** WannaCry, Hermes, BLINDINGCAN (all auto-linked by MITRE connector)
- **Techniques:** 80+ ATT&CK techniques with usage relationships
- **Campaigns:** Operation AppleJeus, Dream Job, etc.
- **Timeline:** chronological view of all activity

Click **"ATT&CK Matrix"** tab → heatmap showing which techniques Lazarus uses most.

---

#### Example 3 — Import a threat report (PDF / blog post)

You found a Mandiant or CrowdStrike blog post about a new campaign.

```
Data → Import → drag and drop the PDF or paste the URL
Select format: "Auto detect" or "Report"
```

OpenCTI parses it and creates a Report object. The AI enrichment connector
then picks it up automatically and extracts:
- Threat actors mentioned
- Malware families
- ATT&CK technique IDs
- Targeted sectors and countries

All as STIX relationships, visible immediately in the UI.

---

#### Example 4 — Track a CVE across your environment

CVE-2024-21762 (Fortinet FortiOS RCE) was just published. Check what you know about it.

```
Knowledge → Vulnerabilities → search "CVE-2024-21762"
```

After the CVE connector syncs, you'll see:
- CVSS score and vector
- Affected software versions
- Which threat actors exploit it (once AlienVault/MITRE data arrives)
- Which campaigns used it
- Related indicators (IPs, domains used in exploitation)

---

#### Example 5 — Create an incident from a sighting

Your EDR detected Cobalt Strike beacon on a workstation.

```
Activities → Incidents → Create
  Name: "CS beacon on WS-042"
  Type: "Intrusion"
  Confidence: 90
  Add object: link to Cobalt Strike (malware)
  Add object: link to T1071.001 (C2 over HTTP)
  Add observable: add the C2 IP
```

With `sighting_incident` rule enabled, future detections of the same C2 IP
automatically raise new incidents without manual work.

---

#### Example 6 — Export IOCs to your firewall / SIEM

You want a live blocklist of all HIGH confidence IPv4 indicators.

```
Data → Indicators
Filter: Score > 70, Type = IPv4-Addr, Valid until > today
Export → CSV or STIX
```

Or use the built-in **TAXII 2.1 server** to push directly to your SIEM:
```
Settings → Taxii Server → Create collection "High confidence IOCs"
Configure your SIEM to poll: http://localhost:8080/taxii2/
```

---

#### Example 7 — Map your detection coverage against ATT&CK

You want to know which techniques you detect vs which you're blind to.

```
Knowledge → Attack Patterns
Filter by: used by (Lazarus Group)
```

Cross-reference the list with your SIEM detection rules.
Techniques with no detection rule = gap in coverage.

Export the filtered list as CSV and import into ATT&CK Navigator
for a visual heatmap of covered vs uncovered techniques.

---

#### Example 8 — Pivot from malware to infrastructure

You found a Ryuk ransomware sample (SHA256 hash).

```
Search → paste the SHA256
```

From the malware object, pivot to:
- **Related indicators** → domains and IPs used for C2
- **Used by** → Wizard Spider (threat actor)
- **Campaigns** → which ransomware campaigns used this variant
- **Techniques** → T1486 (Data Encrypted for Impact), T1490 (Inhibit System Recovery)

Each pivot is one click in the graph view.

---

#### Example 9 — Share intelligence with a partner org

You want to share a report with a partner but strip out RED-marked internal data.

```
Open the report → Actions → Share
Select TLP level: TLP:AMBER (only partner can see it)
```

Or use **Workspaces → Sharing groups** to create a federated share
with another OpenCTI instance. All objects above RED are automatically
excluded from the export.

---

#### Example 10 — Build a custom dashboard for your sector

Your org is in Finance. You want a live dashboard showing threats to your sector.

```
Home → Dashboards → Create dashboard "Finance Threat Landscape"

Add widgets:
  - "Threat actors targeting Finance" (bar chart)
  - "Most used techniques against Finance" (ATT&CK heatmap)
  - "New IOCs last 7 days" (timeline)
  - "Active campaigns" (list)
  - "CVEs affecting banking software" (table)
```

Each widget auto-updates as new data arrives from connectors.

---

### 13.2 AI-Driven Workflows

---

#### AI Example 1 — Automatic report summarization

**What happens:** AlienVault imports a 3000-word pulse about a new Iranian APT campaign.
A CTI analyst without AI would spend 20 minutes reading it.

**With AI enrichment connector:** within 60 seconds of the report landing in OpenCTI,
a Note appears on the report:

```
"Iranian threat actor TA453 (Charming Kitten) conducted a spearphishing
campaign targeting nuclear policy researchers at US and Israeli think tanks,
using credential harvesting pages mimicking ProtonMail. Campaign active
June–August 2024, confidence 85."
```

The analyst reads 3 sentences instead of 3000 words.

---

#### AI Example 2 — ATT&CK mapping from narrative text

A blog post says:
> *"The attacker used scheduled tasks for persistence, dumped credentials
> from LSASS, and exfiltrated data via DNS tunneling"*

OpenCTI without AI: no technique links unless someone manually tags them.

**With AI enrichment:** Claude extracts and links automatically:
```
T1053.005 — Scheduled Task/Job: Scheduled Task  (persistence)
T1003.001 — OS Credential Dumping: LSASS Memory  (credential access)
T1048.001 — Exfiltration Over DNS               (exfiltration)
```

These relationships appear in the report and in the ATT&CK matrix view.

---

#### AI Example 3 — Threat actor disambiguation

An AlienVault pulse mentions "APT1", "Comment Crew", and "Comment Group"
as three separate strings. A human knows these are all the same group.
Without AI, OpenCTI creates three separate objects.

**Prompt approach** (extend the connector):
```python
DEDUP_PROMPT = """These actor names refer to the same or different groups?
Return JSON: {"canonical_name": "...", "aliases": [...], "same_group": true/false}
Names: {names}"""
```

Claude returns `{"canonical_name": "APT1", "aliases": ["Comment Crew", "Comment Group"]}`.
The connector merges them into one object with all aliases.

---

#### AI Example 4 — Severity scoring for your sector

Generic feeds assign the same confidence to everything. But a vulnerability
in FortiGate is critical for your org, while a macOS exploit is irrelevant.

**Extend the connector with a sector-aware prompt:**
```python
SECTOR_PROMPT = """Rate the relevance of this threat for a Financial Services
organization in Eastern Europe on a scale 0-100.
Consider: targeted sectors, geography, exploited technology stack.
Threat: {description}
Return JSON: {"relevance_score": int, "reasoning": string}"""
```

Claude returns `{"relevance_score": 87, "reasoning": "Targets SWIFT infrastructure, Eastern European banks explicitly mentioned"}`.
The score is written to `x_opencti_score` on the indicator — your dashboards filter by it.

---

#### AI Example 5 — IOC extraction from unstructured text

Someone pastes a raw Pastebin dump or a chat log from a dark web forum into OpenCTI as a Note.

**Extend the connector to handle Notes:**
```python
IOC_PROMPT = """Extract all IOCs from this text. Return JSON:
{"ips": [], "domains": [], "hashes": {"md5": [], "sha256": []},
 "emails": [], "urls": []}
Text: {content}"""
```

Claude returns structured IOCs. The connector creates Observable objects for each one
and links them to the Note. Raw unstructured intel becomes queryable graph objects.

---

#### AI Example 6 — Automated MISP tagging

You receive 50 MISP events per day. Each needs to be tagged with
MITRE techniques and TLP levels. Manual tagging takes hours.

**Batch enrichment via pycti:**
```python
# Run as a daily cron job
reports = helper.api.report.list(
    filters={"mode": "and",
             "filters": [{"key": "createdBy", "values": ["MISP"]}],
             "filterGroups": []},
    first=50
)
for report in reports:
    result = call_claude(report["description"])
    apply_tags(report["id"], result["attack_techniques"])
```

50 reports enriched overnight, analyst arrives in the morning to
pre-tagged, pre-mapped intelligence.

---

#### AI Example 7 — Campaign clustering

You have 200 unrelated incidents in OpenCTI over 6 months.
Are some of them actually the same actor operating under the radar?

**Clustering prompt:**
```python
CLUSTER_PROMPT = """Compare these two incidents and rate similarity 0-100.
Consider: TTPs, infrastructure overlap, targeting, timing, malware.
Incident A: {incident_a}
Incident B: {incident_b}
Return JSON: {"similarity": int, "shared_indicators": [], "assessment": string}"""
```

Run pairwise on all incidents. Pairs above 75% similarity → create
`related-to` relationship → cluster emerges in the graph view.
What looked like noise becomes a visible campaign.

---

#### AI Example 8 — Executive briefing generation

Every Monday you need a 1-page threat briefing for management.
No time to read 40 new reports.

```python
# Fetch all reports from last 7 days
reports = helper.api.report.list(
    filters={"mode": "and",
             "filters": [{"key": "created_at", "values": ["7d"]}],
             "filterGroups": []})

all_summaries = [r.get("description","")[:500] for r in reports]

BRIEF_PROMPT = """Based on these {n} threat intelligence summaries from the past week,
write a 1-page executive briefing covering:
1. Top 3 threats relevant to Financial Services
2. New techniques observed this week
3. Recommended immediate actions

Summaries:
{summaries}"""
```

Claude synthesizes 40 reports into one executive document.
Schedule as a cron job, deliver via email every Monday 08:00.

---

#### AI Example 9 — Detecting intelligence gaps

You want to know what you *don't* know — which threat actors targeting
your sector have almost no intelligence in your graph.

```python
# Find actors targeting Finance with < 5 associated objects
actors = helper.api.threat_actor_group.list(
    filters={"mode": "and",
             "filters": [{"key": "targets", "values": ["Finance"]}],
             "filterGroups": []})

GAP_PROMPT = """Threat actor: {name}
Known information: {summary}
How many public reports exist about this actor? What key intelligence
is missing (infrastructure, TTPs, attribution)? What sources should
an analyst check? Return JSON: {"gap_score": 0-100, "missing": [], "sources": []}"""
```

Output: ranked list of actors by intelligence gap. Tells you where to
focus collection efforts.

---

#### AI Example 10 — Real-time threat hunt query generation

An analyst finds a new IOC and wants to hunt for it across their SIEM.
Writing Sigma/KQL/SPL rules takes expertise and time.

**Extend the connector to generate detection rules:**
```python
HUNT_PROMPT = """Given this threat actor TTP:
- Technique: {technique_id} ({technique_name})
- Malware: {malware}
- Context: {context}

Write a Sigma rule to detect this behavior. Return JSON:
{"sigma_rule": "...", "kql_query": "...", "spl_query": "...",
 "data_sources_needed": []}"""
```

Connector writes the generated rules as a Note on the ATT&CK technique object.
Analyst copies the KQL directly into Microsoft Sentinel.
Time to detection rule: 10 seconds instead of 2 hours.

---

```bash
# Start everything
cd /home/andrey/openCTI
docker network create opencti_network 2>/dev/null || true
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.connectors.yml up -d
docker compose -f docker-compose.ai.yml up -d

# Stop everything
docker compose -f docker-compose.ai.yml down
docker compose -f docker-compose.connectors.yml down
docker compose -f docker-compose.yml down

# Access
# UI:      http://localhost:8080
# API:     http://localhost:8080/graphql
# MinIO:   http://localhost:9001
# RabbitMQ: http://localhost:15672
```

---

*Guide version: 2.0 | OpenCTI version: 6.2.0 | ElasticSearch: 8.13.0 | Claude model: claude-opus-4-7*
