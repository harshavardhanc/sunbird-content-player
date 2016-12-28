TelemetryService = {
    _version: "2.0",
    _baseDir: 'EkStep Content App',
    isActive: false,
    _config: undefined,
    instance: undefined,
    gameOutputFile: undefined,
    _gameErrorFile: undefined,
    _gameData: undefined,
    _data: [],
    _gameIds:[],
    _user: {},
    apis: {
        telemetry : "sendTelemetry",
        feedback : "sendFeedback"
    },
    mouseEventMapping: {
        click: 'TOUCH',
        dblclick: 'CHOOSE',
        mousedown: 'DROP',
        pressup: 'DRAG'
    },
    init: function(gameData, user) {
        var localStorageInstance = TelemetryService.getLocalStorageInstance();
        if(localStorageInstance) {
            TelemetryService.setTelemetryService(localStorageInstance, gameData);
        }
        return new Promise(function(resolve, reject) {
            if (!TelemetryService.instance) {
                TelemetryService._user = user;
                TelemetryService.instance = (TelemetryService._version == "1.0") ? new TelemetryV1Manager() : new TelemetryV2Manager();
                if (gameData) {
                    if (gameData.id && gameData.ver) {
                        TelemetryService._parentGameData = gameData;
                        TelemetryService._gameData = gameData;
                    } else {
                        reject('Invalid game data.');
                    }
                    TelemetryServiceUtil.getConfig().then(function(config) {
                        TelemetryService._config = config;
                        if (TelemetryService._config.isActive) TelemetryService.isActive = TelemetryService._config.isActive;
                            resolve(true);
                    }).catch(function(err) {
                        reject(err);
                    });
                } else {
                    reject('Game data is empty.');
                };
                resolve(true);
            }else{
                resolve(true)
                console.log("TelemetryService instance is not create")
            }
        });
    },
    webInit: function(gameData, user) {
        return new Promise(function(resolve, reject) {
            TelemetryService.init(gameData, user)
            .then(function() {
                TelemetryService.start(gameData.id, gameData.ver);
                resolve(true);

            })
            .catch(function(err) {
                reject(err);
            });
        });
    },
    changeVersion: function(version) {
        TelemetryService._version = version;
        TelemetryService.instance = (TelemetryService._version == "1.0") ? new TelemetryV1Manager() : new TelemetryV2Manager();
        console.info("Telemetry Version updated to:", version);
    },
    getDataByField: function(field) {

    },
    getGameData: function() {
        return TelemetryService.isActive ? TelemetryService._gameData : undefined;
    },
    getInstance: function() {
        return TelemetryService.isActive ? TelemetryService.instance : undefined;
    },
    getMouseEventMapping: function() {
        return TelemetryService.mouseEventMapping;
    },
    getGameId: function() {
        return TelemetryService.isActive ? TelemetryService._gameData.id : undefined;
    },
    getGameVer: function() {
        return TelemetryService.isActive ? TelemetryService._gameData.ver : undefined;
    },
    exitWithError: function(error) {
        var message = '';
        if (error) message += ' Error: ' + JSON.stringify(error);
        TelemetryService.instance.exitApp();
    },
    flushEvent: function(event, apiName) {
        TelemetryService._data.push(event);
        if (event)
            event.flush(apiName);
        return event;
    },
    setTelemetryService: function(localStorageInstance, gameData){
        // This is specific to HTML games launched by GenieCanvas
        // HTML content OE_START is already logged by GenieCanvas coverpage
        // OE_START should not log by HTML content once again(if they are using GenieCanvasBridge.js)
        if(localStorageInstance._gameData.id == gameData.id ){
        var start = localStorageInstance._start;//JSON.parse(localStorage.getItem("_start"));
        var end = localStorageInstance._end;//JSON.parse(localStorage.getItem("_end"));
            if (!_.isUndefined(localStorageInstance)) {
                for (var prop in localStorageInstance) {
                    if (TelemetryService.hasOwnProperty(prop)) {
                        TelemetryService[prop] = localStorageInstance[prop];
                    }
                }
            }
            TelemetryService.instance = (TelemetryService._version == "1.0") ? new TelemetryV1Manager() : new TelemetryV2Manager();
            if (!_.isUndefined(start)) {
                for(var i =0; i<start.length;i++){
                    TelemetryService.instance._start.push(start[i]);
                }
            }
            if (!_.isUndefined(end)) {
                var teEndevent = TelemetryService.instance.createEvent("OE_END", {}).start();
                teEndevent.startTime = end[end.length - 1].startTime;
                TelemetryService.instance._end.push(teEndevent);
            }
        }else{
            console.info("Game id is not same",gameData.id);
        }
    },
    getLocalStorageInstance: function() {
        var canvasLocalStorageData = localStorage.getItem("canvasLS");
        var telemetryLocalStorageData;
        if(_.isUndefined(canvasLocalStorageData)){
            canvasLocalStorageData = JSON.parse(canvasLocalStorageData);
            telemetryLocalStorageData =  _.isUndefined(canvasLocalStorageData.telemetryService) ? undefined : JSON.parse(canvasLocalStorageData.telemetryService);
            telemetryLocalStorageData._start = JSON.parse(telemetryLocalStorageData._start);
            telemetryLocalStorageData._end = JSON.parse(telemetryLocalStorageData._end);
        }
        return telemetryLocalStorageData;
    },
    start: function(id, ver) {
        if (!TelemetryService.isActive) {
            console.log("TelemetryService is not active.");
            return new InActiveEvent();
        } else {
            ver = (ver) ? ver + "" : "1"; // setting default ver to 1
            if(_.findWhere(TelemetryService.instance._start, {id: id}))
                return new InActiveEvent();
            else
                return TelemetryService.flushEvent(TelemetryService.instance.start(id, ver), TelemetryService.apis.telemetry);
        }
    },
    end: function() {
        if (!TelemetryService.isActive) {
            return new InActiveEvent();
        }
        return this.flushEvent(TelemetryService.instance.end(), TelemetryService.apis.telemetry);
    },
    interact: function(type, id, extype, data) {
        if (!TelemetryService.isActive) {
            return new InActiveEvent();
        }
        return TelemetryService.flushEvent(TelemetryService.instance.interact(type, id, extype, data), TelemetryService.apis.telemetry);
    },
    assess: function(qid, subj, qlevel, data) {
        if (!TelemetryService.isActive) {
            return new InActiveEvent();
        }
        return TelemetryService.instance.assess(qid, subj, qlevel, data);
    },
    assessEnd: function(event, data) {
        if (!TelemetryService.isActive) {
            return new InActiveEvent();
        }
        return TelemetryService.flushEvent(TelemetryService.instance.assessEnd(event, data), TelemetryService.apis.telemetry);
    },
    levelSet: function(eventData) {
        if (TelemetryService.isActive) {
            var eventName = 'OE_LEVEL_SET';
            return new InActiveEvent();
        }
    },
    interrupt: function(type, id) {
        if (!TelemetryService.isActive) {
            return new InActiveEvent();
        }
        return TelemetryService.flushEvent(TelemetryService.instance.interrupt(type, id), TelemetryService.apis.telemetry);
    },
    exitApp: function() {
        setTimeout(function() {
            navigator.app.exitApp();
        }, 5000);
    },
    navigate: function(stageid, stageto) {
        if (!TelemetryService.isActive) {
            return new InActiveEvent();
        }
        return TelemetryService._version == "1.0" ? "" : this.flushEvent(TelemetryService.instance.navigate(stageid, stageto), TelemetryService.apis.telemetry);
    },
    sendFeedback: function(eks) {
        if (!TelemetryService.isActive) {
            return new InActiveEvent();
        }
        return this.flushEvent(TelemetryService.instance.sendFeedback(eks), TelemetryService.apis.feedback);
    },
    itemResponse: function(data) {
        if (!TelemetryService.isActive) {
            return new InActiveEvent();
        }
        return TelemetryService.instance.itemResponse(data);
    },
    resume: function(newUserId, NewContentId, gameData, user) {
        var previousContentId = TelemetryService._gameData;
        var previousUserId = TelemetryService._user.uid;
        if (previousContentId != NewContentId || newUserId != previousUserId) {
            TelemetryService.end();
            TelemetryService.init(TelemetryService._gameData, TelemetryService._user);
            TelemetryService.start()
        }
    },
    exit: function() {
        if (TelemetryService.isActive) {
            TelemetryService._data = [];
            if(!_.isEmpty(TelemetryService.instance._end)) {
                var len = TelemetryService.instance._end.length;
                for(var i = 0; i < len; i++)
                    TelemetryService.end();
            }
            if(_.isEmpty(TelemetryService.instance._end)) {
                TelemetryService.isActive = false;
            }
        }
    },
    logError: function(eventName, error) {
     var data = {
             'eventName': eventName,
             'message': error,
             'time': getCurrentTime()
         }
     // change this to write to file??
     console.log('TelemetryService Error:', JSON.stringify(data));
     // create the event and Dispatch the Event
     var evt = document.createEvent('Event');
     evt.initEvent('logError', true, true);
     document.body.dispatchEvent(evt);
     console.info('Telemetry :' + JSON.stringify(data.message));
 },
    print: function() {
        if (TelemetryService._data.length > 0) {
            var events = TelemetryService._data.cleanUndefined();
            events = _.pluck(events, "event");
            console.log(JSON.stringify(events));
        } else {
            console.log("No events to print.");
        }
    }
}

Array.prototype.cleanUndefined = function() {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == undefined) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
