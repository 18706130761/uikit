var webpack = require('webpack');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

var util = require('./build/util');
var concat = require('concat');


var loaders = {
    loaders: [
        {loader: 'buble-loader', test: /(src|tests)(\/|\\).*\.js$/},
        {loader: 'json-loader', test: /\.json$/},
        {loader: 'html-loader', test: /\.svg$/}
    ]
};

var components = {};
glob.sync('./src/js/components/**/*.js').forEach(file => components[path.basename(file, '.js')] = file.substring(0, file.length - 3));

module.exports = [

    {
        entry: './tests/js/uikit',
        output: {
            filename: 'dist/js/uikit-core.js',
            library: 'UIkit',
            libraryTarget: 'umd'
        },
        module: loaders,
        externals: {jquery: 'jQuery'},
        resolve: {
            alias: {
                "components$": __dirname + "/dist/icons/components.json",
            }
        },
        plugins: [
            new BuildAll()
        ]
    },

    {
        entry: './src/js/icons',
        output: {
            filename: 'dist/js/uikit-icons.js',
            library: 'UIkitIcons',
            libraryTarget: 'umd'
        },
        module: loaders,
        plugins: [
            {

                apply(compiler) {

                    compiler.plugin('before-run', () => util.write(`dist/icons.json`, util.icons('src/images/icons/*.svg')));
                    compiler.plugin('done', () => fs.unlink(`dist/icons.json`, () => {}));

                }

            }
        ],
        resolve: {
            alias: {
                "icons$": __dirname + "/dist/icons.json",
            }
        }
    },

    {
        entry: {
            index: './tests/js/index'
        },
        output: {
            filename: 'tests/js/test.js'
        },
        module: loaders,
        externals: {jquery: 'jQuery', uikit: 'UIkit'}
    },

    {
        entry: components,
        output: {
            filename: 'dist/js/components/[name].js'
        },
        module: loaders,
        externals: {jquery: 'jQuery', uikit: 'UIkit'},
        plugins: [
            new BuildAll()
        ]
    }

];

function BuildAll(options) {}

BuildAll.prototype.apply = compiler =>
    compiler.plugin('done', () =>
        glob('dist/js/components/**/!(*.min).js', (err, files) =>
            concat(['dist/js/uikit-core.js'].concat(files))
                .then(data => util.write('dist/js/uikit.js', data))
                .then(util.uglify)
        )
    );
