(function(global, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return factory(global, {});
        });
    } else if ('process' in global) {
        throw new Error('This module is only for browsers.');
    } else {
        global.AppOpener = factory(global, {});
    }

}((this.self || global), function(global, AppOpener, undefined) {
    'use strict';

    /**
     * 実行環境を判別するためのUtil
     * 処理は見ての通り。
     *
     */
    var Util = {
        ua: navigator.userAgent.toLowerCase(),

        isIOS: function () {
            return -1 !== this.ua.indexOf('iphone') || -1 !== this.ua.indexOf('ipod') || -1 !== this.ua.indexOf('ipad');
        },
        isAndroid: function () {
            return -1 !== this.ua.indexOf('android');
        },
        isAndroidChrome: function () {
            // NOTE:
            // S Browserとかいう標準ブラウザのくせにUAに"chrome"って入るヤツがいる！
            // それと見分けるために、"version"って文字列もチェック...
            return -1 !== this.ua.indexOf('mobile') && -1 !== this.ua.indexOf('chrome') && -1 === this.ua.indexOf('version');
        },
        isiOSChrome: function () {
            return -1 !== this.ua.indexOf('crios');
        },

        /**
         * 実行環境を配列で取得
         *
         * @return {Array}
         *     ['OS名', 'デフォルトでない場合のBROWSER名']
         *
         */
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
        }
    };

    /**
     *
     * いわゆるURIスキーマやインテントをWebから開くことができます。
     * iOS/Androidに対応し、それぞれ最適な方法でアプリを開きます。
     *
     * @class AppOpener
     *
     * @param {Object} options
     * @param {String} options.schemeStr
     *     開きたいURIスキーマ or インテント文字列
     * @param {String} options.fallbackUrl
     *     万が一、何かあったときに逃すURL
     * @param {Number} options.iOSFastestAppBootTime
     *     URIスキーマ踏んで、アプリが立ち上がりブラウザがサスペンドされるまでの最速タイム
     *     これが高いと、アプリがない端末でアプリが入っている扱いになる可能性が上がる
     *     これが低いと、アプリがある端末でアプリが入ってない扱いになる可能性が上がる
     *
     */
    AppOpener = function(options) {
        // 必須
        this.schemeStr   = options.schemeStr   || null;
        this.fallbackUrl = options.fallbackUrl || null;

        // オプション
        this.iOSFastestAppBootTime = options.iOSFastestAppBootTime || 20;

        // 処理の判定のための文字列を取っとく
        this.envStr = Util.getEnvArr().join('_');

        // 引数および実行環境を調べる
        if (this._isExecutable() === false) {
            this._exit();
        } else {
            this._execute();
        }
    };

    AppOpener.prototype = {
        constructor: AppOpener,
        /**
         *
         * 想定外の踏まれ方や呼び出し方をされていた場合に落とす処理
         *
         * @return {Boolean}
         *     実行可能ならtrue
         *
         */
        _isExecutable: function() {
            // 引数足りてない
            if (this.fallbackUrl === null || this.schemeStr === null) {
                return false;
            }

            // 直打ちはスルー
            if (document.referrer.length === 0 || history.length === 0) {
                return false;
            }

            return true;
        },

        /**
         *
         * 実際にアプリを呼び出す処理を、環境別に切り分けて呼ぶ
         *
         */
        _execute: function() {
            var schemeStr = this.schemeStr;

            switch (this.envStr) {
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

        /**
         *
         * Android標準ブラウザ用の処理
         *
         * 実は標準ブラウザならiframe方式でも動く。
         * が、SBrowserをChromeとしない場合には動かないので、
         * どちらでも動くこっちの方式を選ぶことにした
         *
         * @param {String} schemeStr
         *     実行したいURIスキーマ or インテント
         *
         */
        _androidHandler: function(schemeStr) {
            location.replace(schemeStr);

            setTimeout(function() {
                history.back();
            }, 0);

            // Androidは未インストールの場合、GooglePlayが開く
        },

        /**
         *
         * Android Chrome用の処理
         *
         * @param {String} schemeStr
         *     実行したいURIスキーマ or インテント
         *
         */
        _androidChromeHandler: function(schemeStr) {
            location.replace(schemeStr);

            // Androidは未インストールの場合、GooglePlayが開く
        },

        /**
         *
         * iOS Safari / iOS Chrome用の処理
         *
         * iOSは未インストールの場合、このschemeを処理できない旨のアラートが表示されてしまうので、
         * iframe内で処理することでそれを回避する。
         *
         * @param {String} schemeStr
         *     実行したいURIスキーマ or インテント
         *
         */
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

        /**
         *
         * 緊急離脱の処理
         *
         * サーバーサイドで制限すればそもそも心配いらないはず・・。
         *
         */
        _exit: function() {
            location.replace(this.fallbackUrl);
        }
    };

    return AppOpener;

}));
