(function($, block) {

// Entity formatters for use by tweet list
var entity_formatters = {
    'urls': function(e) {
        return '<a href="' + e.url + '" target="_blank">' + e.display_url + '</a>';
    },
    
    'user_mentions': function(e) {
        return '<a href="https://twitter.com/'+e.screen_name+'" target="_blank">@'+e.screen_name+'</a>';
    },

    'hashtags': function(e) {
        return '<a href="https://twitter.com/hashtag/'+e.text+'?src=hash" target="_blank">#' +e.text+'</a>';
    },

    'default': function(e) {
        return '{ENTITY}';
    }
};

// processes entities for the given message and entity object
var process_entities = function(message, entities) {
    // short-circuit failure mode
    if(typeof entities === 'undefined') {
        return message;
    }

    // build list of entities sorted on starting index
    var es = [];

    $.each(entities, function(t, ts) {
        $.each(ts, function(_, e) {
            e['type'] = t;
            es.push(e);
        });
    });

    es.sort(function(a,b) {
        return a['indices'][0] - b['indices'][0];
    });

    // process entities one-by-one in order of appearance
    var marker = 0;
    var result = "";
    for(var i in es) {
        var e = es[i];
        var start = e['indices'][0];
        var stop = e['indices'][1];

        //copy string content
        result += message.substring(marker, start);

        //process entity (through formatter or no-op function)
        var formatter = entity_formatters[e.type]
                        || function(e) { return message.substring(start,stop) };
        result += formatter(e);

        // update marker location
        marker = stop;
    }

    // append tail of message
    result += message.substring(marker, message.length);

    return result;
}

block.fn.tweets = function(config) {
    var options = $.extend({
        memory: 20
    }, config);
    
    // create the necessary HTML in the block container
    this.$element.append('<div class=""></div>');

    // store list for later
    var $list = this.$element.find('div');


    // register default handler for handling tweet data
    this.actions(function(e, tweet){
        //alert(tweet);
        var $item = $('<li class="row tweet list-group-item"></li>');
		var $itemleft = $('<div class="col-xs-2"></div>');
		var $itemright = $('<div class="col-xs-10"></div>');
		var $itembottom = $('<div class="col-xs-10 functiebalk"></div>');
        var $tweet = $('<div class="tweet"></div>');
        var $content = $('<div class="content"></div>');
        var $header = $('<div class="stream-item-header"></div>');

        // Build a tag image and header:
        var $account = $('<a target="_blank" class="account-group"></a>');
        $account.attr("href", "http://twitter.com/" + tweet.user.screen_name);
		var $avatar = $("<img>").addClass("avatar");
        $avatar.attr("src", tweet.user.profile_image_url);
        $itemleft.append($avatar);
		$itembottom.append('<span id="savebutton" class="glyphicon glyphicon-floppy-disk"></span><span id="retweetbutton" class="glyphicon glyphicon-retweet"></span><span id="savebutton" class="glyphicon glyphicon-arrow-left"></span>');
		$account.append($('<span class="name">' + tweet.user.name + '</span>'));
		$account.append($('<span class="username">@' + tweet.user.screen_name + '</span>'));

        $header.append($account);
		
		var $time = $('<br><small class="time"></small>');
		
		var date = new Date(tweet.created_at);
		var now = Date.now();
		var elapsed = now - date;
		var monthName = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
		if(elapsed > new Date(0000,00,01) ){
			 $time.append($('<span>' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ' op ' + date.getDate() +' '+ monthName[date.getMonth()] + ' ' + date.getFullYear() + ' </span>'));
		}else{
			$time.append($('<span>' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ' uur </span>'));
		}
        // Build timestamp:

        
       

        $header.append($time);
        $content.append($header);

        // Build contents:
        var text = process_entities(tweet.text, tweet.entities);
        var $text = $('<p class="tweet-text">' + text + '</p>');
        $content.append($text);
        // Build outer structure of containing divs:
        $tweet.append($content);
		$itemright.append($tweet);
        $item.append($itemleft);
        $item.append($itemright);
		$item.append($itembottom);
        
        // place new tweet in front of list 
        $list.prepend($item);

        // remove stale tweets
        if ($list.children().size() > options.memory) {
            $list.children().last().remove();
        }
    });

    return this.$element;
};
})(jQuery, block);
