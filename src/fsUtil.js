const core = require('@actions/core');

module.exports.saveOutputFile = function(directory, filename, content, outputName) {
    try {
        const file = path.join(directory, filename);
        fs.writeFileSync(file, content);
        core.setOutput(outputName, file);
        core.info(`File ${outputName} written to ${file}`);
    } catch (err) {
      core.warning(`Failed to save file; ${directory}/${filename}: ${err}`);
    }
}