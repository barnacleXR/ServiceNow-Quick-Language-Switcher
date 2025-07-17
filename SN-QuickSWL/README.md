[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md)

# ServiceNow Quick Language Switcher (QLS)

A browser extension that adds a button to the ServiceNow Polaris UI header, allowing users to quickly switch between installed languages.

> **Compatibility Note**: This extension is designed exclusively for the **Next Experience UI** and does not support the classic UI (UI16).

---

### Features

-   **Seamless Integration**: Adds a language switch icon directly into the ServiceNow header for easy access.
-   **Smart Switching**:
    -   If **two languages** are configured, the button acts as a one-click toggle to the other language.
    -   If **more than two languages** are available, a clean and simple modal appears, allowing you to choose from the list.
-   **Automatic Language Detection**: The extension automatically scrapes the available languages from your ServiceNow preferences panel.
-   **Error Handling**: Provides clear user feedback if the ServiceNow instance does not have multiple languages enabled.

### How It Works

The extension is composed of a content script that injects UI elements and a background script that handles the core logic, bypassing sandbox limitations.

1.  **UI Injection (`content-script.js`)**:
    -   A `MutationObserver` waits for the ServiceNow Polaris header to load.
    -   Once the header is ready, a new language switch icon (`<now-icon icon="translated-text-fill">`) is injected into the header's control zone.
    -   This script listens for clicks on the new icon. When clicked, it sends a message to the background script to fetch the list of available languages.
    -   If more than two languages are returned, it dynamically creates and displays a language selection modal using styles from `custom-modal.css`.

2.  **Core Logic (`background.js`)**:
    -   The background script listens for messages from the content script.
    -   **Fetching Languages**: When a `getLanguages` request is received, it uses the `chrome.scripting.executeScript` API to run a function (`getAvailableLanguages`) in the page's `MAIN` world. This is necessary to access the page's JavaScript context and DOM elements inside complex shadow roots.
    -   The injected `getAvailableLanguages` function automates the UI flow of a user checking their preferences to scrape the language names and their corresponding IDs.
    -   **Setting Language**: When a `setLanguage` request is received (with a target language ID), it injects another function (`switchLanguageTo`) that makes a `PUT` request to ServiceNow's internal API (`/api/now/ui/concoursepicker/language`) to change the session language, and then reloads the page.

### Installation

1.  Download or clone this repository.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" using the toggle in the top-right corner.
4.  Click on the "**Load unpacked**" button.
5.  Select the directory where you saved these files (`SN-QLS` or your project folder).
6.  The extension is now installed and will be active on ServiceNow pages.
