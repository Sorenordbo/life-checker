chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['life-checker.js'],
    });
    // Open the panel and activate Life-compliance highlights immediately,
    // so the user sees the markings as soon as they click the extension icon.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.LifeChecker) {
          window.LifeChecker.setHighlight('life');
          window.LifeChecker.open();
        }
      },
    });
  } catch (err) {
    // Tab may be a chrome:// or protected page — fail silently
    console.warn('Life Checker: could not inject into this tab.', err.message);
  }
});
