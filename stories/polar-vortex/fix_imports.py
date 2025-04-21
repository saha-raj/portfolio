import re
import fileinput

files_to_process = [
    'src/core/lifecycle/LifecycleManager.js',
    'src/core/simulation/constants.js',
    'src/core/simulation/climate-model.js',
    'src/core/objects/ObjectFactory.js',
    'src/core/objects/PotentialPlot.js',
    'src/core/transforms/TransformManager.js',
    'src/core/transitions/TransitionManager.js',
    'src/config/globalConfig.js',
    'src/index.js',
    'src/utils/interpolation.js',
    'src/debug/DebugOverlay.js',
    'src/debug/DebugLogger.js'
]

# Regex to match imports starting with ./ or ../ but not ending in .js
import_pattern = r"from ['\"](\./|\.\./)[^'\"]+?(?!\.js)['\"]"

for file_path in files_to_process:
    print(f"Processing {file_path}")
    with fileinput.FileInput(file_path, inplace=True) as file:
        for line in file:
            # If line contains an import with relative path
            if re.search(import_pattern, line):
                # Add .js to the import path
                line = line.replace("';", ".js';").replace('";', '.js";')
            print(line, end='')

print("Done! Please check the files to make sure everything is correct.")