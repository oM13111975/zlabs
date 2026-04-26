# 🚀 ZLabs Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ZLabs Portal** is a professional, full-stack ecosystem designed to manage the entire lifecycle of interns and team members. From application tracking to automated employee conversion and project tasking, it provides a "World-Class" administrative architecture.

---

## ✨ Features

- **🛡️ Multi-Level RBAC**: Roles for Super Admins, Admins, Team Heads, Mentors, and Team Members.
- **🎓 Intern Pipeline**: 5-round training system with automated progress tracking.
- **🚀 One-Click Conversion**: Promotes interns to employees, automatically provisioning login credentials and notifying them via email.
- **📋 Dual Task System**: 
  - **Intern Tasks**: Public token-based submissions (no login required for interns).
  - **Project Tasks**: Internal authenticated submissions for permanent employees.
- **📊 Activity Monitoring**: Full audit trail of all administrative actions.
- **📅 Team Sync**: Integrated meeting scheduler and project management tools.

---

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite)
- **Vanilla CSS** (Custom Design System)
- **Lucide Icons**
- **React Router v6**

### Backend
- **Django** & **Django REST Framework**
- **SimpleJWT** Authentication
- **SQLite** (Dev) / **PostgreSQL** (Recommended for Prod)
- **Email Service** (SMTP/SES)

---

## 🚦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## ☁️ Deployment (AWS)
For full deployment instructions, including AWS RDS (PostgreSQL), S3 (Media), SES (Email), and ECS/EC2 setup, please refer to the [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md).

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by the ZLabs Team*
