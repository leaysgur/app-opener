(function(global) {
    'use strict';

    var SCHEME = {
        TWITTER: {
            IOS:     'twitter://post?message={{TEXT}}',
            ANDROID: 'intent://post?message={{TEXT}}#Intent;scheme=twitter;package=com.twitter.android;end;'
        },
        FACEBOOK: {
        },
        LINE: {
            IOS:     'line://msg/text/{{TEXT}}',
            ANDROID: 'intent://msg/text/{{TEXT}}#Intent;scheme=line;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=jp.naver.line.android;end;'
        }
    };

    var Util = {
        // いわずもがな
        ua: navigator.userAgent.toLowerCase(),

        // 以下、環境を判別する関数が続く
        isIOS: function () {
            return -1 !== this.ua.indexOf('iphone') || -1 !== this.ua.indexOf('ipod') || -1 !== this.ua.indexOf('ipad');
        },
        isAndroid: function () {
            return -1 !== this.ua.indexOf('android');
        },
        isAndroidChrome: function () {
            // S Browserとかいう標準ブラウザのくせにUAにchromeって入るヤツがいる！
            // それと見分けるために、versionも見る...
            return -1 !== this.ua.indexOf('mobile') && -1 !== this.ua.indexOf('chrome') && -1 === this.ua.indexOf('version');
        },
        isiOSChrome: function () {
            return -1 !== this.ua.indexOf('crios');
        },
        getEnvArr: function() {
            var strArr = [];

            if (this.isIOS()) {
                strArr.push('IOS');
                if (this.isiOSChrome()) {
                    strArr.push('CHROME');
                }
            }
            else if (this.isAndroid()) {
                strArr.push('ANDROID');
                if (this.isAndroidChrome()) {
                    strArr.push('CHROME');
                }
            }

            return strArr;
        },
        fixScheme: function(schemeStr, shareText) {
            return schemeStr.replace('{{TEXT}}', encodeURIComponent(shareText));
        }
    };

    var NativeSharer = global.NativeSharer = function(options) {
        // 何かあったときに逃すURL
        // ただ、出番はほぼないはず
        this.fallbackUrl = options.fallbackUrl || null;
        // URIスキーマ踏んで、アプリが立ち上がりブラウザがサスペンドされるまでの最速タイム
        // この数値を高くすると、アプリがない端末でもアプリが入っている扱いになる可能性が上がる
        // この数値を低くすると、アプリがある端末でもアプリが入ってない扱いになる可能性が上がる
        this.iOSFastestAppBootTime = options.iOSFastestAppBootTime || 20;

        this.envArr = Util.getEnvArr();

        // 引数および実行環境を調べる
        if (this._isExecutable() === false) {
            this._exit();
        }
    };

    NativeSharer.prototype = {
        constructor: NativeSharer,
        _isExecutable: function() {
            // 引数足りてない
            if (this.fallbackUrl === null) {
                return false;
            }

            // 直打ちはスルー
            if (document.referrer.length === 0 || history.length === 0) {
                return false;
            }

            return true;
        },
        toTwitter: function(shareText) {
            var schemeStr = SCHEME['TWITTER'][this.envArr[0]];
            this.toCustom(Util.fixScheme(schemeStr, shareText));
        },
        toFacebook: function(shareText) {
            var schemeStr = SCHEME['FACEBOOK'][this.envArr[0]];
            this.toCustom(Util.fixScheme(schemeStr, shareText));
        },
        toLINE: function(shareText) {
            var schemeStr = SCHEME['LINE'][this.envArr[0]];
            this.toCustom(Util.fixScheme(schemeStr, shareText));
        },
        toCustom: function(schemeStr) {
            switch (this.envArr.join('_')) {
            case 'IOS':
            case 'IOS_CHROME':
                this._iOSHandler(schemeStr);
                break;
            case 'ANDROID':
                this._androidHandler(schemeStr);
                break;
            case 'ANDROID_CHROME':
                this._androidChromeHandler(schemeStr);
                break;
            default:
                this._exit();
                break;
            }
        },
        // 標準ブラウザならiframeでも動くが、SBrowserをChromeとしない場合に動かないので、
        // どちらでも動く方式を選ぶことにした
        _androidHandler: function(schemeStr) {
            location.replace(schemeStr);
            setTimeout(function() {
                history.back();
            }, 0);

            // Androidは未インストールの場合、GooglePlayが開く
        },
        _androidChromeHandler: function(schemeStr) {
            location.replace(schemeStr);

            // Androidは未インストールの場合、GooglePlayが開く
        },
        // iOSは未インストールの場合、このschemeを処理できない旨のアラートが表示されてしまうので、
        // iframe内で処理することでそれを回避
        _iOSHandler: function(schemeStr) {
            // iframeをDOMに落とす"前に"時間を保存する
            var start = Date.now();

            var iframe = document.createElement('iframe');
            iframe.src = schemeStr;
            iframe.style.display = 'none';
            // アプリ起動したならブラウザがサスペンドされるため、
            // これ以降のコードはいったん実行されない
            document.body.appendChild(iframe);

            // ----- 以下はブラウザに戻ったタイミングで実行される -----

            // ゆえにココがすぐさま実行される = サスペンドされなかった = アプリ入ってない
            if (Date.now() - start < this.iOSFastestAppBootTime) {
                alert('アプリがインストールされてないか、\nもしくは何か問題が発生したため、\nアプリを開けませんでした。');
                history.back();
            }
            // アプリ入ってた = ブラウザに戻ってきたタイミングで直前に戻す
            else {
                history.back();
            }
        },
        _exit: function() {
            location.replace(this.fallbackUrl);
        }
    };

}(window));
