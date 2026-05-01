# KineticForge

![Version](https://img.shields.io/badge/version-1.0.0-6366F1?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-07070B?style=for-the-badge)

**KineticForge** is a premium, high-performance mentor-student management platform designed for the modern learning environment. Built with a stunning "Cosmic" aesthetic, it streamlines attendance tracking, session orchestration, and material distribution with a focus on speed and clarity.

---

## ✨ Features

### 👨‍🏫 Mentor Portal
- **Intelligent Dashboard**: Real-time overview of program health, recent activities, and upcoming sessions.
- **Dynamic Attendance**: Rapid manual or bulk attendance marking with instant synchronization.
- **Student Insights**: Deep-dive into student history with year-wise filtering and automated performance reports.
- **Material Management**: Effortlessly distribute session resources and documentation.
- **Smart Importer**: Robust CSV import system with fuzzy-matching logic to resolve student records intelligently.

### 🎓 Student Portal
- **Personalized View**: Instant access to attendance stats, upcoming session schedules, and learning materials.
- **Progress Tracking**: Clear visualization of participation and historical trends.

### 🌌 Design System
- **Cosmic UI**: A dark-themed, glassmorphic interface inspired by deep space.
- **Premium Aesthetics**: Vibrant gradients, subtle micro-animations, and a highly responsive layout.
- **Accessibility First**: Semantic HTML and clear contrast ratios for an inclusive experience.

---

## 🚀 Tech Stack

- **Frontend**: [React 19](https://reactjs.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Native CSS-first configuration)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Parsing**: [PapaParse](https://www.papaparse.com/), [XLSX](https://github.com/SheetJS/sheetjs)
- **Routing**: [React Router v7](https://reactrouter.com/)

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase account and project

### 1. Clone the repository
```bash
git clone https://github.com/rehanpatel215/KineticForge.git
cd KineticForge
```

### 2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the `frontend` directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Execute the SQL scripts found in `backend/supabase/` in your Supabase SQL Editor:
1. `schema.sql`: Sets up the tables, triggers, and RLS policies.
2. `seed.sql`: (Optional) Populates the database with initial test data.

### 5. Run Locally
```bash
npm run dev
```

---

## 📂 Project Structure

```text
KineticForge/
├── backend/            # Database schemas and seed scripts
├── docs/               # Project specifications and design documents
└── frontend/           # React application
    ├── src/
    │   ├── components/ # Reusable UI components & Layouts
    │   ├── lib/        # API and Supabase clients
    │   ├── pages/      # Mentor & Student dashboard views
    │   └── index.css   # Global styles and Tailwind v4 Theme
    └── public/         # Static assets
```

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with 💜 by the KineticForge Team
</p>
