#!/usr/bin/env node

/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// @TODO : Investigate and implement shorthand configurations for 'nopt'
// shortHands = {
//    , "br" : ["--browser"]
//    , "lb" : ["--lib"]
//    , "p" : ["--page"]
//    , "d" : ["--driver"]
//    , "ct" : ["--controller"]
//    , "rs" : ["--reuseSession"]
//    , "rp" : ["--report"]
//    , "t" : ["--testName"]
//    , "g" : ["--group"]
//    , "ll" : ["--logLevel"]
//    , "cx" : ["--context"]
//    , "dm" : ["--dimension"]
//    , "sh" : ["--seleniumHost"]
// }

var ArrowModule = function(params, sliceOff) {
        // Libraries
    var Arrow = require("./lib/interface/arrow"),
        ArrowSetup = require('./lib/util/arrowsetup'),
        fs = require("fs"),
        path = require("path"),
        // Variables
        self = this,
        knownOpts, shortHands = {};

    // number of leading args to ignore (e.g. node, arrow)
    sliceOff = sliceOff || 0;

    // Configuration Options. Used by 'nopt'
    knownOpts = {
        "browser": [String, null],
        "capabilities": [String, null],
        "color": Boolean,
        "context": [String, null],
        "controller": [String, null],
        "coverage": Boolean,
        "coverageExclude": [String, null],
        "dimensions": [String, null],
        "driver": [String, null],
        "enableShareLibYUILoader": Boolean,
        "engine": [String, null],
        "engineConfig": [String, null],
        "exitCode": Boolean,
        "group": [String, null],
        "keepIstanbulCoverageJson": Boolean,
        "lib": [String, null],
        "logLevel": [String, null],
        "page": [String, null],
        "shareLibPath": [String, null],
        "parallel": [Number, null],
        "reuseSession": Boolean,
        "report": Boolean,
        "reportFolder": [String, null],
        "retryCount": [Number, null],
        "seleniumHost": [String, null],
        "testName": [String, null]
    };


    /**
     * Set the Globals that arrow uses.
     */

    //setting appRoot
    global.appRoot = __dirname;

    //recording currentFolder
    global.workingDirectory = process.cwd();

    //Array for holding coverage files.
    global.coverageMap = [];

    //Array for Holding Report Files
    global.reportMap = [];
    global.pathSep = path.sep || '/';

    //getting command line args
    global.routerMap = {};
    global.failedDescriptors = [];

    //store start time
    global.startTime = Date.now();

    /**
     * Run
     */
    self.run = function (params, sliceOff) {
        var LibScanner = require('./lib/util/sharelibscanner'),
            Properties = require("./lib/util/properties"),

            nopt = require("nopt"),
            argv, config, libScanner, prop,
            existsSync = fs.existsSync || path. existsSync,
            showHelp;

        // Use nopt to retrieve our configuration
        argv = nopt(knownOpts, shortHands, params, sliceOff);

        /**
         * Show Help - Prints help text to the console.
         */
        showHelp = function () {
            console.info("\nOPTIONS :" + "\n" +
                "        --lib : a comma seperated list of js files needed by the test" + "\n\n" +
                "        --shareLibPath: a comma seperated list of directory to be scanned and loaded modules by arrow automatically" + "\n\n" +
                "        --page : (optional) path to the mock or production html page" + "\n" +
                "                   example: http://www.yahoo.com or mock.html" + "\n\n" +
                "        --driver : (optional) one of selenium|nodejs. (default: selenium)" + "\n\n" +
                "        --browser : (optional) a comma seperated list of browser names, optionally with a hypenated version number.\n" +
                "                      Example : 'firefox-12.0,chrome-10.0' or 'firefox,chrome' or 'firefox'. (default: firefox)" + "\n\n" +
                "        --engine : (optional) specify the test runner to run test case. Arrow supports test runner of yui, mocha, jasmine, qunit (default: yui)" + "\n" +
                "                      Example : --engine=mocha " + "\n\n" +
                "        --engineConfig : (optional) the file path to config file or a config string  " + "\n" +
                "                      Example : --engineConfig=./mocha-config.json or --engineConfig={\'ui\':\'tdd\'} " + "\n\n" +
                "        --keepTestReport : (optional) When set to true, the report for each descriptor from previous run will be preserved (If same descriptor is run again though, it will overwrite the previous report). (default: false) " + "\n" +
                "                      Example : --keepTestReport=true" + "\n\n" +
                "        --parallel : (optional) test thread count. Determines how many tests to run in parallel for current session. (default: 1)\n" +
                "                          Example : --parallel=3 , will run three tests in parallel" + "\n\n" +
                "        --report : (optional) true/false.  creates report files in junit and json format. (default: true)" + "\n" +
                "                     also prints a consolidated test report summary on console. " + "\n\n" +
                "        --reportFolder : (optional) folderPath.  creates report files under {folderPath}/arrow-report. (default: arrow-target/arrow-report under current directory)" + "\n\n" +
                "        --testName : (optional) comma seprated list of test name(s) defined in test descriptor" + "\n" +
                "                       all other tests will be ignored." + "\n\n" +
                "        --group : (optional) comma seprated list of group(s) defined in test descriptor." + "\n" +
                "                    all other groups will be ignored." + "\n\n" +
                "        --logLevel : (optional) one of DEBUG|INFO|WARN|ERROR|FATAL. (default: INFO)" + "\n\n" +
                "        --dimensions : (optional) a custom dimension file for defining ycb contexts" + "\n\n" +
                "        --context : (optional) name of ycb context" + "\n\n" +
                "        --seleniumHost : (optional) override selenium host url (example: --seleniumHost=http://host.com:port/wd/hub)" + "\n\n" +
                "        --capabilities : (optional) the name of a json file containing webdriver capabilities required by your project" + "\n\n" +
                "        --startProxyServer : (optional) true/false. Starts a proxy server for all intercepting all selenium browser calls" + "\n\n" +
                "        --routerProxyConfig : (optional) filePath. Expects a Json file, in \"router\" object allows users to modify host and headers for all calls being made by browser. Also supports recording of select url calls." + "\n" +
                "                         in \"coverage\" object allow users to set \"clientSideCoverage\" to true to collect client side code coverage\n"+
                "                       Example Json :" + "\n" +
                "                       {" + "\n" +
                "                           \"router\": {" + "\n" +
                "                               \"yahoo.com\": {" + "\n" +
                "                                   \"newHost\": \"x.x.x.x (your new host ip/name)\"," + "\n" +
                "                                   \"headers\": [" + "\n" +
                "                                       {" + "\n" +
                "                                           \"param\": \"<param>\"," + "\n" +
                "                                           \"value\": \"<val>\"" + "\n" +
                "                                       }" + "\n" +
                "                                   ]," + "\n" +
                "                                   \"record\": true" + "\n" +
                "                                }," + "\n" +
                "                             }," + "\n" +
                "                           \"coverage\": {" + "\n" +
                "                               \"clientSideCoverage\": true," + "\n" +
                "                               \"coverageExclude\": [\"^http://yui.yahooapis.com.*\\\\.js$\"]" + "\n" +
                "                           }" + "\n" +
                "                      }" + "\n" +
                "        --exitCode : (optional) true/false. Causes the exit code to be non-zero if any tests fail (default: false)" + "\n" +
                "        --color : (optional) true/false. if set to false, it makes console log colorless ( hudson friendly).(default: true)" + "\n" +
                "        --coverage : (optional) true/false. creates code-coverage report for all js files included/loaded by arrow (default: false)" + "\n" +
                "        --coverageExclude : (optional) string. comma-separated list of files to exclude from coverage reports" + "\n" +
                "        --keepIstanbulCoverageJson : (optional) true/false. if set to true, it does not delete Istanbul coverage json files. (default: false)" + "\n" +
                "        --retryCount : (optional) retry count for failed tests. Determines how many times a test should be retried, if it fails. (default: 0)\n" +
                "                       Example : --retryCount=2 , will retry all failed tests 2 times." + "\n" +
                "        --useYUISandbox : (optional) true/false. Enables YUI sandboxing for your tests. (default: false)" + "\n" +
                "        --replaceParamJSON : (optional) Either .json file or json object to be replaced with its value in descriptor file" + "\n" +
                "                       Example: --replaceParamJSON=./replaceJson.json OR --replaceParamJSON={\"property\":\"finance\"} will replace value of \"property\"" + "\n" +
                "                            inside the descriptor.json with \"finance\"" +"\n" +
                "                       descriptor.json" + "\n" +
                "                       [" + "\n" +
                "                            {" +  "\n" +
                "                                \"settings\":[ \"master\" ]," + "\n" +
                "                                \"name\":\"descriptor\"," + "\n" +
                "                                \"config\":{" + "\n" +
                "                                \"baseUrl\": \"http://${property}$.yahoo.com\" " + "\n" +
                "                            }," + "\n" +
                "                                \"dataprovider\":{ " + "\n" +
                "                                \"Test sample\":{ " + "\n" +
                "                                   \"params\": {" + "\n" +
                "                                        \"test\": \"test.js\" " + "\n" +
                "                                        \"page\":\"$$config.baseUrl$$\"" + "\n" +
                "                                    }" + "\n" +
                "                                }" + "\n" +
                "                               }" + "\n" +
                "                            }" + "\n" +
                "                        ]" + "\n",

                "     --defaultParamJSON : (optional) Accepts .json file or json object as its value. If the parameters to be replaced are not found via replaceParamJSON parameter," +
                                     " it falls back to the parameters specified in defaultParamJSON." + "\n" +
                "                       Example: --defaultParamJSON=./defaultParams.json OR --defaultParamJSON={\"property\":\"finance\"} will replace value of \"property\"" + "\n" +
                "                            inside the descriptor.json with \"finance\"" +"\n" +
                "                       descriptor.json" + "\n" +
                "                       [" + "\n" +
                "                            {" +  "\n" +
                "                                \"settings\":[ \"master\" ]," + "\n" +
                "                                \"name\":\"descriptor\"," + "\n" +
                "                                \"config\":{" + "\n" +
                "                                \"baseUrl\": \"http://${property}$.yahoo.com\" " + "\n" +
                "                            }," + "\n" +
                "                                \"dataprovider\":{ " + "\n" +
                "                                \"Test sample\":{ " + "\n" +
                "                                   \"params\": {" + "\n" +
                "                                        \"test\": \"test.js\" " + "\n" +
                "                                        \"page\":\"$$config.baseUrl$$\"" + "\n" +
                "                                    }" + "\n" +
                "                                }" + "\n" +
                "                               }" + "\n" +
                "                            }" + "\n" +
                "                        ]" + "\n");

            console.log("\nEXAMPLES :" + "\n" +
                "        Unit test: " + "\n" +
                "          arrow test-unit.js --lib=../src/greeter.js" + "\n\n" +
                "        Unit test that load the share library automatically " + "\n" +
                "          arrow test-unit.js --shareLibPath=../" + "\n\n" +
                "        Unit test with a mock page: " + "\n" +
                "          arrow test-unit.js --page=testMock.html --lib=./test-lib.js" + "\n\n" +
                "        Unit test with selenium: \n" +
                "          arrow test-unit.js --page=testMock.html --lib=./test-lib.js --driver=selenium" + "\n\n" +
                "        Integration test: " + "\n" +
                "          arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js" + "\n\n" +
                "        Integration test: " + "\n" +
                "          arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js --driver=selenium" + "\n\n" +
                "        Custom controller: " + "\n" +
                "          arrow --controller=custom-controller.js --driver=selenium");
        };

        if (argv.help) {
            showHelp();
            process.exit(0);
        }

        if (argv.version) {
            console.log("v" + JSON.parse(fs.readFileSync(global.appRoot + "/package.json", "utf-8")).version);
            process.exit(0);
        }

        if (argv.argv.remain.length === 0 && argv.argv.cooked.length === 1) {
            console.error("Unknown option : '" + argv.argv.cooked[0] + "'");
            process.exit(0);
        }

        //adding support for --descriptor param
        if (argv.argv.remain.length === 0 && argv.descriptor) {
            argv.argv.remain.push(argv.descriptor);
            delete argv.descriptor;
        }

        //check if user wants to override default config.
        if (!argv.config) {
            if (existsSync(process.cwd() + "/config.js")) {
                argv.config = process.cwd() + "/config.js";
            } else if (existsSync(process.cwd() + "/config/config.js")) {
                argv.config = process.cwd() + "/config/config.js";
            } else {
                argv.config = '';
            }
        }

        //setup config
        prop = new Properties(__dirname + "/config/config.js", argv.config, argv);
        config = prop.getAll();

        // Setup Global Config Variables
        global.retryCount = config.retryCount;
        global.keepIstanbulCoverageJson = config.keepIstanbulCoverageJson;
        global.color = config.color;

        if (config.shareLibPath !== undefined) {
            libScanner = new LibScanner(config);
            libScanner.genSeedFile(config.shareLibPath, function() { self.startArrow(config, argv); });
        } else {
            self.startArrow(config, argv);
        }
    };

    self.startArrow = function (config, options) {
        // TODO: move arrow setup to Arrow
        var arrow = new Arrow(config, options),
            arrowSetup = new ArrowSetup(config, options);

        self.arrow = Arrow;
        arrowSetup.setup();
        arrow.run();
    };

    self.run(params, sliceOff);
};

if (require.main === module) {
    // This is being run from the command line.
    new ArrowModule(process.argv, 2);
} else {
    // This is being accessed as a module.
    module.exports = ArrowModule;
}
