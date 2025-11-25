# Diagrams

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        string uid PK
        string email
        string fullName
        string role "owner | vet"
        string phoneNumber
        timestamp createdAt
    }

    PETS {
        string id PK
        string ownerId FK
        string name
        string species
        string breed
        date dateOfBirth
        string gender
        string microchipId
        string medicalNotes
        string photoUrl
        timestamp createdAt
        timestamp updatedAt
    }

    APPOINTMENTS {
        string id PK
        string ownerId FK
        string vetId FK
        string petId FK
        timestamp dateTime
        int duration
        string status
        string reason
        string notes
        timestamp createdAt
        timestamp updatedAt
    }

    RECORDS {
        string id PK
        string petId FK
        string vetId FK
        string appointmentId FK
        timestamp date
        string diagnosis
        string treatment
        string prescription
        string notes
        string[] attachments
        timestamp createdAt
        timestamp updatedAt
    }

    NOTIFICATIONS {
        string id PK
        string userId FK
        string type
        string title
        string message
        boolean read
        string relatedId
        timestamp createdAt
    }

    USERS ||--o{ PETS : owns
    USERS ||--o{ APPOINTMENTS : "books (as owner)"
    USERS ||--o{ APPOINTMENTS : "conducts (as vet)"
    USERS ||--o{ RECORDS : "creates (as vet)"
    USERS ||--o{ NOTIFICATIONS : receives
    PETS ||--o{ APPOINTMENTS : has
    PETS ||--o{ RECORDS : has
    APPOINTMENTS |o--o| RECORDS : generates
```

## Sequence Diagram: User Login & Data Fetching

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Auth as Firebase Auth
    participant DB as Firestore
    participant Store as Redux Store

    User->>App: Enters Email & Password
    App->>Auth: signInWithEmailAndPassword(email, password)
    activate Auth
    Auth-->>App: Auth Success (User Object)
    deactivate Auth
    
    App->>DB: getDoc('users', uid)
    activate DB
    DB-->>App: User Profile Data
    deactivate DB

    App->>Store: dispatch(setUser(userData))
    activate Store
    Store-->>App: State Updated
    deactivate Store

    alt Role is Owner
        App->>DB: query('pets', where('ownerId', '==', uid))
        activate DB
        DB-->>App: List of Pets
        deactivate DB
        App->>Store: dispatch(setPets(pets))
        App->>User: Redirect to Owner Dashboard
    else Role is Vet
        App->>DB: query('appointments', where('vetId', '==', uid))
        activate DB
        DB-->>App: List of Appointments
        deactivate DB
        App->>User: Redirect to Vet Dashboard
    end
```

## Gantt Chart: Development Plan

```mermaid
gantt
    title PetCare+ Development Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Project Setup & Config       :done,    des1, 2025-11-01, 3d
    Authentication (Login/Reg)   :done,    des2, after des1, 5d
    Navigation Structure         :done,    des3, after des2, 3d
    
    section Phase 2: Core Features
    User Profiles (Owner/Vet)    :active,  des4, 2025-11-12, 5d
    Pet Management (CRUD)        :active,  des5, after des4, 7d
    Firebase Integration         :done,    des6, 2025-11-10, 5d

    section Phase 3: Advanced
    Appointment Booking          :         des7, after des5, 10d
    Medical Records              :         des8, after des7, 7d
    Notifications                :         des9, after des8, 5d

    section Phase 4: Polish
    UI/UX Refinement             :         des10, after des9, 5d
    Testing & Bug Fixes          :         des11, after des10, 7d
    Deployment                   :         des12, after des11, 3d
```

## Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Client (React Native / Expo)"]
        UI[UI Components]
        Nav[Expo Router]
        Redux[Redux Store]
        Services[Service Layer]
    end

    subgraph Backend ["Firebase Backend"]
        Auth[Authentication]
        Firestore[Cloud Firestore]
        Storage[Cloud Storage]
    end

    UI --> Nav
    Nav --> Redux
    UI --> Redux
    Redux --> Services
    Services --> Auth
    Services --> Firestore
    Services --> Storage

    subgraph Data_Flow ["Data Flow"]
        direction LR
        Auth -.-> |Token| Services
        Firestore -.-> |JSON Data| Services
        Storage -.-> |Images/Files| Services
    end
```

## Activity Diagram: Appointment Booking Process

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> Dashboard: Auth Success
    Dashboard --> SelectPet: Click "Book Appointment"
    SelectPet --> SelectVet: Pet Selected
    SelectVet --> SelectDate: Vet Selected
    SelectDate --> ConfirmBooking: Date & Time Selected
    ConfirmBooking --> CreateAppointment: User Confirms
    CreateAppointment --> Success: Appointment Created
    Success --> Dashboard: Return to Home
    
    state CreateAppointment {
        [*] --> ValidateData
        ValidateData --> SaveToFirestore: Valid
        SaveToFirestore --> NotifyVet: Saved
        NotifyVet --> [*]
    }
```

## Use Case Diagram

```mermaid
usecaseDiagram
    actor "Pet Owner" as Owner
    actor "Veterinarian" as Vet
    package "PetCare+ System" {
        usecase "Login / Register" as UC1
        usecase "Manage Profile" as UC2
        usecase "Manage Pets" as UC3
        usecase "Book Appointment" as UC4
        usecase "View Medical Records" as UC5
        usecase "Manage Medical Records" as UC6
        usecase "View Appointments" as UC7
        usecase "Receive Notifications" as UC8
    }

    Owner --> UC1
    Owner --> UC2
    Owner --> UC3
    Owner --> UC4
    Owner --> UC5
    Owner --> UC8

    Vet --> UC1
    Vet --> UC2
    Vet --> UC6
    Vet --> UC7
    Vet --> UC5
```


