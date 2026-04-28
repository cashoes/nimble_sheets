import os

def build(class_name):
    # 1. Read the base template
    with open('src/base_template.html', 'r', encoding='utf-8') as f:
        template = f.read()

    # 2. Read and concatenate JS files
    js_files = [
        'src/data/core_data.js',
        f'src/data/class_{class_name}.js',
        'src/engine.js'
    ]
    
    js_content = ""
    for js_file in js_files:
        if not os.path.exists(js_file):
            print(f"Error: {js_file} not found.")
            return

        with open(js_file, 'r', encoding='utf-8') as f:
            js_content += f"// --- Source: {js_file} ---\n"
            js_content += f.read() + "\n\n"

    # 3. Wrap JS in script tag
    full_script = f"<script>\n{js_content}</script>"

    # 4. Inject into template
    output = template.replace('<!-- INJECT_SCRIPTS -->', full_script)

    # 5. Write to final file
    filename = f"nimble_tracker_{class_name}_v1.0.0.html"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(output)

    print(f"Build complete: {filename} generated.")

if __name__ == "__main__":
    classes = ['oathsworn', 'berserker', 'hunter', 'shepherd', 'cheat', 'commander', 'zephyr', 'mage', 'shadowmancer', 'songweaver', 'stormshifter']
    for c in classes:
        build(c)
