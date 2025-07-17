/**
 * ServiceNow Quick Switch Language - Background Script (Final Production Version)
 * This script acts as the "brain" of the extension. It listens for messages
 * from the content script and uses the chrome.scripting API to securely execute
 * complex automation in the page's main world, bypassing CSP and isolated world limitations.
 */

// The function that will be injected into the main world to run our automation.
// It has detailed, step-by-step error handling.
async function getAvailableLanguages() {
    const waitForElement = async (finder, timeout = 3000, interval = 100) => {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const element = finder();
            if (element) return element;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        // This will be caught by the step-specific catch block below
        throw new Error("Element not found within timeout.");
    };

    let avatar_button;
    try {
        // --- Step 1: Click User Avatar ---
        try {
            avatar_button = await waitForElement(() => document.querySelector("body > macroponent-f51912f4c700201072b211d4d8c26010")?.shadowRoot?.querySelector("sn-polaris-layout")?.shadowRoot?.querySelector("sn-polaris-header")?.shadowRoot?.querySelector("now-avatar")?.shadowRoot?.querySelector("span"));
            avatar_button.click();
        } catch (e) {
            throw new Error("Step 1 Failed: Could not find User Avatar button. " + e.message);
        }

        // --- Step 2: Click Preferences ---
        try {
            const preferences_button = await waitForElement(() => document.querySelector("body > macroponent-f51912f4c700201072b211d4d8c26010")?.shadowRoot?.querySelector("sn-polaris-layout")?.shadowRoot?.querySelector("sn-polaris-header")?.shadowRoot?.querySelector("#userMenu button.preferences"));
            preferences_button.click();
        } catch (e) {
            throw new Error("Step 2 Failed: Could not find Preferences button. " + e.message);
        }

        // --- Step 3: Click Language & Region ---
        try {
            const lang_region_button = await waitForElement(() => document.querySelector("body > macroponent-f51912f4c700201072b211d4d8c26010")?.shadowRoot?.querySelector("sn-polaris-layout")?.shadowRoot?.querySelector("sn-polaris-header")?.shadowRoot?.querySelector("sn-nav-header-settings")?.shadowRoot?.querySelector("#region"));
            lang_region_button.click();
        } catch (e) {
            // This is an expected failure path if i18n is not installed.
            throw new Error("I18N_NOT_FOUND");
        }
        
        // --- Step 4: Click language selector to open dropdown ---
        try {
            const languageSelectorButton = await waitForElement(() => document.querySelector("body > macroponent-f51912f4c700201072b211d4d8c26010")?.shadowRoot?.querySelector("sn-polaris-layout")?.shadowRoot?.querySelector("sn-polaris-header")?.shadowRoot?.querySelector("sn-nav-header-settings")?.shadowRoot?.querySelector("#language-select > div > now-select")?.shadowRoot?.querySelector('button'));
            languageSelectorButton.click();
        } catch(e) {
            throw new Error("Step 4 Failed: Could not find the language selector dropdown button. " + e.message);
        }

        // --- Step 5: Scrape data from the rendered list ---
        let formattedLanguages;
        try {
            const langListContainer = await waitForElement(() => document.querySelector('body > now-popover-panel > seismic-hoist')?.shadowRoot?.querySelector('div[role="listbox"].now-dropdown-list-item-container'));
            const langElements = langListContainer.querySelectorAll('div[role="option"]');
            if (langElements.length === 0) throw new Error("Language list rendered, but no options found inside.");
            formattedLanguages = Array.from(langElements).map(el => ({ id: el.id, name: el.textContent.trim() }));
        } catch (e) {
            throw new Error("Step 5 Failed: Could not scrape language data from the dropdown. " + e.message);
        }

        // --- Step 6: Close the modal ---
        try {
            const close_button = await waitForElement(() => {
                const settingsRoot = document.querySelector("body > macroponent-f51912f4c700201072b211d4d8c26010")?.shadowRoot?.querySelector("sn-polaris-layout")?.shadowRoot?.querySelector("sn-polaris-header")?.shadowRoot?.querySelector("sn-nav-header-settings")?.shadowRoot;
                return settingsRoot?.querySelector("now-modal")?.shadowRoot?.querySelector("#now-modal-close-button")?.shadowRoot?.querySelector("button") || settingsRoot?.querySelector("#now-modal-close-button")?.shadowRoot?.querySelector("button");
            });
            close_button.click();
        } catch (e) {
            throw new Error("Step 6 Failed: Could not find or click the close button. " + e.message);
        }

        // --- Step 7: Restore UI ---
        avatar_button.click();
        
        return formattedLanguages; // Success!

    } catch (error) {
        // Attempt to restore UI in case of any failure
        if (avatar_button) avatar_button.click();
        // Re-throw the specific error so the background script can catch it
        throw error;
    }
}

// The function to switch language, also to be injected
function switchLanguageTo(langId) {
    return fetch('/api/now/ui/concoursepicker/language', {
        method: 'PUT',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json;charset=UTF-8',
            'X-UserToken': window.g_ck || undefined,
            'X-WantSessionNotificationMessages': 'true'
        },
        body: JSON.stringify({'current': langId })
    }).then(response => {
        if (response.ok) {
            return {success: true};
        }
        return {success: false, status: response.status};
    });
}


// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getLanguages") {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            world: 'MAIN',
            func: getAvailableLanguages
        })
        .then(injectionResults => {
            if (injectionResults && injectionResults.length > 0) {
                sendResponse({success: true, data: injectionResults[0].result });
            } else {
                 sendResponse({success: false, error: "Script injection returned no results."});
            }
        })
        .catch(err => {
            console.error("[SN Quick Switch Background] Automation failed with specific error:", err.message);
            sendResponse({success: false, error: err.message });
        });
        return true; // Indicates that the response is sent asynchronously
    }

    if (message.action === "setLanguage") {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            world: 'MAIN',
            func: switchLanguageTo,
            args: [message.langId]
        })
        .then(injectionResults => {
             // Reload the tab on success
             if (injectionResults[0]?.result?.success) {
                chrome.tabs.reload(sender.tab.id);
             } else {
                console.error("Failed to switch language, result:", injectionResults);
             }
        });
    }
});