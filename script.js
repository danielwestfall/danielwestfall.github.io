// Global variable to store the fetched articles data for the current page
let articles = {};
// Stores the path to the JSON file for the current page, determined dynamically
let currentArticlesJsonPath = '';

// --- Utility Functions ---

/**
 * Updates the ARIA selected state for a group of buttons.
 * This is used for the topic buttons inside accordion panels.
 * @param {string} groupName - The data-toggle-group value for the buttons.
 * @param {HTMLElement} selectedButton - The button that was just selected.
 */
function updateAriaSelected(groupName, selectedButton) {
    // Find all buttons in the same group on the current page
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
 * Hides all tab panels except the one specified by its ID.
 * This ensures only one main tab panel is visible at a time.
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
 * Resets the accordion states and deselects topic buttons within a given tab panel.
 * This is called when switching between main tabs to clean up the previous tab's state.
 * @param {HTMLElement} panelToReset - The tab panel element whose accordions should be reset.
 */
function resetAccordionsInPanel(panelToReset) {
    if (panelToReset) {
        // Close any currently open accordions within this panel
        const accordionButtons = panelToReset.querySelectorAll('.accordion-button[aria-expanded="true"]');
        accordionButtons.forEach(button => {
            button.setAttribute('aria-expanded', 'false');
            const panelId = button.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.setAttribute('hidden', '');
            }
        });

        // Deselect any selected topic buttons within this panel
        const selectedTopicButtons = panelToReset.querySelectorAll('.accordion-panel button[aria-selected="true"]');
        selectedTopicButtons.forEach(button => {
            button.setAttribute('aria-selected', 'false');
        });

        // Optional: Reset the article content area back to its initial HTML content
        // If you want the content area to clear or revert to a default message when a tab is switched,
        // you would implement that logic here. For now, it will retain the last displayed article.
    }
}

// --- Core Functionality ---

/**
 * Fetches the article content from the JSON file specified by the data-articles-path attribute
 * on the main content area.
 */
async function fetchArticles() {
    const mainContentArea = document.querySelector('main.tabbed-content');
    if (!mainContentArea) {
        console.error('Main content area with class "tabbed-content" not found. Cannot fetch articles.');
        return;
    }
    // Get the JSON file path from the data attribute on the main content area
    currentArticlesJsonPath = mainContentArea.dataset.articlesPath;

    if (!currentArticlesJsonPath) {
        console.error('data-articles-path attribute not found on main.tabbed-content. Cannot fetch articles.');
        const articleContentAreas = document.querySelectorAll('.article-content');
        articleContentAreas.forEach(area => {
            area.innerHTML = '<h2>Configuration Error</h2><p>Article data path is missing. Please check the `data-articles-path` attribute on your main content area.</p>';
        });
        return;
    }

    try {
        const response = await fetch(currentArticlesJsonPath);

        if (!response.ok) {
            // Handle HTTP errors (e.g., file not found, server error)
            throw new Error(`HTTP error! Status: ${response.status} fetching ${currentArticlesJsonPath}`);
        }

        const data = await response.json();
        articles = data; // Store the fetched data in the global variable
        console.log(`Articles loaded successfully from: ${currentArticlesJsonPath}`);

        // After successfully fetching articles, set up the initial display state
        setupInitialState();

    } catch (error) {
        console.error(`Error fetching or parsing articles from ${currentArticlesJsonPath}:`, error);
        // Display an error message in all possible article content areas
        const articleContentAreas = document.querySelectorAll('.article-content');
        articleContentAreas.forEach(area => {
            area.innerHTML = '<h2>Error Loading Content</h2><p>We apologize, but there was an issue loading the articles. Please try again later.</p>';
        });
    }
}

/**
 * Displays the content of a specific article in the correct content area.
 * @param {string} articleId - The ID of the article to display (matches a key in the 'articles' JSON data).
 * @param {string} activeTabId - The ID of the currently active main tab (e.g., 'html-tab', 'windows-tab').
 */
