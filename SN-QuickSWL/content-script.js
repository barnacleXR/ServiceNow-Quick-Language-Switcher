/**
 * ServiceNow Quick Switch Language - Content Script (Final Production Version)
 * This script acts as the "remote control". It injects the UI button
 * and communicates with the background script to perform complex actions.
 */
(function () {
    if (window.hasServiceNowLanguageSwitcher) {
        return;
    }
    window.hasServiceNowLanguageSwitcher = true;
    console.log("SN Quick Switch: Content script loaded.");

    const INJECTION_POINT_SELECTOR = "nav > div > div.ending-header-zone > div.polaris-header-controls > div.utility-menu-container > div";

    function showLanguageModal(languages) {
        const existingModal = document.querySelector('.sn-lang-modal-overlay');
        if (existingModal) existingModal.remove();
        const currentLang = document.documentElement.lang;
        const overlay = document.createElement('div');
        overlay.className = 'sn-lang-modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'sn-lang-modal-container';
        modal.innerHTML = `
            <div class="sn-lang-modal-header"><h3>Switch Language</h3><button class="sn-lang-modal-close-btn">&times;</button></div>
            <div class="sn-lang-modal-body"><ul>
                ${languages.map(lang => `<li data-lang-id="${lang.id}" class="${lang.id === currentLang ? 'current-lang' : ''}">${lang.name}</li>`).join('')}
            </ul></div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        const closeModal = () => overlay.remove();
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        modal.querySelector('.sn-lang-modal-close-btn').addEventListener('click', closeModal);
        modal.querySelectorAll('li[data-lang-id]').forEach(li => {
            li.addEventListener('click', (e) => {
                const langId = e.currentTarget.dataset.langId;
                if (langId !== currentLang) {
                    // Send message to background to set the language
                    chrome.runtime.sendMessage({ action: "setLanguage", langId: langId });
                }
                closeModal();
            });
        });
    }

    async function handleSwitchButtonClick() {
        console.log("[SN Quick Switch] Button clicked. Requesting languages from background...");
        try {
            const response = await chrome.runtime.sendMessage({ action: "getLanguages" });
            
            if (response && response.success && response.data) {
                const languages = response.data;
                if (languages.length <= 1) {
                    alert("ServiceNow Quick Switch:\n\nOnly one language was detected. There is nothing to switch to.");
                } else if (languages.length === 2) {
                    const targetLang = languages.find(lang => lang.id !== document.documentElement.lang);
                    if (targetLang) {
                        chrome.runtime.sendMessage({ action: "setLanguage", langId: targetLang.id });
                    }
                } else {
                    showLanguageModal(languages);
                }
            } else if (response && !response.success) {
                // This will now show the detailed error from the background script
                if (response.error && response.error.includes("I18N_NOT_FOUND")) {
                     alert("ServiceNow Quick Switch:\n\nThis ServiceNow instance does not appear to have multiple languages installed or activated.\n\n(未能检测到多语言环境)");
                 } else {
                    alert(`[SN Quick Switch] An unexpected error occurred:\n\n${response.error || 'Unknown error from background.'}`);
                 }
            } else {
                console.error("Received an invalid response from background script:", response);
                alert("Received an invalid response from the background script. Check the console for more details.");
            }
        } catch (error) {
            console.error("Error communicating with background script:", error);
            alert("An error occurred. The extension's background service might have been interrupted. Please try reloading the page.");
        }
    }

    function injectMainButton(injectionPoint) {
        if (injectionPoint.querySelector("#sn-quick-lang-switch-btn")) return;
        const button = document.createElement('span');
        button.id = 'sn-quick-lang-switch-btn';
        button.className = 'contextual-zone-button polaris-enabled';
        button.style.cursor = 'pointer';
        button.title = 'Quick Switch Language';
        button.innerHTML = `<now-icon class="contextual-zone-icon" icon="translated-text-fill" size="md"></now-icon>`;
        button.addEventListener('click', handleSwitchButtonClick);
        injectionPoint.insertAdjacentElement('afterbegin', button);
        console.log("[SN Quick Switch] Main button injected successfully.");
    }

    // INITIALIZATION
    const observer = new MutationObserver((mutations, obs) => {
        const polarisHeader = document.querySelector("body > macroponent-f51912f4c700201072b211d4d8c26010")?.shadowRoot?.querySelector("sn-polaris-layout")?.shadowRoot?.querySelector("sn-polaris-header")?.shadowRoot;
        if (polarisHeader) {
            const injectionPoint = polarisHeader.querySelector(INJECTION_POINT_SELECTOR);
            if (injectionPoint) {
                injectMainButton(injectionPoint);
                obs.disconnect();
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();