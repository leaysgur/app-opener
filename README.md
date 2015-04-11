# app-opener
Better way to open native app from your mobile web site.

## How to use
```javascript
new AppOpener({
    schemeStr:   'twitter://post?message=' + encodeURIComponent('これでWebからアプリが呼べたよ！！ https://github.com/leader22/app-opener'),
    fallbackUrl: 'http://lealog.net'
});
```

## Sample scheme

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
