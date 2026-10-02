# Cloud Run Free-First Deployment Guide

This project is fully containerized and pre-configured for Google Cloud Run with **₹0 / $0 Free-Tier settings**.

---

## Single Deployment Command

Run this command in the project root:

```bash
gcloud run deploy aura-backend \
  --source . \
  --region us-east1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --cpu 1 \
  --memory 512Mi \
  --timeout 300s
```

---

## Why These Flags Guarantee Free-First Usage

* **`--source .`**: Cloud Build packages the existing multi-stage `Dockerfile` (free under 2,500 build-minutes/month).
* **`--region us-east1`**: Official Google Cloud **Free Tier eligible region** with the lowest latency to India.
* **`--min-instances 0`**: Container **scales to zero** when idle (0 vCPU-seconds and 0 GiB-seconds consumed).
* **`--max-instances 1`**: Strict budget guardrail that prevents unexpected scaling surges.
* **`--cpu 1` & `--memory 512Mi`**: Runs Node.js and YouTube stream parsing efficiently within free compute quotas.
* **`--timeout 300s`**: 5-minute request timeout to support track streaming while preventing hanging connections.

---

## Output

Once the command finishes, Google Cloud will output your Service URL:
```text
Service URL: https://aura-backend-xxxxxxxxxx-ue.a.run.app
```

Verify it by opening:
`https://aura-backend-xxxxxxxxxx-ue.a.run.app/api/health`
