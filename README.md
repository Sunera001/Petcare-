# PetCare+ Mobile Application

A mobile application for managing pet clinic appointments and medical records, built with Expo and Firebase.

## 🚀 Tech Stack

- **Framework:** Expo SDK 54 (React Native 0.81)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Redux Toolkit + Redux Persist
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **UI:** React Native + Custom Components

## 📋 Prerequisites

- Node.js (v18.x or v20.x LTS)
- npm or yarn
- Expo Go app on your phone (iOS/Android)
- Firebase account

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   cd c:\Users\prave\Desktop\PROJECTS\pet-care-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project: `PetCarePlus-Dev`
   - Enable Authentication (Email/Password)
   - Create Firestore Database (test mode)
   - Create Cloud Storage (test mode)
   - Register a **Web app** in Firebase
   - Copy the Firebase config

4. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Replace the placeholder values with your Firebase config:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## 🏃 Running the App

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Run on your device:**
   - Install **Expo Go** app from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in the terminal
   - The app will load on your device!

3. **Alternative - Run on emulator:**
   ```bash
   # Android emulator
   npm run android

   # iOS simulator (macOS only)
   npm run ios

   # Web browser
   npm run web
   ```

## 📱 Features (Current Implementation)

- ✅ User Authentication (Login/Register)
- ✅ Role-based access (Pet Owner / Veterinarian)
- ✅ Firebase integration
- ✅ Redux state management with persistence
- ✅ Expo Router navigation
- ✅ TypeScript type safety

## 🚧 Coming Soon

- Pet registration and management
- Appointment booking system
- Medical records
- Push notifications
- Image upload for pet photos

## 📂 Project Structure

```
pet-care-app/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens (login, register)
│   ├── (owner)/           # Pet owner screens
│   ├── (vet)/             # Veterinarian screens
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # Reusable UI components
├── services/              # Firebase services
├── store/                 # Redux store & slices
│   └── slices/           # Redux slices
├── types/                 # TypeScript types
├── theme/                 # Colors, typography
├── utils/                 # Utility functions
└── docs/                  # Documentation
```

## 🧪 Testing the App

1. **Create a test account:**
   - Open the app
   - Tap "Create New Account"
   - Fill in details and select role (Pet Owner or Vet)
   - Register

2. **Test authentication:**
   - Logout
   - Login with the same credentials
   - Verify you're redirected to the correct dashboard

3. **Test persistence:**
   - Close the app completely
   - Reopen it
   - You should still be logged in!

## 🔥 Firebase Setup Details

### Firestore Collections (to be created):

1. **users** - User profiles
2. **pets** - Pet information
3. **appointments** - Appointment bookings
4. **records** - Medical records

### Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    // Add more rules as we build features
  }
}
```

## 📚 Documentation

- [Product Requirements Document (PRD)](./docs/PRD.md)
- [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md)
- [Development Plan](./docs/DEVELOPMENT_PLAN.md)
- [Build Guide](./docs/BUILD_GUIDE.md)
- [Expo Migration Guide](./docs/EXPO_MIGRATION.md)

## 🐛 Troubleshooting

**App won't start:**
```bash
npm start -- -c   # Clear cache
```

**Firebase errors:**
- Check your `.env` file has correct values
- Ensure Firebase project has Auth and Firestore enabled
- Verify you registered a **Web app** (not iOS/Android)

**Can't scan QR code:**
- Make sure phone and computer are on same WiFi
- Try using tunnel mode: `npm start -- --tunnel`

## 📝 Next Development Steps

See [DEVELOPMENT_PLAN.md](./docs/DEVELOPMENT_PLAN.md) for detailed phase-by-phase plan.

**Phase 3 (Next):** Implement Pet Management
- Create pet registration form
- List user's pets
- Pet profile with photo upload

## 👥 Contributors

Development Team - PetCare+ Project

## 📄 License

This project is for educational purposes.

---

**Status:** ✅ Phase 1 & 2 Complete - Authentication Working!  
**Next:** Phase 3 - Pet Management Module





















CORE MATHEMATICS (MANDATORY)
1. Linear Algebra

If you skip this, quit now.

Vectors (dot, cross, normalization)

Matrices (3×3, 4×4), determinants, inverses

Transformations: translation, rotation, scaling

Quaternions (rotation without gimbal lock)

Eigenvalues & eigenvectors (for deformation, stability)

Homogeneous coordinates

2. Calculus

Used for continuous motion and change.

Derivatives (velocity, acceleration, angular motion)

Integrals (accumulated displacement, work, energy)

Differential equations (motion under forces)

Partial derivatives (materials, fields, shaders)

Gradient & Jacobian (optimization, IK)

3. Numerical Analysis

Because real-time systems cannot solve analytically.

Finite difference methods

Numerical integration (Euler, Verlet, Runge–Kutta)

Stability analysis

Root-finding (Newton–Raphson)

Least-squares minimization (camera solve, IK)

Constraint solvers (Gauss–Seidel, Jacobi)

4. Probability & Statistics

Used for realism, AI, signal smoothing.

Distributions (Gaussian, Poisson)

Bayesian probability

Random sampling (Monte Carlo)

Noise models (Perlin, Worley, simplex)

Filtering (Kalman, low-pass, exponential smoothing)

5. Discrete Mathematics & Graph Theory

Used in navigation, level representation, optimizations.

Graphs, adjacency matrices

Shortest path algorithms (A*, Dijkstra)

State machines, decision trees, MDP

6. Optimization & Computational Geometry

For collision detection, animation, world queries.

Convex hulls, Voronoi diagrams

Spatial partitioning (BSP, Octree, KD-tree, BVH)

Linear programming / Lagrange multipliers

Distance & intersection tests (ray, plane, sphere, mesh)

PHYSICS TOPICS (REAL, NOT CARTOON)
1. Classical Mechanics

Newtonian motion (linear & rotational)

Momentum & impulse

Angular dynamics (inertia tensors)

Work, power, torque

Rigid-body collision response

2. Continuum Mechanics

Used for clothes, liquids, soft-bodies.

Stress & strain tensors

Elasticity theory

FEM (finite element method)

Mass-spring systems

3. Fluid Dynamics

Only serious devs tackle this.

Navier–Stokes equations

Vorticity & divergence

Pressure solvers

Buoyancy, drag, turbulence

4. Thermodynamics & Energy Systems

For advanced simulations.

Heat diffusion PDE

Phase change & evaporation models

Radiation & conduction

5. Electromagnetics (Optional but Real)

Used in advanced rendering & materials.

Light transport equations

BRDF/BSDF models

Fresnel equations

Radiometry & photometry

COMPUTER GRAPHICS-SPECIFIC MATH

If you want cutting-edge visuals, you must know:

Ray tracing math (intersection tests, sampling)

Fourier analysis (signal reconstruction, TAA)

Spherical harmonics (global illumination)

Microfacet theory (GGX, Beckmann)

Color science (XYZ, RGB spaces, tone mapping)

IF YOU CAN’T HANDLE THIS, YOU’RE STUCK IN AMATEUR MODE

Most people pretend they want “realistic physics” but won’t touch:

Vector calculus

Tensor math

PDE solvers

Numerical stability theory

If that list scares you, good — it separates real developers from hobby button-pressers.