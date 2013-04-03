/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('engine-mocha-tests', function (Y, NAME) {

	if (!global.ARROW || !global.ARROW.testLibs) {
		global.ARROW = {};
		global.ARROW.onSeeded = function () {
			console.log("seeded");
		}
		global.ARROW.shareLibServerSeed = "server seed";
		global.ARROW.consoleLog = "";
		global.ARROW.testLibs = [__dirname + "/test-data.js"];
		global.ARROW.testfile = __dirname + "/test-data.js";
		if(typeof window !== "undefined") delete window;
	}

	var path = require('path'),
		curDir,
		arrowRoot = path.join(__dirname, '../../../..'),

		suite = new Y.Test.Suite(NAME),
		A = Y.Assert;

	suite.add(new Y.Test.Case({
		'setUp':function () {
			curDir = process.cwd();
			process.chdir(arrowRoot);
			require("module")._cache = {};
		},
		'tearDown':function () {
			process.chdir(curDir);
		},
		'test new interface seed':function () {
			require(arrowRoot + '/lib/engine/mocha/mocha-seed');
		},
		'test new interface runner':function () {
			require(arrowRoot + '/lib/engine/mocha/mocha-runner');
		}
	}));

	Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

