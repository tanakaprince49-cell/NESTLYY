const fs = require('fs');
const path = require('path');
const directory = 'components';
const colorsToReplace = ['blue', 'indigo', 'emerald', 'amber', 'orange', 'yellow', 'teal', 'purple', 'pink', 'cyan'];
let count = 0;
function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            colorsToReplace.forEach(color => {
                const regex = new RegExp('(text|bg|border|ring|shadow|from|via|to|accent)-' + color + '-([1-9]00|50)', 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, '$1-rose-$2');
                    modified = true;
                }
            });
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                count++;
            }
        }
    });
}
processDirectory(directory);
console.log('Updated ' + count + ' files.');
