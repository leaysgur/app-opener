# app-opener
Better way to open native app from your mobile web site.


## Sample scheme

```javascript
const SCHEME = {
    TWITTER: {
        IOS:     'twitter://post?message={{TEXT}}',
        ANDROID: 'intent://post?message={{TEXT}}#Intent;scheme=twitter;package=com.twitter.android;end;'
    },
    FACEBOOK: {
        // NOT AVAILABLE
        // 探せば見つかるかもしれない
        // 私はココロが折れました
    },
    LINE: {
        IOS:     'line://msg/text/{{TEXT}}',
        ANDROID: 'intent://msg/text/{{TEXT}}#Intent;scheme=line;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=jp.naver.line.android;end;'
    }
}
```
