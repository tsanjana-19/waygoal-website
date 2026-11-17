# WayGoal – Complete Website Prototype

**Tagline:** Your Goals. Your Roadmap. Your Future.

This ZIP contains a runnable starter website with:
- Student registration and academic profile
- Goal selection and target details
- Skills, current preparation level and available-time inputs
- Learning preferences and commitments
- Academic calendar/circular document upload (PDF, DOC, DOCX, JPG, PNG)
- A goal-specific sample weekly roadmap
- Task completion and progress tracking
- Node.js + Express backend and local JSON/file storage

## Requirements
- Node.js 18 or newer
- npm

## Run on Windows
1. Extract the ZIP file.
2. Open the extracted `WayGoal_Complete` folder in VS Code.
3. Open Terminal in VS Code.
4. Run:

   ```bash
   npm install
   npm start
   ```

5. Open `http://localhost:3000` in your browser.

## Project structure
```text
WayGoal_Complete/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── data/
│   └── uploads/       (created automatically)
├── package.json
├── server.js
└── README.md
```

## Important prototype limitations
- The roadmap currently uses a transparent rule-based demo, not a connected generative AI model.
- Uploaded documents are stored locally, but their contents are not yet extracted or interpreted. Add a PDF/DOCX text-extraction pipeline and date extraction/validation before presenting automatic circular analysis as implemented.
- Profile data is stored in a local JSON file. This is a development prototype, not production-ready storage.
- Before real student use, add authentication, database storage, consent/privacy notices, validation, file scanning, secure access controls, backups and deployment configuration.
- Do not upload sensitive student records to a public deployment until security and privacy controls are implemented.

## Next development milestones
1. Add MongoDB or PostgreSQL for student profiles and task history.
2. Add document parsing for PDF/DOCX and image OCR.
3. Extract exam, internal assessment, holiday and assignment dates; ask the student to confirm extracted dates.
4. Connect an AI provider through a server-side API key (never place the key in frontend code).
5. Add adaptive rescheduling based on missed/completed tasks, changed study hours and approaching deadlines.
6. Add login, student dashboard, admin controls and deployment.

## Troubleshooting
- If `node` or `npm` is not recognized, install Node.js LTS and reopen VS Code.
- If port 3000 is busy, set a different PORT environment variable before running the server.
- Keep uploaded documents private. The prototype stores files under `data/uploads`.
