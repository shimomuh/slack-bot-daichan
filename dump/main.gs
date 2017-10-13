function Daichan() {
  this.spreadsheet = SpreadsheetApp.openByUrl(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_URL'));
  this.replySheet = this.spreadsheet.getSheets()[0];
  this.words = this.replySheet.getRange("A2:Z100").getValues();
  this.nameTrigger = '大ちゃん|だいちゃん|daichan|dai-chan';
  this.askTrigger = '教えて|おしえて|teach|tell';
  this.listenListTrigger = 'リスト|list';
  this.weatherTrigger = '天気|てんき|weather';
  this.nameTriggerMatcher = new RegExp(this.nameTrigger);
  this.askTriggerMatcher = new RegExp(this.askTrigger);
  this.listenListTriggerMatcher = new RegExp(this.listenListTrigger);
  this.weatherTriggerMatcher = new RegExp(this.weatherTrigger);
}

Daichan.prototype = {
  // @return [Object] Daichan 
  listen: function (word) {
    for (column = 0, len = this.words.length; column < len; column++) {
      var changedWord = this.words[column][0].replace(/ /g, '').replace(/　/g, '').replace(/,/g, '|')

      repliableWord = new RegExp(changedWord);
      if (repliableWord.exec(word) !== null) {
        this.repliableWordIndex = column;
        break;
      }
    }
    return this;
  },
  // @return [String] replyWord
  reply: function () {
    if (this.repliableWordIndex === undefined || this.repliableWordIndex === null) { return ''; }
    
    var replyWords = new Array();
    for (row = 1, len = this.words[this.repliableWordIndex].length; row < len; row++) {
      if (this.words[this.repliableWordIndex][row] == "") { break; }
      replyWords.push(this.words[this.repliableWordIndex][row]);
    }
    
    this.repliableWordIndex = null;
    return replyWords[parseInt(Math.random() * replyWords.length)]
  },
  // @return [String]
  ask: function (word) {
    if (this.nameTriggerMatcher.exec(word) === null || this.askTriggerMatcher.exec(word) === null) { return null; }
    if (this.listenListTriggerMatcher.exec(word) !== null) { return this._writeOutBrain('listenList'); }
    if (this.weatherTriggerMatcher.exec(word) !== null) { return this.feelWeather(); }
  },
  // @return [String]
  _writeOutBrain: function(type) {
    var answer = "```\n";
    if (type === 'listenList') { answer += "[反応する言葉リスト]\n"; }
    for (column = 0, len = this.words.length; column < len; column++) {
      if (this.words[column][0] === '') { break; }
      answer += this.words[column][0] + "\n";
    }
    return answer += "```";
  },
  // @return [String]
  feelWeather: function() {
    var weather = new Weather();
    return weather.predict() + 'やで〜';
  }
}

function Weather() {
  this.cityCode = PropertiesService.getScriptProperties().getProperty('WEATHER_CITY_CODE');
  this.apiEndpoint = 'http://weather.livedoor.com/forecast/webservice/json/v1';
  this.map = {
    '晴れ': ':sunny:',
    '曇り': ':cloud:',
    '雨': ':umbrella_with_rain_drops:',
    '雪': ':snowman:',
    '晴時々曇': ':mostly_sunny:',
    '雨時々曇': ':rain_cloud:',
    '曇時々晴': ':partly_sunny:',
    '曇時々雨': ':rain_cloud:',
    '雨のち曇': ':umbrella_with_rain_drops: :arrow_right: :cloud:',
    '雨のち晴': ':umbrella_with_rain_drops: :arrow_right: :sunny:',
    '晴のち曇': ':sunny: :arrow_right: :cloud:',
    '晴のち雨': ':sunny: :arrow_right: :umbrella_with_rain_drops:',
    '曇のち晴': ':cloud: :arrow_right: :sunny:',
    '曇のち雨': ':cloud: :arrow_right: :umbrella_with_rain_drops:'
  }
}
Weather.prototype = {
  // @return [String]
  predict: function () {
    var weather = UrlFetchApp.fetch(this.apiEndpoint + '?city=' + this.cityCode);
    
    // エラー
    if　(weather.getResponseCode() != 200) { return '天気予報でエラーが出てるよ！'; }

    var json = JSON.parse(weather.getContentText());
    var today = json["forecasts"][0]["telop"]; // 今日の天気
    var tomorrow = json["forecasts"][1]["telop"]; // 明日の天気
    
    return '今日は「' + today + ' ' + this.map[today] + '」、明日は「' + tomorrow + ' ' + this.map[tomorrow] + '」';
  }
}

function GarbageCollection () {
  // *** Mask
}

GarbageCollection.prototype = {
  burnableTomorrow: function () {
    return '明日は燃えるゴミの日 :rolled_up_newspaper:'
  },
  plasticTomorrow: function () {
    return '明日はプラスチックゴミの日 :baby_bottle:'
  },
  metalicTomorrow: function () {
    return '明日は金属ゴミの日 :battery:'
  },
  bottleCanTomorrow: function () {
    return '明日は瓶・缶・ペットボトルの日 :recycle:'
  }
}

function Gym() {
  // *** Mask
}

Gym.prototype ={
  closingTomorrow: function () {
    return '明日はジムが休館日 :swimmer:'
  }
}

function sendMessage(requestMessage) {
  var daichan = new Daichan();
  var message = '';
  message = daichan.ask(requestMessage);
  
  if (message === null) {
    message = daichan.listen(requestMessage).reply();
  }
  return message;
}

function doPost(e){
  var slackAccessToken = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
  var verifyToken = PropertiesService.getScriptProperties().getProperty('SLACK_VERIFY_TOKEN');;
  var slackApp = SlackApp.create(slackAccessToken);  
  
  //投稿の認証
  if (verifyToken != e.parameter.token) {
    throw new Error("invalid token.");
  }
    
  var options = {
    channelId: e.parameter.channel_id,
    userName: '大ちゃん',
    iconURL: PropertiesService.getScriptProperties().getProperty('ICON_URL'),
    message: sendMessage(e.parameter.text)
  };
  
  if (options.Message === '') { return; }
  return slackApp.postMessage(options.channelId, options.message, {
    username: options.userName,
    icon_url: options.iconURL
  });
}

function tellMeWeather() {
  var daichan = new Daichan();
  var message = daichan.feelWeather();
  
  postMessage(message, '#random');
}

function postMessage(message, channel) {
  var slackAccessToken = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
  var slackApp = SlackApp.create(slackAccessToken);
  
  var options = {
    channelId: channel,
    userName: '大ちゃん',
    iconURL: PropertiesService.getScriptProperties().getProperty('ICON_URL'),
    message: message
  };
  
  return slackApp.postMessage(options.channelId, options.message, {
    username: options.userName,
    icon_url: options.iconURL
  });
}

function burnableDate() {
  var garbageCollection = new GarbageCollection();
  postMessage(garbageCollection.burnableTomorrow() + 'やで〜', '#random');
}

function plasticDate() {
  var garbageCollection = new GarbageCollection();
  postMessage(garbageCollection.plasticTomorrow() + 'やで〜', '#random');  
}

function metalicDate() {
  var garbageCollection = new GarbageCollection();
  postMessage(garbageCollection.metalicTomorrow() + 'やで〜', '#random');  
}

function bottleCanDate() {
  var garbageCollection = new GarbageCollection();
  postMessage(garbageCollection.bottleCanTomorrow() + 'やで〜', '#random');  
}

function gymClosingDay() {
  var gym = new Gym();
  postMessage(gym.closingTomorrow() + ' やで〜', '#random');
}
