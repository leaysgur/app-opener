# app-opener
Better way to open native app from your mobile web site.

## How to use

### index.html
```html
<a href="share-tw.html">Share to Twitter</a>
```

Be careful NOT to set ``target="_blank"``.


### share-tw.html
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Share to Twitter app</title>
</head>
<body>
<script src="app-opener/dist/app-opener.min.js"></script>
<script>
var isAndroid = navigator.userAgent.toLowerCase().indexOf('android') !== -1;
var shareText = encodeURIComponent('Webからアプリが開いたよ！！ @leader22++ https://github.com/leader22/app-opener') + ' ';
var schemeStr = (isAndroid) ? 'intent://post?message=' + shareText + '#Intent;scheme=twitter;package=com.twitter.android;end;'
                            : 'twitter://post?message=' + shareText;
new AppOpener({
    schemeStr: schemeStr,
    escapeUrl: 'index.html'
});
</script>
</body>
</html>
```

## Options
### options.schemeStr
[Required] {String} Uri scheme strings you want to open.

### options.escapeUrl
[Required] {String} Url to escape at after app opened or invalid situation.

### options.androidSlowestAppBootTime
[Default] 500

[options] {Number} The time that it takes for the app to boot completely.

### options.iOSFastestAppBootTime
[Default] 20

[options] {Number} The time that it takes for the app to start boot.

### options.iOSNotInstalledFunc
[Default] alert('See code ;o')
[options] {Function} Executed at app could not boot on iOS.

Please try [demo](http://labs.lealog.net/app-opener-sample/).

## Scheme example

```javascript
const SCHEME = {
    TWITTER: {
        SHARE: {
            IOS:     'twitter://post?message={{TEXT}}',
            ANDROID: 'intent://post?message={{TEXT}}#Intent;scheme=twitter;package=com.twitter.android;end;'
        }
    },
    FACEBOOK: {
        SHARE: {
            // 探せば見つかるかもしれないが私はココロが折れました
            // そしてコレがないのは中々に辛い
        },
        SHOW_PROFILE: {
            IOS:     'fb://profile/{{USER_ID}}',
            ANDROID: ''
        }
    },
    LINE: {
        SHARE: {
            IOS:     'line://msg/text/{{TEXT}}',
            ANDROID: 'intent://msg/text/{{TEXT}}#Intent;scheme=line;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=jp.naver.line.android;end;'
        },
        ADD_FRIEND: {
            IOS:     'line://ti/p/{{USER_ID}}',
            ANDROID: 'intent://ti/p/{{USER_ID}}#Intent;scheme=line;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=jp.naver.line.android;end;'
        }
    }
}
```
