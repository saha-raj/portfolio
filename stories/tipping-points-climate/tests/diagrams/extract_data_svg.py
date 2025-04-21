from xml.etree import ElementTree as ET
import json
import re

def parse_transform(transform):
    # Extract x, y coordinates from matrix transform
    match = re.search(r'matrix\(1 0 0 1 ([\d.-]+) ([\d.-]+)\)', transform)
    if match:
        return {
            'x': float(match.group(1)),
            'y': float(match.group(2))
        }
    return {'x': 0, 'y': 0}

def parse_path_d(d):
    # Extract start point from path data
    match = re.search(r'M([\d.-]+),([\d.-]+)', d)
    if match:
        return {
            'x1': float(match.group(1)),
            'y1': float(match.group(2))
        }
    return {'x1': 0, 'y1': 0}

def extract_svg_data(root, namespaces):
    nodes = []
    links = []
    
    # Process nodes first
    for elem in root.findall('.//*'):
        if not elem.attrib:
            continue
            
        if elem.tag.split('}')[-1] == 'text':
            coords = parse_transform(elem.attrib.get('transform', ''))
            nodes.append({
                "id": len(nodes),  # Add unique ID
                "type": "node",
                "x": coords['x'],
                "y": coords['y'],
                "class": elem.attrib.get('class', '')
            })
    
    # Process paths as links
    for elem in root.findall('.//*'):
        if elem.tag.split('}')[-1] == 'path' and 'st0' in elem.attrib.get('class', ''):
            path_data = parse_path_d(elem.attrib.get('d', ''))
            links.append({
                "source": find_closest_node(path_data['x1'], path_data['y1'], nodes),
                "target": find_closest_node_end(elem.attrib.get('d', ''), nodes),
                "path": elem.attrib.get('d', '')
            })
    
    return {
        "nodes": nodes,
        "links": links  # Changed from paths to links for D3 convention
    }

def find_closest_node(x, y, nodes):
    # Find the closest node to given coordinates
    closest = 0
    min_dist = float('inf')
    for i, node in enumerate(nodes):
        dist = ((node['x'] - x) ** 2 + (node['y'] - y) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest = i
    return closest

def find_closest_node_end(path_d, nodes):
    # Extract end point from path data
    # First try to find the last coordinate pair after a C/c command
    matches = re.findall(r'[Cc][\s]*([\d.-]+)[\s]*,[\s]*([\d.-]+)', path_d)
    if matches:
        try:
            last_x, last_y = map(float, matches[-1])
            return find_closest_node(last_x, last_y, nodes)
        except ValueError:
            pass
    
    # If that fails, try to find the last coordinate pair in the path
    matches = re.findall(r'([\d.-]+)[\s]*,[\s]*([\d.-]+)', path_d)
    if matches:
        try:
            last_x, last_y = map(float, matches[-1])
            return find_closest_node(last_x, last_y, nodes)
        except ValueError:
            pass
    
    return 0

# Load and parse SVG
svg_file_path = 'tests/diagrams/feedback_diagram-01.svg'
tree = ET.parse(svg_file_path)
root = tree.getroot()

# Extract and save data
svg_data = extract_svg_data(root, {'svg': 'http://www.w3.org/2000/svg'})

# Save to JSON file
output_file = 'd3_data.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(svg_data, f, indent=2)

print(f"D3-friendly data saved to {output_file}")
