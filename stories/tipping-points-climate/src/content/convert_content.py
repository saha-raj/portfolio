import re

def convert_md_to_js():
    # Read markdown file
    with open('src/content/content.md', 'r', encoding='utf-8') as file:
        content = file.read()

    # Initialize output structure
    output = {}
    
    # Find the first h1 title and map to header-0
    title_match = re.search(r'^# (.+)$', content, re.MULTILINE)
    if title_match:
        output['header-0'] = title_match.group(1).strip()
    
    # Get content between title and first h2 as description-0
    title_content_match = re.search(r'^# .+\n+([\s\S]+?)(?=\n## |$)', content)
    if title_content_match:
        output['description-0'] = title_content_match.group(1).strip()
    
    # Find all h2 sections
    sections = re.findall(r'## (.+)\n+([\s\S]+?)(?=\n## |$)', content)
    
    # Process each section starting from index 1
    for i, (header, desc) in enumerate(sections, 1):
        output[f'header-{i}'] = header.strip()
        output[f'description-{i}'] = desc.strip()

    # Generate JavaScript file content
    js_content = 'export const sceneContent = {\n'
    
    # Add header-0 and description-0 first
    if 'header-0' in output:
        js_content += f'    "header-0": "{output["header-0"]}",\n'
    if 'description-0' in output:
        # Escape backslashes
        desc = output['description-0'].replace('\\', '\\\\')
        js_content += f'    "description-0": `{desc}`,\n\n'
    
    # Add all other headers and descriptions
    for i in range(1, len(sections) + 1):
        header_key = f'header-{i}'
        desc_key = f'description-{i}'
        
        if header_key in output:
            js_content += f'    "{header_key}": "{output[header_key]}",\n'
        if desc_key in output:
            # Escape backslashes
            desc = output[desc_key].replace('\\', '\\\\')
            js_content += f'    "{desc_key}": `{desc}`'
            # Add comma and newline if not the last item
            if i < len(sections):
                js_content += ',\n\n'
    
    js_content += '\n};'
    
    # Write to file
    with open('src/content/contentForExport.js', 'w', encoding='utf-8') as file:
        file.write(js_content)

if __name__ == "__main__":
    convert_md_to_js()