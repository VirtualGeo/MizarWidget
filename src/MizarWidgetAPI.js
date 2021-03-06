/**
 * MizarWidgetAPI is the wrapper between the GUI of MizarWidget and the API of mizar.
 */
define(["jquery", "underscore-min",
    "./utils/UtilsCore", "MizarWidgetGui",
    "./uws/UWSManager",
    "gw/Mizar", "gw/Gui/dialog/ErrorDialog", "text!templates/mizarCore.html"],
    function ($, _,
        UtilsCore, MizarWidgetGui,
        UWSManager,
        Mizar, ErrorDialog, mizarCoreHTML) {

        // private variables.
        var options;
        var mizarAPI;
        var self;

        /**
         * Returns the mizar URL.
         * @return {String}
         * @private
         */
        var getMizarUrl = function () {
            /**
             *    Store the mizar base urlferf
             *    Used to access to images(Compass, Mollweide, Target icon for name resolver)
             *    Also used to define "star" icon for point data on-fly
             *    NB: Not the best solution of my life.... TODO: think how to improve it..
             */
            // Search throught all the loaded scripts for minified version
            var scripts = document.getElementsByTagName('script');
            var mizarSrc = _.find(scripts, function (script) {
                return script.src.indexOf("MizarWidget.min") !== -1;
            });

            // Depending on its presence decide if Mizar is used on prod or on dev
            var mizarBaseUrl;
            if (mizarSrc) {
                // Prod
                // Extract mizar's url
                mizarBaseUrl = mizarSrc.src.split('/').slice(0, -1).join('/') + '/';
            }
            else {
                // Dev
                // Basically use the relative path from index page
                mizarSrc = _.find(scripts, function (script) {
                    return script.src.indexOf("MizarWidgetAPI") !== -1;
                });
                mizarBaseUrl = mizarSrc.src.split('/').slice(0, -1).join('/') + '/../';
            }
            return mizarBaseUrl;
        };

        /**
         * Loads in a synchronous way all files.
         * @param {url} url URL of the file to retrieve 
         */
        var getUrl = function (url) {
            return $.ajax({
                type: "GET",
                url: url,
                cache: false,
                async: false
            }).responseText;
        };

        /**
         * Builds a deynamic url to avail the brwser cache the URL.
         * The URL is build with a uuid parameter
         * @param {url} url 
         * @param {string} uuid 
         */
        var buildUrlNoCacheUrl = function(url, uuid) {
            var delimiter = (url.indexOf("?")>=0) ? "&" : "?";
            return url+delimiter+"uuid="+uuid;
        }

        /**
         * Applies the shared parameters to options if they exist.
         * @private
         */
        var _applySharedParameters = function (options) {
            var documentURI = window.document.documentURI;
            // Retrieve shared parameters
            var sharedParametersIndex = documentURI
                .indexOf("sharedParameters=");
            if (sharedParametersIndex !== -1) {
                var startIndex = sharedParametersIndex
                    + "sharedParameters=".length;
                var sharedString = documentURI.substr(startIndex);
                if (options.shortener) {
                    $.ajax({
                        type: "GET",
                        url: options.shortener.baseUrl + '/'
                            + sharedString,
                        async: false, // TODO: create callback
                        success: function (sharedConf) {
                            _mergeWithOptions(sharedConf);
                        },
                        error: function (thrownError) {
                            console.error(thrownError);
                        }
                    });
                } else {
                    console.log("Shortener plugin isn't defined, try to extract as a string");
                    var sharedParameters = JSON
                        .parse(decodeURI(sharedString));
                    _mergeWithOptions(sharedParameters);
                }
            }
        };

        /**
         * Removes "C"-like comments lines from string
         * @param string
         * @return {JSON}
         * @private
         */
        var _removeComments = function (string) {
            var starCommentRe = new RegExp("/\\\*(.|[\r\n])*?\\\*/", "g");
            var slashCommentRe = new RegExp("[^:]//.*[\r\n]", "g");
            string = string.replace(slashCommentRe, "");
            string = string.replace(starCommentRe, "");

            return string;
        };

        /**
         * Merges the retrieved shared parameters with Mizar configuration.
         * @param {object} sharedParameters
         * @private
         */
        //TODO décrire shareparameters
        var _mergeWithOptions = function (sharedParameters) {
            // Navigation
            options.navigation.initTarget = sharedParameters.initTarget;
            options.navigation.initFov = sharedParameters.fov;
            options.navigation.up = sharedParameters.up;

            // Layer visibility
            options.layerVisibility = sharedParameters.visibility;
        };

        function initGUI(MizarWidgetAPI, mode) {
            if (MizarWidgetAPI.getMode() === MizarWidgetAPI.CONTEXT.Sky) {
                // Set different GUIs
                MizarWidgetAPI.setAngleDistancePlanetGui(false);
                MizarWidgetAPI.setAngleDistanceSkyGui(true);
                MizarWidgetAPI.setSwitchTo2D(false);
                MizarWidgetAPI.setSampGui(true);
                MizarWidgetAPI.setShortenerUrlGui(false);
                MizarWidgetAPI.setMollweideMapGui(true);
                MizarWidgetAPI.setReverseNameResolverGui(true);
                MizarWidgetAPI.setNameResolverGui(true);
                MizarWidgetAPI.setCategoryGui(true);
                MizarWidgetAPI.setImageViewerGui(true);
                MizarWidgetAPI.setExportGui(true);
                MizarWidgetAPI.setDistanceGui(false);
            } else if (MizarWidgetAPI.getMode() === MizarWidgetAPI.CONTEXT.Planet) {
                // Set different GUIs
                MizarWidgetAPI.setAngleDistanceSkyGui(false);
                MizarWidgetAPI.setAngleDistancePlanetGui(true);
                MizarWidgetAPI.setSwitchTo2D(true);
                MizarWidgetAPI.setSampGui(false);
                MizarWidgetAPI.setShortenerUrlGui(false);
                MizarWidgetAPI.setMollweideMapGui(false);
                MizarWidgetAPI.setReverseNameResolverGui(true);
                MizarWidgetAPI.setNameResolverGui(true);
                MizarWidgetAPI.setCategoryGui(true);
                MizarWidgetAPI.setImageViewerGui(true);
                MizarWidgetAPI.setExportGui(false);
                MizarWidgetAPI.setDistanceGui(true);
            } else if (MizarWidgetAPI.getMode() === MizarWidgetAPI.CONTEXT.Ground) {
                MizarWidgetAPI.setAngleDistanceSkyGui(false);
                MizarWidgetAPI.setAngleDistancePlanetGui(false);
                MizarWidgetAPI.setSwitchTo2D(false);
                MizarWidgetAPI.setSampGui(false);
                MizarWidgetAPI.setShortenerUrlGui(false);
                MizarWidgetAPI.setMollweideMapGui(false);
                MizarWidgetAPI.setReverseNameResolverGui(false);
                MizarWidgetAPI.setNameResolverGui(false);
                MizarWidgetAPI.setCategoryGui(true);
                MizarWidgetAPI.setImageViewerGui(true);
                MizarWidgetAPI.setExportGui(false);
                MizarWidgetAPI.setDistanceGui(false);
            } else {
                throw "Unable to find mizar.mode=" + mizar.mode;
            }
        }

        /**
         * Adds layers to sky (default) or to planet
         * @param {array} layers to add to a globe : sky or planet
         * @private
         * @fires Mizar#backgroundSurveysReady
         */
        var callbackLayersLoaded = function (layers) {
            // Add surveys
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                if (layer.name === "Mars") {
                    loadNoStandardPlanetProviders();
                }
                var gwLayer = self.addLayer(layer);
                // Update layer visibility according to options
                if (options.layerVisibility
                    && options.layerVisibility.hasOwnProperty(layer.name)) {
                    gwLayer.visible(options.layerVisibility[layer.name]);
                }
                mizarAPI.publish("backgroundSurveysReady");
            }
        };

        /**
         * Loads No standard data providers
         */
        var loadNoStandardSkyProviders = function () {
            var planetProvider = mizarAPI.ProviderFactory.create(Mizar.PROVIDER.Planet);
            var starProvider = mizarAPI.ProviderFactory.create(Mizar.PROVIDER.Star);
            var constellationProvider = mizarAPI.ProviderFactory.create(Mizar.PROVIDER.Constellation);
            mizarAPI.registerNoStandardDataProvider("planets", planetProvider.loadFiles);
            mizarAPI.registerNoStandardDataProvider("constellation", constellationProvider.loadFiles);
            mizarAPI.registerNoStandardDataProvider("star", starProvider.loadFiles);
        };

        var loadNoStandardPlanetProviders = function () {
            var craterProvider = mizarAPI.ProviderFactory.create(Mizar.PROVIDER.Crater);
            mizarAPI.registerNoStandardDataProvider("crater", craterProvider.loadFiles);
            var trajectoryProvider = mizarAPI.ProviderFactory.create(Mizar.PROVIDER.Trajectory);
            mizarAPI.registerNoStandardDataProvider("trajectory", trajectoryProvider.loadFiles);
        };


        /**
         * Creates global options for mizar configuration.
         * @param configuration
         * @return {Object}
         * @private
         */
        function createOptions(configuration) {
            var isMobile = ('ontouchstart' in window || (window.DocumentTouch !== undefined && window.DocumentTouch && document instanceof DocumentTouch));
            var sitoolsBaseUrl = configuration.global.sitoolsBaseUrl ? configuration.global.sitoolsBaseUrl : "http://demonstrator.telespazio.com/sitools";
            var proxyUrl = configuration.global.proxyUrl ? configuration.global.proxyUrl : null;
            var proxyUse = configuration.global.proxyUse == null ? false : configuration.global.proxyUse;
            options = {};
            $.extend(options, configuration);
            options.global.sitoolsBaseUrl = sitoolsBaseUrl;
            options.global.proxyUrl = proxyUrl;
            options.global.proxyUse = proxyUse;
            options.global.isMobile = isMobile;
            return options;
        }

        function RenderingGlobeFinished() {
            $(self.div).find('#loading').hide();
            $(self.div).find('#splash').hide();
        }

        var getUniqueId = function (prefix) {
            var d = new Date().getTime();
            d += (parseInt(Math.random() * 100)).toString();
            return d;
        };

        /**
         * Update mode according to the CRS.
         * @param {Object} ctxList 
         */
        var updateMode = function(ctxList) {
            var crs;
            for (ctx in ctxList) {
                crs = ctxList[ctx].context.init.coordinateSystem.geoideName;
                ctxList[ctx].mode = Mizar.CRS_TO_CONTEXT[crs];
            }
        }

        /**
         * Returns the parameters of href
         * @param href Url from which parameters lust be extracted
         * @returns parameters from href 
         */
        var getUrlVars = function(href){
            var reg = /[?&]+([^=&]+)=?([^&]*)/gi;
            var map = {};
            href.replace(reg, function(match, key, value) {
                key = decodeURIComponent(key);
                value = value ? decodeURIComponent(value) : true;
                map[key] ? map[key] instanceof Array ? map[key].push(value) : map[key] = [map[key], value] :  map[key] = value;
            });
            return map;
        };        

        /**
         * Add a new context as default in the configuration file of MizarWidget.
         * The context is defined by the value related to ctxurl in the URL
         * @param {Object} mizarWidgetConf 
         */
        var addNewCtxAsDefault = function(mizarWidgetConf) {
            var href = window.location.search;
            var parameters = getUrlVars(href);
            var distantConfFileUrl = parameters.ctxurl;
            if (distantConfFileUrl === undefined) {
                // no context to add.
            } else {
                mizarWidgetConf.ctx.push({
                    "name":"userDefined",
                    "mode":"something",
                    "context":distantConfFileUrl
                });
                mizarWidgetConf.defaultCtx = "userDefined";
            }
            return mizarWidgetConf;
        }        

        /**
         * Entry point to manage Mizar Widget.
         * @param div Div to use for the Widget
         * @param userOptions Configuration properties for the Widget
         * @param callbackInitMain Callback function
         * @constructor
         * @example
         * {
         * "global": {
         *      "proxyUrl": "http://localhost:8081/?url=",
         *      "proxyUse": false
         * },
         * "gui": {
         *      "isMobile": true,
         *      "positionTracker": {
         *          "position": "bottom"
         *      },
         * "elevationTracker": {
         *      "position": "bottom"
         * },
         * "stats": {
         *      "visible": true
         * },
         * "debug": true,
         * "registry": {
         *      "hips" :"http://aladin.unistra.fr/hips/globalhipslist?fmt=json&hips_frame=equatorial&hips_frame=galactic"
         * },
         * "shortener": "${sitoolsBaseUrl}/shortener"
         * },
         * "ctx": [
         *     {
         *      "name": "sky",
         *      "mode": "Sky",
         *      "context": "./skyCtx.json"
         *     },
         *     {
         *       "name": "mars",
         *       "mode": "Planet",
         *       "context": "./marsCtx.json"
         *     },
         *     {
         *       "name": "earth",
         *       "mode": "Planet",
         *       "context": "./earthCtx.json"
         *     },
         *     {
         *       "name": "curiosity",
         *       "mode": "Ground",
         *       "context": "./curiosityCtx.json"
         *     },
         *     {
         *       "name": "sun",
         *       "mode": "Planet",
         *       "context": "./sunCtx.json"
         *     },
         *     {
         *       "name": "titan",
         *       "mode": "Planet",
         *       "context": "./titanCtx.json"
         *     }
         *   ],
         *   "defaultCtx": "earth"
         * }                
         * http://127.0.0.1:8080/dist/?ctxurl=http://127.0.0.1:8080/dist/conf/titanCtx.json
         */
        var MizarWidgetAPI = function (div, userOptions, callbackInitMain) {

            userOptions = addNewCtxAsDefault(userOptions);

            this.div = '#'+div;

            // Retrieves the Mizar's URL
            var mizarBaseUrl = getMizarUrl();

            // Creates the user options
            userOptions.global.mizarBaseUrl = mizarBaseUrl;

            // Loads all context files that are defined in mizarWidget.json
            userOptions.ctx = this._loadConfigFiles(mizarBaseUrl, userOptions.ctx);

            // Update mode (Planet, Sky, Ground) according to the CRS (geoideName)
            updateMode(userOptions.ctx);

            // Retrieves the div element.
            self = this;

            // Merge default options with user options
            this.options = createOptions(userOptions);

            // Create mizar core HTML
            var mizarContent = _.template(mizarCoreHTML, {});
            $(this.div).append(mizarContent);
            _applySharedParameters(options);

            // Call Mizar
            mizarAPI = new Mizar({
                canvas: $(this.div).find('#GlobWebCanvas')[0],
                configuration: {
                    "mizarBaseUrl": this.options.global.mizarBaseUrl,
                    "debug": this.options.gui.debug,
                    "isMobile": this.options.gui.isMobile,
                    "positionTracker": this.options.gui.positionTracker,
                    "elevationTracker": this.options.gui.elevationTracker,
                    "registry": this.options.gui.registry,
                    "proxyUse": this.options.global.proxyUse,
                    "proxyUrl": this.options.global.proxyUrl
                }
            });

            // Search the reference to the default context.
            var selectedCtx = _.find(this.options.ctx, function (obj) { return obj.name === userOptions.defaultCtx });
            if (selectedCtx === undefined) {
                throw "Unable to find the default context";
            } else {
                // Gets the mode : Sky, Ground Planet
                this.mode = selectedCtx.mode;

                // Creates a context for the mode with the init parameters
                selectedCtx.context.init.isMobile = this.options.gui.isMobile;
                mizarAPI.createContext(this.mode, selectedCtx.context.init);

                // Create the API on which the GUI is used
                this.mizarWidgetGui = new MizarWidgetGui(this.div, {
                    mizarWidgetAPI: this,
                    options: this.options
                });

                initGUI(this, this.mode);

                // Removes the spinner when background layers are loaded
                this.subscribeCtx(Mizar.EVENT_MSG.BASE_LAYERS_READY, RenderingGlobeFinished);
                // Removes the spinner when we come back to a previous context (it was not destroyed, then
                // no baseLayersReady event is sent.
                this.subscribeMizar(Mizar.EVENT_MSG.MIZAR_MODE_TOGGLE, RenderingGlobeFinished);

                loadNoStandardSkyProviders();
                loadNoStandardPlanetProviders();

                // Add stats
                if (this.options.gui.stats.visible) {
                    mizarAPI.createStats({
                        element: $("#fps"),
                        verbose: this.options.gui.stats.verbose ? this.options.gui.stats.verbose : false
                    });
                    $("#fps").show();
                }

                // Initialize name resolver
                mizarAPI.getServiceByName(Mizar.SERVICE.NameResolver).init(mizarAPI);

                // Initialize reverse name resolver
                mizarAPI.getServiceByName(Mizar.SERVICE.ReverseNameResolver).init(mizarAPI);

                // UWS services initialization
                UWSManager.init(options);

                // Initialization of tools useful for different modules
                UtilsCore.init(this, options);

                // Initialize moc base
                mizarAPI.getServiceByName(Mizar.SERVICE.MocBase).init(this, options);

                // Fullscreen mode
                document.addEventListener("keydown", function (event) {
                    // Ctrl + Space
                    if (event.ctrlKey === true && event.keyCode === 32) {
                        $('.canvas > canvas').siblings(":not(canvas)").each(
                            function () {
                                $(this).fadeToggle();
                            });
                    }
                });


                ErrorDialog.setIcon('#warningButton');
                $('#warningButton').on('click', function () {
                    if (ErrorDialog.isActive() === true) {
                        ErrorDialog.hide();
                    } else {
                        ErrorDialog.view();
                    }
                })

            }
        };


        /**************************************************************************************************************/

        MizarWidgetAPI.prototype.init = function () {
            var userOptions = this.options;
            var selectedCtx = _.find(this.options.ctx, function (obj) { return obj.name === userOptions.defaultCtx });
            for (var i = 0; i < selectedCtx.context.layers.length; i++) {
                var layer = selectedCtx.context.layers[i];
                mizarAPI.addLayer(layer,
                    function (layerID) {
                        var myLayer = mizarAPI.getLayerByID(layerID);
                        if (myLayer.type === Mizar.LAYER.WCSElevation) {
                            mizarAPI.setBaseElevationByID(layerID);
                        }
                    },
                    function (e) {
                        console.error(e);
                        var layerDescription = e.layerDescription;
                        if(layerDescription.background) {
                            $(self.div).find('#loading').hide();
                            $(self.div).find('#splash').hide();
                            $(self.div).find("canvas").hide();
                            $(self.div).find("#navigationDiv").hide();
                            $(self.div).find('#webGLContextLost').show();                            
                        }                        
                    }
                );
            }

        };


        /**
         * Loads all configuration files from mizarWidget.json
         * Each configuration file can be located as relative or absolute URL
         * @param {url} mizarUrl Mizar URL
         * @param {string[]} configCtx - List of context files. 
         * @return the list of context objects
         */
        MizarWidgetAPI.prototype._loadConfigFiles = function (mizarUrl, configCtx) {
            var ctxObj = [];
            // generate a unique identifier to avoid the web server puts the configuration file in cache.
            var uuid = getUniqueId();
            for (var i = 0; i < configCtx.length; i++) {
                var ctx = configCtx[i];
                var url;
                if (ctx.context.toLowerCase().startsWith('http')) {
                    url = ctx.context;
                } else {
                    url = mizarUrl + "/conf/" + ctx.context;
                }
                url = buildUrlNoCacheUrl(url, uuid);
                var ctxResult = getUrl(url);
                ctx.context = JSON.parse(_removeComments(ctxResult));
                ctxObj.push(ctx);
            }
            return ctxObj;
        };

        /**
         * Returns the mizarWidget GUI.
         */
        MizarWidgetAPI.prototype.getMizarWidgetGui = function () {
            return this.mizarWidgetGui;
        };

        /**
         * Returns the current Mizar context (Sky/Planet)
         * @function getContext
         * @memberof MizarWidgetAPI.prototype
         * @return {SkyContext} SkyContext
         */
        MizarWidgetAPI.prototype.getContext = function () {
            return mizarAPI.getActivatedContext();
        };

        MizarWidgetAPI.prototype.getRenderContext = function () {
            return mizarAPI.getRenderContext();
        };

        /**
         * Returns the current Scene (Sky or Planet).
         * @function getScene
         * @memberof MizarWidgetAPI.prototype
         * @return {Sky} Scene
         */
        MizarWidgetAPI.prototype.getScene = function () {
            return mizarAPI.getActivatedContext()._getGlobe();
        };

        /**
         * Returns the current Navigation.
         * @function getNavigation
         * @memberof MizarWidgetAPI.prototype
         * @return {AstroNavigation} Navigation
         */
        MizarWidgetAPI.prototype.getNavigation = function () {
            return mizarAPI.getActivatedContext().getNavigation();
        };

        MizarWidgetAPI.prototype.getCrs = function () {
            return mizarAPI.getCrs();
        };

        MizarWidgetAPI.prototype.setCrs = function (coordinateSystem) {
            mizarAPI.setCrs(coordinateSystem);
        };

        MizarWidgetAPI.prototype.subscribeMizar = function (name, callback) {
            mizarAPI.subscribe(name, callback);
        };

        MizarWidgetAPI.prototype.unsubscribeMizar = function (name, callback) {
            mizarAPI.unsubscribe(name, callback);
        };

        MizarWidgetAPI.prototype.publishMizar = function (name, context) {
            mizarAPI.publish(name, context);
        };

        MizarWidgetAPI.prototype.subscribeCtx = function (name, callback) {
            mizarAPI.getActivatedContext().subscribe(name, callback);
        };

        MizarWidgetAPI.prototype.unsubscribeCtx = function (name, callback) {
            mizarAPI.getActivatedContext().unsubscribe(name, callback);
        };

        MizarWidgetAPI.prototype.publishCtx = function (name, context) {
            mizarAPI.getActivatedContext().publish(name, context);
        };


        MizarWidgetAPI.prototype.refresh = function () {
            mizarAPI.getActivatedContext().refresh();
        };

        MizarWidgetAPI.prototype.getTileManager = function () {
            return mizarAPI.getActivatedContext().getTileManager();
        };


        /**
         * Add additional layer(OpenSearch, GeoJSON, HIPS, grid coordinates)
         * @function addLayer
         * @memberof MizarWidgetAPI.prototype
         * @param {Object} layerDesc Layer description
         * @return {Layer}The created layer
         */
        MizarWidgetAPI.prototype.addLayer = function (layerDesc) {
            if (layerDesc.coordinateSystem) {
                layerDesc.coordinateSystem = { geoideName: layerDesc.coordinateSystem };
            }
            return mizarAPI.addLayer(layerDesc);
        };


        MizarWidgetAPI.prototype.getServiceByName = function (name, options) {
            return mizarAPI.getServiceByName(name, options);
        };

        MizarWidgetAPI.prototype.SERVICE = Mizar.SERVICE;

        MizarWidgetAPI.prototype.LAYER = Mizar.LAYER;

        MizarWidgetAPI.prototype.CONTEXT = Mizar.CONTEXT;

        MizarWidgetAPI.prototype.CRS = Mizar.CRS;

        MizarWidgetAPI.prototype.GEOMETRY = Mizar.GEOMETRY;

        MizarWidgetAPI.prototype.UTILITY = Mizar.UTILITY;

        MizarWidgetAPI.prototype.NAVIGATION = Mizar.NAVIGATION;

        MizarWidgetAPI.prototype.LAYER = Mizar.LAYER;

        MizarWidgetAPI.prototype.EVENT_MSG = Mizar.EVENT_MSG;


        /**
         * Show/hide angle distance GUI
         * @function setAngleDistanceSkyGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setAngleDistanceSkyGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setAngleDistanceSkyGui(visible);
            }
        };

        /**
         * Show/hide angle distance GUI
         * @function setAngleDistanceSkyGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setAngleDistancePlanetGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setAngleDistancePlanetGui(visible);
            }
        };

        /**
         * Show/hide Switch To 2D
         * @function setSwitchTo2D
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setSwitchTo2D = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setSwitchTo2D(visible);
            }
        };

        /**
         * Show/hide samp GUI
         * Only on desktop
         * @function setSampGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setSampGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setSampGui(visible);
            }
        };

        /**
         * Show/hide shortener GUI
         * @function setShortenerUrlGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setShortenerUrlGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setShortenerUrlGui(visible);
            }
        };

        /**
         * Show/hide 2d map GUI
         * @function setMollweideMapGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setMollweideMapGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setMollweideMapGui(visible);
            }
        };

        /**
         * Show/hide reverse name resolver GUI
         * @function setReverseNameResolverGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setReverseNameResolverGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setReverseNameResolverGui(visible);
            }
        };

        /**
         * Show/hide reverse name resolver GUI
         * @function setReverseNameResolverGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setDistanceGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setDistanceGui(visible);
            }
        };

        /**
         * Show/hide name resolver GUI
         * @function setNameResolverGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setNameResolverGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setNameResolverGui(visible);
            }
        };

        /**
         * Show/hide jQueryUI layer manager view
         * @function setCategoryGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setCategoryGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setCategoryGui(visible);
            }
        };

        /**
         * Show/hide jQueryUI image viewer GUI
         * @function setImageViewerGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setImageViewerGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setImageViewerGui(visible);
            }
        };

        /**
         * Show/hide jQueryUI Export GUI
         * @function setExportGui
         * @memberof MizarWidgetAPI.prototype
         * @param {boolean} visible
         */
        MizarWidgetAPI.prototype.setExportGui = function (visible) {
            if (this.mizarWidgetGui) {
                this.mizarWidgetGui.setExportGui(visible);
            }
        };


        MizarWidgetAPI.prototype.getMode = function () {
            return mizarAPI.getActivatedContext().getMode();
        };

        /**
         * Toggle between between 3D and 2D
         * @function toggleDimension
         * @memberof MizarWidgetAPI.prototype
         * @param {Layer} layer the current layer
         */
        MizarWidgetAPI.prototype.toggleDimension = function (layer) {
            mizarAPI.toggleDimension();
            this.setAngleDistancePlanetGui(true);
            this.setSwitchTo2D(true);
        };

        MizarWidgetAPI.prototype.isSkyContext = function () {
            return this.getMode() === Mizar.CONTEXT.Sky;
        };

        MizarWidgetAPI.prototype.isPlanetContext = function () {
            return this.getMode() === Mizar.CONTEXT.Planet;
        };

        MizarWidgetAPI.prototype.isGroundContext = function () {
            return this.getMode() === Mizar.CONTEXT.Ground;
        };


        MizarWidgetAPI.prototype.createMarsContext = function () {
            this.unsubscribeCtx(Mizar.EVENT_MSG.BASE_LAYERS_READY, RenderingGlobeFinished);
            $(this.div).find('#loading').show();
            var userOptions = this.options;
            var selectedCtx = _.find(this.options.ctx, function (obj) { return obj.name === "mars" });
            if (selectedCtx === undefined) {
                throw "Unable to get the Mars context"
            }
            selectedCtx.context.init.isMobile = this.options.gui.isMobile;
            mizarAPI.createContext(Mizar.CONTEXT.Planet, selectedCtx.context.init);
            var self = this;
            mizarAPI.toggleToContext(mizarAPI.getPlanetContext(), {
                "mustBeHidden": true, "callback": function () {
                    initGUI(self, self.getMode());
                    self.subscribeCtx(Mizar.EVENT_MSG.BASE_LAYERS_READY, RenderingGlobeFinished);
                }
            });
            loadNoStandardPlanetProviders();
            for (var i = 0; i < selectedCtx.context.layers.length; i++) {
                var layer = selectedCtx.context.layers[i];
                mizarAPI.addLayer(layer, function (layerID) {
                    var myLayer = mizarAPI.getLayerByID(layerID);
                    if (myLayer.getType() === Mizar.LAYER.WCSElevation) {
                        mizarAPI.setBaseElevationByID(layerID);
                    }
                });
            }
            self.mizarWidgetGui.setUpdatedActivatedContext(self.getContext());

        };

        MizarWidgetAPI.prototype.createCuriosityContext = function () {
            this.unsubscribeCtx(Mizar.EVENT_MSG.BASE_LAYERS_READY, RenderingGlobeFinished);
            $(this.div).find('#loading').show();
            var userOptions = this.options;
            var selectedCtx = _.find(this.options.ctx, function (obj) { return obj.name === "curiosity" });
            selectedCtx.context.init.isMobile = this.options.gui.isMobile;
            mizarAPI.createContext(Mizar.CONTEXT.Ground, selectedCtx.context.init);
            var self = this;
            mizarAPI.toggleToContext(mizarAPI.getGroundContext(), {
                "mustBeHidden": true, "callback": function () {
                    initGUI(self, self.getMode());
                    self.subscribeCtx(Mizar.EVENT_MSG.BASE_LAYERS_READY, RenderingGlobeFinished);
                }
            });
            for (var i = 0; i < selectedCtx.context.layers.length; i++) {
                var layer = selectedCtx.context.layers[i];
                mizarAPI.addLayer(layer, function (layerID) {
                    var myLayer = mizarAPI.getLayerByID(layerID);
                    if (myLayer.getType() === Mizar.LAYER.WCSElevation) {
                        mizarAPI.setBaseElevationByID(layerID);
                    }
                });
            }
            self.mizarWidgetGui.setUpdatedActivatedContext(self.getContext());
        };

        MizarWidgetAPI.prototype.createSunContext = function () {
            this.unsubscribeCtx(Mizar.EVENT_MSG.BASE_LAYERS_READY, RenderingGlobeFinished);
            $(this.div).find('#loading').show();
            var userOptions = this.options;
            var selectedCtx = _.find(this.options.ctx, function (obj) { return obj.name === "sun" });
            selectedCtx.context.init.isMobile = this.options.gui.isMobile;
            mizarAPI.createContext(Mizar.CONTEXT.Planet, selectedCtx.context.init);
            var self = this;
            mizarAPI.toggleToContext(mizarAPI.getPlanetContext(), {
                "mustBeHidden": true, "callback": function () {
                    initGUI(self, self.getMode());
                    self.subscribeCtx(Mizar.EVENT_MSG.BASE_LAYERS_READY, RenderingGlobeFinished);
                }
            });
            for (var i = 0; i < selectedCtx.context.layers.length; i++) {
                var layer = selectedCtx.context.layers[i];
                mizarAPI.addLayer(layer, function (layerID) {
                    var myLayer = mizarAPI.getLayerByID(layerID);
                    if (myLayer.getType() === Mizar.LAYER.WCSElevation) {
                        mizarAPI.setBaseElevationByID(layerID);
                    }
                });
            }
            self.mizarWidgetGui.setUpdatedActivatedContext(self.getContext());
        };

        MizarWidgetAPI.prototype.toggleToSky = function () {
            $(this.div).find('#loading').show();
            var ctx;
            if (mizarAPI.getMode() === Mizar.CONTEXT.Planet) {
                ctx = mizarAPI.getSkyContext();
            } else if (mizarAPI.getMode() === Mizar.CONTEXT.Ground) {
                ctx = mizarAPI.getPlanetContext();
            }
            mizarAPI.toggleToContext(ctx, { mustBeDestroyed: true });
            self.mizarWidgetGui.setUpdatedActivatedContext(self.getContext());
        };

        MizarWidgetAPI.prototype.getMizarAPI = function () {
            return mizarAPI;
        };

        /**
         * Add layer by drag n drop
         */
        MizarWidgetAPI.prototype.addLayerByDragNDrop = function (name, GeoJson) {
            var self = this;
            mizarAPI.addLayer({
                name: name,
                type: Mizar.LAYER.GeoJSON,
                pickable: true,
                deletable: true,
                visible: true
            }, function (layerID) {
                var layer = mizarAPI.getLayerByID(layerID);
                layer.addFeatureCollection(GeoJson);
                layer.publish(Mizar.EVENT_MSG.LAYER_VISIBILITY_CHANGED, layer);
            }, function(err) {
                ErrorDialog.open(Mizar.LEVEL.ERROR,"Drag n drop failed","Cannot display the file "+name+": "+err);
                ErrorDialog.view();
            });
        };

        MizarWidgetAPI.prototype.getLayers = function () {
            return mizarAPI.getLayers();
        };

        MizarWidgetAPI.prototype.removeLayer = function (layerID) {
            return mizarAPI.removeLayer(layerID);
        };

        MizarWidgetAPI.prototype.getLayerByName = function (name) {
            return mizarAPI.getLayerByName(name);
        };

        MizarWidgetAPI.prototype.getLayerByID = function (ID) {
            return mizarAPI.getLayerByID(ID);
        };

        MizarWidgetAPI.prototype.setBackgroundLayer = function (name) {
            return mizarAPI.setBackgroundLayer(name);
        };

        MizarWidgetAPI.prototype.hasSkyContext = function () {
            return mizarAPI.getSkyContext() != null;
        };

        MizarWidgetAPI.prototype.hasPlanetContext = function () {
            return mizarAPI.getPlanetContext() != null;
        };

        MizarWidgetAPI.prototype.createLayerFromFits = function (name, fits) {
            // createLayerFromFits: function (name, fits) {
            //     var gwLayer = createSimpleLayer(name);
            //     gwLayer.dataType = "line";
            //
            //     // Create feature
            //     var coords = Utils.getPolygonCoordinatesFromFits(fits);
            //     var feature = {
            //         "geometry": {
            //             "gid": name,
            //             "coordinates": [coords],
            //             "type": "Polygon"
            //         },
            //         "properties": {
            //             "identifier": name
            //         },
            //         "type": "Feature"
            //     };
            //
            //     gwLayer.addFeature(feature);
            //     PickingManagerCore.addPickableLayer(gwLayer);
            //     this.addLayer(gwLayer, mizarCore.activatedContext.planetLayer);
            //     return gwLayer;
            // },
            //TODO A reimplémenter et mettre le bon CRS
        };




        return MizarWidgetAPI;
    });
