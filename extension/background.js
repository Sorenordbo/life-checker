chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['life-checker.js'],
    });
  } catch (err) {
    // Tab may be a chrome:// or protected page — fail silently
    console.warn('Life Checker: could not inject into this tab.', err.message);
  }
});