function displayArticle(articleId, activeTabId) {
    // Determine the specific article content area based on the active tab's ID
    const articleContentAreaId = activeTabId.replace('-tab', '-article-content');
    const articleContentArea = document.getElementById(articleContentAreaId);

    if (!articleContentArea) {
        console.error(`Article content area not found for tab ID: ${activeTabId}. Expected ID: ${articleContentAreaId}`);
        return;
    }

    // Check if the article exists in the loaded data
    if (articles && articles[articleId]) {
        const article = articles[articleId];
        // Inject the article's title and content into the designated area.
        // Using innerHTML is considered safe here as content is from a controlled JSON source.
        articleContentArea.innerHTML = `<h2>${article.title}</h2>${article.content}`;
        // Scroll the content area to the top for better user experience
        articleContentArea.scrollTop = 0;

    } else {
        console.warn(`Article with ID '${articleId}' not found in loaded articles data from ${currentArticlesJsonPath}.`);
        // Display a "content not found" message if the article ID is missing
        articleContentArea.innerHTML = `<h2>Content Not Available</h2><p>The requested article "${articleId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}" could not be found. Please select another topic.</p>`;
    }
}

// --- Event Handlers ---

/**
 * Handles click events on the main tab buttons (e.g., HTML, CSS, Windows, macOS).
 * Manages the aria-selected state and visibility of tab panels.
 * @param {MouseEvent} event - The click event object from the tab button.
 */
function handleTabClick(event) {
    const clickedTab = event.target;
    const isSelected = clickedTab.getAttribute('aria-selected') === 'true';

    // Only process the click if the tab is not already selected
    if (!isSelected) {
        const tabList = clickedTab.parentElement; // The element with role="tablist"
        const tabs = tabList.querySelectorAll('[role="tab"]');
        const targetPanelId = clickedTab.getAttribute('aria-controls');
        const targetPanel = document.getElementById(targetPanelId);

        // Deactivate all tabs visually and semantically
        tabs.forEach(tab => {
            tab.setAttribute('aria-selected', 'false');
            // Optional: tab.setAttribute('tabindex', '-1'); // To make non-selected tabs not reachable via Tab key
        });

        // Get the currently visible panel before hiding all to reset its accordions
        const currentlyVisiblePanel = document.querySelector('[role="tabpanel"]:not([hidden])');
        if (currentlyVisiblePanel && currentlyVisiblePanel !== targetPanel) {
            resetAccordionsInPanel(currentlyVisiblePanel);
        }

        // Activate the clicked tab
        clickedTab.setAttribute('aria-selected', 'true');
        // Optional: clickedTab.setAttribute('tabindex', '0'); // To ensure selected tab is focusable

        // Show the target panel and hide all others
        hideOtherTabPanels(targetPanelId);

        // Set focus to the newly revealed panel's content area (important for screen reader users)
        if (targetPanel) {
            const articleContentDiv = targetPanel.querySelector('.article-content');
            if (articleContentDiv) {
                // Make the content area programmatically focusable
                articleContentDiv.setAttribute('tabindex', '-1');
                articleContentDiv.focus(); // Move focus to the content
                // Remove tabindex after a brief delay if it's not meant to be permanently focusable
                // setTimeout(() => articleContentDiv.removeAttribute('tabindex'), 10);
            }
            // If the tab just switched to is NOT the welcome panel (which usually has static content),
            // attempt to load the first article of the newly active tab's first accordion.
            // This provides immediate content when switching to a new OS/Language tab.
            if (targetPanelId !== 'welcome-panel') {
                const firstAccordionButton = targetPanel.querySelector('.accordion-button:first-of-type');
                if (firstAccordionButton) {
                    // Expand the first accordion
                    firstAccordionButton.setAttribute('aria-expanded', 'true');
                    const firstAccordionPanel = document.getElementById(firstAccordionButton.getAttribute('aria-controls'));
                    if (firstAccordionPanel) {
                        firstAccordionPanel.removeAttribute('hidden');

                        // Click the first article button within that opened accordion
                        const firstArticleButton = firstAccordionPanel.querySelector('button[data-article]:first-of-type');
                        if (firstArticleButton) {
                            // This simulates a click, which will call handleTopicButtonClick and update aria-selected
                            firstArticleButton.click();
                        }
                    }
                }
            }
        }
    }
}

/**
 * Handles keyboard navigation within the main tab list (Arrow keys, Home, End, Enter, Space).
 * @param {KeyboardEvent} event - The keyboard event object.
 */
