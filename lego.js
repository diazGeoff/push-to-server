var fs = require('fs');
var cmd = require('../watch-file/watch-file');
var design = require("./push-to-server");
var ocfParser = require("../parse-object-command-format/parse-object-command-format");
var extract = require("../ocf-parser-extractor/ocf-parser-extractor");
var harvest = require("../harvest-directory/harvest-directory").harvestDirectory;
var dir = process.argv.slice(2);

var harvester = function harvester(filePath) {
    var data = fs.readFileSync(filePath, {encoding: "utf-8"});
    var parsedData = extract(ocfParser(data), "module-configuration");
    return parsedData.testFile ? true : false;
};

var harvested = harvest(dir.toString(), harvester);
harvested.forEach(function ( watchFiles ) {
    var watcher = new cmd( watchFiles , design );
    watcher.watchFile();
});
