module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy("./src/css/");
    eleventyConfig.addPassthroughCopy("./src/images/");
    eleventyConfig.addPassthroughCopy("./src/rest/");
    eleventyConfig.addPassthroughCopy("./assets/");
    eleventyConfig.addWatchTarget("./src/css/");
    eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
    eleventyConfig.addFilter("lastmodDate", function (value) {
        // return should be yyyy-mm-dd with padded 0's for mm and dd
        let date = new Date(value);
        let mm = date.getMonth() + 1;
        let dd = date.getDate();
        return `${date.getFullYear()}-${mm.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
    })
    // Add JSON stringify filter for API templates (no HTML escaping)
    eleventyConfig.addFilter("json", function (value) {
        return JSON.stringify(value, null, 2);
    });
    // Add urlencode filter for sharing links
    eleventyConfig.addFilter("urlencode", function (value) {
        return encodeURIComponent(value);
    });
    // Add shortcode to generate joke API response
    eleventyConfig.addShortcode("jokeApi", function (joke, id, baseURL) {
        const data = {
            joke: joke.joke,
            punchline: joke.punchline,
            id: id,
            source: `${baseURL}/${id}`
        };
        return JSON.stringify(data, null, 2);
    });
    // Add read-only WebMCP tools to every generated page.
    // Browsers without the early-preview API ignore the script.
    eleventyConfig.addTransform("webmcp-tools", function (content) {
        if (!this.outputPath?.endsWith(".html")) return content;
        const tag = '    <script src="/assets/js/webmcp.js" defer></script>';
        if (content.includes("</body>")) return content.replace("</body>", `${tag}\n</body>`);
        return `${content}\n${tag}\n`;
    });
    return {
        dir: {
            input: "src",
            output: "_site",
        },
    };
};