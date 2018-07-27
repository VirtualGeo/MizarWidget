({
	baseUrl: "../src",
	name: "../build/almond",
	include : ['MizarWidget'],
//	insertRequire: ['MizarWidget'],
	out: "../build/generated/MizarWidget.min.js",
	optimize: "uglify2",
	paths: {
			// Externals requirements
			"jquery": 										"../external/jquery/dist/jquery.min",
			"jquery.ui": 									"../external/jquery-ui/jquery-ui.min",
			"jquery.ui.timepicker": 			"../external/jquery.ui.timepicker/jquery.ui.timepicker",
			"jquery.once": 								"../external/jquery-once/jquery.once.min",
			"jquery.datetimepicker"	:					"../node_modules/jquery-datetimepicker/build/jquery.datetimepicker.full.min",
			"underscore-min": 						"../external/underscore/underscore",
			"jszip": 											"../external/jszip/jszip.min",
			"saveAs": 										"../external/fileSaver/FileSaver.min",
			"jquery.nicescroll.min": 			"../external/jquery.nicescroll/dist/jquery.nicescroll.min",
			"fits": 											"../external/fits",
			"samp": 											"../external/samp",
			"gzip": 											"../external/gzip",
			"crc32": 											"../external/crc32",
			"deflate-js": 								"../external/deflate",
			"inflate-js": 								"../external/inflate",
			"wcs": 												"../external/wcs",
			"selectize": 									"../external/selectizejs/selectize",
			"sifter": 										"../external/selectizejs/sifter",
			"microplugin": 								"../external/selectizejs/microplugin",
			"flot": 											"../external/flot/jquery.flot.min",
			"flot.tooltip": 							"../external/flot/jquery.flot.tooltip.min",
			"flot.axislabels": 						"../external/flot/jquery.flot.axislabels",
			"loadmask": 									"../external/loadmask/jquery.loadmask",
			"text" : 											"../node_modules/requirejs-plugins/lib/text",

			// Mizar Core requirements
			"gw"          : 	"../../Mizar/src",
			"glMatrix"    : 	"../../Mizar/external/glMatrix",
			"name_resolver": 	"gw/NameResolver",

			// Widget requirements
			"uws": 										"./uws",
			"gui": 										"./gui",
			"MizarWidgetGui": 				"./MizarWidgetGui",
			"provider": 							"./provider",
			"service": 								"./service",
			"tracker" : 							"./gui/tracker",
			"reverse_name_resolver": 	"./reverse_name_resolver",
			"templates": 							"../templates",
			"data":										"../data"
	},
	shim: {
			'jquery': {
					deps: [],
					exports: 'jQuery'
			},
			'jquery.ui': {
					deps: ['jquery'],
					exports: 'jQuery'
			},
			'jquery.ui.timepicker': {
					deps: ['jquery.ui'],
					exports: 'jQuery'
			},
			'underscore-min': {
					deps: ['jquery'],
					exports: '_',
					init : function() {
					 return _.noConflict();
				}
			},
			'jquery.nicescroll.min': {
					deps: ['jquery'],
					exports: ''
			},
			'flot': {
					deps: ['jquery'],
					exports: '$.plot'
			},
			'flot.tooltip': {
					deps: ['flot']
			},
			'flot.axislabels': {
					deps: ['flot']
			},
			'loadmask': {
					deps: ['jquery']
			}
	},
	waitSeconds: 0,
	wrap: {
        startFile: './start.frag',
        endFile: './end.frag'
    },
	uglify2: {
        output: {
            beautify: false
        },
        compress: {
					unsafe: true,
					dead_code: false,
        },
        warnings: true,
        mangle: true
    }
})
