(function(window) {

    function _registerEvent(target, eventType, cb) {
        if (target.addEventListener) {
            target.addEventListener(eventType, cb);
            return {
                remove: function () {
                    target.removeEventListener(eventType, cb);
                }
            };
        } else {
            target.attachEvent(eventType, cb);
            return {
                remove: function () {
                    target.detachEvent(eventType, cb);
                }
            };
        }
    }

    function _createHiddenIframe(target, uri) {
        var iframe = document.createElement("iframe");
        iframe.src = uri;
        iframe.id = "hiddenIframe";
        iframe.style.display = "none";
        target.appendChild(iframe);

        return iframe;
    }
    
    function openUriWithHiddenFrame(uri, failCb, successCb) {
        var timeout = setTimeout(function () {
            //需要先删除handler，否则如果failCb()执行alert会失去焦点
            handler.remove();
            failCb();
        }, 1000);

        var iframe = document.querySelector("#hiddenIframe");
        if (!iframe) {
            iframe = _createHiddenIframe(document.body, "about:blank");
        }

        var handler = _registerEvent(window, "blur", onBlur);

        function onBlur() {
            clearTimeout(timeout);
            handler.remove();
            successCb();
        }

        iframe.contentWindow.location.href = uri;
    }
    
    function openUriWithTimeoutHack(uri, failCb, successCb) {
        var timeout = setTimeout(function () {
            handler.remove();
            failCb();
        }, 1000);

        //handle page running in an iframe (blur must be registered with top level window)
        var target = window;
        while (target != target.parent) {
            target = target.parent;
        }

        var handler = _registerEvent(target, "blur", onBlur);

        function onBlur() {
            clearTimeout(timeout);
            handler.remove();
            successCb();
        }
        
        window.location = uri;
        
    }
    
    function openUriWithTimeoutHackFor360JS(uri, failCb, successCb) {
        var timeout = setTimeout(function () {
            handler.remove();
            failCb();
        }, 1000);

        //handle page running in an iframe (blur must be registered with top level window)
        var target = window;
        while (target != target.parent) {
            target = target.parent;
        }

        var handler = _registerEvent(target, "blur", onBlur);

        function onBlur() {
            clearTimeout(timeout);
            handler.remove();
            successCb();
        }
        
        window.location = uri;
        onBlur();//360手动失去焦点
        
    }    
    
    function openUriUsingFirefox(uri, failCb, successCb) {
        var iframe = document.querySelector("#hiddenIframe");

        if (!iframe) {
            iframe = _createHiddenIframe(document.body, "about:blank");
        }

        try {
            iframe.contentWindow.location.href = uri;

            iframe.contentWindow.onload = function(){
                successCb();
            }
        } catch (e) {
            if (e.name == "NS_ERROR_UNKNOWN_PROTOCOL") {
                failCb();
            }

            failCb();
        }
    }    

    function openUriUsingIEInOlderWindows(uri, failCb, successCb) {
        var iev = getInternetExplorerVersion();
        if (iev === 10) {
            //openUriUsingIE10InWindows7(uri, failCb, successCb); Win7下IE10不好使
            openUriInNewWindowHack(uri, failCb, successCb);
        } else if (iev === 9 || iev === 11) {
            openUriWithHiddenFrame(uri, failCb, successCb);
        } else{
            //console.log("ie others");
            openUriInNewWindowHack(uri, failCb, successCb);
        }
    }
    
    function openUriUsingChrome(uri, failCb, successCb) {
        //假设MimeTypes长度大于30时为360极速浏览器或360安全浏览器极速模式，暂时没找到更好的判断方法
        //基于chrome的360，window.location后不触发失去焦点事件，所以只能做到安装协议时打开，但不安装没有提示
        if(window.navigator.mimeTypes.length > 30){
            //openUriInNewWindowHack(uri, failCb, successCb);
            //openUriWithTimeoutHack(uri, failCb, successCb);
            openUriWithTimeoutHackFor360JS(uri, failCb, successCb);
        }else{
            //chrome
            openUriWithTimeoutHack(uri, failCb, successCb);
        }
    }    

    function openUriUsingIE10InWindows7(uri, failCb, successCb) {
        var timeout = setTimeout(failCb, 1000);
        window.addEventListener("blur", function () {
            clearTimeout(timeout);
            successCb();
        });

        var iframe = document.querySelector("#hiddenIframe");
        if (!iframe) {
            iframe = _createHiddenIframe(document.body, "about:blank");
        }
        try {
            iframe.contentWindow.location.href = uri;
        } catch (e) {
            failCb();
            clearTimeout(timeout);
        }
    }

    function openUriInNewWindowHack(uri, failCb, successCb) {
        var myWindow = window.open('', '', 'width=0,height=0');

        myWindow.document.write("<iframe src='" + uri + "'></iframe>");

        setTimeout(function () {
            try {
                myWindow.location.href;
                myWindow.setTimeout("window.close()", 100);
                successCb();
            } catch (e) {
                myWindow.close();
                failCb();
            }
        }, 1000);
    }
    
    function openUriWithMsLaunchUri(uri, failCb, successCb) {
        navigator.msLaunchUri(uri,
            successCb,
            failCb
        );
    }
    
    function checkBrowser() {
        //console.log(navigator);
        var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        return {
            isOpera   : isOpera,
            isFirefox : typeof InstallTrigger !== 'undefined',
            isSafari  : Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
            isChrome  : !!window.chrome && !isOpera,
            isIE      : /*@cc_on!@*/false || !!document.documentMode // At least IE6
        }
    }

    //下面浏览器判断360时有问题，可以改成jquery判断
    function getInternetExplorerVersion() {
        var rv = -1;
        if (navigator.appName === "Microsoft Internet Explorer") {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)
                rv = parseFloat(RegExp.$1);
        }
        else if (navigator.appName === "Netscape") {
            var ua = navigator.userAgent;
            var re = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null) {
                rv = parseFloat(RegExp.$1);
            }
        }
        return rv;
    }

    function getFirefoxVersion(){
        let match = window.navigator.userAgent.match(/Firefox\/([0-9]+)\./);
        return match ? parseInt(match[1]) : 0;
    }

    window.protocolCheck = function(uri, failCb, successCb) {
        function failCallback() {
            failCb && failCb();
        }

        function successCallback() {
            successCb && successCb();
        }

        if (navigator.msLaunchUri) { //for IE and Edge in Win 8 and Win 10
            openUriWithMsLaunchUri(uri, failCb, successCb);
        } else {
            var browser = checkBrowser();

            if (browser.isFirefox) {
                if (getFirefoxVersion() >= 64) {
                    openUriWithHiddenFrame(uri, failCb, successCb);
                } else {
                    openUriUsingFirefox(uri, failCallback, successCallback);
                }
            } else if (browser.isChrome) {
                openUriUsingChrome(uri, failCallback, successCallback);
            } else if (browser.isIE) {
                openUriUsingIEInOlderWindows(uri, failCallback, successCallback);
            } else {
                //not supported, implement please
            }
        }
    }
} (window));