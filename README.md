# BillSplit AI 💸

A modern, responsive web application designed to make splitting bills effortless. Whether it's a dinner with friends or shared household expenses, BillSplit AI helps you calculate exactly who owes what, with support for complex splits and tax distributions.

![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-skyblue)

## ✨ Features

- **👥 Group Management**: Quickly add and manage the people splitting the bill.
- **🛍️ Itemized Splitting**: Add individual items and prices from your receipt.
- **🔢 Smart Portions**: Move beyond simple "even splits." Assign specific counts/portions to each person (e.g., if someone had 2 drinks and another had 1).
- **🧾 Tax & Extra Charges**: Add taxes or service charges with two distribution methods:
  - **Equal Split**: Tax is divided evenly among everyone.
  - **Proportional**: Tax is distributed based on the value of items each person consumed.
- **🤖 AI Bill Scanner**: Use the built-in AI prompt helper to quickly import items from a text-based receipt scan or photo.
- **💾 Persistent State**: Your progress is automatically saved to local storage, so you won't lose your data if the page refreshes.
- **📱 Mobile Ready**: Built with Capacitor, ready to be deployed as a native Android or iOS app.

## 🚀 Tech Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Mobile**: [Capacitor](https://capacitorjs.com/)

## 🛠️ Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bill-split.git
   cd bill-split
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

### Building for Production
```bash
npm run build
```

## 📱 Mobile Deployment (Capacitor)

This project is configured for mobile using Capacitor.

1. **Build the web project**:
   ```bash
   npm run build
   ```

2. **Sync with platforms**:
   ```bash
   npx cap sync
   ```

3. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

## 📁 Project Structure

```
bill-split/
├── src/
│   ├── App.tsx          # Main application logic & UI
│   ├── types.ts         # TypeScript interfaces
│   ├── index.css        # Tailwind & global styles
│   └── main.tsx         # React entry point
├── public/              # Static assets
├── capacitor.config.ts  # Mobile configuration
├── vite.config.ts       # Vite configuration
└── package.json         # Project dependencies & scripts
```

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](file:///c:/Users/anand/Files/Projects/bill-split/LICENSE) file for details.

---
Built with ❤️ by [Anandu Kannan](https://github.com/AnanduKannan)
