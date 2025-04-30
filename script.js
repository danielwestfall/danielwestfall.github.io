// script.js

// --- Tab Functionality ---
// Select all elements with the role 'tab' and 'tabpanel'
const tabs = document.querySelectorAll('[role="tab"]');
const tabPanels = document.querySelectorAll('[role="tabpanel"]');

// Add event listeners for click and keyboard navigation to each tab
tabs.forEach(tab => {
    tab.addEventListener('click', handleTabClick);
    // Add keyboard navigation for accessibility (Arrow keys, Home, End, Enter, Space)
    tab.addEventListener('keydown', handleTabKeyDown);
});

// Handles click events on tab buttons
function handleTabClick(event) {
    const clickedTab = event.target;
    switchTab(clickedTab); // Call the function to switch tabs
}

// Handles keyboard navigation within the tab list
function handleTabKeyDown(event) {
    const currentTab = event.target;
    const tabList = currentTab.parentNode;
    // Convert NodeList to Array to use indexOf and array methods
    const tabsArray = Array.from(tabList.children);
    const currentIndex = tabsArray.indexOf(currentTab);
    let newIndex;

    // Handle different key presses for navigation
    switch (event.key) {
        case 'ArrowLeft':
            // Move to the previous tab, loop around to the end if at the beginning
            newIndex = currentIndex > 0 ? currentIndex - 1 : tabsArray.length - 1;
            tabsArray[newIndex].focus(); // Move focus to the new tab button
            break;
        case 'ArrowRight':
            // Move to the next tab, loop around to the beginning if at the end
            newIndex = currentIndex < tabsArray.length - 1 ? currentIndex + 1 : 0;
            tabsArray[newIndex].focus(); // Move focus to the new tab button
            break;
        case 'Home':
            // Move focus to the first tab button
            newIndex = 0;
            tabsArray[newIndex].focus();
            break;
        case 'End':
            // Move focus to the last tab button
            newIndex = tabsArray.length - 1;
            tabsArray[newIndex].focus();
            break;
        case 'Enter':
        case 'Space':
            // Activate the currently focused tab when Enter or Space is pressed
            event.preventDefault(); // Prevent default browser actions (like scrolling with space)
            switchTab(currentTab); // Call the function to switch tabs
            break;
        default:
            return; // Do nothing for other key presses
    }
    // Note: Focus is handled directly in ArrowLeft/Right/Home/End cases.
    // For Enter/Space, focus stays on the button initially, then is moved to the panel in switchTab.
}

// Switches the active tab and shows the corresponding panel
// High Priority JS: Corrected panel visibility logic
// Medium Priority JS: Added basic focus management to the panel after switching
function switchTab(selectedTab) {
    // Deactivate all tabs: remove aria-selected and optionally tabindex
    tabs.forEach(tab => {
        tab.setAttribute('aria-selected', 'false');
        // tab.setAttribute('tabindex', '-1'); // Optional: Make non-selected tabs not focusable via Tab key
    });

    // Hide all tab panels: set the hidden attribute
    tabPanels.forEach(panel => {
        panel.setAttribute('hidden', 'true'); // Or panel.hidden = true;
        // Optional: Ensure interactive elements inside hidden panels are not focusable
    });

    // Activate the selected tab: set aria-selected to true
    selectedTab.setAttribute('aria-selected', 'true');
    // selectedTab.setAttribute('tabindex', '0'); // Optional: Ensure selected tab is focusable (should be by default for buttons)


    // Show the target panel associated with the selected tab
    const targetPanelId = selectedTab.getAttribute('aria-controls');
    const targetPanel = document.getElementById(targetPanelId);
    if (targetPanel) {
        targetPanel.removeAttribute('hidden'); // Or targetPanel.hidden = false;

        // Medium Priority JS: Focus Management (Strategy A: Focus the panel)
        // Make the panel focusable programmatically (temporarily or permanently) and set focus.
        // This is important for screen reader users to land on the new content after tab activation.
        targetPanel.setAttribute('tabindex', '-1'); // Make it focusable programmatically
        targetPanel.focus(); // Set focus to the panel

        // Optional: Remove tabindex after a small delay if you don't want it permanently focusable
        // setTimeout(() => {
        //     targetPanel.removeAttribute('tabindex');
        // }, 10); // Use a small delay to ensure focus takes effect

        // For Strategy B (Focus first interactive element), see previous explanation
    }
}


