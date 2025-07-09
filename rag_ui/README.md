# RAG React App

This project is a modular, themeable React application built with Vite and Chakra UI, featuring robust file upload, atomic design, and SCSS module styling.

## Features

- **Chakra UI v3.21.0**: Consistent, theme-driven UI with custom color and shadow variables.
- **Atomic Design & BEM**: Components and SCSS modules follow atomic design and BEM conventions for maintainability.
- **File Upload Card**:
  - Custom file input using Chakra UI best practices (no default upload, no FormControl/FileUpload component).
  - Accepts PDF, TXT, and DOCX files only, with robust error handling and accessibility.
  - Captures file Blob for further processing (no upload to default URL).
  - Right-aligned upload button with icon, styled via SCSS variables.
- **Consistent Theming**: All UI elements (cards, buttons, scrollbars) styled via SCSS variables for easy theming.
- **Accessible & Responsive**: All interactions and error states are accessible and mobile-friendly.

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the app:**
   ```sh
   npm run dev
   ```

## File Upload Usage
- The upload card is in `src/pages/components/Upload/FileUploadCard.jsx`.
- File selection is handled with a visually hidden input and a styled button.
- No file is uploaded to a default URL; the file Blob is captured for custom handling.
- Error messages are shown for invalid file types or sizes.

## Customization
- Update color and shadow variables in `src/styles/_variables.scss` for theming.
- Extend file upload logic for preview, progress, or backend integration as needed.

## Project Structure
- `src/pages/components/` – Modular, atomic React components
- `src/styles/` – SCSS modules and variables
- `public/` – Static assets

---

This project was bootstrapped with [Vite](https://vitejs.dev/) and uses [Chakra UI](https://chakra-ui.com/) for UI components.

---

# Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
