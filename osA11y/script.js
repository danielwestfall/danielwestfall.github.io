// Global variable to store the fetched articles data
let articles = {};

// --- Utility Functions ---

/**
 * Updates the ARIA selected state for a group of buttons.
 * @param {string} groupName - The data-toggle-group value for the buttons.
 * @param {HTMLElement} selectedButton - The button that was just selected.
 */
function updateAriaSelected(groupName, selectedButton) {
    // Find all buttons in the same group
    const buttonsInGroup = document.querySelectorAll(`button[data-toggle-group="${groupName}"]`);

    buttonsInGroup.forEach(button => {
        if (button === selectedButton) {
            // Set the clicked button to selected
            button.setAttribute('aria-selected', 'true');
        } else {
            // Set all other buttons in the group to not selected
            button.setAttribute('aria-selected', 'false');
        }
    });
}

/**
 * Hides all tab panels except the one specified.
 * @param {string} panelIdToShow - The ID of the tab panel to show.
 */
function hideOtherTabPanels(panelIdToShow) {
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
    tabPanels.forEach(panel => {
        if (panel.id === panelIdToShow) {
            panel.removeAttribute('hidden'); // Show the selected panel
        } else {
            panel.setAttribute('hidden', ''); // Hide other panels
        }
    });
}

/**
 * Resets the accordion states and selected topic buttons within a panel.
 * Closes all accordions and deselects topic buttons in the panel that is being reset.
 * NOTE: This function is now primarily used when accordions within a panel are toggled,
 * NOT when switching between main tabs.
 */
function resetAccordionsInPanel(panelToReset) {
    if (panelToReset) {
        // Close any open accordions
        const accordionButtons = panelToReset.querySelectorAll('.accordion-button[aria-expanded="true"]');
        accordionButtons.forEach(button => {
            button.setAttribute('aria-expanded', 'false');
            const panelId = button.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.setAttribute('hidden', '');
            }
        });

        // Also reset the selected state of the detailed topic buttons
        const selectedTopicButtons = panelToReset.querySelectorAll('.accordion-panel button[aria-selected="true"]');
         selectedTopicButtons.forEach(button => {
             button.setAttribute('aria-selected', 'false');
         });

        // Optional: Reset the article content area back to its initial HTML content
        // This requires storing the initial HTML or reloading it.
        // For now, we'll leave the last displayed article content there,
        // but if you want it to revert to the default HTML, you'd need to store and restore it here.
    }
}


// --- Core Functionality ---

/**
 * Fetches the article content from the JSON file.
 */
