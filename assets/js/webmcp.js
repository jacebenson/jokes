// Read-only WebMCP tools for joke.jace.pro.
// WebMCP is an early-preview browser API. The site works normally without it.
(() => {
  const modelContext = document.modelContext;
  if (!modelContext?.registerTool) return;

  const DATA_URL = "/api/all.json";
  let dataPromise = null;

  const loadJokes = () => {
    dataPromise ||= fetch(DATA_URL, { credentials: "same-origin" }).then((response) => {
      if (!response.ok) throw new Error(`The joke list returned HTTP ${response.status}.`);
      return response.json();
    });
    return dataPromise;
  };

  const shape = (joke) => ({ id: joke.id, joke: joke.joke, punchline: joke.punchline || null, url: joke.url });

  // Tool results should stay close to the 1.5K character budget agents work with.
  const fit = (payload) => {
    const json = JSON.stringify(payload);
    if (json.length <= 1500) return json;
    return JSON.stringify(payload.slice(0, 3));
  };

  modelContext.registerTool({
    name: "joke_random",
    description: "Get one random dad joke, programming joke, or pun from joke.jace.pro, with its page URL. Read-only.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async () => {
      const jokes = await loadJokes();
      if (!jokes.length) return "The joke list is empty.";
      return JSON.stringify(shape(jokes[Math.floor(Math.random() * jokes.length)]));
    },
  });

  modelContext.registerTool({
    name: "joke_search",
    description: "Search jokes by keyword and return matches with their page URLs. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words to look for in the setup or punchline, for example chicken or compiler." },
        limit: { type: "integer", minimum: 1, maximum: 10, description: "Maximum matches to return, default 5." },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async ({ query, limit }) => {
      const terms = String(query || "").toLowerCase().split(/\s+/).filter((term) => term.length > 1).slice(0, 8);
      if (!terms.length) return "Enter a search query.";
      const jokes = await loadJokes();
      const matches = [];
      for (const joke of jokes) {
        const haystack = `${joke.joke} ${joke.punchline || ""}`.toLowerCase();
        let score = 0;
        for (const term of terms) score += haystack.split(term).length - 1;
        if (score) matches.push({ score, joke });
      }
      if (!matches.length) return `No jokes match "${query}".`;
      const take = Math.max(1, Math.min(Number(limit) || 5, 10));
      return fit(matches.sort((a, b) => b.score - a.score).slice(0, take).map((hit) => shape(hit.joke)));
    },
  });
})();
