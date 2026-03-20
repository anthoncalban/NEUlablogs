# 🏫 NEU Laboratory Room Logs

## 📝 Description
The **NEU Laboratory Room Logs** is a secure web application designed to streamline the monitoring and management of laboratory room usage at New Era University. It provides role-based access for professors and administrators, enabling efficient logging of room activities, student attendance, and resource usage. The system ensures accountability, transparency, and accessibility through Firebase-backed authentication and storage.

---

## 🌐 Live Deployment
- **Link:** [NEU Laboratory Room Logs](https://neu-lablogs.vercel.app/)

---

## 📌 Features
- 🔐 **Secure Login**: Google Authentication restricted to `@neu.edu.ph`.  
- 👨‍🏫 **Professor Role**:  
  - Log laboratory room usage.  
  - Track student attendance and activity.  
  - Access personal portal for monitoring.  
- 🛠️ **Admin Role**:  
  - Manage professor accounts.  
  - Monitor overall lab usage statistics.  
  - Generate reports (daily, weekly, monthly, or custom).  
- 📊 **Analytics Dashboard**: Visualize lab usage trends and attendance.  
- 📂 **Data Management**: Store logs in Firestore with metadata.  
- ⚠️ **Error Handling**: Error boundaries ensure smooth user experience.  
- 📱 **PWA Installation**:  
  - **Android (Chrome):** Open app → Add to Home Screen → Install  
  - **iOS (Safari):** Open app → Share → Add to Home Screen → Install  

---

## 🏗️ Tech Stack

| **Layer**            | **Technology**                  |
|-----------------------|---------------------------------|
| Frontend (UI)         | React + TypeScript (Vite)       |
| State Management      | React Context API               |
| Authentication        | Firebase Authentication (Google)|
| Database              | Firestore (NoSQL)               |
| Hosting               | Firebase Hosting / Vercel       |
| Configuration         | JSON configs + env.example      |
| Styling               | CSS / Tailwind (optional)       |
| Build Tool            | Vite                            |

---

## 🔄 Application Flows

| **Flow**              | **Purpose**                                                                 | **Steps**                                                                 |
|------------------------|-----------------------------------------------------------------------------|---------------------------------------------------------------------------|
| **Professor Login**    | Authenticate professors via Google restricted to `@neu.edu.ph`.             | 1. Professor clicks login → 2. Google Auth → 3. Domain check → 4. Success → 5. Access Professor Portal. |
| **Room Logging**       | Professors record lab room usage and attendance.                           | 1. Navigate to portal → 2. Select lab room → 3. Input usage/attendance → 4. Save to Firestore. |
| **Admin Monitoring**   | Admins oversee lab usage and professor activity.                           | 1. Login as Admin → 2. Access dashboard → 3. View logs → 4. Generate reports. |
| **Report Generation**  | Provide insights into lab usage over time.                                 | 1. Admin selects time range → 2. Query Firestore logs → 3. Display charts/statistics. |
| **Error Handling**     | Prevent app crashes and provide fallback UI.                               | 1. Component error occurs → 2. ErrorBoundary catches → 3. Display error message → 4. Log error. |

---

## ⚖️ License
**Academic Integrity & Copyright Notice**  
This project was developed for academic purposes at NEU. Unauthorized copying, adaptation, distribution, or commercial use is strictly prohibited.
