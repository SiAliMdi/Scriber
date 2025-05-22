# Scriber: Legal Decisions Annotation Web App

Scriber is a full-stack web application for collaborative annotation and validation of legal decisions. It supports both **binary** and **extractive** annotation workflows, integrates with machine learning models (LLMs), and provides tools for dataset management and export.

---

## Features

- **User Authentication**: Secure login and user management.
- **Dataset Management**: Upload, view, and manage legal decision datasets.
- **Annotation Workflows**:
  - **Binary Annotation**: Label decisions as positive/negative (manual or model-assisted).
  - **Extractive Annotation**: Highlight and label text spans (manual or LLM-assisted).
- **Validation**: Review and validate annotations from multiple users or models.
- **Export**: Download annotated datasets in JSON format.
- **Admin Tools**: Manage users, models, and annotation tasks.
- **Integration**:
  - **PostgreSQL** for data storage.
  - **Typesense** for fast search.
  - **LLM APIs** (e.g., Mistral, Llama) for automated annotation.

---

## Tech Stack

- **Frontend**: React (TypeScript), Vite, Tailwind CSS, Radix UI
- **Backend**: Django, Django REST Framework, Channels (WebSockets), Celery
- **Database**: PostgreSQL
- **Search**: Typesense
- **LLMs**: vLLM HTTP APIs (Mistral, Llama, etc.)
- **Deployment**: Nginx, systemd, Ubuntu

---

## Project Structure
