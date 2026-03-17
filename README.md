# HousingDE - The Automated Operating System for German Rentals

**HousingDE** is not just another listing site; it is an AI-powered operating system designed to automate the entire German housing search process. We solve the three biggest pain points of the market: **Speed**, **Language Barriers**, and **Trust**.

While traditional platforms acts as static directories, HousingDE is **proactive**—it finds the home, vets the landlord, and writes the application for you.

## 🚀 Key AI Features

### 1. The Hawk (AI Bodyguard) 🦅
*   **Problem:** The market is flooded with scams that waste time and steal money.
*   **Solution:** Our computer vision and NLP models analyze listings in real-time.
    *   **Image Analysis:** Detects recycled stock photos and inconsistent lighting.
    *   **Text Analysis:** Identifies fraud patterns in descriptions.
    *   **Trust Score:** Every listing gets a 0-100 score, filtering out scams *before* you see them.

### 2. The Diplomat (Application Automation) 🎩
*   **Problem:** Generic "I am interested" messages get ignored. German landlords expect detailed, formal *Bewerbungen*.
*   **Solution:** An autonomous agent that writes culturally nuanced applications.
    *   **Profile Integration:** Uses your income, occupation, and personal details.
    *   **Context Awareness:** Tailors the message to the specific listing (e.g., mentioning the balcony or location).
    *   **Perfect German:** Generates native-level communication instantly.

### 3. The Advisor (24/7 AI Scout) 🧠
*   **Problem:** Filters are rigid and often miss hidden gems.
*   **Solution:** A RAG-powered (Retrieval-Augmented Generation) chat assistant.
    *   **Natural Language Search:** *"Find me a 2-room Altbau in Neukölln under €1200 that accepts pets."*
    *   **Live Market Data:** The AI has access to the real-time database of verified listings.
    *   **Strategic Advice:** Acts as a consultant, helping you navigate German rental law and market trends.

## 🏗️ Technology Stack

*   **Frontend:** Next.js 14, Tailwind CSS, Glassmorphism 2.0 Design
*   **Backend:** NestJS, PostgreSQL, TypeORM
*   **AI/ML:** Google Gemini (1.5 Flash), BullMQ (Job Queues), Redis
*   **Real-time:** Socket.io (Chat & Notifications)
*   **Infrastructure:** Docker, Nginx

## 🏁 Getting Started

### Prerequisites
*   Node.js v20+
*   Docker (for Redis/Postgres)

### Installation

1.  **Clone the repository**
    \`\`\`bash
    git clone https://github.com/your-repo/housing-de.git
    \`\`\`

2.  **Start Services (DB & Redis)**
    \`\`\`bash
    docker-compose up -d
    \`\`\`

3.  **Install Dependencies**
    \`\`\`bash
    cd backend && npm install
    cd ../frontend && npm install
    \`\`\`

4.  **Run Development Servers**
    *   Backend: \`npm run start:dev\` (Port 3001)
    *   Frontend: \`npm run dev\` (Port 3000)

## 📸 Snapshots

![HousingDE Homepage](/frontend/public/placeholder.jpg)
*Real-time AI search and verified listings.*