// --- Accordion Functionality ---
// Select all elements with the class 'accordion-button'
const accordionButtons = document.querySelectorAll('.accordion-button');

// Add click event listeners to all accordion buttons
accordionButtons.forEach(button => {
    button.addEventListener('click', toggleAccordion);
});

// Toggles an accordion panel, closes others in the same tab panel, and manages button selected state
// Requested: Only one accordion open at a time within a tab panel
// Requested: Deselect buttons when accordion is collapsed
function toggleAccordion() {
    const clickedButton = this; // The accordion button that was clicked
    // Check the current expanded state of the clicked button
    const expanded = clickedButton.getAttribute('aria-expanded') === 'true';

    // Find the closest parent tab panel of the clicked accordion button.
    // This is crucial for enforcing the 'only one open' rule within a specific tab's accordions.
    const parentTabPanel = clickedButton.closest('[role="tabpanel"], .language-topics'); // Added .language-topics to include new accordions

    if (parentTabPanel) {
        // Find all other accordion buttons within the SAME parent container (tab panel or language topics section)
        const accordionButtonsInContainer = parentTabPanel.querySelectorAll('.accordion-button');

        // Close any other currently open accordions within this container
        accordionButtonsInContainer.forEach(button => {
            // If the current button in the loop is NOT the clicked button AND it is currently expanded
            if (button !== clickedButton && button.getAttribute('aria-expanded') === 'true') {
                const panelIdToClose = button.getAttribute('aria-controls');
                const panelToClose = document.getElementById(panelIdToClose);

                // Set aria-expanded to false for the button and hide the panel
                button.setAttribute('aria-expanded', 'false');
                if (panelToClose) {
                    panelToClose.hidden = true; // Hide the panel using the hidden attribute

                    // --- Requested Logic: Deselect buttons in the collapsed panel ---
                    // Find all buttons with data-article within this specific collapsed panel
                    const subjectButtonsInCollapsedPanel = panelToClose.querySelectorAll('button[data-article]');
                    subjectButtonsInCollapsedPanel.forEach(subjectButton => {
                        subjectButton.setAttribute('aria-selected', 'false'); // Set aria-selected to false
                    });
                    // --- End Requested Logic ---
                }
            }
        });
    } else {
         // Log a warning if an accordion button is found outside an expected container (unexpected)
         console.warn("Accordion button is not inside a recognized container ([role='tabpanel'] or .language-topics). Cannot enforce single-open rule.");
    }

    // Toggle the state of the clicked accordion
    const panelIdToToggle = clickedButton.getAttribute('aria-controls');
    const panelToToggle = document.getElementById(panelIdToToggle);

    // If the clicked button was collapsed (!expanded), open it; otherwise (expanded), close it.
    if (!expanded) { // If it was collapsed, expand it
         clickedButton.setAttribute('aria-expanded', 'true');
         if (panelToToggle) {
             panelToToggle.hidden = false; // Show the panel
         }
    } else { // If it was expanded, collapse it
         clickedButton.setAttribute('aria-expanded', 'false');
         if (panelToToggle) {
             panelToToggle.hidden = true; // Hide the panel

             // --- Requested Logic: Deselect buttons when the clicked accordion is collapsed ---
             // Find all buttons with data-article within this specific collapsed panel
             const subjectButtonsInCollapsedPanel = panelToToggle.querySelectorAll('button[data-article]');
             subjectButtonsInCollapsedPanel.forEach(subjectButton => {
                 subjectButton.setAttribute('aria-selected', 'false'); // Set aria-selected to false
             });
             // --- End Requested Logic ---
         }
    }
    // Alternative, more concise toggle logic:
    // clickedButton.setAttribute('aria-expanded', !expanded);
    // if (panelToToggle) {
    //     panelToToggle.hidden = expanded; // panel is hidden if expanded was true
    //     // --- New Logic: Deselect buttons when the panel is hidden ---
    //     if (panelToToggle.hidden) { // Check if the panel is now hidden after toggling
    //         const subjectButtonsInCollapsedPanel = panelToToggle.querySelectorAll('button[data-article]');
    //         subjectButtonsInCollapsedPanel.forEach(subjectButton => {
    //             subjectButton.setAttribute('aria-selected', 'false');
    //         });
    //     }
    //     // --- End New Logic ---
    // }
}


