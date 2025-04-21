export function parseMarkdownContent(markdownString) {
    console.log("Raw markdown content:", markdownString.substring(0, 100) + "..."); // Debug

    const sections = markdownString.split(/(?=^#{1,2} .*$)/m);
    console.log("Number of sections found:", sections.length); // Debug

    const contentMap = {};
    
    sections.forEach((section, index) => {
        const lines = section.trim().split('\n');
        const headerMatch = lines[0].match(/^(#{1,2}) (.*)$/);
        
        if (headerMatch) {
            const level = headerMatch[1].length;  // # or ##
            const title = headerMatch[2].trim();
            const content = lines.slice(1).join('\n').trim();
            
            // Convert header to id format
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            console.log(`Processing section ${index}:`, { // Debug
                level,
                title,
                contentPreview: content.substring(0, 50) + "..."
            });

            // Map header levels to types
            const type = level === 1 ? "titleText" : "header";
            contentMap[`header-${id}`] = {
                type,
                content: title
            };
            
            if (content) {
                contentMap[`description-${id}`] = {
                    type: "description",
                    content: content
                };
            }
        }
    });

    console.log("Parsed content map:", contentMap); // Debug
    return contentMap;
} 