async function fetchArticles() {
    try {
        // *** IMPORTANT: Update the file path to your new JSON file ***
        const response = await fetch('../data/os_a11y_articles.json');

        if (!response.ok) {
            // Handle HTTP errors (e.g., file not found)
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        articles = data; // Store the fetched data in the global variable
        console.log('OS Accessibility Articles loaded successfully:', articles); // Log success

        // After fetching, set up initial state (e.g., show default content for the first tab)
        setupInitialState();

    } catch (error) {
        console.error('Error fetching or parsing articles:', error);
        // Display an error message in the content areas
        const articleContentAreas = document.querySelectorAll('.article-content');
        articleContentAreas.forEach(area => {
            area.innerHTML = '<h2>Error</h2><p>Error loading content. Please try again later.</p>';
        });
    }
}

/**
 * Displays the content of a specific article in the correct content area.
 * @param {string} articleId - The ID of the article to display (matches JSON key).
 * @param {string} osTabId - The ID of the currently active OS tab (e.g., 'windows-tab').
 */
function displayArticle(articleId, osTabId) {
     // Find the article content area specific to the current OS tab
     const articleContentAreaId = osTabId.replace('-tab', '-article-content');
     const articleContentArea = document.getElementById(articleContentAreaId);

    if (!articleContentArea) {
        console.error(`Article content area not found for OS tab: ${osTabId}`);
        return;
    }

    // Check if the article exists in the loaded data
    if (articles && articles[articleId]) {
        const article = articles[articleId];
        // Update the content area with the article's title and content
        // Using innerHTML is okay here because the content is controlled JSON data
        articleContentArea.innerHTML = `<h2>${article.title}</h2>${article.content}`;
        // Optional: Scroll the content area to the top
        articleContentArea.scrollTop = 0;

    } else {
        console.warn(`Article with ID '${articleId}' not found in loaded articles data.`);
        // Display a "not found" message
        articleContentArea.innerHTML = `<h2>Content Not Found</h2><p>The article for "${articleId}" could not be loaded.</p>`;
    }
}


// --- Event Handlers ---

/**
 * Handles clicks on the main OS tab buttons.
 * @param {MouseEvent} event - The click event object.
 */
function handleTabClick(event) {
    const clickedTab = event.target;
    const isSelected = clickedTab.getAttribute('aria-selected') === 'true';

    // Only proceed if the tab is not already selected
    if (!isSelected) {
        const tabGroup = clickedTab.parentElement; // The tablist
        const tabs = tabGroup.querySelectorAll('[role="tab"]');

        // Update aria-selected for all tabs in the group
        tabs.forEach(tab => {
            if (tab === clickedTab) {
                tab.setAttribute('aria-selected', 'true');
            } else {
                tab.setAttribute('aria-selected', 'false');
            }
        });

        // *** REMOVED: Call to resetAccordionsInPanel ***
        // We no longer want to reset the state when switching tabs.
        // The state of the previous tab's panel will be preserved.
        // const currentPanel = document.querySelector('[role="tabpanel"]:not([hidden])');
        // resetAccordionsInPanel(currentPanel);


        // Show the panel associated with the clicked tab
        const panelId = clickedTab.getAttribute('aria-controls');
        hideOtherTabPanels(panelId);

        // When a new tab is clicked, the initial HTML content in its .article-content div
        // will be visible by default, UNLESS the user had previously selected an article
        // in that tab, in which case the last selected article's content will remain.
    }
}

/**
 * Handles clicks on the accordion header buttons.
 * @param {MouseEvent} event - The click event object.
 */
function handleAccordionClick(event) {
    const clickedButton = event.target;
    const isExpanded = clickedButton.getAttribute('aria-expanded') === 'true';
    const panelId = clickedButton.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);

    if (!panel) {
        console.error(`Accordion panel not found for ID: ${panelId}`);
        return;
    }

    // Close any other open accordions within the same OS tab panel
    // Find the parent tab panel that is currently visible
    const parentTabPanel = clickedButton.closest('[role="tabpanel"]:not([hidden])');
    if (parentTabPanel) {
         const openAccordionsInPanel = parentTabPanel.querySelectorAll('.accordion-button[aria-expanded="true"]');
         openAccordionsInPanel.forEach(button => {
            if (button !== clickedButton) {
                button.setAttribute('aria-expanded', 'false');
                const otherPanelId = button.getAttribute('aria-controls');
                const otherPanel = document.getElementById(otherPanelId);
                if (otherPanel) {
                    otherPanel.setAttribute('hidden', '');
                     // Reset selected state of topic buttons in the panel being closed
                     const selectedTopicButtons = otherPanel.querySelectorAll('button[data-article][aria-selected="true"]');
                     selectedTopicButtons.forEach(btn => {
                         btn.setAttribute('aria-selected', 'false');
                     });
                }
            }
         });
    }


    // Toggle the clicked accordion
    if (isExpanded) {
        clickedButton.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
        // Reset selected state of detailed topic buttons when closing accordion
        const selectedTopicButtons = panel.querySelectorAll('button[data-article][aria-selected="true"]');
        selectedTopicButtons.forEach(button => {
            button.setAttribute('aria-selected', 'false');
        });

    } else {
        clickedButton.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
    }
}

/**
 * Handles clicks on the detailed topic buttons inside accordion panels.
 * @param {MouseEvent} event - The click event object.
 */
function handleTopicButtonClick(event) {
    const clickedButton = event.target;
    const articleId = clickedButton.dataset.article;
    const toggleGroup = clickedButton.dataset.toggleGroup; // Get the toggle group

    if (articleId) {
        // Find the currently active OS tab ID
        const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
        const osTabId = activeTab ? activeTab.id : null;

        if (osTabId) {
            // Display the article content
            displayArticle(articleId, osTabId);
            // Update the aria-selected state for buttons in this group
            updateAriaSelected(toggleGroup, clickedButton);
        } else {
            console.error("Could not determine active OS tab.");
        }
    }
}


// --- Initialization ---

/**
 * Sets up event listeners and initial state when the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Fetch articles when the DOM is loaded
    fetchArticles();

    // Add event listeners to main tab buttons
    const tabs = document.querySelectorAll('[role="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });

    // Add event listeners to accordion header buttons
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.addEventListener('click', handleAccordionClick);
    });

    // Add event listeners to the detailed topic buttons inside accordion panels
    // Use event delegation on the accordion container for efficiency
    const accordionContainers = document.querySelectorAll('.accordion-container');
    accordionContainers.forEach(container => {
        container.addEventListener('click', (event) => {
            // Check if the clicked element is a button with a data-article attribute
            // Make sure the click wasn't on the accordion-button itself (though delegation helps here)
            if (event.target.tagName === 'BUTTON' && event.target.dataset.article) {
                handleTopicButtonClick(event);
            }
        });
    });
});

/**
 * Sets the initial state of the page after articles are loaded.
 * Ensures the first tab is active and its default content is shown.
 */
function setupInitialState() {
    // Find the first tab and its associated panel
    const firstTab = document.querySelector('[role="tablist"] [role="tab"]:first-child');
    if (firstTab) {
        // Ensure the first tab is marked as selected (should be in HTML, but good practice)
        firstTab.setAttribute('aria-selected', 'true');

        // Show the first tab's panel and hide others
        const firstPanelId = firstTab.getAttribute('aria-controls');
        hideOtherTabPanels(firstPanelId);

        // *** Removed: Simulating click on the first article button ***
        // The default content in the HTML .article-content div will now be visible initially.
    }
}