// --- Article Subject Button Functionality ---
// This block handles the aria-selected state for the buttons inside the *original* accordion panels
// that are used to select which article to display.
// High Priority JS: Refined logic to select within the correct data-toggle-group
// Note: This targets buttons with the data-article attribute. The new topic list accordions
// do not have this attribute on their inner buttons, so this logic will not apply to them,
// which is the intended behavior if those buttons don't load content.
document.addEventListener('DOMContentLoaded', function() {
  // Select all buttons with the data-article attribute within accordion panels
  const accordionSubjectButtons = document.querySelectorAll('.accordion-panel button[data-article]');

  // Add click event listeners to these article subject buttons
  accordionSubjectButtons.forEach(button => {
    button.addEventListener('click', function(event) { // Pass event object
      const clickedButton = this; // The button that was clicked
      const groupName = clickedButton.dataset.toggleGroup; // Get the group name from data-toggle-group

      // Select ALL buttons on the page with the SAME data-toggle-group attribute
      // This ensures only one button is aria-selected="true" within its specific group.
      const groupButtons = document.querySelectorAll('[data-toggle-group="' + groupName + '"]');

      groupButtons.forEach(btn => {
        if (btn === clickedButton) {
          btn.setAttribute('aria-selected', 'true'); // Set clicked button as selected
        } else {
          btn.setAttribute('aria-selected', 'false'); // Unselect other buttons in the same group
        }
      });

      // Call the function to display the article content associated with the clicked button
      displayArticle(event); // Pass the event object to displayArticle
    });
  });
});


// --- Article Content Loading Functionality ---
// Map tab panel IDs to their corresponding article content container IDs
const articleContainers = {
    'html-panel': document.getElementById('html-article-content'),
    'css-panel': document.getElementById('css-article-content'),
    'js-panel': document.getElementById('js-article-content'),
    'aria-panel': document.getElementById('aria-article-content'),
};

// Function to fetch and display article content based on the clicked button's data-article attribute
// This function is called by the click listener for accordion subject buttons.
async function displayArticle(event) {
    // Get the article ID from the data-article attribute of the clicked button
    const articleId = event.target.dataset.article;
    // Find the closest parent tab panel to determine which article container to target
    const tabPanel = event.target.closest('[role="tabpanel"]');

    // Check if the parent tab panel and its corresponding article container exist
    if (!tabPanel || !articleContainers[tabPanel.id]) {
        console.warn(`Could not find parent tab panel or article container for clicked button.`);
        return; // Exit the function if containers are not found
    }

    const container = articleContainers[tabPanel.id]; // Get the correct article content container

    // Medium Priority JS: Note on innerHTML safety. Using innerHTML with trusted content (like your JSON file)
    // is generally lower risk. However, if the content source were external or user-provided without sanitization,
    // it could pose a Cross-Site Scripting (XSS) vulnerability. Be cautious in different contexts.
    try {
        // Fetch the articles data from the JSON file
        const response = await fetch('data/articles.json'); // Path to your JSON file
        // Check if the fetch request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const articles = await response.json(); // Parse the JSON data

        // Check if the requested article exists in the JSON data
        if (articles[articleId]) {
            // Inject the article title and content into the container using innerHTML
            // Assumes articles.json content is safe HTML.
            container.innerHTML = `<h2>${articles[articleId].title}</h2>${articles[articleId].content}`;
             // Note: The HTML structure was updated to fix <h2> inside <p>, so this injection format is now appropriate.
        } else {
            // Display a message if the article ID is not found in the JSON
            console.warn(`Article with ID '${articleId}' not found in articles.json`);
            container.innerHTML = '<p>Article not found.</p>';
        }
    } catch (error) {
        // Log and display an error message if fetching or parsing fails
        console.error("Error fetching or parsing articles:", error);
        container.innerHTML = '<p>Failed to load article.</p>';
    }
}


// Removed Unused Disclosure Functionality (Requested)
// The code that previously handled disclosure buttons and the toggleDisclosure function has been removed.