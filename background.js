const googleUrls = [
  "www.google.com"
]

const LOG = true
const no_ai_addon = " -ai"

function conditional_log(desc_or_str, str = null) {
  if (LOG) {
    if (str) {
      console.log(desc_or_str, str)
    }
    else {
      console.log(desc_or_str)
    }
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  try {
    let data = await chrome.storage.sync.get("enabled")
    // conditional_log('enabledObj', data)
    // conditional_log('details', details)
    if (!data?.enabled) return;
    const urlObj = new URL(details.url);
    // Only listen for google.com/search
    if (googleUrls.includes(urlObj.hostname) && urlObj.pathname === "/search") {
      conditional_log('url condition met')
      const newQuery = await addNoAiToQuery(urlObj)
      if (newQuery) {
        urlObj.searchParams.set("q", newQuery)
        chrome.tabs.update(details.tabId, { url: urlObj.toString() });
        chrome.storage.sync.set({ prevQuery: newQuery });
      }
      else {
        // Keep track of previous search regardless
        chrome.storage.sync.set({ prevQuery: urlObj.searchParams.get("q").trim() });
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
  if (query !== "" && !query) return null
  return query.replace(no_ai_addon, "")
}

async function getPrevQuery() {
  const data = await chrome.storage.sync.get("prevQuery")
  return data?.prevQuery?.trim() ?? ""
}

function usingBuiltInUtility(query) {
  conditional_log("usingBuiltInUtility?")
  query = query.toLowerCase()
  // Using basic math
  if (/[!#+\-$%^*()\[\]]/i.test(query)) {
    return true
  }
  const queryWordSet = new Set(
    query.split(/\s+/).filter(word => word.length > 0)
  );
  const wordUtilities = [
    "timer", "stopwatch",
    "weather", "forecast",
    "define", "synonym", "antonym", "spell",
    "spinner", 
    "metronome",
    "translate",
    "mod", "choose", "permute",
  ]
  for (const wordUtility of wordUtilities) {
    if (queryWordSet.has(wordUtility)) {
      return true
    }
  }
  const phraseUtilities = [
    "near me",
    "stop watch",
    "time in", "time is it in",
    "roll a die", "roll dice", "roll die", "random number",
    "color picker",
    "log(", "ln(", "log2(", "sqrt(", "cbrt(", "exp(",
    "sin(", "cos(", "tan(", "sinh(", "cosh(", "tanh(", "abs(", "sign(",
  ]
  for (const phraseUtility of phraseUtilities) {
    if (query.includes(phraseUtility)) {
      return true
    }
  }
  return false
}

async function addNoAiToQuery(urlObj) {
  conditional_log("addNoAiToQuery")
  let currentQuery = urlObj.searchParams.get("q")
  conditional_log('orig_query', currentQuery)
  if (!currentQuery) {
    return null
  }
  currentQuery = currentQuery.trim()
  let newQuery = null
  let prevQuery

  // If user switches to a different search tab, e.g. "Images",
  // then we remove the " -ai" for them
  if (urlObj.searchParams.get("udm")) {
    prevQuery = await getPrevQuery()
    // Remove " -ai" if their query didn't change, but they switched search tabs.    
    if (
      prevQuery.includes(no_ai_addon)
      && prevQuery === currentQuery
    ) {
      newQuery = removeNoAiFromQuery(currentQuery)
    }
  }
  // Don't change the URL if query already has " -ai"  (prevent infinite loop)
  else if (currentQuery.includes(no_ai_addon)) {
    conditional_log('already has (or falsy)')
    return null
  }
  // This is the general case
  else {
    prevQuery = await getPrevQuery()
    // Don't modify their search if we detect they manually deleted the " -ai"
    if (currentQuery !== prevQuery
      && currentQuery === removeNoAiFromQuery(prevQuery)) {
      return null
    }

    // If the user is trying to use a Google built-in utility
    if (usingBuiltInUtility(currentQuery)) {
      conditional_log("yes")
      return null
    }

    // Add " -ai" to their query
    newQuery = `${currentQuery}${no_ai_addon}`
  }
  return newQuery
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true });
  chrome.storage.sync.set({ prevQuery: "" });
});