function handleTabKeyDown(event) {
    const currentTab = event.target;
    const tabList = currentTab.parentNode;
    // Convert NodeList to an Array to use array methods like indexOf
    const tabsArray = Array.from(tabList.children);
    const currentIndex = tabsArray.indexOf(currentTab);
    let newIndex;

    switch (event.key) {
        case 'ArrowLeft':
            // Move to the previous tab, loop around to the end if at the beginning
            newIndex = currentIndex > 0 ? currentIndex - 1 : tabsArray.length - 1;
            tabsArray[newIndex].focus(); // Move focus to the new tab button
            event.preventDefault(); // Prevent default browser scroll or other actions
            break;
        case 'ArrowRight':
            // Move to the next tab, loop around to the beginning if at the end
            newIndex = currentIndex < tabsArray.length - 1 ? currentIndex + 1 : 0;
            tabsArray[newIndex].focus(); // Move focus to the new tab button
            event.preventDefault(); // Prevent default browser scroll or other actions
            break;
        case 'Home':
            // Move focus to the first tab button
            newIndex = 0;
            tabsArray[newIndex].focus();
            event.preventDefault();
            break;
        case 'End':
            // Move focus to the last tab button
            newIndex = tabsArray.length - 1;
            tabsArray[newIndex].focus();
            event.preventDefault();
            break;
        case 'Enter':
        case 'Space':
            // Activate the currently focused tab when Enter or Space is pressed
            event.preventDefault(); // Prevent default browser actions (like scrolling with space)
            // Trigger the click handler to activate the tab and show its content
            handleTabClick({ target: currentTab });
            break;
        default:
            return; // Do nothing for other key presses
    }
    // Note: The click handler will manage the panel visibility and initial content loading.
    // For arrow keys, we only change focus and the user presses Enter/Space to activate.
    // If you want auto-activation on arrow keys, uncomment the `handleTabClick` lines above in relevant cases.
}

/**
 * Handles click events on the accordion header buttons (e.g., "Vision Accessibility Features").
 * Manages the expanded/collapsed state and ensures only one accordion within a tab panel is open.
 * @param {MouseEvent} event - The click event object from the accordion button.
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

    // Find the closest parent tab panel that is currently visible.
    // This limits the "one open accordion" rule to the active tab.
    const parentTabPanel = clickedButton.closest('[role="tabpanel"]:not([hidden])');
    if (parentTabPanel) {
        // Find all other accordion buttons that are currently open within this visible tab panel
        const openAccordionsInPanel = parentTabPanel.querySelectorAll('.accordion-button[aria-expanded="true"]');
        openAccordionsInPanel.forEach(button => {
            // If the current button in the loop is NOT the clicked button, close it
            if (button !== clickedButton) {
                button.setAttribute('aria-expanded', 'false');
                const otherPanelId = button.getAttribute('aria-controls');
                const otherPanel = document.getElementById(otherPanelId);
                if (otherPanel) {
                    otherPanel.setAttribute('hidden', ''); // Hide the associated panel
                    // Deselect any topic buttons within the accordion panel being closed
                    const selectedTopicButtons = otherPanel.querySelectorAll('button[data-article][aria-selected="true"]');
                    selectedTopicButtons.forEach(btn => {
                        btn.setAttribute('aria-selected', 'false');
                    });
                }
            }
        });
    }

    // Toggle the clicked accordion's state
    if (isExpanded) {
        // If it was expanded, collapse it
        clickedButton.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
        // When collapsing, deselect any topic buttons within this specific accordion panel
        const selectedTopicButtons = panel.querySelectorAll('button[data-article][aria-selected="true"]');
        selectedTopicButtons.forEach(button => {
            button.setAttribute('aria-selected', 'false');
        });
    } else {
        // If it was collapsed, expand it
        clickedButton.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
    }
}

/**
 * Handles click events on the detailed topic buttons inside accordion panels
 * (e.g., "Narrator (Screen Reader)", "Magnifier").
 * Loads and displays the specific article content.
 * @param {MouseEvent} event - The click event object from the topic button.
 */
