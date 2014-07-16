var exec = require("child_process").exec;
var fs = require("fs");
var async = require("async");
var ocfParser = require("../parse-object-command-format/parse-object-command-format");
var statusFormater = require("../status-formater/status-formater");
var extract = require("../ocf-parser-extractor/ocf-parser-extractor");
var send = require("../send-request-to-server/send-request-to-server");

var testResults = function testResults( event ) {
    var directory = this.directory;
    var filePath = this.path;
    if ( event == "change" || event == "start") {
        var data = fs.readFileSync(filePath, { encoding: 'utf-8'});
        var parsedData = extract(ocfParser(data) , "module-configuration");
        if (parsedData.testFile) {
            async.parallel([
                    function (callback) {
                        exec("mocha --reporter spec " + directory + parsedData.testFile, function (error, stdout) {
                            var splitStacktrace = [];
                            if (error) {
                                var arrayOfStackTrace = error.message.match(/(at\s.+\d{1}\))/g);
                                var temp = [];
                                for (each in arrayOfStackTrace) {
                                    if (arrayOfStackTrace[each].match(/at\sprocessImmediate/)) {
                                        temp.push(arrayOfStackTrace[each]);
                                        splitStacktrace.push(temp);
                                        temp = [];
                                    } else {
                                        temp.push(arrayOfStackTrace[each]);
                                    }
                                }
                            }
                            callback(null, splitStacktrace);
                        });
                    },
                    function (callback) {
                        exec("mocha --reporter json " + directory + parsedData.testFile, function (error, stdout) {
                            callback(null, JSON.parse(stdout));
                        });
                    }
                ],
                function (error, results) {
                    var status = JSON.stringify(statusFormater( parsedData , results[1] , results[0], filePath), null, 3);
                    send(status);
                });
        }
        if( event == "change" )this.watcher(filePath, testResults);
    }
};

( module || {} ).exports = testResults;
