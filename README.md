# ScheduleGame

## Prerequisites

To run the project locally, ensure the following tools are installed on your machine:

1. **Node.js**:
2. **Java Development Kit (JDK)**: Required to run the Firebase Firestore emulator.
3. **Firebase CLI**: Install globally via npm using the following command:

```bash
npm install -g firebase-tools
```

## Installation

1. Clone the repository or extract the project archive.
2. Navigate to the project root directory.
3. Install the required dependencies:

```bash
npm install
```

## Running the Application

The application requires running both the **Frontend** (Angular) and the **Backend** (Firebase Emulators) concurrently. You will need to open two separate terminal windows.

### Step 1: Start Firebase Emulators (Backend)

In the first terminal window, start the local database and authentication services:

```bash
firebase emulators:start --only firestore,auth
```

Note: Please wait until you see the "All emulators ready" message.

### Step 2: Start Angular Server (Frontend)

In the second terminal window, start the application server:

```bash
ng serve
```

Once both services are running, open your web browser and navigate to:
`http://localhost:4200/`

## Testing

### Unit Tests

To execute the suite of unit tests using the Karma test runner, run:

```bash
ng test
```
