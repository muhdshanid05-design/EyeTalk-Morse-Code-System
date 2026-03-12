# 👁️ EyeTalk – Eye-Controlled Morse Code Communication System

![Python](https://img.shields.io/badge/Python-3.x-blue)
![Django](https://img.shields.io/badge/Django-Web%20Framework-green)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Mesh-orange)
![Status](https://img.shields.io/badge/Project-Academic-blueviolet)

A smart **assistive communication system** designed for **paralyzed or speech-impaired users**.

EyeTalk allows users to communicate using **eye blinks**, which are converted into **Morse code**, decoded into **text**, and optionally spoken using **Text-to-Speech (TTS)**.

---

# 🧠 Project Overview

Many individuals suffering from paralysis, ALS, or severe speech disabilities cannot communicate easily.

This project introduces an **eye-controlled communication interface** where:

Eye Blinks → Morse Code → Text → Voice

The system uses **computer vision** to detect eye movements and translate them into meaningful communication.

---

# 🎯 Key Features

✔ Eye blink detection using computer vision
✔ Morse code communication system
✔ Real-time text generation
✔ Text-to-Speech voice output
✔ Eye-controlled keyboard
✔ Morse learning tutorial
✔ Morse training game
✔ Guardian monitoring system
✔ SOS emergency alert system
✔ Customizable blink sensitivity settings

---

# ⚙️ System Workflow

```
Eye Blink Detection
        ↓
Blink Classification
        ↓
Morse Code Generation
        ↓
Morse Decoder
        ↓
Text Output
        ↓
Voice Output (Text-to-Speech)
```

Blink duration determines the Morse symbol.

| Blink Type       | Action            |
| ---------------- | ----------------- |
| Short Blink      | Dot (.)           |
| Medium Blink     | Dash (-)          |
| Long Blink       | Delete character  |
| Extra Long Blink | Navigation / Exit |

---

# 👥 System Roles

## 👤 User (Patient)

The user communicates using eye movements.

Functions:

• EyeTalk Morse communication
• Eye-controlled keyboard
• Morse code learning module
• Morse practice game
• Accessibility settings
• SOS emergency alert

---

## 👨‍⚕️ Guardian

Guardians can monitor and assist the user.

Functions:

• Connect to a user
• Monitor user messages
• Modify user settings
• View activity reports
• Assist communication

---

## 🛠 Admin

Admin manages the entire platform.

Functions:

• Approve users
• Approve guardians
• Manage system access
• Monitor feedback
• Control user-guardian connections

---

# 🏗 System Architecture

The system uses a **client-server architecture**.

```
User Camera
      ↓
MediaPipe Face Mesh
      ↓
Blink Detection Algorithm
      ↓
Django Backend API
      ↓
Morse Code Decoder
      ↓
Text Output
      ↓
Text-to-Speech
```

---

# 💻 Technology Stack

### Backend

• Python
• Django Framework

### Frontend

• HTML
• CSS
• JavaScript

### Computer Vision

• MediaPipe Face Mesh

### Browser APIs

• Web Speech API (Text-to-Speech)

### Database

• SQLite / MySQL

---

# 👁 Eye Blink Detection

EyeTalk detects blinks using **facial landmark detection**.

MediaPipe identifies key eye points and calculates **Eye Aspect Ratio (EAR)**.

```
EAR < Threshold  → Eye Closed
EAR ≥ Threshold → Eye Open
```

When the eye closes for a certain duration, a **blink event** is generated.

---

# 🧩 Main Modules

### 1️⃣ User Dashboard

The dashboard provides access to system features:

• EyeTalk Communication
• Eye Keyboard
• Morse Learning
• Morse Game
• Settings
• SOS Emergency Alert

Navigation is possible using **eye blinks**.

---

### 2️⃣ EyeTalk Communication

Users enter Morse code using eye blinks.

Example:

```
Short Blink → .
Medium Blink → -
```

The system decodes Morse sequences into letters and words.

---

### 3️⃣ Eye-Controlled Keyboard

A scanning keyboard allows users to type messages using eye blinks.

Keyboard features:

• Character input
• Space
• Delete
• Send message

---

### 4️⃣ Morse Learning Module

A tutorial module helps users learn Morse code.

The tutorial explains:

• Dot and Dash representation
• Morse alphabets
• Blink mapping
• Communication examples

---

### 5️⃣ Morse Learning Game

A training game helps users practice Morse code.

Game features:

• Random letter generation
• Score tracking
• High score storage

---

### 6️⃣ Accessibility Settings

Users can customize blink detection settings.

Adjustable parameters include:

• Short blink duration
• Medium blink duration
• Long blink duration
• Word gap timing
• Blink sensitivity

---

### 7️⃣ SOS Emergency Alert

The system allows users to send emergency alerts to guardians.

When triggered:

• An email alert is sent
• Guardian receives user information
• Immediate assistance can be provided

---

# 📂 Project Structure

```
EyeTalk-Morse-Code-System
│
├── morsecode_reader_app
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── eye.py
│
├── templates
│   ├── eyetalk_prog.html
│   ├── user_dashboard.html
│   ├── eye_keyboard.html
│   ├── learning_home.html
│   ├── learning_game.html
│   └── user_settings.html
│
├── static
│   ├── js
│   ├── css
│   └── mediapipe
│
└── manage.py
```

---

# 🚀 Installation Guide

### Clone Repository

```
git clone https://github.com/muhdshanid05-design/EyeTalk-Morse-Code-System.git
```

### Navigate to Project Folder

```
cd EyeTalk-Morse-Code-System
```

### Install Dependencies

```
pip install -r requirements.txt
```

### Run Server

```
python manage.py runserver
```

Open browser:

```
http://127.0.0.1:8000
```

---

# 🔬 Research Significance

This project demonstrates how **computer vision** and **assistive technology** can help individuals with severe disabilities communicate independently.

Possible applications include:

• ALS patients
• Locked-in syndrome
• Paralysis rehabilitation
• Assistive healthcare devices

---

# 👨‍💻 Developer

**Muhammed Shanid**

Final Year Project
Assistive Communication System

---

# 📜 License

This project is developed for **academic and research purposes**.
