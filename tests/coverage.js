'use strict';

var expect = require('chai').expect,
    fs     = require('fs'),
    path   = require('path'),
    uncss  = require('./../src/uncss.js');

/* node-phantom-simple seems to leak */
process.setMaxListeners(0);

/* Read file sync sugar. */
var rfs = function (file) {
    return fs.readFileSync(path.join(__dirname, file), 'utf-8').replace(/\r\n/g, '\n');
};

var stylesheets = ['coverage/override.css', 'coverage/ignore.css', 'coverage/ignore_comment.css'],
    rawcss = rfs('coverage/raw.css'),
    options = {
        csspath: 'tests',
        ignore: ['.unused_test', /^#test/],
        stylesheets: stylesheets,
        raw: rawcss
    };

describe('Options', function () {

    var output, report;

    before(function (done) {
        uncss(rfs('selectors/index.html'), options, function (err, res, rep) {
            if (err) {
                throw err;
            }
            output = res;
            report  = rep;
            done();
        });
    });

    it('options.stylesheets should override <link> tags', function () {
        expect(output).to.include(rfs(stylesheets[0]));
    });

    it('options.ignoreSheets should be respected', function (done) {
        uncss(
            rfs('selectors/index.html'),
            {
                ignoreSheets: [
                    'http://fonts.googleapis.com/css?family=Open+Sans:400',
                    /font\-awesome/
                ],
                csspath: 'tests/selectors'
            },
            function (err, output) {
                expect(err).to.be.null;
                expect(output).to.not.include('@font-face');
                done();
            }
        );
    });

    it('options.raw should be added to the processed CSS', function () {
        expect(output).to.include(rawcss);
    });

    it('options.ignore should be added to the output and accept a regex', function () {
        expect(output).to.include(rfs(stylesheets[1]));
    });

    it('inline ignore comments should be respected', function () {
        expect(output).to.include(rfs(stylesheets[2]));
    });

    it('options.htmlroot should be respected', function (done) {
        uncss(rfs('coverage/htmlroot.html'), { htmlroot: 'tests/coverage' }, function (err, output) {
            expect(err).to.be.null;
            expect(output).to.include(rfs('coverage/override.css'));
            done();
        });
    });

    it('options.media should default to screen, all', function (done) {
        uncss(rfs('coverage/media.html'), { csspath: 'tests/selectors' }, function (err, output) {
            expect(err).to.be.null;
            expect(output).to.include(rfs('selectors/expected/adjacent.css'));
            expect(output).to.include(rfs('selectors/expected/child.css'));
            expect(output).to.include(rfs('selectors/expected/complex.css'));
            expect(output).to.not.include(rfs('selectors/expected/classes.css'));
            done();
        });
    });

    it('options.media should be configurable', function (done) {
        uncss(rfs('coverage/media.html'), { csspath: 'tests/selectors', media: 'print' }, function (err, output) {
            expect(err).to.be.null;
            expect(output).to.include(rfs('selectors/expected/adjacent.css'));
            expect(output).to.include(rfs('selectors/expected/child.css'));
            expect(output).to.include(rfs('selectors/expected/complex.css'));
            expect(output).to.include(rfs('selectors/expected/classes.css'));
            done();
        });
    });

    it('options.report should generate report object', function (done) {
        uncss(
            rfs('selectors/index.html'),
            { csspath: 'tests/selectors', report: true },
            function (err, res, rep) {
                expect(err).to.be.null;

                expect(rep).to.have.ownProperty('original');
                expect(rep.original).to.have.length.above(res.length);

                expect(rep.selectors.all).to.be.instanceof(Array);
                expect(rep.selectors.used).to.be.instanceof(Array);

                done();
            }
        );
    });
});
