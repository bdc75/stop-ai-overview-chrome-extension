const googleUrls = [
  "www.google.com"
]

const LOG = false
const no_ai_addon = " -ai"

function conditional_log(desc_or_str, str = null) {
  if (LOG) {
    if (str) {
      conditional_log(desc_or_str, str)
    }
    else {
      conditional_log(desc_or_str)
    }
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  try {
    let data = await chrome.storage.sync.get("enabled")
    conditional_log('enabledObj', data)
    conditional_log('details', details)
    if (!data?.enabled) return;
    const url_obj = new URL(details.url);
    let newQuery
    if (googleUrls.includes(url_obj.hostname) && url_obj.pathname === "/search") {
      conditional_log('url condition met')
      newQuery = await setNewUrl(url_obj)
      if (newQuery) {
        chrome.tabs.update(details.tabId, { url: url_obj.toString() });
        chrome.storage.sync.set({ prevQuery: newQuery.trim() });
      }
      else {
        chrome.storage.sync.set({ prevQuery: url_obj.searchParams.get("q").trim() });
      }

      return
    }
    conditional_log('url condition NOT met')
  }
  catch (e) {
    console.error(e)
  }
});

function removeNoAiFromQuery(query) {
  if (!query) return
  return query.replace(no_ai_addon, "")
}


async function setNewUrl(url_obj) {
  const currentQuery = url_obj.searchParams.get("q")
  conditional_log('orig_query', currentQuery)
  let newQuery
  let data

  // If user switches to a different search tab, e.g. "Images",
  // then we remove the " -ai" for them
  if (url_obj.searchParams.get("udm")) {
    data = await chrome.storage.sync.get("prevQuery")
    if (
      data?.prevQuery.includes(no_ai_addon)
      && data?.prevQuery === currentQuery
    ) {
      newQuery = removeNoAiFromQuery(currentQuery)
    }
  }
  else {
    if (!currentQuery || currentQuery.includes(no_ai_addon)) {
      conditional_log('already has (or falsy)')
      return null
    }
    data = await chrome.storage.sync.get("prevQuery")
    if (currentQuery !== data?.prevQuery
      && currentQuery.trim() === removeNoAiFromQuery(data?.prevQuery?.trim())) {
      // Don't modify their search if we detect they manually deleted the " -ai"
      return null
    }
    newQuery = `${currentQuery}${no_ai_addon}`
  }

  url_obj.searchParams.set("q", newQuery)
  return newQuery
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true });
});