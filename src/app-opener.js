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

        /**
         * 実行環境を取得
         *
         * @return {String}
         *     IOS or ANDROID
         *
         */
        getEnvStr: function() {
            var str = '';

            if (this.isIOS()) {
                str = 'IOS';
            }
            else if (this.isAndroid()) {
                str = 'ANDROID';
            }
            return str;
        },

        /**
         * iOSで未インストールと判断された時に実行される関数
         *
         */
        iOSNotInstalledFunc: function() {
            alert('アプリがインストールされてないか、\nもしくは何か問題が発生したため、\nアプリを開けませんでした。');
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
     * @param {String} options.escapeUrl
     *     万が一、何かあったときや、ブラウザに戻ったときに逃す先のURL
     * @param {Number} options.androidSlowestAppBootTime
     *     URIスキーマ踏んで、アプリが立ち上がりブラウザがサスペンドされるまでの最遅タイム
     *     これが低いと、アプリ起動中に処理が実行されてなぜか無視される
     *     アプリ側に完全に主導権が移るまで待って、こっそり裏で処理を実行する必要がある
     * @param {Number} options.iOSFastestAppBootTime
     *     URIスキーマ踏んで、アプリが立ち上がりブラウザがサスペンドされるまでの最速タイム
     *     これが高いと、アプリがない端末でアプリが入っている扱いになる可能性が上がる
     *     これが低いと、アプリがある端末でアプリが入ってない扱いになる可能性が上がる
     * @param {Function} options.iOSNotInstalledFunc
     *     iOSで未インストールと判断された時に実行される関数
     *
     */
    AppOpener = function(options) {
        // 必須
        this.schemeStr = options.schemeStr || null;
        this.escapeUrl = options.escapeUrl || null;

        // オプション
        this.androidSlowestAppBootTime = options.androidSlowestAppBootTime || 500;
        this.iOSFastestAppBootTime     = options.iOSFastestAppBootTime     || 20;
        this.iOSNotInstalledFunc       = options.iOSNotInstalledFunc       || Util.iOSNotInstalledFunc;

        // 処理の判定のための文字列を取っとく
        this.envStr = Util.getEnvStr();

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
            if (this.escapeUrl === null || this.schemeStr === null) {
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
                this._iOSHandler(schemeStr);
                break;
            case 'ANDROID':
                this._androidHandler(schemeStr);
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

            var that = this;
            setTimeout(function() { that._exit(); }, this.androidSlowestAppBootTime);

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
                this.iOSNotInstalledFunc();
                this._exit();
            }
            // アプリ入ってた = ブラウザに戻ってきたタイミングで逃がす
            else {
                this._exit();
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
            var escapeUrl = this.escapeUrl;
            // ずらさないとiOS Safari以外で実行されない...
            setTimeout(function() { location.replace(escapeUrl); }, 0);
        }
    };

    return AppOpener;

}));