function handleTopicButtonClick(event) {
    const clickedButton = event.target;
    const articleId = clickedButton.dataset.article; // Get the article ID from data-article attribute
    const toggleGroup = clickedButton.dataset.toggleGroup; // Get the group name for aria-selected updates

    if (articleId) {
        // Find the currently active main tab ID (e.g., 'html-tab', 'windows-tab')
        const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
        const activeTabId = activeTab ? activeTab.id : null;

        if (activeTabId) {
            // Display the specific article content
            displayArticle(articleId, activeTabId);
            // Update the aria-selected state for buttons in this specific toggle group
            updateAriaSelected(toggleGroup, clickedButton);
        } else {
            console.error("Could not determine active tab for displaying article content.");
        }
    }
}


// --- Initialization ---

/**
 * Sets the initial state of the page when the articles data is loaded.
 * Ensures the first tab is active, its panel is visible, and attempts to load
 * the first article content for dynamic tabs.
 */
function setupInitialState() {
    // Try to find an already selected tab (defined in HTML)
    let initialTab = document.querySelector('[role="tab"][aria-selected="true"]');

    // If no tab is initially selected, default to the first one in the list
    if (!initialTab) {
        initialTab = document.querySelector('[role="tablist"] [role="tab"]:first-child');
        if (initialTab) {
            initialTab.setAttribute('aria-selected', 'true'); // Programmatically select it
        } else {
            console.error("No tabs found on the page to set initial state.");
            return;
        }
    }

    // Get the ID of the panel associated with the initial tab
    const initialPanelId = initialTab.getAttribute('aria-controls');
    // Show this panel and hide all others
    hideOtherTabPanels(initialPanelId);

    // If the initial panel is not the 'welcome-panel' (which has static content in HTML),
    // we assume it's a dynamic content tab (like HTML, CSS, Windows, etc.) and try to
    // automatically open its first accordion and load its first article.
    if (initialPanelId !== 'welcome-panel') {
        const initialPanel = document.getElementById(initialPanelId);
        if (initialPanel) {
            const firstAccordionButton = initialPanel.querySelector('.accordion-button:first-of-type');
            if (firstAccordionButton) {
                // Explicitly set aria-expanded and remove hidden for the first accordion and its panel
                firstAccordionButton.setAttribute('aria-expanded', 'true');
                const firstAccordionPanel = document.getElementById(firstAccordionButton.getAttribute('aria-controls'));
                if (firstAccordionPanel) {
                    firstAccordionPanel.removeAttribute('hidden');

                    // Now, try to find and "click" the very first article button inside that accordion
                    const firstArticleButton = firstAccordionPanel.querySelector('button[data-article]:first-of-type');
                    if (firstArticleButton) {
                        // Simulate a click on this button to load its content and set its aria-selected state
                        // This will trigger the handleTopicButtonClick function.
                        firstArticleButton.click();
                    }
                }
            }
        }
    }
    // The 'welcome-panel' typically contains static HTML that is already loaded,
    // so no dynamic article loading is needed for it on initial page load.
}

/**
 * Initializes all necessary event listeners once the DOM is fully loaded.
 * This is the main entry point for the script's execution.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Begin by fetching the articles data relevant to the current page
    fetchArticles();

    // Attach event listeners to the main tab buttons
    const tabs = document.querySelectorAll('[role="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
        tab.addEventListener('keydown', handleTabKeyDown); // Enable keyboard navigation for tabs
    });

    // Attach event listeners to the accordion header buttons
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.addEventListener('click', handleAccordionClick);
        // Optional: Add keydown listener for accordion buttons to allow Space/Enter to toggle them
        button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === 'Space') {
                event.preventDefault(); // Prevent scrolling on Space
                handleAccordionClick(event);
            }
        });
    });

    // Implement event delegation for the detailed topic buttons inside accordion panels.
    // This is efficient as it uses a single listener for many potential buttons,
    // including those that might be dynamically added later.
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
    tabPanels.forEach(panel => {
        panel.addEventListener('click', (event) => {
            // Check if the clicked element is indeed a button AND has a data-article attribute
            // This ensures we only react to clicks on the specific topic buttons
            if (event.target.tagName === 'BUTTON' && event.target.dataset.article) {
                handleTopicButtonClick(event);
            }
        });
    });
});