import re

def convert_md_to_js():
    # Read markdown file
    with open('src/content/content.md', 'r', encoding='utf-8') as file:
        content = file.read()

    # Initialize output structure
    output = {}
    segment_counter = 0
    
    # Handle title (header-0) and first segment
    title_match = re.search(r'^# (.+)$', content, re.MULTILINE)
    if title_match:
        output['header-0'] = title_match.group(1).strip()
    
    # Get content between title and first h2
    title_content_match = re.search(r'^# .+\n+([\s\S]+?)(?=\n## |$)', content)
    if title_content_match:
        segments = title_content_match.group(1).split('[segment]')
        for segment in segments:
            if segment.strip():
                output[f'segment-{segment_counter}'] = segment.strip()
                segment_counter += 1
    
    # Find all h2 sections
    sections = re.findall(r'## (.+)\n+([\s\S]+?)(?=\n## |$)', content)
    
    # Process each section
    for header, desc in sections:
        output[f'header-{segment_counter}'] = header.strip()
        
        # Split description into segments
        segments = desc.split('[segment]')
        for segment in segments:
            if segment.strip():
                output[f'segment-{segment_counter}'] = segment.strip()
                segment_counter += 1

    # Generate JavaScript file content
    js_content = 'export const sceneContent = {\n'
    
    # Write all content in sequential order
    for i in range(max(map(lambda x: int(x.split('-')[1]), output.keys())) + 1):
        if f'header-{i}' in output:
            js_content += f'    "header-{i}": "{output[f"header-{i}"]}",\n'
        if f'segment-{i}' in output:
            # Escape backslashes
            segment = output[f'segment-{i}'].replace('\\', '\\\\')
            js_content += f'    "segment-{i}": `{segment}`'
            # Add comma if not the last item
            if i < max(map(lambda x: int(x.split('-')[1]), output.keys())):
                js_content += ',\n\n'
    
    js_content += '\n};'
    
    # Write to file
    with open('src/content/contentForExport_2.js', 'w', encoding='utf-8') as file:
        file.write(js_content)

if __name__ == "__main__":
    convert_md_to_js()