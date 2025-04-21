import json
import re

def read_js_content():
    with open('src/content/contentForExport.js', 'r') as f:
        content = f.read()
        # Extract the object literal using regex
        match = re.search(r'export const sceneContent = ({[\s\S]*?});', content)
        if match:
            # Convert JS object to Python dict string
            js_obj = match.group(1)
            # Replace JS template literals with normal strings
            js_obj = re.sub(r'`([\s\S]*?)`', lambda m: f'"""{m.group(1)}"""', js_obj)
            # Make it valid Python
            py_obj = eval(js_obj)
            return py_obj
    return {}

def generate_scene_config():
    # Get content from JS file
    sceneContent = read_js_content()
    
    # Calculate scene timing
    total_scenes = len([k for k in sceneContent.keys() if k.startswith('header-')]) + 1  # +1 for title
    SCENE_DURATION = 1 / total_scenes

    # Initialize config array
    config = []

    # Process title scene (scene 0)
    if 'title' in sceneContent:
        config.append({
            'id': 'title',
            'type': 'titleText',
            'content': sceneContent['title'],
            'transition': {
                'entry_from': {
                    'at': 0
                },
                'exit_to': {
                    'at': SCENE_DURATION
                }
            }
        })
        
        # Add title description if it exists
        if 'description-title' in sceneContent:
            config.append({
                'id': 'description-title',
                'type': 'description',
                'content': sceneContent['description-title'],
                'transition': {
                    'entry_from': {
                        'at': 0
                    },
                    'exit_to': {
                        'at': SCENE_DURATION
                    }
                }
            })

    # Process numbered scenes
    for i in range(1, total_scenes):
        header_key = f'header-{i}'
        desc_key = f'description-{i}'
        
        if header_key in sceneContent:
            config.append({
                'id': header_key,
                'type': 'header',
                'content': sceneContent[header_key],
                'transition': {
                    'entry_from': {
                        'at': (i * SCENE_DURATION)
                    },
                    'exit_to': {
                        'at': ((i + 1) * SCENE_DURATION)
                    }
                }
            })
        
        if desc_key in sceneContent:
            config.append({
                'id': desc_key,
                'type': 'description',
                'content': sceneContent[desc_key],
                'transition': {
                    'entry_from': {
                        'at': (i * SCENE_DURATION)
                    },
                    'exit_to': {
                        'at': ((i + 1) * SCENE_DURATION)
                    }
                }
            })

    # Save to file for inspection
    with open('src/content/generated_config.json', 'w') as f:
        json.dump(config, f, indent=2)

    return config

if __name__ == "__main__":
    config = generate_scene_config()
    print(f"Generated configuration for {len(config)} objects") 