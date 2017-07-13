/**
 * Plugin to create repo instance and to register repo instance
 * @extends EkstepRenderer.Plugin
 * @author Manjunath Davanam <manjunathd@ilimi.in>
 */
Plugin.extend({
    templatePath : undefined,
    controllerPath: undefined,
    _ngScopeVar: "playerContent",
    _injectTemplateFn: undefined,
    initialize: function() {
        EkstepRendererAPI.addEventListener('renderer:launcher:load', this.start, this);
        this.templatePath = EkstepRendererAPI.resolvePluginResource(this._manifest.id, this._manifest.ver, "renderer/templates/renderer.html");
        this.controllerPath = EkstepRendererAPI.resolvePluginResource(this._manifest.id, this._manifest.ver, "renderer/js/rendererApp.js");
        var instance = this;
        org.ekstep.service.controller.loadNgModules(this.templatePath, this.controllerPath);
    },
    start: function(evt, content) {
        var globalConfig = EkstepRendererAPI.getGlobalConfig();
        var contentTypePlugin = _.findWhere(globalConfig.contentLaunchers, {
            'mimeType': content.mimeType
        });
        
        org.ekstep.contentrenderer.initPlugins('',globalConfig.corePluginspath);
        this.loadEndPagePlugin();

        if (!_.isUndefined(contentTypePlugin)) {
            this.loadPlugin(contentTypePlugin, content);
        }
    },
    loadEndPagePlugin: function(){
        if(GlobalContext.config.showEndPage){
            org.ekstep.contentrenderer.loadPlugins({"id": "org.ekstep.endpage", "ver": "1.0", "type": 'plugin'}, [], function(){
                console.info('Canvas Default plugins are loaded..');
                console.log("End page plugin loaded..");
            });        
        }
    },
    loadPlugin: function(plugin, contentData) {
        var instance = this;
        content = contentData;
        org.ekstep.contentrenderer.loadPlugins(plugin, [], function() {
            instance.initTelemetry(content);
            EkstepRendererAPI.dispatchEvent("telemetryPlugin:intialize"); 
            EkstepRendererAPI.dispatchEvent('renderer:collection:hide');
            EkstepRendererAPI.dispatchEvent('content:load:' + content.mimeType, undefined, content);
        });
    },
    initTelemetry:function(content) {
        EkstepRendererAPI.dispatchEvent('renderer:telemetry:start', undefined, content);
    }   

})
//# sourceURL=ContentLauncher.js