<div align="center">

# ♿ AccessHub - Inclusive Digital Ecosystem

**Empowering Accessibility, Fostering Community, and Driving Independence for All.**

[![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3.1-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-accessibility-suite">Accessibility Features</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

</div>

## 🌟 Overview

**AccessHub** is a comprehensive, accessibility-first web application designed to bridge the digital gap for Persons with Disabilities (PWDs). Built with modern frontend web technologies, **AccessHub** offers an interconnected suite of services including wheelchair-accessible navigation maps, specialized job portals, an assistive device marketplace, community support networks, and AI-powered voice assistance.

---

## ✨ Key Features

| Feature | Description | Icon / Module |
| :--- | :--- | :---: |
| **♿ Accessibility Controls** | High contrast themes, dynamic text scaling, screen reader focus, and speech synthesis. | `AccessibilityContext` |
| **🗺️ Accessible Navigation Map** | Find and review wheelchair-accessible locations, ramp access, and sensory-friendly zones. | `MapScreen` |
| **🛒 Assistive Marketplace** | Buy, sell, or rent specialized devices, wheelchairs, Braille displays, and adaptive gear. | `MarketplaceScreen` |
| **💼 Inclusive Job Portal** | Connect with disability-confident employers offering remote and accessible workplaces. | `JobsScreen` |
| **🤝 Support Services** | Discover physical therapy, sign language interpreters, personal assistants, and mobility support. | `ServicesScreen` |
| **💖 Micro-Donations & Funding** | Crowdfund assistive devices and medical treatments with transparent goal tracking. | `DonationScreen` |
| **🤖 AI Voice & Smart Assistant** | Interactive AI modal equipped with voice commands, summaries, and instant accessibility guidance. | `AiAssistantModal` |
| **💬 Community Hub & Chat** | Connect, communicate, and share experiences with peers and support communities. | `ChatScreen` |

---

## 🛠️ Tech Stack

### **Frontend & Core Libraries**
- ⚛️ **[React 18](https://reactjs.org/)** - Component-based UI library
- 📘 **[TypeScript 5](https://www.typescriptlang.org/)** - Static type checking & DX
- ⚡ **[Vite 5](https://vitejs.dev/)** - Lightning-fast build tool & dev server
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS styling
- 🧩 **[Lucide React](https://lucide.dev/)** - Beautiful, accessible SVG icons
- 🔀 **[clsx](https://github.com/lukeed/clsx) & [tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Dynamic class composition

---

## 📂 Project Structure

```text
AccessHub/
├── 📁 public/                 # Static assets & public icons
├── 📁 src/
│   ├── 📁 components/        # Reusable UI components
│   │   ├── 📁 ai/            # AI Assistant modal & voice widgets
│   │   ├── 📁 common/        # Buttons, Inputs, Badges & Cards
│   │   ├── 📁 layout/        # Navbar, Header, DeviceFrame
│   │   └── 📁 modals/        # Sell product & action modals
│   ├── 📁 constants/         # App constants, theme tokens
│   ├── 📁 context/           # Accessibility & App State Context providers
│   ├── 📁 hooks/             # Custom React hooks (useAccessibility, etc.)
│   ├── 📁 mock/              # Sample data for jobs, products, maps, services
│   ├── 📁 navigation/        # Screen routing & tab bar logic
│   ├── 📁 screens/           # Main feature views & screens
│   │   ├── ChatScreen.tsx
│   │   ├── DonationScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── JobsScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── MarketplaceScreen.tsx
│   │   ├── ProductDetailScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── ServicesScreen.tsx
│   ├── 📁 services/          # API & external service integrations
│   ├── 📁 types/             # TypeScript definitions & interface models
│   ├── 📁 utils/             # Helper functions & formatting utilities
│   ├── App.tsx               # Root component wrapper with providers
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles & Tailwind directives
├── 📄 package.json           # Scripts & project dependencies
├── 📄 tailwind.config.js     # Tailwind CSS configuration
├── 📄 tsconfig.json          # TypeScript configuration
└── 📄 vite.config.ts         # Vite bundler configuration
```

---

## 🚀 Getting Started

Follow these steps to run **AccessHub** locally on your machine.

### 📋 Prerequisites

Ensure you have the following installed on your environment:
- 🟢 **[Node.js](https://nodejs.org/)** (v18.0.0 or higher recommended)
- 📦 **npm** (v9.0.0 or higher) or **yarn** / **pnpm**

### 💻 Installation & Execution

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Sine-D/AccessHub.git
   cd AccessHub
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   > 🌐 Open your browser and navigate to `http://localhost:5173`

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Preview Production Build**
   ```bash
   npm run preview
   ```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Runs TypeScript checks and compiles the app into `dist/` for production. |
| `npm run lint` | Executes TypeScript type verification across the project. |
| `npm run preview` | Serves the production build locally for verification. |

---

## ♿ Accessibility Suite Features

AccessHub is built from the ground up prioritizing **WCAG 2.1 AA** design principles:

- 🌗 **High-Contrast Theme**: Toggleable dark/high-contrast mode for vision impairments.
- 🔠 **Dynamic Font Scaling**: Instant text resize without breaking layout structure.
- 🗣️ **Text-to-Speech (TTS)**: Built-in reader support for content sections.
- 🎯 **Keyboard Navigation**: Clear focus outlines and keyboard trap prevention.
- 🏷️ **ARIA Standards**: Accessible labels, landmarks, and interactive roles throughout all views.

---

## 🤝 Contributing

Contributions make the open-source community an incredible place to learn, inspire, and create! Any contributions you make are **greatly appreciated**.

1. 🍴 **Fork** the Project
2. 🌿 **Create** your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. 💾 **Commit** your Changes (`git commit -m 'Add some AmazingFeature'`)
4. 🚀 **Push** to the Branch (`git push origin feature/AmazingFeature`)
5. 📬 **Open** a Pull Request


